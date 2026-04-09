# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoPaw is a personal AI assistant framework (Python 3.10-3.13). It runs multi-agent workloads locally, connects to users via channels (Feishu, Discord, DingTalk, QQ, Telegram, etc.), and extends behavior through markdown-driven Skills. The frontend console is a React SPA.

## Common Commands

### Backend
```bash
uv sync --dev --all-extras          # Install all dependencies
uv run copaw app                     # Start app (FastAPI on port 8088)
uv run pytest                        # Run all tests
uv run pytest tests/unit/agents/     # Run specific test directory
uv run pytest -k "test_name"         # Run test by name
uv run pytest -m "not slow"          # Skip slow tests
pre-commit run --all-files           # Run all linters (black, flake8, pylint, mypy)
```

### Frontend
```bash
cd console
bun install                          # Install deps (bun preferred, npm ci also works)
bun run dev                          # Dev server (port 5173, proxies /api -> localhost:8088)
bun run build                        # Production build -> dist/
bun run lint                         # ESLint
bun run format                       # Prettier
```

### Full build from source
```bash
uv sync --dev --all-extras
cd console && bun install && bun run build && cd ..
mkdir -p src/copaw/console && cp -R console/dist/. src/copaw/console/
uv run copaw app
```

### Docker
```bash
docker-compose up                    # Uses agentscope/copaw:latest
```

## Architecture

### Backend (`src/copaw/`)

**Entry point:** `copaw` CLI (Click-based, defined in `pyproject.toml`). Main subcommand: `copaw app` starts the FastAPI server.

**Startup flow** (`app/_app.py`):
1. Creates `DynamicMultiAgentRunner` (routes requests to per-agent runners via `X-Agent-Id` header)
2. Initializes `MultiAgentManager` → starts all configured agents concurrently
3. Each agent gets its own `Workspace` with independent services

**Workspace** (`app/workspace/workspace.py`): A self-contained agent runtime with priority-based service initialization. Services: `AgentRunner`, `ChannelManager`, `MemoryManager`, `MCPClientManager`, `CronManager`, `TaskTracker`. Some services are marked `reusable` to survive hot-reloads (memory, chat manager).

**Multi-Agent Manager** (`app/multi_agent_manager.py`): Lazy-loads agents. `reload_agent()` does zero-downtime swap: starts new workspace fully, then atomically swaps and drains the old one (60s timeout for active tasks).

**Agent** (`agents/react_agent.py`): `CoPawAgent` extends `agentscope.ReActAgent` with `ToolGuardMixin` for security interception. Built-in tools in `agents/tools/` include shell execution, file ops, browser use, code execution, etc.

**Channels** (`app/channels/`): Plugin system with `BaseChannel` ABC + `ChannelRegistry`. Each channel has its own `asyncio.Queue` with 4 consumer workers. Message flow: native payload → queue → `build_agent_request_from_native()` → runner.stream_query → send response. Built-in channels: imessage, discord, dingtalk, feishu, qq, telegram, mattermost, mqtt, console, matrix, voice, wecom, xiaoyi.

**Skills** (`agents/skills_manager.py`, `agents/skills_hub.py`): Markdown-driven (each has `SKILL.md` with YAML frontmatter). Three-tier: `builtin` (shipped in package), `customized` (user overrides at `~/.copaw/workspaces/{agent}/customized_skills/`), `active` (runtime). Customized overrides builtin of same name.

**Memory** (`agents/memory/`): Extends `ReMeLight` with vector/full-text search. Workspace-level markdown files (`MEMORY.md`, `AGENTS.md`, `SOUL.md`, `PROFILE.md`) drive the agent's system prompt via `PromptBuilder`.

**API routes** (`app/routers/`): All under `/api`. Key routers: `runner` (chat streaming), `agents` (multi-agent CRUD), `skills`, `channels`, `workspace`, `auth`, `providers`, `mcp`, `cron`. Agent-scoped routes at `/api/agents/{agentId}/...` wrap many of these.

### Frontend (`console/`)

**Stack:** React 18 + TypeScript + Vite 6 + Ant Design 5 + Zustand 5 + React Router v7.

**API layer** (`src/api/`): `getApiUrl(path)` in `config.ts` prepends `VITE_API_BASE_URL + "/api"`. In dev mode (empty `VITE_API_BASE_URL`), Vite proxy forwards `/api` to backend. `request.ts` handles auth headers and 401 redirect.

**State management** (`src/stores/agentStore.ts`): Zustand with `persist` middleware. Stores selected agent and agent list in localStorage.

**Routing** (`src/layouts/MainLayout/`): All pages under MainLayout with Sidebar + Header. Key routes: `/chat` (default), `/channels`, `/skills`, `/tools`, `/mcp`, `/workspace`, `/agents`, `/models`, `/integration/*`, `/ecommerce/*`.

**i18n:** Supports zh, en, ja, ru via `i18next`.

### Runtime Data

All runtime data lives at `~/.copaw/`:
- `config.json` — Global config
- `workspaces/{agent_id}/agent.json` — Per-agent config
- `workspaces/{agent_id}/MEMORY.md` — Agent long-term memory
- `workspaces/{agent_id}/AGENTS.md`, `SOUL.md`, `PROFILE.md` — Prompt files

### Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `COPAW_PORT` | Server port | 8088 |
| `COPAW_AUTH_ENABLED` | Enable auth | false |
| `COPAW_LOG_LEVEL` | Logging level | INFO |
| `COPAW_DISABLED_CHANNELS` | Disable specific channels | (none) |
| `CORS_ORIGINS` | CORS allowed origins | (none) |
| `VITE_API_BASE_URL` | Frontend API base | "" (same-origin) |

## Code Style

- **Python:** black (line-length 79), flake8, pylint, mypy (all via pre-commit). Max line length 79.
- **TypeScript:** ESLint + Prettier (flat config at `console/eslint.config.js`).
- **Skills directory** (`agents/skills/`) is excluded from all linters.
- Python comments use English; follow existing patterns in each file.
