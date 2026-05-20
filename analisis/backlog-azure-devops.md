# StoryForge — Backlog Azure DevOps

*Fecha: 15 de mayo de 2026 | Versión: MVP v1.0*

> Jerarquía: Épica → Historia de Usuario → Criterios de Aceptación
> Listo para importar como work items en Azure DevOps.

---

### ÉPICA 1: Pipeline de Generación de Video
**Descripción:** Núcleo del producto. Automatiza el 100% del proceso de creación de video desde texto hasta MP4 exportable.
**Área:** Core Product
**Prioridad:** Alta

#### Historia de Usuario 1.1 — Análisis narrativo del texto
- **Título:** Analizar texto y generar guión estructurado
- **Descripción:** "Como creadora de recaps, quiero pegar el texto de una historia y recibir un guión con los momentos más impactantes, para no tener que seleccionar manualmente."
- **Prioridad:** Alta
- **Estimación:** 8 SP
- **Criterios de Aceptación:**
  - [ ] Dado que ingresé texto de al menos 300 palabras, cuando hago clic en "Analizar historia", entonces la IA devuelve en menos de 30 segundos un guión de 5-8 escenas.
  - [ ] Cada escena incluye: texto narrativo, descripción de imagen sugerida y etiqueta de emoción (tensión / romance / acción / revelación).
  - [ ] Si el texto tiene menos de 300 palabras, el sistema muestra un mensaje de error claro antes de llamar a la API.
  - [ ] El texto ingresado no se persiste en base de datos tras la generación del guión.

#### Historia de Usuario 1.2 — Generación de imágenes por estilo visual
- **Título:** Generar imágenes de cada escena según estilo de género
- **Descripción:** "Como creadora, quiero elegir el estilo visual antes de generar las imágenes, para que el video sea coherente con el universo de la historia."
- **Prioridad:** Alta
- **Estimación:** 8 SP
- **Criterios de Aceptación:**
  - [ ] Dado que el guión fue generado, cuando selecciono uno de los 4 estilos (manhwa / anime / novela web / fantasy) y confirmo, entonces se generan imágenes para cada escena en menos de 60 segundos.
  - [ ] Las imágenes respetan la paleta de color y estilo de trazo del género seleccionado.
  - [ ] Cada imagen es visible en pantalla antes de continuar al paso de audio.
  - [ ] Si la generación de una imagen falla, el sistema reintenta automáticamente una vez y notifica al usuario si persiste el error.

#### Historia de Usuario 1.3 — Narración con voz en off
- **Título:** Seleccionar voz y generar audio narrado
- **Descripción:** "Como creadora, quiero elegir una voz de una biblioteca predefinida y que el audio se sincronice automáticamente, para que el video suene acorde al tono de la historia."
- **Prioridad:** Alta
- **Estimación:** 5 SP
- **Criterios de Aceptación:**
  - [ ] Dado que estoy en el paso de audio, cuando escucho los samples de las 6 voces disponibles y selecciono una, entonces la IA genera el audio narrado completo del guión con esa voz.
  - [ ] El audio generado se sincroniza automáticamente con las imágenes y los subtítulos.
  - [ ] La biblioteca muestra al menos 6 voces: 3 femeninas y 3 masculinas, con variantes de tono (dramático, neutro, enérgico).
  - [ ] El tiempo de generación de audio no supera los 30 segundos para guiones de hasta 8 escenas.

#### Historia de Usuario 1.4 — Ensamblado y export del video final
- **Título:** Exportar video MP4 9:16 listo para YouTube Shorts
- **Descripción:** "Como creadora, quiero descargar el video en formato 9:16 con subtítulos y audio sincronizados, para subirlo a YouTube Shorts sin edición adicional."
- **Prioridad:** Alta
- **Estimación:** 13 SP
- **Criterios de Aceptación:**
  - [ ] Dado que el guión, imágenes y audio fueron generados, cuando hago clic en "Exportar", entonces descargo un MP4 1080x1920 en menos de 3 minutos.
  - [ ] El video incluye subtítulos incrustados sincronizados con el audio narrado.
  - [ ] La duración del video no supera los 60 segundos.
  - [ ] El archivo no contiene marca de agua en el plan gratuito.
  - [ ] El tiempo total del flujo completo (texto → descarga) no supera los 5 minutos.

---

### ÉPICA 2: Autenticación y Gestión de Cuenta
**Descripción:** Registro, login y gestión del ciclo de vida del usuario. Base para el control de cuota freemium.
**Área:** Identity & Access
**Prioridad:** Alta

#### Historia de Usuario 2.1 — Registro e inicio de sesión con Google
- **Título:** Autenticación OAuth con Google en un clic
- **Descripción:** "Como usuario nuevo, quiero registrarme con mi cuenta de Google sin formularios, para empezar a usar StoryForge de inmediato."
- **Prioridad:** Alta
- **Estimación:** 3 SP
- **Criterios de Aceptación:**
  - [ ] Dado que soy un usuario nuevo en la landing page, cuando hago clic en "Continuar con Google" y autorizo el acceso, entonces se crea mi cuenta automáticamente y soy redirigido al dashboard.
  - [ ] El plan gratuito queda activo desde el momento del registro sin ninguna acción adicional.
  - [ ] Si el usuario ya existe, el flujo de login no crea una cuenta duplicada.

#### Historia de Usuario 2.2 — Control y visualización de cuota mensual
- **Título:** Mostrar cuota de videos disponibles y bloquear al superarla
- **Descripción:** "Como usuario gratuito, quiero ver cuántos videos me quedan este mes y recibir un aviso claro al agotar mi cuota, para no llevarme sorpresas."
- **Prioridad:** Alta
- **Estimación:** 3 SP
- **Criterios de Aceptación:**
  - [ ] Dado que estoy en el dashboard, cuando cargo la página, entonces veo un indicador "X de 3 videos usados este mes" con la fecha de renovación.
  - [ ] Dado que intenté generar un cuarto video, cuando el sistema detecta que superé la cuota, entonces bloquea la generación y muestra un modal con la fecha de renovación y opción de upgrade.
  - [ ] La cuota se resetea automáticamente el primer día de cada mes calendario.

---

### ÉPICA 3: Infraestructura y Pipeline Técnico
**Descripción:** Setup, integración de APIs externas y pipeline serverless de ensamblado de video.
**Área:** Engineering / DevOps
**Prioridad:** Alta

#### Historia de Usuario 3.1 — Setup del proyecto y arquitectura base
- **Título:** Inicializar repositorio con React + NestJS + Supabase
- **Descripción:** "Como equipo de desarrollo, quiero tener el proyecto base configurado con autenticación, base de datos y deploy automático, para poder construir features sin fricción de setup."
- **Prioridad:** Alta
- **Estimación:** 5 SP
- **Criterios de Aceptación:**
  - [ ] Repositorio configurado con frontend React (Vite) y backend NestJS.
  - [ ] Supabase conectado con Auth (Google OAuth), PostgreSQL y Storage habilitados.
  - [ ] Variables de entorno definidas y documentadas para todas las API keys (Claude, ElevenLabs, Replicate, Stripe).
  - [ ] Pipeline de CI/CD básico: push a main despliega automáticamente en Vercel (frontend) y Railway (backend).

#### Historia de Usuario 3.2 — Integración del pipeline de IA
- **Título:** Integrar Claude API, Replicate y ElevenLabs en el backend NestJS
- **Descripción:** "Como equipo de desarrollo, quiero tener los tres servicios de IA integrados y testeados de forma aislada, para componer el pipeline de generación con confianza."
- **Prioridad:** Alta
- **Estimación:** 8 SP
- **Criterios de Aceptación:**
  - [ ] Endpoint POST `/generate/script` recibe texto y retorna guión estructurado (JSON) usando Claude API.
  - [ ] Endpoint POST `/generate/images` recibe descripción de escena + estilo y retorna URL de imagen usando Replicate.
  - [ ] Endpoint POST `/generate/audio` recibe texto del guión + voice_id y retorna URL de audio usando ElevenLabs.
  - [ ] Cada endpoint tiene manejo de errores, timeout y logging estructurado.
  - [ ] Rate limiting aplicado: máximo 1 generación simultánea por usuario.

#### Historia de Usuario 3.3 — Pipeline de ensamblado serverless con FFmpeg
- **Título:** Ensamblar imagen + audio + subtítulos en MP4 9:16 via FFmpeg serverless
- **Descripción:** "Como equipo de desarrollo, quiero un pipeline serverless que tome imágenes, audio y texto de subtítulos y entregue un MP4 listo, para no mantener un servidor de video dedicado."
- **Prioridad:** Alta
- **Estimación:** 13 SP
- **Criterios de Aceptación:**
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
| Épica 2: Autenticación y Gestión de Cuenta | 2 | 6 SP | Alta |
| Épica 3: Infraestructura y Pipeline Técnico | 3 | 26 SP | Alta |
| **TOTAL MVP** | **9** | **66 SP** | |

> *Referencia de velocidad sugerida para equipo de 2 devs: 20-25 SP/semana → MVP completable en 3-4 semanas de desarrollo efectivo.*
