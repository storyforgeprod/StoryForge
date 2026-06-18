# Diagrama Secuencial - StoryForge

Flujo paso a paso de cómo se genera un video completo desde una historia.

## Resumen Rápido

```
Usuario envía historia
    ↓
[1] POST /script → Job pending → Azure OpenAI → script con escenas
    ↓
[2] POST /images → Job pending → Azure Foundry → imágenes de cada escena
    ↓
[3] POST /audio → Job pending → OpenAI + ElevenLabs → narración de audio
    ↓
[4] POST /video → Job pending → FFmpeg → video final
    ↓
Video completado ✓
```

---

## Paso 1: Generar Script

Convierte una historia larga en un script con escenas cortas.

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as Frontend React
    participant API as Backend NestJS
    participant DB as BD Supabase
    participant Queue as Bull Queue
    participant Processor as Queue Processor
    participant Azure as Azure OpenAI

    User->>Frontend: 1. Escribe historia + parámetros
    Note over Frontend: • Title: "Mi Historia"<br/>• Story: "Texto largo..."<br/>• Duration: 60s<br/>• Scenes: 12
    
    Frontend->>API: 2. POST /generate/script
    API->>DB: 3. Crear Job (status: pending)
    DB-->>API: jobId devuelto
    API->>Queue: 4. Agregar a Bull Queue
    API-->>Frontend: 5. HTTP 202 + jobId
    Frontend-->>User: "Script en generación..."

    par Frontend polling (cliente)
        Frontend->>API: 6a. GET /generate/job/:jobId
        API->>DB: Leer job
        DB-->>API: status: pending
        API-->>Frontend: 202 (aún procesando)
    and Backend procesamiento (asincrónico)
        Processor->>Queue: 6b. Dequeue job
        Processor->>Azure: 7. generateScript(story, duration, scenes)
        Note over Processor,Azure: "Usa prompt para respetar<br/>constraints de duración"
        Azure-->>Processor: "Scene 1: ...\nScene 2: ..."
        Processor->>DB: 8. Actualizar Job<br/>(status: completed, result: script)
        DB-->>Processor: ✓ OK
    end

    Frontend->>API: 9. GET /generate/job/:jobId
    DB->>API: status: completed
    API-->>Frontend: 200 + script
    Frontend-->>User: ✓ Script listo!
```

**Salida:** Job con `result = {script: "Scene 1: ..., Scene 2: ..."}`

---

## Paso 2: Generar Imágenes

Extrae escenas del script y genera una imagen por escena.

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as Frontend React
    participant API as Backend NestJS
    participant DB as BD Supabase
    participant Queue as Bull Queue
    participant Processor as Queue Processor
    participant ImageAI as Azure Foundry
    participant Storage as Supabase Storage

    User->>Frontend: 1. Selecciona estilo visual
    Note over Frontend: • Style: "manga_ink"<br/>• Luego selecciona script job
    
    Frontend->>API: 2. POST /generate/images
    Note over API: {scriptId: "job_abc", style: "manga_ink"}
    
    API->>DB: 3. Validar script completado
    DB-->>API: ✓ OK
    API->>DB: 4. Crear Job images (pending)
    DB-->>API: imageJobId
    API->>Queue: 5. Agregar a Bull Queue
    API-->>Frontend: 6. HTTP 202 + imageJobId
    Frontend-->>User: "Imágenes en generación..."

    par Frontend polling
        Frontend->>API: 7a. GET /generate/job/:imageJobId
        API-->>Frontend: 202 (aún en progreso)
    and Backend procesamiento
        Processor->>Queue: 7b. Dequeue images job
        Processor->>DB: 8. Fetch script job result
        DB-->>Processor: {script: "Scene 1: ...\nScene 2: ..."}
        Processor->>Processor: 9. Extraer escenas del script
        Note over Processor: Busca "Scene 1:", "Scene 2:", etc
        
        loop Para cada escena (ej: 6 escenas)
            Processor->>Processor: 10a. Construir prompt
            Note over Processor: + style descriptions<br/>(ej: "manga ink illustration...")
            Processor->>ImageAI: 10b. generateImage(prompt)
            Note over Processor,ImageAI: Azure Foundry Flux.2-pro<br/>Rate limit: 1-2 seg por imagen
            ImageAI-->>Processor: https://storage.../img1.png
            Processor->>Storage: Confirmar almacenamiento
        end
        
        Processor->>DB: 11. Actualizar Job images
        Note over DB: status: completed<br/>result: {imageUrls: [...], prompt: "..."}
        DB-->>Processor: ✓ OK
    end

    Frontend->>API: 12. GET /generate/job/:imageJobId
    API->>DB: Leer job completado
    API-->>Frontend: 200 + imageUrls[]
    Frontend-->>User: ✓ Imágenes listas!
```

**Salida:** Job con `result = {imageUrls: ["url1", "url2", ...], prompt: "..."}`

---

## Paso 3: Generar Audio

Genera una narración profesional y la convierte a audio.

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as Frontend React
    participant API as Backend NestJS
    participant DB as BD Supabase
    participant Queue as Bull Queue
    participant Processor as Queue Processor
    participant Azure as Azure OpenAI
    participant TTS as ElevenLabs/Azure Speech
    participant Storage as Supabase Storage

    User->>Frontend: 1. Selecciona voz y idioma
    Note over Frontend: • Voice: "alloy"<br/>• Language: "es"
    
    Frontend->>API: 2. POST /generate/audio
    Note over API: {scriptId: "job_abc",<br/>voiceId: "alloy",<br/>language: "es"}
    
    API->>DB: 3. Validar script completado
    DB-->>API: ✓ OK
    API->>DB: 4. Crear Job audio (pending)
    API->>Queue: 5. Agregar a Bull Queue
    API-->>Frontend: 6. HTTP 202 + audioJobId
    Frontend-->>User: "Audio en generación..."

    par Frontend polling
        Frontend->>API: 7a. GET /generate/job/:audioJobId
        API-->>Frontend: 202
    and Backend procesamiento
        Processor->>Queue: 7b. Dequeue audio job
        Processor->>DB: 8. Fetch script job (completo)
        DB-->>Processor: {result: "Scene 1...",<br/>metadata: {story: "original...",<br/>targetDuration: 60}}
        
        Processor->>Azure: 9. generateAudioNarration(story, 60s, 6 scenes)
        Note over Processor,Azure: Usa STORY original<br/>(no el script)<br/>OpenAI genera narración<br/>profesional y natural
        Azure-->>Processor: "En una galaxia lejana..."
        
        Processor->>TTS: 10. generateTextToSpeech(narración, "es", "alloy")
        Note over Processor,TTS: Intenta ElevenLabs primero<br/>Si falla: fallback a Azure Speech
        TTS-->>Processor: https://storage.../audio.mp3
        Processor->>Storage: Confirmar almacenamiento
        
        Processor->>DB: 11. Actualizar Job audio
        Note over DB: status: completed<br/>result: {audioUrl: "...",<br/>audioLength: 55}
        DB-->>Processor: ✓ OK
    end

    Frontend->>API: 12. GET /generate/job/:audioJobId
    API->>DB: Leer job completado
    API-->>Frontend: 200 + audioUrl
    Frontend-->>User: ✓ Audio listo!
```

**Salida:** Job con `result = {audioUrl: "https://...", audioLength: 55}`

---

## Paso 4: Ensamblar Video

Combina imágenes + audio en un video MP4 final.

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as Frontend React
    participant API as Backend NestJS
    participant DB as BD Supabase
    participant Queue as Bull Queue
    participant Processor as Queue Processor
    participant FFmpeg as FFmpeg
    participant Storage as Supabase Storage

    User->>Frontend: 1. Selecciona jobs de imagen + audio
    Note over Frontend: • Image Job: job_img<br/>• Audio Job: job_audio
    
    Frontend->>API: 2. POST /generate/video
    Note over API: {imageJobId: "job_img",<br/>audioJobId: "job_audio"}
    
    API->>DB: 3. Validar image job completado
    API->>DB: 4. Validar audio job completado
    DB-->>API: ✓ Ambos OK
    
    API->>DB: 5. Crear Job video (pending)
    API->>Queue: 6. Agregar a Bull Queue
    API-->>Frontend: 7. HTTP 202 + videoJobId
    Frontend-->>User: "Video en generación..."

    par Frontend polling
        Frontend->>API: 8a. GET /generate/job/:videoJobId
        API-->>Frontend: 202
    and Backend procesamiento
        Processor->>Queue: 8b. Dequeue video job
        
        Processor->>DB: 9a. Fetch image job result
        DB-->>Processor: {imageUrls: ["img1.png", "img2.png", ...]}
        
        Processor->>DB: 9b. Fetch audio job result
        DB-->>Processor: {audioUrl: "audio.mp3", audioLength: 55}
        
        Processor->>Processor: 10. Calcular timings
        Note over Processor: 6 imágenes x 55s = ~9s por imagen
        
        Processor->>FFmpeg: 11. assembleVideo(images[], audio, fps=30, bitrate=2M)
        Note over Processor,FFmpeg: FFmpeg pipeline:<br/>1. Descargar imágenes<br/>2. Crear secuencia<br/>3. Sincronizar con audio<br/>4. Codificar MP4
        
        FFmpeg-->>Processor: video.mp4 (descargado)
        Processor->>Storage: 12. Upload a Supabase Storage
        Storage-->>Processor: https://storage.../video.mp4
        
        Processor->>DB: 13. Actualizar Job video
        Note over DB: status: completed<br/>result: {videoUrl: "...",<br/>duration: 55,<br/>format: "mp4"}
        DB-->>Processor: ✓ OK
    end

    Frontend->>API: 14. GET /generate/job/:videoJobId
    API->>DB: Leer job completado
    API-->>Frontend: 200 + videoUrl
    Frontend-->>User: 🎥 Video listo!<br/>Descarga/Comparte
```

**Salida:** Job con `result = {videoUrl: "https://...", duration: 55, format: "mp4"}`

---

## Patrón General: Fire & Poll

Todos los pasos siguen este patrón:

```
1. POST /generate/{type}
   ├─ BD: Job creado (pending)
   ├─ Queue: Job encolado
   └─ API: Devuelve 202 + jobId

2. GET /generate/job/:jobId (polling)
   ├─ Si status=pending: Devuelve 202
   ├─ Si status=completed: Devuelve 200 + resultado
   └─ Si status=failed: Devuelve 200 + error

[En background: Queue Processor procesa asincronamente]
```

**Ventajas:**
- ✓ Frontend no bloquea esperando
- ✓ Tolera servicios externos lentos
- ✓ Escalable: múltiples jobs simultáneos
- ✓ Tolerancia a fallos: reintentos automáticos

---

## Flujo Completo: Visión General

```mermaid
graph LR
    A["📝 Story<br/>Texto largo"] -->|POST /script| B["🔴 Script Job<br/>pending"]
    B -->|Queue Process| C["✓ Script Job<br/>completed"]
    
    C -->|POST /images| D["🔴 Image Job<br/>pending"]
    D -->|Queue Process| E["✓ Image Job<br/>completed"]
    
    C -->|POST /audio| F["🔴 Audio Job<br/>pending"]
    F -->|Queue Process| G["✓ Audio Job<br/>completed"]
    
    E -->|POST /video| H["🔴 Video Job<br/>pending"]
    G -->|Required for| H
    H -->|Queue Process| I["✓ Video Job<br/>completed"]
    
    I -->|GET /job| J["🎥 Video MP4<br/>Descarga/Comparte"]
    
    style A fill:#fff3cd
    style B fill:#cfe2ff
    style C fill:#d1ecf1
    style D fill:#cfe2ff
    style E fill:#d1ecf1
    style F fill:#cfe2ff
    style G fill:#d1ecf1
    style H fill:#cfe2ff
    style I fill:#d1ecf1
    style J fill:#d4edda
```
