# 🎨 Prototipo de Referencia — storyForge Editorial

> **Para Claude Code:** Este directorio es la fuente de verdad visual del proyecto.
> Tu trabajo es adaptar el frontend existente para que se vea y sienta como este prototipo,
> **sin modificar ninguna lógica de negocio, llamadas a APIs, ni funcionalidades existentes.**

---

## Reglas estrictas

### ✅ Podés cambiar
- Clases de Tailwind en JSX/TSX (colores, tipografía, spacing, bordes, sombras)
- Archivos CSS globales y variables CSS
- `tailwind.config.ts` — colores, fuentes, radios personalizados
- Estructura visual de componentes (layout, orden visual)
- Animaciones y transiciones

### ❌ NO podés tocar
- Lógica de estado (`useState`, `useReducer`, `useContext`, `zustand`, etc.)
- Llamadas a APIs (`fetch`, `axios`, `react-query`, `swr`, `trpc`, etc.)
- Handlers de eventos (`onClick`, `onSubmit`, `onChange`, etc.)
- Validaciones de formularios
- Routing (`react-router`, `tanstack-router`, etc.)
- Autenticación y autorización
- Variables de entorno
- Tests

---

## Sistema de diseño

### Variante activa: Editorial Bold
El prototipo usa la variante **editorial** con los siguientes tokens.

### Paleta de colores

| Token          | Dark mode                     | Light mode                    | Uso |
|----------------|-------------------------------|-------------------------------|-----|
| `bg`           | `#0c0a09`                     | `#faf6f0`                     | Fondo de página |
| `card`         | `#16110c`                     | `#ffffff`                     | Fondo de cards |
| `elev`         | `#1a1714`                     | `#f4ede3`                     | Elementos elevados |
| `elev2`        | `#221d18`                     | `#ece0d2`                     | Hover states |
| `bd`           | `#2a241f`                     | `#e9ddcd`                     | Bordes |
| `bd2`          | `#382f27`                     | `#d9c9b4`                     | Bordes hover |
| `fg`           | `#faf7f2`                     | `#1c140d`                     | Texto principal |
| `mut`          | `#b8aea2`                     | `#6b5d4d`                     | Texto secundario |
| `mut2`         | `#847a6e`                     | `#9c8c77`                     | Texto terciario |
| `acc`          | `oklch(0.72 0.18 38)`         | `oklch(0.58 0.19 38)`         | Acento principal (coral) |
| `acc2`         | `oklch(0.74 0.16 55)`         | `oklch(0.6 0.17 55)`          | Acento secundario |
| `on-acc`       | `#1a0f06`                     | `#ffffff`                     | Texto sobre acento |
| `acc-soft`     | `oklch(0.72 0.18 38 / 0.14)` | `oklch(0.58 0.19 38 / 0.12)` | Fondo acento suave |

### Tipografía

| Rol         | Fuente                   | Peso  | Tracking   |
|-------------|--------------------------|-------|------------|
| Headings    | Bricolage Grotesque      | 800   | -0.04em    |
| Body        | Plus Jakarta Sans        | 400   | normal     |
| Monospace   | JetBrains Mono           | 400   | +0.03em    |

Google Fonts a importar:
```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap
```

### Radios de borde

| Token  | Valor  | Uso |
|--------|--------|-----|
| `r-sm` | `8px`  | Inputs, badges pequeños |
| `r`    | `10px` | Cards medianas |
| `r-lg` | `16px` | Cards grandes, modales |

---

## Tailwind config recomendado

Agregá esto a tu `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--bg)',
        card:    'var(--card)',
        elev:    'var(--elev)',
        elev2:   'var(--elev2)',
        bd:      'var(--bd)',
        bd2:     'var(--bd2)',
        fg:      'var(--fg)',
        mut:     'var(--mut)',
        mut2:    'var(--mut2)',
        acc:     'var(--acc)',
        acc2:    'var(--acc2)',
        'on-acc':'var(--on-acc)',
      },
      fontFamily: {
        head: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm:  '8px',
        DEFAULT: '10px',
        lg:  '16px',
      },
    },
  },
} satisfies Config
```

Luego en tu CSS global (`index.css`), pegá las variables del archivo
`tokens/variables.css` de este directorio.

---

## Componentes — referencia visual

Cada componente del prototipo tiene su equivalente en `components/`.
La estructura de cada archivo es:

```
components/
├── Button.tsx        ← variantes primary / ghost / soft
├── Badge.tsx         ← badge de acento
├── Input.tsx         ← input con ícono izquierdo
├── Card.tsx          ← card con borde y fondo elevado
├── AuthScreen.tsx    ← pantalla de login/registro
└── StyleThumb.tsx    ← miniaturas de estilos (SVG)
```

### Cómo usarlos como referencia
Para cada componente existente en tu app, buscá su equivalente en esta carpeta
y aplicá el mismo sistema visual (colores, tipografía, spacing, radios).
**No reemplaces el componente existente — solo adaptá su apariencia.**

---

## Pantallas — mapa de referencia

| Pantalla            | Archivo de referencia          | Descripción |
|---------------------|-------------------------------|-------------|
| Login / Register    | `screens/auth.png`            | Split layout: showcase + form |
| Home / Dashboard    | `screens/home.png`            | Greeting + stats + recientes |
| Listado proyectos   | `screens/projects.png`        | Grid con cards de estado |
| Selección de estilo | `screens/style-picker.png`    | Grid 3×2 + preview de escenas |
| Selector de voz     | `screens/voice-picker.png`    | Lista con preview + ecualizador |
| Resultado / Video   | `screens/generate.png`        | Mockup de teléfono + acciones |

---

## Proceso de adaptación recomendado

1. **Configurá Tailwind** — agregá los tokens al config
2. **Pegá las variables CSS** — `tokens/variables.css` en tu `index.css`
3. **Importá las fuentes** — pegá el link de Google Fonts en tu `index.html`
4. **Adaptá página por página** — empezá por las más visibles
5. **Verificá funcionalidad** — corré los tests después de cada página

---

## Archivos en este directorio

```
prototipo/
├── README.md               ← este archivo (instrucciones para Claude Code)
├── tokens/
│   ├── variables.css       ← CSS custom properties listas para pegar
│   ├── colors.ts           ← tokens tipados en TypeScript
│   ├── typography.ts       ← tokens de tipografía
│   └── spacing.ts          ← tokens de spacing y radios
├── styles/
│   └── theme.css           ← sistema de estilos completo del prototipo
├── components/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── StyleThumb.tsx
│   └── ...
└── screens/                ← screenshots de referencia (agregar manualmente)
    └── .gitkeep
```
