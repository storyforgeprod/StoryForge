# StoryForge — Integración MCP (Model Context Protocol)

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Propósito:** Guía completa para integrar MCP en el desarrollo de StoryForge

---

## 📌 ¿Qué es MCP?

**Model Context Protocol (MCP)** permite a Claude (y otros LLMs) acceder a herramientas y datos de forma estandarizada. Para StoryForge, usaremos MCP para:

1. **Autoaceleración de desarrollo** — Claude generará código dentro del contexto del proyecto
2. **Acceso a APIs externas** — MCP servers para Claude, Replicate, ElevenLabs
3. **Análisis de codebase** — Claude puede leer/analizar código existente
4. **Ejecutar acciones** — Crear archivos, ejecutar tests, deployar

---

## 🔧 Setup MCP para StoryForge

### 1. Instalar MCP SDK (Backend)

```bash
cd backend
npm install @modelcontextprotocol/sdk
```

### 2. Crear MCP Server Básico

**`backend/src/mcp/server.ts`:**

```typescript
import {
  Server,
  StdioServerTransport,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/server/index.js';
import { TextContent } from '@modelcontextprotocol/sdk/types.js';

class StoryForgeMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'storyforge',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Handlers
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool.bind(this));
  }

  private async handleListTools() {
    return {
      tools: [
        {
          name: 'get_project_structure',
          description: 'Retorna la estructura del proyecto StoryForge',
          inputSchema: {
            type: 'object',
            properties: {
              depth: {
                type: 'number',
                description: 'Profundidad de la estructura (default: 3)',
              },
            },
          },
        },
        {
          name: 'read_api_schema',
          description: 'Lee el schema de un endpoint de API (Swagger)',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'Ej: /generate/script',
              },
            },
            required: ['endpoint'],
          },
        },
        {
          name: 'get_database_schema',
          description: 'Retorna el schema de Prisma',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'execute_test',
          description: 'Ejecuta tests de una feature',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                description: 'Ej: generate-script, auth',
              },
            },
            required: ['feature'],
          },
        },
        {
          name: 'deploy_to_staging',
          description: 'Deploya el backend a Render staging',
          inputSchema: {
            type: 'object',
            properties: {
              confirm: {
                type: 'boolean',
                description: 'Confirmación de deploy',
              },
            },
            required: ['confirm'],
          },
        },
      ] as Tool[],
    };
  }

  private async handleCallTool(request: any): Promise<{ content: TextContent[] }> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_project_structure':
        return this.getProjectStructure(args?.depth || 3);

      case 'read_api_schema':
        return this.readAPISchema(args.endpoint);

      case 'get_database_schema':
        return this.getDatabaseSchema();

      case 'execute_test':
        return this.executeTest(args.feature);

      case 'deploy_to_staging':
        return this.deployToStaging(args.confirm);

      default:
        return {
          content: [{ type: 'text', text: `Tool ${name} not found` }],
        };
    }
  }

  private async getProjectStructure(depth: number) {
    const fs = require('fs').promises;
    const path = require('path');

    const traverseDir = async (dir: string, currentDepth: number): Promise<string> => {
      if (currentDepth >= depth) return '';

      const entries = await fs.readdir(dir, { withFileTypes: true });
      let structure = '';

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const indent = '  '.repeat(currentDepth);
        if (entry.isDirectory()) {
          structure += `${indent}├─ ${entry.name}/\n`;
          structure += await traverseDir(path.join(dir, entry.name), currentDepth + 1);
        } else {
          structure += `${indent}├─ ${entry.name}\n`;
        }
      }

      return structure;
    };

    const structure = await traverseDir(process.cwd(), 0);
    return {
      content: [
        {
          type: 'text',
          text: `StoryForge Project Structure:\n\n${structure}`,
        },
      ],
    };
  }

  private async readAPISchema(endpoint: string) {
    // Leer Swagger/OpenAPI
    const swaggerPath = './dist/swagger.json';
    // (Implementar lectura de swagger.json)
    return {
      content: [
        {
          type: 'text',
          text: `API Schema for ${endpoint}: [schema content]`,
        },
      ],
    };
  }

  private async getDatabaseSchema() {
    const fs = require('fs').promises;
    const schema = await fs.readFile('./src/prisma/schema.prisma', 'utf-8');
    return {
      content: [{ type: 'text', text: `Prisma Schema:\n\n${schema}` }],
    };
  }

  private async executeTest(feature: string) {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`npm run test -- ${feature}`, (error: any, stdout: string) => {
        resolve({
          content: [
            {
              type: 'text',
              text: error ? `Tests failed:\n${error}` : `Tests passed:\n${stdout}`,
            },
          ],
        });
      });
    });
  }

  private async deployToStaging(confirm: boolean) {
    if (!confirm) {
      return {
        content: [{ type: 'text', text: 'Deploy cancelled' }],
      };
    }

    // Trigger render deploy
    return {
      content: [
        {
          type: 'text',
          text: 'Deploy to staging triggered. Check Render dashboard for progress.',
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('StoryForge MCP Server running');
  }
}

const server = new StoryForgeMCPServer();
server.start();
```

### 3. Integración con Claude en VS Code

**En `.claude/commands/storyforge-dev.md`:**

```markdown
---
name: storyforge-dev
description: Asistente de desarrollo para StoryForge
model: claude-3-5-sonnet-20241022
---

# StoryForge Development Assistant

Tienes acceso a herramientas MCP para:
- 📁 Navegar la estructura del proyecto
- 📋 Leer schemas de API y DB
- ✅ Ejecutar tests
- 🚀 Ver logs de deploy

Cuando el usuario pida:
- "Genera el endpoint para..." → Usa read_api_schema + crea el código
- "¿Cuál es la estructura?" → Usa get_project_structure
- "¿Está todo testeado?" → Usa execute_test
- "Deploy a staging" → Usa deploy_to_staging

Siempre:
1. Verificar contexto (schema, estructura)
2. Generar código siguiendo lineamientos (DEVELOPMENT_GUIDELINES.md)
3. Referenciar épicas/historias (de IMPLEMENTATION_PLAN.md)
4. Suggiest tests cuando sea relevante
```

---

## 🤖 Flujos de Trabajo MCP

### Flujo 1: Generar Endpoint de API

```
Usuario: "@storyforge-dev generar endpoint POST /generate/script"
  ↓
Claude: 
  1. Lee API schema (via MCP)
  2. Lee DB schema (via MCP)
  3. Genera endpoint.ts, .dto.ts, .spec.ts
  4. Sigue DEVELOPMENT_GUIDELINES.md
  5. Propone PR con descripción
```

### Flujo 2: Verificar Tests

```
Usuario: "@storyforge-dev ejecutar tests para generate-script"
  ↓
Claude:
  1. Corre: npm run test -- generate-script (via MCP)
  2. Muestra resultados
  3. Si fallan, analiza y propone fixes
```

### Flujo 3: Deploy Asistido

```
Usuario: "@storyforge-dev prepara deploy a staging"
  ↓
Claude:
  1. Verifica tests (execute_test)
  2. Verifica structure (get_project_structure)
  3. Construye checklist
  4. Si todo ok, propone deploy (deploy_to_staging)
```

---

## 📋 MCP Tools para StoryForge

### Tool: `get_backlog_status`

```typescript
{
  name: 'get_backlog_status',
  description: 'Obtiene status de historias en IMPLEMENTATION_PLAN.md',
  inputSchema: {
    type: 'object',
    properties: {
      epic: {
        type: 'string',
        enum: ['1', '2', '3'],
        description: 'Número de épica',
      },
    },
  },
}
```

Respuesta:
```
Épica 1: Pipeline de Generación de Video
├─ 1.1 Análisis narrativo (8 SP) ✅ Completado
├─ 1.2 Generación de imágenes (8 SP) 🔄 En desarrollo
├─ 1.3 Narración con voz (5 SP) ⏳ No iniciado
└─ 1.4 Export MP4 (13 SP) ⏳ No iniciado
```

### Tool: `get_environment_status`

```typescript
{
  name: 'get_environment_status',
  description: 'Verifica que todas las variables de entorno estén configuradas',
  inputSchema: {
    type: 'object',
    properties: {
      environment: {
        type: 'string',
        enum: ['dev', 'staging', 'prod'],
      },
    },
  },
}
```

---

## 🔌 Configuración de Claude.ai/code

En `claude.ai/code` o VS Code con la extensión de Claude:

```json
{
  "mcpServers": {
    "storyforge": {
      "command": "node",
      "args": ["./backend/dist/mcp/server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: "Genera el endpoint para generar imágenes"

```
Claude leerá:
1. API schema → entiende el patrón de endpoints
2. DB schema → ve qué datos hay disponibles
3. DEVELOPMENT_GUIDELINES → sigue conventions
4. IMPLEMENTATION_PLAN → ubica la historia 1.2

Genera:
- images.controller.ts (con validación)
- images.service.ts (lógica + integración Replicate)
- images.dto.ts (tipos)
- images.spec.ts (tests)
- Propone PR a develop
```

### Ejemplo 2: "Ejecuta todos los tests y muestra reporte"

```
Claude ejecuta:
npm run test -- --coverage

Output:
✅ All tests passed (156 tests)
Coverage: 78%
- Backend: 82%
- Frontend: 74%
```

### Ejemplo 3: "Verifica que el staging esté listo para producción"

```
Claude:
1. Ejecuta tests completos ✅
2. Verifica structure integrity ✅
3. Chequea DB migrations ✅
4. Verifica env vars en Render ✅
5. Confirma deploy ✅

Respuesta: "Ready for production. Deploy at your discretion."
```

---

## 🚀 Integración con Azure DevOps

### MCP Tool: `sync_to_ado`

```typescript
{
  name: 'sync_to_ado',
  description: 'Sincroniza status local con Azure DevOps',
  inputSchema: {
    type: 'object',
    properties: {
      organization: {
        type: 'string',
        description: 'ia-aplicada-grupo-04',
      },
      project: {
        type: 'string',
        description: 'StoryForge',
      },
      workItemId: {
        type: 'number',
        description: 'ID de Historia en ADO',
      },
      status: {
        type: 'string',
        enum: ['New', 'Active', 'Resolved', 'Closed'],
      },
    },
  },
}
```

Cuando Claude actualice IMPLEMENTATION_PLAN.md, puede:
1. Cambiar status localmente
2. Usar `sync_to_ado` para actualizar Azure DevOps automáticamente

---

## 🔐 Seguridad en MCP

### Restricciones

```typescript
// No permitir:
// - Acceso a .env files directamente
// - Ejecutar comandos arbitrarios
// - Modificar Prisma schema sin aprobación
// - Deploy a producción sin confirmación explícita

// Permitir solo:
// - Lectura de esquemas y código
// - Ejecución de tests
// - Generación de código (con review previo)
// - Deploy a staging
```

### Implementar WhiteList

```typescript
const ALLOWED_COMMANDS = [
  'npm run test',
  'npm run build',
  'npm run lint',
];

const FORBIDDEN_PATHS = [
  '.env*',
  'secrets/',
  'credentials/',
];
```

---

## 📞 Troubleshooting MCP

| Problema | Solución |
|----------|----------|
| MCP server no inicia | Verificar `npm install @modelcontextprotocol/sdk` |
| Claude no ve las tools | Reiniciar extensión de Claude en VS Code |
| Rate limiting | Implementar cooldown entre llamadas |
| Timeout en lectura de archivos grandes | Implementar streaming |

---

## 📚 Referencias

- **MCP Specification:** https://modelcontextprotocol.io/
- **Claude API:** https://claude.ai/api-docs
- **VS Code Claude Extension:** Usar IDE integrado

---

**Última actualización:** 15 de mayo de 2026  
**Próximo paso:** Implementar servidor MCP en Semana 1.5
