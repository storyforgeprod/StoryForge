# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryForge is a product in early definition stage. The repository currently contains a set of Claude Code slash commands that implement a multi-agent product discovery pipeline.

## Azure DevOps

Remote repository: `https://dev.azure.com/ia-aplicada-grupo-04/StoryForge`
Credentials are stored in Windows Credential Manager for `dev.azure.com`.

## Custom Slash Commands

Located in `.claude/commands/`. These agents form a sequential pipeline for product discovery and documentation:

| Command | Role | Input | Output |
|---|---|---|---|
| `/product-analyst` | Senior Product Researcher | Raw idea from user | Blind spots + clarification questions |
| `/product-strategist` | VP of Product / PLG Strategist | Output from analyst | JTBD, North Star Metric, risk matrix |
| `/product-architect` | Senior TPM | Output from strategist | MVP scope (MoSCoW), epics, user stories, tech stack |
| `/product-writer` | Technical Writer / PM | Output from strategist + architect | Full Product Brief + Azure DevOps-ready backlog |
| `/product-pipeline` | Pipeline Orchestrator | Raw idea from user | Runs all 4 stages sequentially with user confirmation between each |

### Pipeline usage

**Option A — Manual:** Run the commands in order, passing the output of each agent as input to the next.

**Option B — Automated:** Use `/product-pipeline` to run all 4 stages in a single session. The orchestrator presents the output of each stage, waits for explicit user confirmation ("sí / continuar / ok"), incorporates any feedback, then passes the result automatically to the next stage.

The `/product-writer` final output (Stage 4) includes epics and user stories formatted for direct import into Azure DevOps as work items (Epic → User Story → Acceptance Criteria).
