# StoryForge — Configuración Azure DevOps

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Propósito:** Guía para configurar y mantener Azure DevOps como fuente de verdad del backlog

---

## 🔑 Token de Azure DevOps

### Configuración

**Token proporcionado:**
```
Cm6zsQU42s7VpMYPLMF7y2yZ2qNH60Wp6rw8b4DTqOL9Z4zV0KFvJQQJ99CEACAAAAATpybuAAASAZDO4cLs
```

**Guardarlo en:**
- **Windows Credential Manager (recomendado)**
  ```powershell
  # PowerShell como Admin
  $cred = New-Object System.Management.Automation.PSCredential(
    "pat",
    (ConvertTo-SecureString "Cm6zsQU42s7VpMYPLMF7y2yZ2qNH60Wp6rw8b4DTqOL9Z4zV0KFvJQQJ99CEACAAAAATpybuAAASAZDO4cLs" -AsPlainText -Force)
  )
  $cred | Export-Clixml -Path $env:APPDATA\Microsoft\Credentials\dev_azure_devops.xml
  ```

- **O en `.env` (solo dev local, NUNCA en git)**
  ```
  AZURE_DEVOPS_PAT=Cm6zsQU42s7VpMYPLMF7y2yZ2qNH60Wp6rw8b4DTqOL9Z4zV0KFvJQQJ99CEACAAAAATpybuAAASAZDO4cLs
  AZURE_DEVOPS_ORG=ia-aplicada-grupo-04
  AZURE_DEVOPS_PROJECT=StoryForge
  ```

### URL Base de Azure DevOps

```
https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
```

---

## 📋 Estructura del Backlog en ADO

### Jerarquía

```
Project: StoryForge
├─ Area: Core Product
│  ├─ Épica 1: Pipeline de Generación de Video
│  │  ├─ Historia 1.1: Análisis narrativo (8 SP)
│  │  ├─ Historia 1.2: Generación de imágenes (8 SP)
│  │  ├─ Historia 1.3: Narración con voz (5 SP)
│  │  └─ Historia 1.4: Export MP4 (13 SP)
│
├─ Area: Identity & Access
│  ├─ Épica 2: Autenticación y Gestión de Cuenta
│  │  ├─ Historia 2.1: Registro OAuth (3 SP)
│  │  └─ Historia 2.2: Control de cuota (3 SP)
│
└─ Area: Engineering
   ├─ Épica 3: Infraestructura y Pipeline Técnico
   │  ├─ Historia 3.1: Setup proyecto (5 SP)
   │  ├─ Historia 3.2: Pipeline IA (8 SP)
   │  └─ Historia 3.3: Ensamblado serverless (13 SP)
```

### Campos Personalizados

| Campo | Tipo | Valores | Propósito |
|-------|------|--------|-----------|
| `Fase` | Picklist | Fase 1 / Fase 2 / Fase 3 / Validación | Rastrear en qué fase estamos |
| `Blockers` | Text | Descripción de bloqueos | Registrar impedimentos |
| `GitHub Link` | URL | Link a PR / branch | Vincular con código |
| `Dependencies` | Text | IDs de otras historias | Mostrar dependencias |

---

## 🔄 Workflow en ADO

### Estados de Work Item

```
New (no iniciado)
  ↓
Active (en desarrollo)
  ├─ Code Review (esperando review)
  └─ Testing (testeando)
    ↓
Resolved (code merge + PR aprobado)
  ↓
Closed (testeado en staging + documentado)
```

### Transiciones

| Desde | A | Quién | Condición |
|------|---|------|-----------|
| New | Active | Dev | Tarea iniciada |
| Active | Code Review | Dev | Push a GitHub |
| Code Review | Active | Reviewer | Cambios solicitados |
| Code Review | Resolved | Reviewer | ✅ Aprobado |
| Resolved | Closed | QA/PM | ✅ Validado en staging |
| Closed | Active | PM | ❌ Blocker descubierto |

---

## 📝 Plantilla de Importación

### Crear Épicas en ADO (Importar CSV)

**Formato CSV:**
```csv
ID,Type,Title,Description,Story Points,Priority,Area,Iteration
E1,Epic,Pipeline de Generación de Video,Núcleo del producto: automático de texto a MP4,34,1,Core Product,Sprint 1
E2,Epic,Autenticación y Gestión de Cuenta,Registro y control de cuota freemium,6,1,Identity & Access,Sprint 2
E3,Epic,Infraestructura y Pipeline Técnico,Setup y APIs externas,26,1,Engineering,Sprint 1
```

### Crear Historias en ADO

**Plantilla JSON (para API):**
```json
{
  "op": "add",
  "path": "/fields/System.Title",
  "value": "Analizar texto y generar guión estructurado"
},
{
  "op": "add",
  "path": "/fields/System.Description",
  "value": "Como creadora de recaps, quiero pegar el texto y recibir un guión..."
},
{
  "op": "add",
  "path": "/fields/Microsoft.VSTS.Scheduling.StoryPoints",
  "value": 8
},
{
  "op": "add",
  "path": "/fields/System.AreaPath",
  "value": "StoryForge\\Core Product"
},
{
  "op": "add",
  "path": "/relations/-",
  "value": {
    "rel": "System.LinkTypes.Hierarchy-reverse",
    "url": "https://dev.azure.com/ia-aplicada-grupo-04/StoryForge/_apis/wit/workitems/1"
  }
}
```

---

## 🤖 Integración con Pipeline

### GitHub Actions → Azure DevOps

Cuando se hace push a `main`, actualizar ADO automáticamente:

**`.github/workflows/sync-ado.yml`:**
```yaml
name: Sync to Azure DevOps

on:
  push:
    branches: [main, staging]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update ADO work items
        env:
          ADO_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
          ADO_ORG: ia-aplicada-grupo-04
          ADO_PROJECT: StoryForge
        run: |
          # Script para actualizar status en ADO based on git tags/commits
          node scripts/sync-ado.js
```

---

## 📊 Dashboards útiles en ADO

### 1. Sprint Board (Kanban)

```
Backlog → Sprint → In Progress → Code Review → Done
```

### 2. Burndown Chart

Monitorear velocidad por sprint (Semana 1-2 vs Semana 3-4 vs Semana 5-6)

### 3. Queries Personalizadas

```sql
-- Historias sin cerrar hace más de 2 sprints
SELECT [System.Id], [System.Title], [System.State]
WHERE [System.State] <> 'Closed' AND [System.IterationPath] CONTAINS 'Sprint 3'

-- Historias bloqueadas
SELECT [System.Id], [System.Title], [Custom.Blockers]
WHERE [Custom.Blockers] IS NOT EMPTY

-- Backlog por Épica
SELECT [System.Id], [System.Title], [System.Parent]
WHERE [System.WorkItemType] = 'User Story'
ORDER BY [System.Parent]
```

---

## 🔐 Permisos en ADO

### Roles

| Rol | Permisos |
|-----|----------|
| **Admin** | Crear/editar épicas, sprints, campos personalizados |
| **Dev** | Crear historias, cambiar estado (New → Active → Code Review) |
| **Reviewer** | Cambiar (Code Review → Resolved → Closed) |
| **Viewer** | Solo lectura |

### Asignar Permisos

```
Project Settings → Security → Add users
├─ Usuario1: Admin
├─ Usuario2: Dev (Frontend)
├─ Usuario3: Dev (Backend)
└─ Usuario4: Reviewer
```

---

## 🔗 Vinculación Bidireccional

### GitHub ↔ Azure DevOps

Cuando hagas commit, referenciar la Historia:

```bash
# Vincular commit a Historia 1.1
git commit -m "feat(auth): implement Google OAuth - AB#1.1"

# En PR, referenciar múltiples
# "Closes AB#1.1, Closes AB#1.2, Relates to AB#3.2"
```

Resultado en ADO:
- Se muestra link al commit en la Historia
- Se muestra link a PR
- Estado se sincroniza automáticamente

---

## 📤 Exportar Backlog desde ADO

### Opción 1: CSV Export

```
Azure DevOps → Backlog → Export to CSV
```

### Opción 2: API REST

```bash
curl -u :$PAT https://dev.azure.com/ia-aplicada-grupo-04/StoryForge/_apis/wit/wiql?api-version=7.0 \
  -H "Content-Type: application/json" \
  -d '{"query": "Select [System.Id], [System.Title], [System.State] From WorkItems Where [System.ProjectName] = '\''StoryForge'\''"}'
```

---

## 🔍 Monitoreo Semanal

### Cada Viernes (Cierre de Sprint)

```
1. ✅ Revisar Burndown Chart
   - ¿Bajamos 20-25 SP como planeado?
   - ¿Hay tasks que se arrastraron?

2. ✅ Actualizar historias en ADO
   - Cambiar estado → Closed si está listo
   - Añadir Blockers si hay impedimentos

3. ✅ Sincronizar IMPLEMENTATION_PLAN.md
   - Reflejar cambios en ADO aquí
   - Notas de lo que funcionó / falló

4. ✅ Preparar próximo sprint
   - Mover historias a Next Sprint
   - Estimar nuevas tareas si surgen

5. ✅ Comunicar al equipo
   - Status update
   - Blockers críticos
```

---

## 🚨 Troubleshooting ADO

| Problema | Solución |
|----------|----------|
| PAT expirado | Regenerar en ADO → User Settings → Personal access tokens |
| Sync no funciona | Verificar GitHub Actions secrets |
| No puedo ver el proyecto | Pedir acceso en Project Settings → Security |
| Campos personalizados no aparecen | Crear en Admin → Process → Custom fields |

---

## 📚 Referencias

- **Azure DevOps Docs:** https://learn.microsoft.com/en-us/azure/devops/
- **REST API:** https://learn.microsoft.com/en-us/rest/api/azure/devops/
- **GitHub ↔ ADO Integration:** https://learn.microsoft.com/en-us/azure/devops/boards/github

---

**Última actualización:** 15 de mayo de 2026  
**Token actualizado:** 15 de mayo de 2026
