# CoPaw Windows Migration Guide

This document covers everything needed to run CoPaw on Windows, including external dependencies, channel compatibility, and installation steps.

## Overview

CoPaw's Python backend is already written with Windows in mind. All platform-specific code paths are gated with `sys.platform == "win32"` or `os.name == "nt"` checks. **The core application works on Windows without code changes.**

The main work is installing external tools and creating Windows equivalents for Bash scripts.

---

## Prerequisites

| Tool | Version | Windows Install |
|------|---------|----------------|
| Python | 3.10 - 3.13 | `winget install Python.Python.3.10` |
| Node.js | LTS | `winget install OpenJS.NodeJS` |
| Bun | Latest | `powershell -c "irm bun.sh/install.ps1 \| iex"` |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| uv | Latest | `pip install uv` |

---

## Quick Start

```powershell
# 1. Clone and enter project
git clone <repo-url> CoPaw
cd CoPaw

# 2. Install Python dependencies
uv sync --dev --all-extras

# 3. Install Playwright browser
uv run playwright install chromium

# 4. Build frontend
cd console
bun install
bun run build

# 5. Copy static assets (PowerShell)
Remove-Item -Recurse -Force ..\src\copaw\console\assets -ErrorAction SilentlyContinue
Copy-Item -Recurse dist\assets ..\src\copaw\console\assets
Copy-Item dist\index.html ..\src\copaw\console\index.html

# 6. Start CoPaw
cd ..
uv run copaw app
```

---

## Shell Scripts Requiring Windows Equivalents

The following Bash scripts need `.ps1` (PowerShell) or `.bat` versions for Windows:

| Script | Purpose | Priority |
|--------|---------|----------|
| `scripts/install.sh` | Installer (currently rejects non-Linux/macOS) | High |
| `scripts/dev.sh` | Dev server launcher (uses `lsof`) | Medium |
| `scripts/wheel_build.sh` | Wheel packaging (`rm`, `cp` commands) | Low |
| `scripts/website_build.sh` | Website build | Low |
| `console/dev-no-proxy.sh` | Dev server without proxy | Low |

### install.sh — Key Differences

The installer at `scripts/install.sh:96-100` explicitly rejects Windows:

```bash
die "Unsupported OS: $OS. This installer supports Linux and macOS only."
```

On Windows, install manually via the Quick Start steps above, or create a PowerShell equivalent.

---

## External Infrastructure

### PostgreSQL (via Docker)

Used by Amazon Crawler API. Run with Docker Desktop:

```powershell
cd 00_project_ai/amazon_crawler
docker compose up -d
```

- Database: `amazon_crawler`, Port: `5433`
- User: `amazon`, Password: `password`
- Data persists in Docker named volume

### Playwright + Chromium

Required for browser automation (built-in tool + XiYouZhaoCi scraper):

```powershell
uv run playwright install chromium
```

### Bun Runtime

Required by XiYouZhaoCi scraper:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

---

## Channel Compatibility

| Channel | Dependency | Windows Compatible |
|---------|-----------|-------------------|
| Discord | `discord-py`, Bot Token | Yes |
| DingTalk | `dingtalk-stream`, Developer credentials | Yes |
| Feishu / Lark | `lark-oapi`, App ID/Secret | Yes |
| Telegram | `python-telegram-bot`, Bot Token | Yes |
| QQ | QQ Bot SDK | Yes |
| Matrix | `matrix-nio`, homeserver credentials | Yes |
| Mattermost | REST API + WebSocket | Yes |
| WeCom | Enterprise WeChat SDK | Yes |
| XiaoYi | Huawei A2A WebSocket | Yes |
| MQTT | `paho-mqtt`, broker address | Yes |
| Voice | Twilio + cloudflared (auto-downloaded) | Yes |
| Console | Built-in | Yes |
| **iMessage** | macOS Messages SQLite DB | **No (macOS only)** |

### Windows-Specific Channel Notes

- **cloudflared** (Voice channel): Auto-downloads as `cloudflared-windows-amd64.exe` to `{WORKING_DIR}/bin/`
- **Twilio Voice**: Works on Windows, requires outbound internet for API calls

---

## Skills External Tools

Install these as needed based on which skills you use.

### PDF Processing

```powershell
choco install poppler qpdf
```

Requires: `pdftotext`, `pdftoppm`, `pdfimages` (poppler-utils) and `qpdf`.

### Office Documents (DOCX / XLSX / PPTX)

Install [LibreOffice](https://www.libreoffice.org/) — adds itself to PATH automatically.

For DOCX text extraction, also install pandoc:

```powershell
winget install JohnMacFarlane.Pandoc
```

### Email (Himalaya)

Download from [GitHub Releases](https://github.com/pimalaya/himalaya/releases) (Windows `.zip`).

Config location on Windows: `%USERPROFILE%\.config\himalaya\config.toml`

### Audio Processing

```powershell
winget install ffmpeg
```

Required for audio mode and local Whisper speech-to-text.

### Local Whisper (Speech-to-Text)

```powershell
uv sync --extra whisper
```

Requires `ffmpeg` (see above).

---

## LLM Providers

### Cloud Providers (require API keys)

All cloud providers work on Windows:

| Provider | API Key |
|----------|---------|
| OpenAI | `sk-...` |
| Anthropic | `sk-ant-...` |
| Google Gemini | Configured in console |
| DeepSeek | `sk-...` |
| DashScope (Alibaba) | `sk-...` |
| Kimi | No prefix |
| MiniMax | No prefix |
| ModelScope | `ms-...` |
| Azure OpenAI | Custom |

### Local Providers

| Provider | Windows Compatible | Install |
|----------|-------------------|---------|
| Ollama | Yes | https://ollama.com |
| LM Studio | Yes | https://lmstudio.ai |
| llama-cpp-python | Yes (may need MSVC Build Tools) | `pip install copaw[llamacpp]` |
| **MLX** | **No (Apple Silicon only)** | N/A |

---

## MCP Servers

### Default: Tavily Search

Requires Node.js/npx (already a prerequisite):

```powershell
npx tavily-mcp@latest
```

Auto-enabled when `TAVILY_API_KEY` environment variable is set.

### Custom MCP

Any stdio-based MCP server configured in agent config must use Windows-compatible commands and paths.

---

## Docker Deployment

Docker Desktop for Windows supports the existing `docker-compose.yml`:

```powershell
docker compose up -d
```

The Dockerfile uses Debian packages and Linux paths, but these run **inside the container** — no host changes needed.

---

## Already Handled (No Action Needed)

These are properly gated with `sys.platform == "win32"` checks:

| Module | File | Windows Behavior |
|--------|------|-----------------|
| Timezone detection | `config/timezone.py:72-116` | Uses Windows registry |
| Browser paths | `config/utils.py:80-89` | Uses `ProgramFiles` env var |
| Process management | `cli/shutdown_cmd.py:36-62` | Uses `netstat` + `taskkill` |
| Shell execution | `agents/tools/shell.py:105-120` | Uses `cmd /D /S /C` |
| UTF-8 output | `cli/main.py:12-17` | Forces UTF-8 on Windows |
| ANSI colors | `utils/logging.py:28-46` | Via `ctypes.windll.kernel32` |
| File permissions | All `os.chmod()` calls | No-op on NTFS |
| Signals | SIGTERM/SIGKILL | SIGKILL downgraded to SIGTERM |
| Unix sockets | LibreOffice shim | Skipped when `AF_UNIX` absent |
| Runtime directory | `~/.copaw` | Resolves to `C:\Users\<user>\.copaw` |
| cloudflared | `tunnel/binary_manager.py` | Downloads `.exe` variant |
| Uninstall | `cli/uninstall_cmd.py` | Only cleans Unix shell profiles |

---

## Known Limitations

| Feature | Reason | Workaround |
|---------|--------|-----------|
| iMessage channel | Reads macOS `~/Library/Messages/chat.db` | None available |
| MLX provider | Apple Silicon only | Use Ollama or llama-cpp-python instead |
| Shell scripts | Bash-only (`scripts/*.sh`) | Create PowerShell equivalents or follow Quick Start |
