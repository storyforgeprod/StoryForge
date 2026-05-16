# StoryForge — Componentes Opcionales y Decisiones Reversibles

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Propósito:** Documentar qué puede sacarse/modificarse post-MVP sin romper la arquitectura

---

## 📌 Componentes Potencialmente Eliminables

### 1️⃣ Text-to-Speech (ElevenLabs)

**Status MVP:** ✅ Incluido (Story Point: 5 SP en Historia 1.3)

**¿Por qué podría sacarse?**
- Costo recurrente mensual (~$25+)
- Usuarios podrían usar narradores humanos o no narración
- Puede retrasar time-to-video

**Arquitectura reversible:**

```typescript
// Backend: Servicio abstracto permite desactivar sin reescribir
@Injectable()
export class AudioService {
  async generateAudio(text: string, voiceId: string) {
    if (!process.env.FEATURE_TEXT_TO_SPEECH) {
      return null; // Skip audio generation
    }
    return this.elevenLabs.synthesize(text, voiceId);
  }
}

// Frontend: UI condicionada
{process.env.VITE_ENABLE_TEXT_TO_SPEECH && <VoiceSelector />}

// Video render: Si no hay audio, video sin narración
// ✅ Funciona perfectamente sin narración
```

**Si se saca:**
- Dejar placeholder "Audio deshabilitado en este plan"
- Users siguen viendo imágenes + subtítulos
- Funcionalidad 80% íntacta

**Costo de sacar:** ~2 horas de refactor

---

### 2️⃣ Video Render (FFmpeg/Modal)

**Status MVP:** ✅ Incluido (Story Point: 13 SP en Historia 3.3)

**¿Por qué podría sacarse?**
- Más complejo (FFmpeg + serverless)
- Cuello de botella en tiempo
- Alternativa: Enviar assets al usuario para que renderee localmente

**Arquitectura reversible:**

```typescript
// Opción A: Video render serverless (MVP)
@Post('generate/video')
async renderVideo(dto: GenerateVideoDTO) {
  return this.videoService.render(dto); // Retorna MP4
}

// Opción B: Download assets (sin render)
@Post('generate/assets')
async generateAssets(dto: GenerateVideoDTO) {
  return {
    images: [...urls],
    audioUrl: '...',
    subtitles: [...],
    // Usuario las descarga y renderea con Capcut/Adobe
  };
}
```

**Si se saca:**
- Usuario descarga imágenes + audio en ZIP
- Usa herramienta de edición local (Capcut, Adobe)
- Reduce costo backend 70%
- Aumenta time-to-video ~5 min

**Costo de sacar:** ~4 horas de pivoteo

---

## 🎯 Componentes Críticos (NO pueden sacarse)

| Componente | Razón | Impacto si se saca |
|-----------|-------|-------------------|
| **Google OAuth** | Core del login | 100% — App inutilizable |
| **Claude API** | Script generation | 95% — Core feature |
| **Replicate** | Image generation | 95% — Core feature |
| **Supabase** | Database + Auth | 90% — Data loss + Auth breaks |

---

## 🔄 Componentes Mutables Post-MVP

### Storage Backend

**MVP:** Supabase Storage (S3-compatible)

**Alternativas futuras:**
- AWS S3 (si escala mucho)
- Cloudflare R2 (más barato)
- Google Cloud Storage

**Costo cambio:** ~3 horas (abstracción ya existe)

```typescript
// Servicio abstracto
export interface StorageProvider {
  upload(key: string, file: Buffer): Promise<string>;
  delete(key: string): Promise<void>;
}

// Implementaciones intercambiables
class SupabaseStorage implements StorageProvider {}
class S3Storage implements StorageProvider {}
class CloudflareR2Storage implements StorageProvider {}
```

---

### Database

**MVP:** Supabase PostgreSQL

**Alternativas futuras:**
- MongoDB (si schema cambia mucho)
- Firebase (simpler pero menos flexible)

**Costo cambio:** ~20 horas (reescribir Prisma schema)

---

### Frontend Framework

**MVP:** React + Vite

**Alternativas futuras:**
- Next.js (si necesitas SSR)
- SvelteKit (si quieres algo más simple)

**Costo cambio:** ~40 horas (reescribir todo)
⚠️ **No recomendado sacar en MVP**

---

## 🛠️ Cómo Implementar Decisiones Reversibles

### Ejemplo: Desactivar Text-to-Speech

**Paso 1:** Backend — Feature flag

```typescript
// src/config/features.config.ts
export const FEATURES = {
  TEXT_TO_SPEECH: process.env.FEATURE_TEXT_TO_SPEECH === 'true',
  VIDEO_RENDER: process.env.FEATURE_VIDEO_RENDER === 'true',
};
```

**Paso 2:** Backend — Servicio respeta flag

```typescript
@Injectable()
export class AudioService {
  async generateAudio(text: string, voiceId: string) {
    if (!FEATURES.TEXT_TO_SPEECH) {
      this.logger.warn('Text-to-speech disabled, skipping');
      return null;
    }
    // Continúa con generación...
  }
}
```

**Paso 3:** Backend — Endpoint devuelve null en lugar de error

```typescript
@Post('generate/audio')
async generateAudio(@Body() dto: GenerateAudioDTO) {
  const audio = await this.audioService.generateAudio(dto.text, dto.voiceId);
  
  if (!audio) {
    return { audioUrl: null, message: 'TTS disabled' };
  }
  
  return { audioUrl: audio };
}
```

**Paso 4:** Frontend — UI se adapta

```typescript
export const VoiceSelector: FC = () => {
  const { data: voices, isLoading } = useQuery('voices', fetchVoices);
  
  if (process.env.VITE_ENABLE_TEXT_TO_SPEECH === 'false') {
    return <p className="text-gray-500">Audio deshabilitado en este plan</p>;
  }
  
  return <SelectComponent options={voices} />;
};
```

**Paso 5:** Frontend — Video render sin audio

```typescript
const videoAssets = {
  images: [...],
  audioUrl: null, // No hay audio
  subtitles: [...],
};

// FFmpeg lo renderea sin pista de audio
// ✅ Video de 50 segundos sin narración funciona perfectamente
```

**Resultado:**
- ✅ Desactivar TTS = 1 línea en `.env`
- ✅ Toda la UI se adapta automáticamente
- ✅ No hay errores
- ✅ Usuarios siguen usando el producto

---

## 📊 Matriz de Riesgo/Reversibilidad

| Componente | Reversibilidad | Complejidad | Riesgo |
|-----------|-----------------|-----------|--------|
| TTS | ✅ Muy alta | ⭐ Baja | 🟡 Medio |
| Video Render | ✅ Alta | ⭐⭐ Media | 🟠 Alto |
| Claude API | ❌ Nula | ⭐⭐⭐ Alta | 🔴 Crítico |
| Storage Backend | ✅ Alta | ⭐⭐ Media | 🟡 Medio |
| Database | ⚠️ Media | ⭐⭐⭐⭐ Muy alta | 🔴 Crítico |
| Frontend FW | ❌ Baja | ⭐⭐⭐⭐⭐ Máxima | 🔴 Crítico |

---

## 🚦 Decisión de Sacar Componentes

**Flujo de decisión:**

```
¿Queremos sacar X?
├─ ¿Es crítico? (Claude, Auth, DB)
│  └─ SÍ → ❌ NO SACAR (Costo > beneficio)
│
└─ ¿Es reversible? (TTS, Storage, Video)
   ├─ SÍ → Evaluar:
   │       ├─ ¿Ahorra costo significativo? (>$100/mes)
   │       └─ ¿Mejora time-to-MVP? (>5 horas saved)
   │           ├─ SÍ ambos → ✅ SACAR
   │           └─ NO → ⏳ DEJAR para later
   │
   └─ NO → ⚠️ REVISAR ARQUITECTURA
```

---

## 📝 Cambios Requeridos Después de Sacar Componentes

### Si se saca TTS

- [ ] Actualizar `.env` con `FEATURE_TEXT_TO_SPEECH=false`
- [ ] Mensaje en UI "Audio no disponible en este plan"
- [ ] Video renderea sin pista de audio
- [ ] Tests actualizan para skipear audio generation
- [ ] Documentación: "El plan básico no incluye narración"

### Si se saca Video Render

- [ ] Cambiar endpoint `/generate/video` → `/generate/assets`
- [ ] Devolver ZIP con imágenes + audio + SRT
- [ ] UI muestra instrucciones de descarga
- [ ] Agregar link a tutorial "Cómo renderear con Capcut"
- [ ] Tests actualizan para skipear FFmpeg

---

## 🎯 Recomendación para MVP

**Mantener ambos incluidos en MVP por:**

1. ✅ Experiencia completa ("video generado en 5 minutos")
2. ✅ Validar que users valorizan el producto antes de sacar features
3. ✅ Si fallan (timeout, costo alto), sacarlos es fácil después

**Post-MVP (Semanas 7+):**
- Monitorear costos reales
- Recopilar feedback de usuarios
- Decidir qué optimizar/sacar

---

**Última actualización:** 15 de mayo de 2026
