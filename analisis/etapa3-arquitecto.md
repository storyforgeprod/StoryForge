# Etapa 3 — Arquitecto de Producto (TPM)

## Principio rector ágil

> **El MVP no es una versión pequeña del producto completo. Es el experimento más barato que prueba que el valor existe.**

El criterio de éxito es único y medible: **60% de usuarios nuevos generan su primer video en D1.** Hasta que ese número no se alcance, no se construye ninguna feature nueva.

**Marco de trabajo:** Kanban continuo
**Tiempo al MVP:** 4-6 semanas
**Exit criteria:** 60% de activación en D1

---

## 1. Definición del MVP (MoSCoW)

### Must Have *(el MVP son solo estos items)*

| # | Feature | Por qué es Must Have |
|---|---------|----------------------|
| 1 | Input de texto libre (pegar sinopsis) | Es el inicio del pipeline |
| 2 | Análisis narrativo por IA → guión con 5-8 escenas | Es el núcleo diferenciador |
| 3 | Selección de estilo visual (4 géneros predefinidos) | Define la coherencia visual |
| 4 | Generación de imágenes por escena | Output visible del producto |
| 5 | Selección de voz (6 voces predefinidas) + generación de audio | Convierte el slideshow en video |
| 6 | Ensamblado automático y export MP4 9:16 | El entregable que el usuario publica |
| 7 | Auth con Google (sin formulario) | Necesario para cuota y persistencia |
| 8 | Cuota de 3 videos/mes para usuarios gratuitos | Límite del free tier |

### Should Have *(solo si el MVP supera el criterio de activación)*
- Preview del video antes de exportar
- Regenerar imagen individual por escena
- Historial de videos generados
- Música de fondo por mood
- Dashboard de cuota restante

### Could Have *(Backlog — validar con usuarios antes de construir)*
- Exportación optimizada para TikTok e Instagram Reels
- Ajuste de velocidad de narración
- Templates de estructura narrativa

### Won't Have *(explícitamente fuera del producto actual)*
- Integración directa con Webtoon / Naver / Kakao
- Publicación automática en redes desde la plataforma
- Clonación de voz propia
- Workspaces colaborativos
- Analíticas post-publicación

---

## 2. Tablero Kanban y Hoja de Ruta del MVP

**Columnas del tablero:**
```
[ BACKLOG ] → [ READY ] → [ IN PROGRESS ] → [ IN REVIEW ] → [ DONE ]
```

### Semana 1-2 — Núcleo del pipeline de IA
- [ ] Setup del proyecto (React + NestJS + Supabase)
- [ ] Auth con Google (Supabase Auth)
- [ ] Endpoint NestJS: recibir texto → llamar Claude API → devolver guión estructurado
- [ ] Endpoint NestJS: recibir descripción de escena + estilo → generar imagen (Replicate)
- [ ] Endpoint NestJS: recibir guión → generar audio narrado (ElevenLabs)

### Semana 3-4 — Ensamblado y UI mínima
- [ ] Pipeline de ensamblado: FFmpeg sincroniza imagen + audio + subtítulos → MP4
- [ ] UI React: pantalla de input de texto + selección de estilo + selección de voz
- [ ] UI React: pantalla de preview del video generado + botón de descarga
- [ ] Control de cuota: contador 3 videos/mes por usuario

### Semana 5-6 — Estabilización y primeros usuarios
- [ ] Tests del flujo completo end-to-end
- [ ] Manejo de errores y estados de carga
- [ ] Landing page mínima con propuesta de valor y CTA
- [ ] Deploy en producción (Vercel + Railway)
- [ ] Onboarding de 10-20 usuarios beta para medir tasa de activación en D1

---

## 3. Épicas e Historias de Usuario

### Épica 1: Pipeline de Generación de Video *(Prioridad: Crítica)*

#### Historia 1.1 — Análisis narrativo del texto
- **Descripción:** "Como creadora de recaps, quiero pegar el texto de una historia y recibir un guión con los momentos más impactantes, para no tener que seleccionar manualmente."
- **Criterios de Aceptación:**
  - Dado que ingresé texto de al menos 300 palabras,
  - Cuando hago clic en "Analizar historia",
  - Entonces la IA devuelve en menos de 30 segundos un guión de 5-8 escenas con texto narrativo, descripción visual y etiqueta de emoción por escena.

#### Historia 1.2 — Generación de imágenes por estilo
- **Descripción:** "Como creadora, quiero elegir el estilo visual antes de generar las imágenes, para que el video sea coherente con el universo de la historia."
- **Criterios de Aceptación:**
  - Dado que el guión fue generado y seleccioné un estilo (manhwa / anime / novela web / fantasy),
  - Cuando confirmo la selección,
  - Entonces se generan imágenes para cada escena respetando la paleta y trazo del estilo, visibles en pantalla en menos de 60 segundos.

#### Historia 1.3 — Narración con voz en off
- **Descripción:** "Como creadora, quiero elegir una voz de una biblioteca predefinida, para que el video suene acorde al tono de la historia."
- **Criterios de Aceptación:**
  - Dado que escuché los samples de las 6 voces disponibles y seleccioné una,
  - Cuando confirmo la elección,
  - Entonces la IA genera el audio narrado completo y lo sincroniza automáticamente con las imágenes y subtítulos.

#### Historia 1.4 — Export del video final
- **Descripción:** "Como creadora, quiero descargar el video en formato 9:16, para subirlo a YouTube Shorts sin edición adicional."
- **Criterios de Aceptación:**
  - Dado que el video fue generado correctamente,
  - Cuando hago clic en "Exportar",
  - Entonces descargo un MP4 1080x1920 de hasta 60 segundos con subtítulos incrustados y audio sincronizado.

---

### Épica 2: Autenticación y Cuota Freemium *(Prioridad: Alta)*

#### Historia 2.1 — Registro con Google
- **Descripción:** "Como usuario nuevo, quiero registrarme con Google en un clic, para empezar sin formularios."
- **Criterios de Aceptación:**
  - Dado que llego al sitio por primera vez,
  - Cuando hago clic en "Continuar con Google",
  - Entonces mi cuenta se crea y soy redirigido al dashboard con el plan gratuito activo.

#### Historia 2.2 — Control de cuota mensual
- **Descripción:** "Como usuario gratuito, quiero saber cuántos videos me quedan, para decidir cuándo usarlos."
- **Criterios de Aceptación:**
  - Dado que estoy en el dashboard,
  - Cuando intento generar un cuarto video habiendo usado mis 3 créditos del mes,
  - Entonces el sistema bloquea la generación y muestra un mensaje claro con la fecha de renovación de la cuota.

---

## 4. Stack Técnico del MVP

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React (Vite) | SPA liviana, deploy en Vercel, ecosistema amplio |
| Backend | NestJS (TypeScript) | Arquitectura modular, decoradores, DX robusta, mismo lenguaje que el frontend |
| Base de datos + Auth | Supabase | Auth OAuth, Storage para MP4, RLS multiusuario |
| IA narrativa | Claude API (claude-sonnet-4-6) | Comprensión narrativa superior |
| Generación de imágenes | Replicate (Flux Schnell) | Rápido, por inferencia, sin costo fijo |
| Text-to-Speech | ElevenLabs API | Voces realistas, multilingüe |
| Ensamblado de video | FFmpeg (serverless via Modal) | Sin servidor dedicado, pago por uso |
| Pagos | Stripe | Para el upgrade a plan pago (Should Have) |
| Deploy | Vercel (frontend) + Railway (NestJS) | Bajo costo inicial, escala cuando valida |

### Requerimientos No Funcionales del MVP
- Tiempo de generación completo < 5 minutos
- Disponibilidad > 99% en horario pico (18-23hs)
- El texto del usuario no se almacena después de la generación (privacidad por diseño)
- Rate limiting: máximo 1 generación simultánea por usuario gratuito

---

## 5. Flujo Lógico de la Aplicación (Happy Path)

```
Landing → "Crear video gratis"
    └─► Auth Google (1 clic)
            └─► Dashboard → "Nuevo video"
                    └─► [1] Pegar texto (300+ palabras)
                            └─► [2] IA analiza → muestra guión (< 30s)
                                    └─► [3] Elegir estilo visual → generar imágenes (< 60s)
                                            └─► [4] Elegir voz → generar audio (< 30s)
                                                    └─► [5] Ensamblado automático (< 2min)
                                                            └─► [6] Preview → Descargar MP4
                                                                    └─► Subir a YouTube Shorts ✅
```
