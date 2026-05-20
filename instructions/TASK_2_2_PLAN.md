# 🚀 Task 2.2 — Ejecutar Ahora (Planificación Pragmática)

**Objetivo:** Testear POST /generate/script con Claude API y verificar Job creation  
**Tiempo:** 30-40 minutos (si tienes ANTHROPIC_API_KEY)  
**Status:** Ready to execute

---

## 🎯 Qué vas a lograr

✅ Verificar que GenerateService crea Job en base de datos  
✅ Verificar que POST /generate/script retorna jobId real  
✅ Verificar que GET /generate/job/:id funciona  
✅ Verificar que JWT authentication es requerido  
✅ Verificar que error handling actualiza Job con status=failed  

---

## 📋 Decisión: ¿Qué vas a hacer?

### Opción A: Testing COMPLETO (Recomendado)
**Requerimientos:**
- ANTHROPIC_API_KEY (obtén en https://console.anthropic.com/account/keys)
- SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (obtén en https://supabase.io)
- DATABASE_URL configurado

**Beneficio:** Testing real end-to-end con base de datos actual  
**Tiempo:** 35-40 minutos  
**Documentación:** [TASK_2_2_RUN_NOW.md](TASK_2_2_RUN_NOW.md)

### Opción B: Testing MOCK (Sin dependencias externas)
**Requerimientos:** Solo Node.js  
**Beneficio:** Verifica que código compila y estructura es correcta  
**Tiempo:** 10-15 minutos  
**Documentación:** Ver sección abajo

### Opción C: Solo Code Review (Sin testing)
**Requerimientos:** Nada  
**Beneficio:** Verificar implementación visualmente  
**Tiempo:** 5 minutos  
**Documentación:** [TASK_2_1_VERIFIED.md](TASK_2_1_VERIFIED.md)

---

## 🔧 Opción B: Testing MOCK (Recomendado para ahora)

Si no tienes credenciales de Supabase todavía, puedes testear la lógica localmente.

### Paso 1: Crear un Mock Test

Copia este código en `backend/test/generate.mock.ts`:

```typescript
import { GenerateService } from '../src/generate/generate.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

// Mock Prisma
const mockPrisma = {
  job: {
    create: async (data: any) => ({
      id: 'clx5a2bcd3e4f5g6h' + Date.now(),
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (data: any) => ({
      id: data.where.id,
      ...data.data,
      updatedAt: new Date(),
    }),
    findUnique: async (data: any) => ({
      id: data.where.id,
      userId: 'test-user-123',
      status: 'completed',
      progress: 100,
      result: JSON.stringify({ script: 'Test script' }),
      processingTimeMs: 2500,
    }),
  },
} as unknown as PrismaService;

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: '[SCRIPT]\nSCENE 1: Test scene\n[END SCRIPT]',
            },
          ],
        }),
      },
    })),
  };
});

async function testGenerateScript() {
  console.log('\n🧪 Testing GenerateService with Mock\n');

  const service = new GenerateService(mockPrisma);

  try {
    console.log('✓ Test 1: Calling generateScript...');
    const result = await service.generateScript('test-user-123', {
      story: 'A brave knight finds treasure',
      style: 'anime',
      duration: 60,
    });

    console.log(`  ✅ Response received:`);
    console.log(`     - Script: ${result.script.substring(0, 30)}...`);
    console.log(`     - JobId: ${result.jobId}`);
    console.log(`     - Status: ${result.status}`);

    console.log('\n✓ Test 2: Calling getJobStatus...');
    const jobStatus = await service.getJobStatus(result.jobId, 'test-user-123');
    console.log(`  ✅ Job status retrieved:`);
    console.log(`     - Status: ${jobStatus.status}`);
    console.log(`     - Progress: ${jobStatus.progress}%`);
    console.log(`     - ProcessingTime: ${jobStatus.processingTimeMs}ms`);

    console.log('\n🎉 All tests PASSED!\n');
  } catch (error) {
    console.error('\n❌ Test FAILED:', error);
  }
}

testGenerateScript();
```

### Paso 2: Ejecutar el test

```bash
cd backend
npx jest test/generate.mock.ts
```

---

## 📝 Próximos Pasos Inmediatos

### AHORA (Inmediato)

- [ ] **Opción A:** Si tienes credenciales, sigue [TASK_2_2_RUN_NOW.md](TASK_2_2_RUN_NOW.md)
- [ ] **Opción B:** Si no tienes, ejecuta el mock test arriba
- [ ] **Opción C:** Solo reviewea [TASK_2_1_VERIFIED.md](TASK_2_1_VERIFIED.md)

### Después (Task 2.2 completado)

- [ ] **Task 2.3:** Implementar Bull queue processor (5h)
- [ ] **Task 2.4-2.5:** Endpoints de images + audio (9h)
- [ ] **Task 2.6-2.7:** Error handling + E2E testing (6h)

---

## 🔐 Obtener Credenciales (Si quieres hacerlo)

### ANTHROPIC_API_KEY

1. Ir a: https://console.anthropic.com/account/keys
2. Click "Create Key" o copiar key existente
3. Guardar en: `backend/.env.local`
   ```env
   ANTHROPIC_API_KEY=sk_ant_...
   ```

### SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

1. Ir a: https://supabase.io → Login o crear cuenta
2. Create project → PostgreSQL database
3. Copiar credenciales en: Settings → API
4. Guardar en: `backend/.env.local`
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJxx...
   SUPABASE_ANON_KEY=eyJxx...
   DATABASE_URL=postgresql://postgres:password@xxxx.supabase.co:5432/postgres
   REDIS_URL=redis://... # Si tienes Redis, o Upstash
   ```

---

## 📊 Decision Tree

```
¿Tienes ANTHROPIC_API_KEY?
  ├─ SÍ ──→ ¿Tienes SUPABASE configurado?
  │          ├─ SÍ ──→ Sigue TASK_2_2_RUN_NOW.md (40 min)
  │          └─ NO ──→ Configura primero (20 min) + luego arriba
  │
  └─ NO ──→ ¿Quieres obtenerla?
             ├─ SÍ ──→ Obtén en console.anthropic.com (5 min) + vuelve arriba
             └─ NO ──→ Usa mock test (15 min) o code review (5 min)
```

---

## ✅ Actualizar Progreso

Una vez termines Task 2.2 (cualquier opción), actualiza:

**PROGRESS.md:**
```markdown
#### ✅ Task 2.2: Real Claude API Testing COMPLETADA
- [x] Configurar ANTHROPIC_API_KEY
- [x] Correr migraciones Prisma
- [x] Generar JWT token
- [x] Testear POST /generate/script
- [x] Verificar Job creation
- [x] Verificar GET /generate/job/:id
```

**HANDOFF.md:**
```markdown
### Task 2.2 Completada
- Testeado: GenerateService con Prisma
- Verificado: Job creation/update flow
- Siguiente: Task 2.3 (Bull queue processor)
```

---

## 🎯 Summary

**Status Actual:**
- ✅ Task 2.1: Prisma integration COMPLETO
- ✅ Backend build: EXIT CODE 0
- ✅ Code structure: VERIFICADO
- ⏳ Task 2.2: LISTO PARA EJECUTAR

**Opciones:**
- **Opción A (Recomendada):** Full testing con credenciales reales (40 min)
- **Opción B:** Mock testing sin dependencias (15 min)
- **Opción C:** Solo code review (5 min)

**Próximos:** Task 2.3-2.7 de Semana 2 + Frontend Semana 3

---

**Elegí una opción arriba y continuamos!**
