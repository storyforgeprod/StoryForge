---
name: storyforge-backend
description: "Backend development standards for StoryForge. Always activate when the user asks to create or modify backend code: endpoints, controllers, services, DTOs, NestJS modules, AI integrations, auth guards, rate limiting, backend tests, or any server-side .ts file. Also activate if the user says 'create endpoint', 'add service', 'add validation', 'build the X module', or any backend task even if NestJS is not explicitly mentioned."
---

# StoryForge — Backend Code Standards

## File naming & folder structure

```
src/
└── module-name/
    ├── controllers/    ← name.controller.ts
    ├── services/       ← name.service.ts
    ├── name.module.ts
    ├── name.dto.ts
    ├── name.guard.ts
    └── name.types.ts
```

- Controllers must live inside a `controllers/` subfolder within the module
- Services must live inside a `services/` subfolder within the module
- Never place controllers or services directly at the module root

---

## Mandatory architecture

```
Controller → Service → Repository → Database
   DTO         Business Logic   Query Builder
 Validation    Error Handling   Data Access
```

Never put business logic in the controller or queries in the service.

---

## Full module structure

```typescript
// 1. DTO (input validation)
import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateScriptDTO {
  @IsString()
  @MinLength(300)
  @MaxLength(5000)
  text: string;

  @IsEnum(['manhwa', 'anime', 'webnovel', 'fantasy'])
  style: string;
}

// 2. Controller
@Controller('generate')
@UseGuards(AuthGuard, ThrottlerGuard)  // ← always both
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('script')
  async generateScript(
    @Body() dto: GenerateScriptDTO,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.generateService.createScript(dto, req.user.id);
  }
}

// 3. Service
@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(private readonly aiService: AIService) {}

  async createScript(dto: GenerateScriptDTO, userId: string): Promise<Script> {
    this.logger.log(`[Script] Starting for user: ${userId}, style: ${dto.style}`);
    try {
      const result = await this.aiService.analyzeText(dto.text, dto.style);
      this.logger.log(`[Script] Success for user: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`[Script] Failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate script');
    }
  }
}

// 4. Module
@Module({
  controllers: [GenerateController],
  providers: [GenerateService, AIService],
  exports: [GenerateService],
})
export class GenerateModule {}
```

---

## Checklist before submitting backend code

- [ ] DTO with `class-validator` decorators on all fields
- [ ] `@UseGuards(AuthGuard)` on the controller
- [ ] `@UseGuards(ThrottlerGuard)` on expensive endpoints (AI, storage)
- [ ] `Logger` with `[ContextName] message` format in service
- [ ] `try/catch` with `throw new BadRequestException(...)` in service
- [ ] `userId` always taken from `req.user.id`, never from the request body
- [ ] `ValidationPipe` enabled globally in `main.ts`

---

## AI integration (Anthropic)

```typescript
@Injectable()
export class AIService {
  constructor(private readonly anthropic: Anthropic) {}

  async analyzeText(text: string, style: string): Promise<Script> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Analyze this ${style} text...` }],
    });
    // Parse response.content[0] and return
  }
}
```

---

## Rate limiting (ThrottlerModule)

```typescript
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])

// On expensive controllers
@UseGuards(ThrottlerGuard)
```

---

## Input sanitization

```typescript
// Before passing to AI or persisting
const sanitizedText = xss(userInput, { whiteList: {}, stripIgnoredTag: true });
```

---

## Minimum unit test per service

```typescript
// name.service.spec.ts
describe('GenerateService', () => {
  let service: GenerateService;
  let aiService: AIService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GenerateService,
        { provide: AIService, useValue: { analyzeText: jest.fn() } },
      ],
    }).compile();

    service = module.get(GenerateService);
    aiService = module.get(AIService);
  });

  it('should generate script', async () => {
    jest.spyOn(aiService, 'analyzeText').mockResolvedValue(mockScript);
    const result = await service.createScript(dto, 'user-123');
    expect(result).toEqual(mockScript);
  });

  it('should throw on AI failure', async () => {
    jest.spyOn(aiService, 'analyzeText').mockRejectedValue(new Error('fail'));
    await expect(service.createScript(dto, 'user-123')).rejects.toThrow(BadRequestException);
  });
});
```

---

## Never do

- ❌ `@Body() body: any` — always use a typed DTO
- ❌ Business logic in the controller
- ❌ Direct queries in the service (use repository)
- ❌ `console.log` — use NestJS `Logger`
- ❌ `userId` from the request body
- ❌ Hardcoded API keys — always use `process.env.X`