# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Overview

**StoryForge** is a SaaS MVP that converts long-form story text (webtoons, manhwas, web novels) into short-form narrated videos (YouTube Shorts format) in <5 minutes, powered by AI.

**Status:** MVP Implementation Phase (Weeks 1-6)  
**Tech Stack:** React + Vite + NestJS + Supabase + Claude + Replicate + ElevenLabs + FFmpeg  
**Target Launch:** Week 6 (staging ready for validation)

## 🔑 Azure DevOps

**Remote Repository:**
```
https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
```

**PAT Token (Configured):**
```
✅ Configured in Windows Credential Manager
✅ Workspace: ia-aplicada-grupo-04
✅ Project: StoryForge
```

**Backlog Management:**
- Épicas, Historias y Criterios de Aceptación listos en ADO
- Sincronización bidireccional: GitHub ↔ Azure DevOps
- Weekly burn-down charts y velocity tracking

## 📚 Essential Documentation

**Start here:**
1. [QUICK_START.md](QUICK_START.md) — Setup local en 10 minutos
2. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Hoja de ruta de 6 semanas con rastreamiento
3. [STACK_INIT.md](STACK_INIT.md) — Tech stack, versiones, estructura de directorios
4. [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — Convenciones, patrones, testing
5. [AZURE_DEVOPS_CONFIG.md](AZURE_DEVOPS_CONFIG.md) — Setup y manejo del backlog
6. [MCP_INTEGRATION.md](MCP_INTEGRATION.md) — Integración con Claude para acelerar dev
7. [OPTIONAL_COMPONENTS.md](OPTIONAL_COMPONENTS.md) — Qué puede sacarse/modificarse

**Reference Files:**
- `etapa4-brief-final.md` — Product Brief (JTBD, North Star Metric, exit criteria)
- `backlog-azure-devops.md` — 3 épicas, 9 historias, 66 story points

## 🎯 Custom Slash Commands (Legacy — Fase de Discovery)

Located in `.claude/commands/`. These agents remain available for future product discovery:

| Command | Role | Phase |
|---|---|---|
| `/product-analyst` | Research + validation | Pre-MVP ✅ Complete |
| `/product-strategist` | Strategy + metrics | Pre-MVP ✅ Complete |
| `/product-architect` | Technical planning | Pre-MVP ✅ Complete |
| `/product-writer` | Documentation | Pre-MVP ✅ Complete |
| `/product-pipeline` | Orchestrator | Pre-MVP ✅ Complete |

**Status:** Discovery phase COMPLETE. Now in Implementation phase.

## 🤖 Current Development Mode

**Using MCP for Development Acceleration:**
- Claude can access project structure, API schema, DB schema
- Automatic tests execution and validation
- Code generation following guidelines + ADO story refs
- Deploy automation to Render/Vercel

See [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for details.
