# StoryForge — Product Brief v1.0

*Fecha: 15 de mayo de 2026 | Estado: MVP en definición*

---

## 1. Resumen Ejecutivo (Elevator Pitch)

**StoryForge** es una plataforma SaaS freemium que convierte texto de historias largas —manhwas, webtoons, novelas web, k-dramas— en videos cortos narrados listos para publicar en YouTube Shorts, en menos de 5 minutos y sin conocimientos de edición.

El creador pega el texto, elige un estilo visual y una voz, y la IA hace el resto: analiza la trama, identifica los momentos más dramáticos, genera un guión con hook y cliffhanger, produce imágenes coherentes con el universo de la historia, narra el video con voz sintética realista y entrega un MP4 9:16 listo para subir.

Lo que hoy toma 3 a 5 horas, StoryForge lo resuelve en 10 minutos. Sin copyright. Sin edición. Sin fricción.

---

## 2. Objetivos y Métricas de Éxito

**Objetivo del MVP:** Validar que el producto genera suficiente valor como para que el usuario lo use de forma recurrente, antes de invertir en nuevas features.

**Métrica Estrella (North Star Metric):**
> Videos publicados en redes sociales generados con StoryForge por semana

**Exit criteria del MVP — no se construye nada nuevo hasta alcanzar:**

| Métrica | Objetivo | Ventana |
|---------|----------|---------|
| Tasa de activación (genera su 1er video en D1) | **> 60%** | D1 |
| Tasa de retención | > 40% | D7 |
| Tasa de publicación (videos generados que se suben) | > 50% | D30 |
| NPS | > 40 | D60 |

---

## 3. Análisis de Usuarios y JTBD

**User Persona Principal — Sofía**
Estudiante universitaria o joven profesional, 18-26 años, fan de manhwas y webtoons. Gestiona un canal de YouTube/TikTok con recaps. Publica de forma irregular porque producir cada video le consume 3-5 horas. No tiene presupuesto para herramientas de pago si no percibe valor inmediato. Cuando una historia entra en tendencia, no puede reaccionar a tiempo.

**Core Job-to-be-Done:**
> "Cuando una historia que sigo entra en tendencia, quiero convertirla en un video de recap en minutos, para publicar antes que la competencia y capitalizar el momento viral."

**El "Aha! Moment":**
Pegar texto → elegir estilo → elegir voz → presionar Generar → ver el video completo listo en menos de 5 minutos.

---

## 4. Alcance del MVP (MoSCoW)

**Must Have** *(semanas 1-6)*
- Input de texto libre (sinopsis o capítulo completo)
- Análisis narrativo por IA → guión de 5-8 escenas con hook y cliffhanger
- Selección de estilo visual por género (manhwa / anime / novela web / fantasy)
- Generación de imágenes por escena coherentes con el estilo
- Biblioteca de 2 voces predefinidas + generación de audio narrado
- Sincronización automática imagen + audio + subtítulos
- Export MP4 1080x1920 (9:16) para YouTube Shorts

**Should Have** *(solo tras validar exit criteria)*
Preview editable, historial de videos, dashboard de cuota

**Won't Have** *(fuera del MVP)*
Integración con plataformas de contenido, publicación automática, workspaces colaborativos

---

## 5. Requerimientos Funcionales y Criterios de Aceptación

| Requerimiento | Criterio de Aceptación |
|--------------|----------------------|
| Análisis narrativo | Devuelve guión en < 30 segundos para textos de hasta 5.000 palabras |
| Generación de imágenes | 5-8 imágenes generadas en < 60 segundos, coherentes con el estilo elegido |
| Generación de audio | Audio narrado sincronizado con el guión en < 30 segundos |
| Ensamblado de video | MP4 final entregado en < 3 minutos desde la confirmación del usuario |
| Tiempo total del flujo | De texto pegado a video descargado en < 5 minutos |
| Privacidad | El texto ingresado no se persiste en base de datos post-generación |

---

## 6. Stack Técnico

# Stack Final Recomendado

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | React + Vite | rápido, simple, moderno |
| UI | TailwindCSS + shadcn/ui | velocidad de desarrollo |
| Backend API | NestJS (TypeScript) | arquitectura sólida y escalable |
| Base de datos | PostgreSQL | relacional y excelente para SaaS |
| Backend-as-a-Service | Supabase | auth + DB + storage |
| Auth | Supabase Auth (Google OAuth) | login instantáneo |
| Storage | Supabase Storage | imágenes/audio/video |
| Queue | Redis + BullMQ | procesamiento async |
| IA narrativa | Claude + Gemini Flash híbrido | calidad + control de costos |
| Generación imágenes | Replicate + Flux Schnell | rapidez MVP |
| Text-to-Speech | ElevenLabs | mejor calidad inicial |
| Render de video | Modal + FFmpeg | workers serverless |
| Deploy frontend | Vercel | deploy inmediato |
| Deploy backend | Railway | simple para NestJS |
| Analytics producto | PostHog | métricas MVP |
| Error tracking | Sentry | observabilidad |
| Billing | Stripe | suscripciones |

---

## 7. Hoja de Ruta Sugerida

```
Semanas 1-2  │ Pipeline de IA: análisis narrativo + imágenes + audio
Semanas 3-4  │ Ensamblado de video + UI React
Semanas 5-6  │ Estabilización + landing + deploy
             │ ── MEDICIÓN DE EXIT CRITERIA ──
Semanas 7-8  │ [Si 60% activación] → Preview editable + historial
```

---

## 8. Backlog para Azure DevOps

> El backlog completo está en **[backlog-azure-devops.md](backlog-azure-devops.md)** — 3 épicas, 9 historias de usuario, 66 story points listos para importar como work items en Azure DevOps.

### Resumen del Backlog

| Épica | # Historias | Story Points Totales | Prioridad |
|-------|-------------|----------------------|-----------|
| Épica 1: Pipeline de Generación de Video | 4 | 34 SP | Alta |
| Épica 2: Gestión de Cuenta | 2 | 6 SP | Alta |
| Épica 3: Infraestructura y Pipeline Técnico | 3 | 26 SP | Alta |
| **TOTAL MVP** | **9** | **66 SP** | |

> *Referencia de velocidad sugerida para equipo de 2 devs: 20-25 SP/semana → MVP completable en 3-4 semanas de desarrollo efectivo.*

---

> ✅ El Product Brief y el Backlog están listos. Ver [backlog-azure-devops.md](backlog-azure-devops.md) para el detalle completo de épicas e historias.

<!-- eliminado: contenido del backlog movido a backlog-azure-devops.md -->

### ÉPICA 1: Pipeline de Generación de Video

**Descripción:** Núcleo del producto. Automatiza el proceso completo desde texto hasta MP4 exportable.  
**Área:** Core Product  
**Prioridad:** Alta

---

#### Historia de Usuario 1.1 — Análisis narrativo del texto

- **Título:** Analizar texto y generar guión estructurado
- **Descripción:**  
  "Como creadora de recaps, quiero pegar el texto de una historia y recibir un guión con los momentos más impactantes, para no tener que seleccionar manualmente."
- **Prioridad:** Alta
- **Estimación:** 8 SP

##### Criterios de Aceptación

- [ ] Dado que ingresé texto de al menos 300 palabras, cuando hago clic en "Analizar historia", entonces la IA devuelve en menos de 30 segundos un guión de 5-8 escenas.
- [ ] Cada escena incluye: texto narrativo, descripción de imagen sugerida y etiqueta de emoción (tensión / romance / acción / revelación).
- [ ] Si el texto tiene menos de 300 palabras, el sistema muestra un mensaje de error claro antes de llamar a la API.
- [ ] El texto ingresado no se persiste en base de datos tras la generación del guión.

---

#### Historia de Usuario 1.2 — Generación de imágenes por estilo visual

- **Título:** Generar imágenes de cada escena según estilo de género
- **Descripción:**  
  "Como creadora, quiero elegir el estilo visual antes de generar las imágenes, para que el video sea coherente con el universo de la historia."
- **Prioridad:** Alta
- **Estimación:** 8 SP

##### Criterios de Aceptación

- [ ] Dado que el guión fue generado, cuando selecciono uno de los 4 estilos (manhwa / anime / novela web / fantasy) y confirmo, entonces se generan imágenes para cada escena en menos de 60 segundos.
- [ ] Las imágenes respetan la paleta de color y estilo visual del género seleccionado.
- [ ] Cada imagen es visible en pantalla antes de continuar al paso de audio.
- [ ] Si la generación de una imagen falla, el sistema reintenta automáticamente una vez y notifica al usuario si persiste el error.

---

#### Historia de Usuario 1.3 — Narración con voz en off

- **Título:** Seleccionar voz y generar audio narrado
- **Descripción:**  
  "Como creadora, quiero elegir una voz de una biblioteca predefinida y que el audio se sincronice automáticamente, para que el video suene acorde al tono de la historia."
- **Prioridad:** Alta
- **Estimación:** 5 SP

##### Criterios de Aceptación

- [ ] Dado que estoy en el paso de audio, cuando selecciono una de las 2 voces disponibles, entonces la IA genera el audio narrado completo del guión.
- [ ] El audio generado se sincroniza automáticamente con las imágenes y los subtítulos.
- [ ] La biblioteca muestra al menos 2 voces con tono diferenciable.
- [ ] El tiempo de generación de audio no supera los 30 segundos para guiones de hasta 8 escenas.

---

#### Historia de Usuario 1.4 — Ensamblado y export del video final

- **Título:** Exportar video MP4 9:16 listo para YouTube Shorts
- **Descripción:**  
  "Como creadora, quiero descargar el video en formato 9:16 con subtítulos y audio sincronizados, para subirlo a YouTube Shorts sin edición adicional."
- **Prioridad:** Alta
- **Estimación:** 13 SP

##### Criterios de Aceptación

- [ ] Dado que el guión, imágenes y audio fueron generados, cuando hago clic en "Exportar", entonces descargo un MP4 1080x1920.
- [ ] El video incluye subtítulos incrustados sincronizados con el audio narrado.
- [ ] La duración del video no supera los 60 segundos.
- [ ] El tiempo total del flujo completo (texto → descarga) no supera los 10 minutos.

---

### ÉPICA 2: Interfaz y Experiencia de Usuario

**Descripción:** Construcción de la experiencia principal del usuario desde el input hasta la descarga del video.  
**Área:** Frontend / UX  
**Prioridad:** Alta

---

#### Historia de Usuario 2.1 — Input de historia y flujo guiado

- **Título:** Crear flujo guiado de generación paso a paso
- **Descripción:**  
  "Como usuario nuevo, quiero un flujo claro y simple para pegar texto, elegir estilo y generar el video sin confusión."
- **Prioridad:** Alta
- **Estimación:** 5 SP

##### Criterios de Aceptación

- [ ] El usuario puede pegar texto desde desktop o mobile.
- [ ] El flujo muestra claramente los pasos: Texto → Estilo → Voz → Generar.
- [ ] El botón "Generar Video" permanece deshabilitado hasta completar los campos mínimos requeridos.
- [ ] El usuario visualiza estados de carga durante cada etapa del pipeline.

---

#### Historia de Usuario 2.2 — Visualización del progreso del pipeline

- **Título:** Mostrar progreso de generación en tiempo real
- **Descripción:**  
  "Como usuario, quiero saber qué está haciendo el sistema mientras se genera el video, para entender el progreso y reducir incertidumbre."
- **Prioridad:** Alta
- **Estimación:** 3 SP

##### Criterios de Aceptación

- [ ] El frontend muestra estados de progreso: analizando historia, generando imágenes, generando audio y renderizando video.
- [ ] El usuario puede permanecer en la pantalla sin perder el estado del proceso.
- [ ] Si ocurre un error, el sistema muestra un mensaje claro y opción de reintento.

---

### ÉPICA 3: Infraestructura y Pipeline Técnico

**Descripción:** Setup técnico, integración de APIs externas y arquitectura async para procesamiento multimedia.  
**Área:** Engineering / DevOps  
**Prioridad:** Alta

---

#### Historia de Usuario 3.1 — Setup inicial del proyecto

- **Título:** Inicializar repositorio y arquitectura base
- **Descripción:**  
  "Como equipo de desarrollo, quiero tener el proyecto base configurado con frontend, backend, storage y deploy automático."
- **Prioridad:** Alta
- **Estimación:** 5 SP

##### Criterios de Aceptación

- [ ] Repositorio configurado con React + Vite y NestJS.
- [ ] Supabase conectado con PostgreSQL y Storage.
- [ ] Variables de entorno documentadas para todas las APIs externas.
- [ ] Pipeline básico de CI/CD funcionando en Vercel y Railway.

---

#### Historia de Usuario 3.2 — Integración del pipeline de IA

- **Título:** Integrar servicios de IA para narrativa, imágenes y audio
- **Descripción:**  
  "Como equipo de desarrollo, quiero tener integradas las APIs de IA para generar guiones, imágenes y narraciones automáticamente."
- **Prioridad:** Alta
- **Estimación:** 11 SP

##### Criterios de Aceptación

- [ ] Endpoint POST `/generate/script` retorna guión estructurado.
- [ ] Endpoint POST `/generate/images` retorna imágenes generadas por escena.
- [ ] Endpoint POST `/generate/audio` retorna URL de audio narrado.
- [ ] Cada endpoint implementa timeout, retry y logging estructurado.
- [ ] El sistema limita generación simultánea por usuario.

---

#### Historia de Usuario 3.3 — Pipeline de ensamblado serverless con FFmpeg

- **Título:** Ensamblar imagen + audio + subtítulos en MP4 9:16 via FFmpeg serverless
- **Descripción:**  
  "Como equipo de desarrollo, quiero un pipeline serverless que tome imágenes, audio y texto de subtítulos y entregue un MP4 listo, para no mantener un servidor de video dedicado."
- **Prioridad:** Alta
- **Estimación:** 13 SP

##### Criterios de Aceptación

- [ ] El pipeline acepta: array de URLs de imágenes, URL de audio narrado y array de textos de subtítulos con timestamps.
- [ ] El output es un MP4 1080x1920 con subtítulos incrustados (SRT burned-in) y duración máxima de 60 segundos.
- [ ] El video generado se sube automáticamente a Supabase Storage y se devuelve una URL firmada de descarga.
- [ ] El tiempo de ensamblado no supera los 3 minutos para videos de hasta 60 segundos.
- [ ] La URL firmada expira a las 24 horas por razones de costo de almacenamiento.

---

### Resumen del Backlog

| Épica | # Historias | Story Points Totales | Prioridad |
|-------|-------------|----------------------|-----------|
| Épica 1: Pipeline de Generación de Video | 4 | 34 SP | Alta |
| Épica 2: Interfaz y Experiencia de Usuario | 2 | 8 SP | Alta |
| Épica 3: Infraestructura y Pipeline Técnico | 3 | 29 SP | Alta |
| **TOTAL MVP** | **9** | **71 SP** | |

> *Referencia de velocidad sugerida para equipo de 2 devs: 20-25 SP/semana → MVP completable en 3-4 semanas de desarrollo efectivo.*

---

> ✅ El Product Brief y el Backlog están listos. Las épicas e historias de usuario pueden copiarse directamente en Azure DevOps como work items (Épica → Historia de Usuario → Criterios de Aceptación).
