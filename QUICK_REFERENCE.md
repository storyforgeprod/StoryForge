# 🎯 QUICK REFERENCE — Atajos Rápidos para Desarrolladores

**Guía de bolsillo con lo más importante**

---

## 🚀 Comienza Aquí

```bash
# Setup inicial (primera vez)
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
cd StoryForge

# Backend
cd backend && cp .env.example .env.local
# ⚠️ Llena .env.local con tus keys
npm install && npm run start:dev
# Debe estar en http://localhost:3000 ✓

# Frontend (en otra terminal)
cd frontend && cp .env.example .env.local
npm install && npm run dev
# Debe estar en http://localhost:5173 ✓

# Listo para desarrollar
```

---

## 📋 Workflow Rápido

### 1. Escoger tarea
Revisar [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) → Semana actual

### 2. Create branch
```bash
git checkout -b feature/1-1-script-analysis
# Nomenclatura: feature/[EPIC]-[STORY]-[description]
```

### 3. Develop
```bash
npm run start:dev    # Backend
npm run dev          # Frontend
npm run test         # Tests mientras trabajas
```

### 4. Commit & Push
```bash
git commit -m "feat(generate): implement Claude integration - AB#1.1"
#                    ^scope             ^description                 ^ADO ref
git push origin feature/1-1-script-analysis
```

### 5. PR & Merge
- Descripción clara
- Referencia historia: `Closes AB#1.1`
- Merge a `develop` (NOT main)

---

## 🔑 Key Files

| Archivo | Para qué | Cuándo leerlo |
|---------|----------|--------------|
| README.md | Overview | Primer día |
| QUICK_START.md | Setup local | Setup |
| IMPLEMENTATION_PLAN.md | Hoja de ruta | Weekly |
| DEVELOPMENT_GUIDELINES.md | Cómo codear | Antes de PR |
| STACK_INIT.md | Tech stack | Si necesitas agregar dependencia |
| AZURE_DEVOPS_CONFIG.md | Backlog | PM only |
| MCP_INTEGRATION.md | AI tools | Si usas Claude |
| OPTIONAL_COMPONENTS.md | Decisiones | Meetings de arquitectura |

---

## 💻 Comandos Útiles

### Backend

```bash
# Desarrollo
npm run start:dev          # Dev server con hot reload

# Testing
npm run test               # Tests unitarios
npm run test:e2e          # End-to-end
npm run test:cov          # Con coverage

# Lint & Format
npm run lint              # ESLint
npm run format            # Prettier

# Build
npm run build             # Compilar a JS
npm start                 # Producción
```

### Frontend

```bash
# Desarrollo
npm run dev               # Vite dev server

# Testing
npm run test              # Vitest
npm run test:ui          # UI interactivo
npm run test:cov         # Coverage

# Lint & Format
npm run lint              # ESLint
npm run format            # Prettier

# Build
npm run build             # Compilar para prod
npm run preview           # Preview del build
```

### Ambos

```bash
# Limpiar dependencias
rm -rf node_modules package-lock.json
npm install

# Reinstalar una dependencia
npm reinstall [package-name]

# Actualizar todas
npm update
```

---

## 🐛 Debugging

### Backend

```bash
# Ver logs detallados
DEBUG=* npm run start:dev

# Conectar debugger de Node
node --inspect dist/main.js

# En Chrome
chrome://inspect → Select target
```

### Frontend

```bash
# Devtools automáticos
npm run dev
# Luego: http://localhost:5173 → F12

# Debugging de Vite
# En vite.config.ts:
define: { 'window.DEBUG': true }
```

---

## 🚨 Errores Comunes

| Error | Causa | Fix |
|-------|-------|-----|
| `Cannot find module` | Dependencia no instalada | `npm install [package]` |
| `Port 3000 in use` | Otro proceso en puerto | `lsof -i :3000 → kill -9 <PID>` |
| `SUPABASE_URL undefined` | .env.local no cargado | Check: `cat .env.local` contiene la key |
| `API 500` | Error en backend | Ver logs: `npm run start:dev` output |
| `CORS error` | Frontend URL no allowed | Backend: Update `CORS_ORIGIN` en .env |
| `Rate limit exceeded` | Demasiadas requests | Esperar 1 min, reintentar |

---

## 📊 Testing

### Escribir test backend

```typescript
// generate.service.spec.ts
describe('GenerateService', () => {
  it('should generate script from text', async () => {
    const result = await service.createScript({ text: 'a'.repeat(300) });
    expect(result).toHaveProperty('scenes');
  });
});

npm run test -- generate.service.spec.ts
```

### Escribir test frontend

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders and can be clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });
});

npm run test -- Button.test.tsx
```

---

## 🚀 Deploy

### Automático (Recomendado)

```bash
# Staging
git push origin staging      # Auto-deploy a Render

# Production
git push origin main        # Auto-deploy a prod
```

### Manual

```bash
# Backend: Render dashboard
# 1. Manual Deployment → Select branch → Deploy

# Frontend: Render dashboard
# 1. Deployments → Redeploy
```

---

## 🔐 Seguridad

### Never Commit

```bash
# ❌ NO comitear
.env (credenciales)
*.log (logs)
dist/ o build/ (compilados)

# ✅ SÍ comitear
.env.example (template)
src/ (código fuente)
tests/ (tests)
```

### Sanitizar Input

```typescript
// Backend: Validar entrada
import { IsString, MinLength } from 'class-validator';

export class GenerateDTO {
  @IsString()
  @MinLength(300)
  text: string;  // Auto-validado
}

// Frontend: Validar antes de enviar
if (text.length < 300) {
  setError('Mínimo 300 caracteres');
  return;
}
```

---

## 📝 Git Best Practices

```bash
# ✅ Bueno
git commit -m "feat(auth): implement Google OAuth - AB#2.1"
git push origin feature/2-1-google-oauth

# ❌ Malo
git commit -m "fixed stuff"
git push origin master
```

### Revertir cambios

```bash
# Revertir último commit (no pusheado)
git reset --soft HEAD~1

# Revertir archivo específico
git checkout -- src/file.ts

# Revertir todo working directory
git reset --hard
```

---

## 🎓 Recursos Rápidos

- **TypeScript:** https://www.typescriptlang.org/docs/
- **React:** https://react.dev/reference
- **NestJS:** https://docs.nestjs.com/
- **Supabase:** https://supabase.com/docs
- **Testing Library:** https://testing-library.com/

---

## ✅ Pre-PR Checklist

Antes de hacer merge:

- [ ] `npm run test` pasa (coverage >70%)
- [ ] `npm run lint` sin errores
- [ ] Tests incluyen casos de error
- [ ] Logging presente (no console.log)
- [ ] Tipos TypeScript correctos
- [ ] Validación de input presente
- [ ] Documentación en código (si es complejo)
- [ ] Referencia a historia ADO en commit
- [ ] No hay secretos en el código

---

## 🚨 When Stuck

```
1. ¿Error específico?
   → Google it + ver Stack Overflow

2. ¿No funciona setup?
   → QUICK_START.md Troubleshooting

3. ¿Patrón de código?
   → DEVELOPMENT_GUIDELINES.md

4. ¿Bloqueado por otro dev?
   → Post en ADO "Blockers" field

5. ¿Arquitectura unclear?
   → Slack/teams + flag issue
```

---

## 📞 Key Contacts

- **Tech Lead:** [Name] — Decisiones arquitectónicas
- **PM:** [Name] — Cambios scope / timeline
- **QA:** [Name] — Testing / release

---

**Print this & keep in your desk** 📌

**Last updated:** 15 de mayo de 2026
