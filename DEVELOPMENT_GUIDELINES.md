# StoryForge — Lineamientos de Desarrollo

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Propósito:** Definir estándares, convenciones y mejores prácticas para todo el desarrollo del MVP

---

## 🎯 Principios Rectores

1. **Simplicidad sobre complejidad** — Preferir soluciones claras que escalen después
2. **Escalabilidad desde el inicio** — Arquitectura que permita agregar features sin reescribir
3. **Eliminable, no pegajoso** — Todo debe poder removerse (TTS, video render, etc.) sin romper nada
4. **Seguridad first** — Validar inputs, sanitizar datos, auth en cada endpoint
5. **Observabilidad** — Log todo para poder debuggear en producción
6. **Testing desde el inicio** — No esperar a fin para testear (aunque MVP es pragmático)

---

## 📝 Convenciones de Código

### TypeScript

**Archivos:**
- Componentes React: `ComponentName.tsx`
- Servicios: `serviceName.service.ts`
- Controllers: `name.controller.ts`
- Tipos: `types.ts` o `interfaces.ts`
- Utils: `utilName.util.ts`

**Ejemplo estructura:**
```typescript
// ✅ Bueno
import { UserService } from '@/services/user.service';
import type { User, CreateUserDTO } from '@/types/user.types';

export const getUserById = async (id: string): Promise<User> => {
  // implementation
};

// ❌ Evitar
import UserService from 'userService';
const getUser = (id) => { /* ... */ };
```

### NestJS Backend

**Estructura de módulos:**
```typescript
// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}

// user.controller.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}

// user.service.ts
@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async findById(id: string): Promise<User> {
    // business logic
  }
}
```

**Validación de entrada:**
```typescript
// ✅ Siempre validar
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

export class CreateScriptDTO {
  @IsString()
  @MinLength(300)
  @MaxLength(5000)
  text: string;
}

// En main.ts
app.useGlobalPipes(new ValidationPipe());
```

### React Frontend

**Componentes:**
```typescript
// ✅ Bueno: Componente tipado con props claras
import type { FC } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export const TextInput: FC<TextInputProps> = ({
  value,
  onChange,
  maxLength = 5000,
  placeholder = 'Pega aquí tu historia...'
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    maxLength={maxLength}
    placeholder={placeholder}
    className="w-full h-64 p-4 border rounded-lg"
  />
);

// ❌ Evitar: Sin tipos, props implícitos
const TextInput = (props) => (
  <textarea {...props} />
);
```

**Custom Hooks:**
```typescript
// ✅ Bueno
export const useGenerate = () => {
  const [state, setState] = useState<GenerateState>('idle');
  const [error, setError] = useState<string | null>(null);

  const generate = async (text: string, style: string) => {
    try {
      setState('loading');
      const result = await api.post('/generate/script', { text, style });
      setState('success');
      return result;
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  return { state, error, generate };
};

// Uso en componente
const { state, error, generate } = useGenerate();
```

---

## 🏗️ Arquitectura y Patrones

### Backend: Capas Limpias

```
Controller ──→ Service ──→ Repository ──→ Database
  ↓              ↓           ↓
 DTO        Business Logic  Query Builder
Validation   Error Handling  Data Access
```

**Ejemplo completo:**

```typescript
// 1. DTO (validación de entrada)
export class GenerateScriptDTO {
  @IsString()
  @MinLength(300)
  text: string;

  @IsEnum(['manhwa', 'anime', 'webnovel', 'fantasy'])
  style: string;
}

// 2. Controller (recibir request, delegar a service)
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('script')
  async generateScript(@Body() dto: GenerateScriptDTO) {
    return this.generateService.createScript(dto);
  }
}

// 3. Service (lógica de negocio)
@Injectable()
export class GenerateService {
  constructor(
    private readonly aiService: AIService,
    private readonly logger: Logger,
  ) {}

  async createScript(dto: GenerateScriptDTO): Promise<Script> {
    this.logger.log(`Generating script for style: ${dto.style}`);

    try {
      const script = await this.aiService.analyzeText(dto.text, dto.style);
      return script;
    } catch (error) {
      this.logger.error(`Script generation failed: ${error.message}`);
      throw new BadRequestException('Failed to generate script');
    }
  }
}

// 4. Service IA (integración con APIs externas)
@Injectable()
export class AIService {
  constructor(private readonly anthropic: Anthropic) {}

  async analyzeText(text: string, style: string): Promise<Script> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Analiza este texto de ${style}... [prompt detallado]`,
        },
      ],
    });
    // Parse y retornar
  }
}
```

### Frontend: Componentes Composables

```
├── pages/
│   └── GeneratePage
│       └── Composición de componentes reutilizables
│           ├── TextInput
│           ├── StyleSelector
│           ├── VoiceSelector
│           └── ProgressIndicator
└── components/
    ├── Input/
    │   ├── TextInput.tsx
    │   └── index.ts
    ├── Selectors/
    │   ├── StyleSelector.tsx
    │   └── VoiceSelector.tsx
    └── common/
        ├── Button.tsx
        ├── Modal.tsx
        └── Loader.tsx
```

---

## 🔒 Seguridad

### Backend

**1. Validación siempre:**
```typescript
// ✅ Bueno
@Post('generate/script')
async generateScript(@Body(ValidationPipe) dto: GenerateScriptDTO) {
  // DTO ya validado por class-validator
}

// ❌ Malo
@Post('generate/script')
async generateScript(@Body() body: any) {
  // Puede recibir cualquier cosa
}
```

**2. Autenticación en endpoints:**
```typescript
// ✅ Bueno
@UseGuards(AuthGuard)
@Post('generate/script')
async generateScript(
  @Body() dto: GenerateScriptDTO,
  @Request() req: AuthenticatedRequest,
) {
  // req.user está disponible
}

// ❌ Malo: sin guardar user context
@Post('generate/script')
async generateScript(@Body() dto: GenerateScriptDTO) {
  // ¿Quién está generando esto?
}
```

**3. Rate limiting:**
```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// En app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 10 }, // 10 requests per minute
    ]),
  ],
})
export class AppModule {}

// En controller
@UseGuards(ThrottlerGuard)
@Post('generate/script')
async generateScript(@Body() dto: GenerateScriptDTO) {}
```

**4. Sanitización de input:**
```typescript
// Antes de persistir en DB o pasar a IA
const sanitizedText = xss(userInput, {
  whiteList: {}, // Remover HTML/JS
  stripIgnoredTag: true,
});
```

### Frontend

**1. Validación en cliente:**
```typescript
// ✅ Bueno
if (!text || text.trim().length < 300) {
  setError('Mínimo 300 caracteres');
  return;
}

// ❌ Malo
api.post('/generate', { text }); // Confiar en backend
```

**2. Proteger tokens:**
```typescript
// ✅ Usar localStorage con cuidado
localStorage.setItem('supabase.auth.token', token);

// ❌ Exponer keys en el código
const API_KEY = 'sk-ant-xxxxx'; // ¡NUNCA!
// Usar variable de entorno: VITE_API_URL
```

**3. No loguear datos sensibles:**
```typescript
// ✅ Bueno
console.log('User generated video:', { userId, timestamp });

// ❌ Malo
console.log('User:', user); // Puede contener API keys, tokens
```

---

## 📊 Logging y Observabilidad

### Backend (Winston)

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  async createScript(dto: GenerateScriptDTO) {
    this.logger.log(`[Script] Starting analysis for user: ${userId}`);

    try {
      const result = await this.aiService.analyze(dto);
      this.logger.log(`[Script] Completed in ${duration}ms`);
      return result;
    } catch (error) {
      this.logger.error(`[Script] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}

// Configurar con Sentry
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Frontend (PostHog)

```typescript
import posthog from 'posthog-js';

// En app.tsx o main.tsx
posthog.init(process.env.VITE_POSTHOG_KEY, {
  api_host: process.env.VITE_POSTHOG_URL,
});

// Trackear eventos
posthog.capture('video_generated', {
  style: 'manhwa',
  duration_ms: 5000,
  user_id: user.id,
});
```

---

## ✅ Testing

### Backend (Jest + Supertest)

```typescript
// generate.service.spec.ts
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

  it('should generate script from text', async () => {
    const dto: GenerateScriptDTO = { text: 'a'.repeat(300), style: 'manhwa' };
    jest.spyOn(aiService, 'analyzeText').mockResolvedValue(mockScript);

    const result = await service.createScript(dto);
    expect(result).toEqual(mockScript);
  });

  it('should throw on invalid text', async () => {
    const dto: GenerateScriptDTO = { text: 'short', style: 'manhwa' };

    await expect(service.createScript(dto)).rejects.toThrow();
  });
});
```

### Frontend (Vitest + React Testing Library)

```typescript
// TextInput.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('should call onChange when user types', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<TextInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText(/pega aquí/i);

    await user.type(input, 'test text');
    expect(onChange).toHaveBeenCalledWith('test text');
  });

  it('should not exceed maxLength', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<TextInput value="" onChange={onChange} maxLength={10} />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;

    expect(input.maxLength).toBe(10);
  });
});
```

---

## 🔄 Git Workflow

### Branch Strategy

```
main (production)
  ↑
  └─ staging (deploy staging)
      ↑
      └─ develop (integration branch)
          ↑
          ├─ feature/1-auth-oauth
          ├─ feature/2-generate-script
          ├─ fix/rate-limiting-bug
          └─ chore/update-dependencies
```

### Commit Messages

**Formato:** `<type>(<scope>): <subject>`

```bash
feat(auth): implement Google OAuth login
fix(generate): handle image generation timeout
chore(deps): upgrade NestJS to v10
docs(api): add endpoint documentation
refactor(storage): abstract Supabase client
test(generate): add unit tests for script service
```

**Tipos permitidos:**
- `feat` — Nueva feature
- `fix` — Bugfix
- `refactor` — Cambio sin alterar comportamiento
- `test` — Tests
- `docs` — Documentación
- `chore` — Cambios de build, deps, etc.
- `ci` — CI/CD changes

### PR Requirements

```
1. ✅ Título claro (referencia a epic/historia)
   - "[EP1.1] Implement script generation"
   - "[BUG] Fix image timeout handling"

2. ✅ Descripción con:
   - Qué cambió y por qué
   - Tests incluidos
   - Screenshots si UI
   - Notas de deploy

3. ✅ Tests pasando (CI verde)

4. ✅ Revisión de code (mínimo 1 dev)

5. ✅ Merge a develop, no a main (main solo de staging)
```

---

## 📋 Checklist por Feature

Antes de marcar historia como "Hecho":

### Backend Feature

```
[ ] Endpoint implementado con validación
[ ] DTOs definidos con decoradores class-validator
[ ] Unit tests (>70% coverage)
[ ] Error handling y logging
[ ] Rate limiting si aplica
[ ] API documentation (Swagger)
[ ] Variables de entorno documentadas
[ ] Testing local verificado
[ ] Code review completado
```

### Frontend Feature

```
[ ] Componente React tipado (TypeScript)
[ ] Estilos con Tailwind (responsive)
[ ] Props bien definidas
[ ] Manejo de loading/error states
[ ] Validación local de entrada
[ ] Tests (interaction tests)
[ ] Integración con API backend
[ ] Responsive en mobile + desktop
[ ] Accesibilidad (alt text, labels)
[ ] Code review completado
```

---

## 🚀 Performance y Optimización

### Backend

- **Queries optimizadas:** Usar `select()` en Prisma para solo campos necesarios
- **Caching:** Redis para resultados frecuentes (estilos, voces)
- **Async processing:** BullMQ para jobs largos (video rendering)
- **Compression:** gzip habilitado en NestJS

### Frontend

- **Code splitting:** Lazy load rutas no críticas
- **Image optimization:** Compresión de assets con Vite
- **Lazy loading:** Observador para componentes no visibles
- **State optimization:** Zustand/React Query para evitar re-renders innecesarios

---

## 📞 Contacto y Escalamientos

Si durante el desarrollo:
- ⏳ Alguna tarea se estanca por **>1 día** → Escalamiento inmediato
- 🐛 Se descubre bug crítico → Pausar features, fijar bug
- ⚡ Nueva info del usuario → Adaptar plan si es validación crítica
- 💡 Oportunidad de refactor → Anotar para después de MVP

---

## 📚 Referencias Útiles

- **NestJS Best Practices:** https://docs.nestjs.com/techniques
- **React Patterns:** https://react.dev/reference
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Security Cheat Sheet:** https://cheatsheetseries.owasp.org/

---

**Última actualización:** 15 de mayo de 2026
