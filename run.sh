#!/bin/bash
# qeeshu-hubos 服务管理脚本
# 用法: ./run.sh {start|stop|restart|status}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_BRIDGE_DIR_DEFAULT="$PROJECT_ROOT/qeeclaw-sdk/packages/hermes-bridge"
WORKSPACE_BRIDGE_DIR="$WORKSPACE_BRIDGE_DIR_DEFAULT"
WORKSPACE_BRIDGE_SCRIPT="$WORKSPACE_BRIDGE_DIR/bridge_server.py"
WORKSPACE_HERMES_AGENT_DIR_DEFAULT=""
WORKSPACE_HUD_DIR_DEFAULT=""
BRIDGE_PORT_DEFAULT=21747
BRIDGE_FALLBACK_PORT=21748
HUD_PORT_DEFAULT=8134
FRONTEND_PORT_DEFAULT=5173
BRIDGE_URL_DEFAULT="http://127.0.0.1:21747"
HUBOS_API_DEFAULT="http://127.0.0.1:3456"
PIDFILE_DIR="/tmp/qeeshu-hubos"

mkdir -p "$PIDFILE_DIR"

# ── 工具函数 ──────────────────────────────

is_local_url() {
    case "$1" in
        http://127.0.0.1:*|http://localhost:*|http://0.0.0.0:*|http://[::1]:*|http://*.local:*|\
https://127.0.0.1:*|https://localhost:*|https://0.0.0.0:*|https://[::1]:*|https://*.local:*)
            return 0 ;;
        *) return 1 ;;
    esac
}

check_url_ok() { curl -fsS "$1" > /dev/null 2>&1; }

wait_url_ok() {
    local url="$1" attempts="${2:-20}" delay="${3:-0.5}"
    local i
    for ((i=0; i<attempts; i++)); do
        if check_url_ok "$url"; then
            return 0
        fi
        sleep "$delay"
    done
    return 1
}

check_platform_models_invoke_route() {
    local bridge_url="$1" status
    status="$(curl -sS -o /dev/null -w "%{http_code}" \
        -X POST "$bridge_url/api/platform/models/invoke" \
        -H 'Content-Type: application/json' \
        -d '{}' 2>/dev/null || true)"
    [ "$status" = "400" ]
}

check_workspace_bridge_ready() {
    local bridge_url="$1"
    check_url_ok "$bridge_url/health" \
        && check_url_ok "$bridge_url/api/platform/channels/bindings/validate?team_id=999999&channel_key=wechat_personal_plugin" \
        && check_platform_models_invoke_route "$bridge_url"
}

describe_pid() { ps -p "$1" -o command= 2>/dev/null || true; }
pid_cwd() { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1; }
process_env_contains() { ps eww -p "$1" | grep -F "$2" > /dev/null 2>&1; }

trim() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "$value"
}

load_env_file() {
    local env_file="$1" line key value
    [ -f "$env_file" ] || return 0
    while IFS= read -r line || [ -n "$line" ]; do
        line="$(trim "$line")"
        case "$line" in
            ""|\#*) continue ;;
            export\ *) line="$(trim "${line#export }")" ;;
        esac
        key="${line%%=*}"
        value="${line#*=}"
        key="$(trim "$key")"
        value="$(trim "$value")"
        case "$key" in
            ""|*[!A-Za-z0-9_]*) continue ;;
        esac
        case "$value" in
            \"*\") value="${value#\"}"; value="${value%\"}" ;;
            \'*\') value="${value#\'}"; value="${value%\'}" ;;
        esac
        export "$key=$value"
    done < "$env_file"
}

resolve_bundle_path() {
    local value="$1"
    [ -n "$value" ] || return 0
    case "$value" in
        /*) printf '%s\n' "$value" ;;
        "~") printf '%s\n' "$HOME" ;;
        "~/"*) printf '%s/%s\n' "$HOME" "${value#~/}" ;;
        *) printf '%s/%s\n' "$PROJECT_ROOT" "$value" ;;
    esac
}

resolve_node_binary() {
    local configured="${HUBOS_NODE_BIN:-}" candidate
    if [ -n "$configured" ]; then
        resolve_bundle_path "$configured"
        return
    fi
    for candidate in \
        "$PROJECT_ROOT/runtime/node/bin/node" \
        "$SCRIPT_DIR/runtime/node/bin/node"
    do
        if [ -x "$candidate" ]; then
            echo "$candidate"
            return
        fi
    done
    command -v node || true
}

resolve_bridge_dir() {
    local configured="${QEECLAW_HERMES_BRIDGE_DIR:-}" candidate
    if [ -n "$configured" ]; then
        resolve_bundle_path "$configured"
        return
    fi

    for candidate in \
        "$PROJECT_ROOT"/qeeclaw-server/release/*-standalone \
        "$PROJECT_ROOT"/qeeclaw-server/release/* \
        "$PROJECT_ROOT"/qeeclaw-server \
        "$WORKSPACE_BRIDGE_DIR_DEFAULT"
    do
        if [ -f "$candidate/bridge_server.py" ]; then
            echo "$candidate"
            return
        fi
    done
}

resolve_agent_dir_default() {
    if [ -d "$WORKSPACE_BRIDGE_DIR/vendor/hermes-agent" ]; then
        echo "$WORKSPACE_BRIDGE_DIR/vendor/hermes-agent"
        return
    fi
    echo "$PROJECT_ROOT/vendor/hermes-agent"
}

resolve_hud_dir_default() {
    if [ -d "$WORKSPACE_BRIDGE_DIR/vendor/hermes-hudui" ]; then
        echo "$WORKSPACE_BRIDGE_DIR/vendor/hermes-hudui"
        return
    fi
    echo "$PROJECT_ROOT/vendor/hermes-hudui"
}

resolve_kb_model_file_default() {
    local candidate
    for candidate in \
        "$WORKSPACE_BRIDGE_DIR/models/Qwen3-Embedding-0.6B-Q4_0.gguf" \
        "$WORKSPACE_BRIDGE_DIR/vendor/models/Qwen3-Embedding-0.6B-Q4_0.gguf" \
        "$PROJECT_ROOT/qeeclaw-server/models/Qwen3-Embedding-0.6B-Q4_0.gguf" \
        "$PROJECT_ROOT/data/riscv-embedding/Qwen3-Embedding-0.6B-Q4_0.gguf" \
        "$PROJECT_ROOT/data/models/Qwen3-Embedding-0.6B-Q4_0.gguf"
    do
        if [ -f "$candidate" ]; then
            echo "$candidate"
            return
        fi
    done
    echo "$WORKSPACE_BRIDGE_DIR/models/Qwen3-Embedding-0.6B-Q4_0.gguf"
}

resolve_kb_dir_default() {
    echo "$WORKSPACE_BRIDGE_DIR/data/knowledge"
}

ensure_bridge_python_import() {
    local module="$1" package="$2"
    if "$QEECLAW_HERMES_BRIDGE_PYTHON" -c "import ${module}" >/dev/null 2>&1; then
        return 0
    fi
    if [ "${HUBOS_ALLOW_PIP_INSTALL:-0}" = "1" ]; then
        echo "📦 bridge Python 缺少 ${module}，正在安装 ${package}..."
        "$QEECLAW_HERMES_BRIDGE_PYTHON" -m pip install --quiet "$package"
        return
    fi
    echo "❌ bridge Python 缺少 ${module}。生产环境不会在客户机执行 pip install。"
    echo "   请重新打包含有 ${package} 的 runtime，或在开发机设置 HUBOS_ALLOW_PIP_INSTALL=1 后再启动。"
    exit 1
}

frontend_process_matches_bridge_env() {
    local pid="$1"
    process_env_contains "$pid" "VITE_BRIDGE_URL=$VITE_BRIDGE_URL" \
        && process_env_contains "$pid" "VITE_CHANNELS_BRIDGE_URL=$VITE_CHANNELS_BRIDGE_URL"
}

url_port() {
    "$HUBOS_NODE_BIN" -e '
const u = new URL(process.argv[1]);
console.log(u.port || (u.protocol === "https:" ? "443" : "80"));
' "$1"
}

replace_url_port() {
    "$HUBOS_NODE_BIN" -e '
const u = new URL(process.argv[1]);
u.port = process.argv[2];
console.log(u.toString().replace(/\/$/, ""));
' "$1" "$2"
}

json_read() {
    "$HUBOS_NODE_BIN" -e '
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => data += chunk);
process.stdin.on("end", () => {
  let value = JSON.parse(data);
  for (const key of process.argv[1].split(".")) {
    value = Array.isArray(value) ? value[Number(key)] : value[key];
  }
  if (value === null || value === undefined) console.log("");
  else if (typeof value === "boolean") console.log(value ? "true" : "false");
  else console.log(value);
});
' "$1"
}

resolve_bridge_python() {
    local configured="${QEECLAW_HERMES_BRIDGE_PYTHON:-}"
    if [ -n "$configured" ]; then
        resolve_bundle_path "$configured"
        return
    fi

    local candidate
    for candidate in \
        "$PROJECT_ROOT/runtime/python-venv/bin/python3" \
        "$PROJECT_ROOT/runtime/python/bin/python3" \
        "$PROJECT_ROOT/qeeclaw-server/runtime/python/bin/python3" \
        "$PROJECT_ROOT/qeeclaw-server/standalone/python/bin/python3" \
        "$PROJECT_ROOT"/qeeclaw-server/release/*-standalone/.venv/bin/python3 \
        "$PROJECT_ROOT"/qeeclaw-server/release/*-standalone/python/bin/python3 \
        "$PROJECT_ROOT"/qeeclaw-server/release/*/runtime/python/bin/python3 \
        "$PROJECT_ROOT"/qeeclaw-server/release/*/python/bin/python3 \
        "$PROJECT_ROOT"/qeeclaw-server/release/*/.venv/bin/python3 \
        "$WORKSPACE_BRIDGE_DIR/.venv/bin/python3" \
        "$PROJECT_ROOT/.venv/bin/python3"
    do
        if [ -x "$candidate" ]; then
            echo "$candidate"
            return
        fi
    done

    if [ "${HUBOS_ALLOW_SYSTEM_PYTHON:-0}" = "1" ]; then
        command -v python3 || true
    fi
}

is_workspace_bridge_process() {
    local pid="$1" command="$2" cwd
    cwd="$(pid_cwd "$pid")"
    case "$command" in
        *"/qeeclaw-sdk/packages/hermes-bridge/bridge_server.py"*) return 0 ;;
    esac
    [ "$cwd" = "$WORKSPACE_BRIDGE_DIR" ]
}

is_workspace_hud_process() {
    local pid="$1" command="$2" cwd
    cwd="$(pid_cwd "$pid")"
    case "$command" in
        *"backend.main"*|*"hermes-hudui"*) ;;
        *) return 1 ;;
    esac
    [ "$cwd" = "$QEECLAW_HUD_DIR" ] || [ "$cwd" = "$QEECLAW_HUD_DIR/backend" ]
}

pid_alive() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }

bridge_ports() {
    printf '%s\n' "$QEECLAW_HERMES_BRIDGE_PORT" "$BRIDGE_PORT_DEFAULT" "$BRIDGE_FALLBACK_PORT" | awk 'NF && !seen[$0]++'
}

wait_pid_exit() {
    local pid="$1" attempts="${2:-20}"
    local i
    for ((i=0; i<attempts; i++)); do
        if ! pid_alive "$pid"; then
            return 0
        fi
        sleep 0.2
    done
    ! pid_alive "$pid"
}

stop_pid() {
    local pid="$1" label="$2"
    if ! pid_alive "$pid"; then
        return 0
    fi
    kill "$pid" 2>/dev/null || true
    if ! wait_pid_exit "$pid" 20; then
        kill -9 "$pid" 2>/dev/null || true
        wait_pid_exit "$pid" 10 || true
    fi
    if pid_alive "$pid"; then
        echo "⚠️  $label 停止失败 (PID: $pid)"
        return 1
    fi
    echo "✅ $label 已停止 (PID: $pid)"
}

stop_bridge_children() {
    local bridge_pid="$1"
    [ -n "$bridge_pid" ] || return 0
    local child_pids
    child_pids="$(ps -Ao pid,ppid,command | awk -v ppid="$bridge_pid" '$2 == ppid {print $1}' || true)"
    [ -n "$child_pids" ] || return 0
    while IFS= read -r child_pid; do
        [ -n "$child_pid" ] || continue
        local child_cmd="$(describe_pid "$child_pid")"
        if is_workspace_hud_process "$child_pid" "$child_cmd"; then
            stop_pid "$child_pid" "HUD 子进程"
        fi
    done <<< "$child_pids"
}

save_pid() { echo "$2" > "$PIDFILE_DIR/$1.pid"; }

read_pid() {
    local f="$PIDFILE_DIR/$1.pid"
    [ -f "$f" ] && cat "$f" || echo ""
}

clear_pid() { rm -f "$PIDFILE_DIR/$1.pid"; }

start_detached() {
    local log_file="$1"
    shift
    nohup "$@" > "$log_file" 2>&1 < /dev/null &
    echo $!
}

init_env() {
    load_env_file "$SCRIPT_DIR/.env"

    export HUBOS_NODE_BIN="$(resolve_node_binary)"
    [ -n "$HUBOS_NODE_BIN" ] && export PATH="$(dirname "$HUBOS_NODE_BIN"):$PATH"

    WORKSPACE_BRIDGE_DIR="$(resolve_bridge_dir)"
    [ -n "$WORKSPACE_BRIDGE_DIR" ] || { echo "❌ 未找到 bridge_server.py。请将 qeeclaw-server 与 qeeshu-hubos 放在同一目录下。"; exit 1; }
    WORKSPACE_BRIDGE_SCRIPT="$WORKSPACE_BRIDGE_DIR/bridge_server.py"
    WORKSPACE_HERMES_AGENT_DIR_DEFAULT="$(resolve_agent_dir_default)"
    WORKSPACE_HUD_DIR_DEFAULT="$(resolve_hud_dir_default)"
    WORKSPACE_KB_MODEL_FILE_DEFAULT="$(resolve_kb_model_file_default)"
    WORKSPACE_KB_DIR_DEFAULT="$(resolve_kb_dir_default)"

    export QEECLAW_HERMES_BRIDGE_PORT="${QEECLAW_HERMES_BRIDGE_PORT:-$BRIDGE_PORT_DEFAULT}"
    export HUBOS_API_PORT="${HUBOS_API_PORT:-3456}"
    export VITE_BRIDGE_URL="${VITE_BRIDGE_URL:-http://127.0.0.1:$QEECLAW_HERMES_BRIDGE_PORT}"
    export VITE_CHANNELS_BRIDGE_URL="${VITE_CHANNELS_BRIDGE_URL:-$VITE_BRIDGE_URL}"
    export VITE_HUBOS_API_URL="${VITE_HUBOS_API_URL:-http://127.0.0.1:$HUBOS_API_PORT}"
    export QEECLAW_HERMES_AGENT_DIR="$(resolve_bundle_path "${QEECLAW_HERMES_AGENT_DIR:-$WORKSPACE_HERMES_AGENT_DIR_DEFAULT}")"
    export QEECLAW_HUD_DIR="$(resolve_bundle_path "${QEECLAW_HUD_DIR:-$WORKSPACE_HUD_DIR_DEFAULT}")"
    export QEECLAW_HUD_PORT="${QEECLAW_HUD_PORT:-$HUD_PORT_DEFAULT}"
    export QEECLAW_KB_VECTOR_BACKEND="${QEECLAW_KB_VECTOR_BACKEND:-chromadb}"
    export QEECLAW_KB_DIR="$(resolve_bundle_path "${QEECLAW_KB_DIR:-$WORKSPACE_KB_DIR_DEFAULT}")"
    export QEECLAW_KB_EMBEDDING_MODEL="${QEECLAW_KB_EMBEDDING_MODEL:-Qwen3-Embedding-0.6B-Q4_0}"
    export QEECLAW_KB_EMBEDDING_ENGINE="${QEECLAW_KB_EMBEDDING_ENGINE:-llama-server}"
    export QEECLAW_KB_EMBEDDING_MODEL_FILE="$(resolve_bundle_path "${QEECLAW_KB_EMBEDDING_MODEL_FILE:-$WORKSPACE_KB_MODEL_FILE_DEFAULT}")"
    export QEECLAW_KB_EMBEDDING_API_URL="${QEECLAW_KB_EMBEDDING_API_URL:-http://127.0.0.1:8080/embedding}"
    export QEECLAW_KB_EMBEDDING_DEVICE="${QEECLAW_KB_EMBEDDING_DEVICE:-cpu}"
    export QEECLAW_KB_EMBEDDING_DIMENSION="${QEECLAW_KB_EMBEDDING_DIMENSION:-1024}"
    export QEECLAW_KB_TOP_K="${QEECLAW_KB_TOP_K:-5}"
    export QEECLAW_KB_CHUNK_SIZE="${QEECLAW_KB_CHUNK_SIZE:-512}"
    export QEECLAW_KB_CHUNK_OVERLAP="${QEECLAW_KB_CHUNK_OVERLAP:-64}"
    export HUBOS_FRONTEND_PORT="${HUBOS_FRONTEND_PORT:-$FRONTEND_PORT_DEFAULT}"
    export HUBOS_FRONTEND_MODE="${HUBOS_FRONTEND_MODE:-dev}"
    export HERMES_HOME="$(resolve_bundle_path "${HERMES_HOME:-~/.qeeclaw_hermes}")"
    export QEECLAW_HERMES_BRIDGE_PYTHON="$(resolve_bridge_python)"
}

check_deps() {
    [ -x "$HUBOS_NODE_BIN" ] || { echo "❌ 未找到 node，请打包 runtime/node 或安装 Node.js"; exit 1; }
    [ -x "$QEECLAW_HERMES_BRIDGE_PYTHON" ] || { echo "❌ bridge Python 不可执行: $QEECLAW_HERMES_BRIDGE_PYTHON"; exit 1; }
    ensure_bridge_python_import "pypdf" "pypdf>=5.0.0"
    ensure_bridge_python_import "yaml" "pyyaml>=6.0"
    ensure_bridge_python_import "openai" "openai>=2.21.0,<3"
    ensure_bridge_python_import "aiohttp" "aiohttp>=3.9.0"
    ensure_bridge_python_import "cryptography" "cryptography>=42.0.0"
    ensure_bridge_python_import "chromadb" "chromadb==1.0.7"
    ensure_bridge_python_import "numpy" "numpy>=1.26.0"

    if ! is_local_url "$VITE_BRIDGE_URL"; then
        echo "❌ VITE_BRIDGE_URL 必须指向本地: $VITE_BRIDGE_URL"; exit 1
    fi
    if ! is_local_url "$VITE_CHANNELS_BRIDGE_URL"; then
        echo "❌ VITE_CHANNELS_BRIDGE_URL 必须指向本地: $VITE_CHANNELS_BRIDGE_URL"; exit 1
    fi
    if [ ! -d "$QEECLAW_HERMES_AGENT_DIR" ]; then
        echo "❌ 未找到 hermes-agent 目录: $QEECLAW_HERMES_AGENT_DIR"; exit 1
    fi
    if [ ! -f "$QEECLAW_KB_EMBEDDING_MODEL_FILE" ]; then
        echo "❌ 未找到本地知识库 embedding 模型: $QEECLAW_KB_EMBEDDING_MODEL_FILE"
        echo "   qeeclaw-server standalone 包应包含 models/Qwen3-Embedding-0.6B-Q4_0.gguf。请重新打包 qeeclaw-server。"
        exit 1
    fi
    if [ "$(dd if="$QEECLAW_KB_EMBEDDING_MODEL_FILE" bs=4 count=1 2>/dev/null)" != "GGUF" ]; then
        echo "❌ 本地知识库 embedding 模型不是有效 GGUF 文件: $QEECLAW_KB_EMBEDDING_MODEL_FILE"
        exit 1
    fi
    if [ "$HUBOS_FRONTEND_MODE" = "static" ]; then
        [ -f "$SCRIPT_DIR/dist/index.html" ] || { echo "❌ 静态前端不存在: $SCRIPT_DIR/dist/index.html"; exit 1; }
    elif [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        if [ "${HUBOS_ALLOW_NPM_INSTALL:-1}" != "1" ]; then
            echo "❌ 未找到 node_modules，且 HUBOS_ALLOW_NPM_INSTALL=0。请重新打包含 node_modules 的 runtime。"
            exit 1
        fi
        echo "📦 首次运行，安装依赖..."
        (cd "$SCRIPT_DIR" && npm install)
        echo ""
    fi
}

start_workspace_bridge() {
    local bridge_url="$1" bridge_port="$2"
    local bridge_log="/tmp/bridge_server_${bridge_port}.log"

    echo "   ℹ️  bridge Python: $QEECLAW_HERMES_BRIDGE_PYTHON"
    local pid
    pid="$(start_detached "$bridge_log" env \
        QEECLAW_HERMES_BRIDGE_PORT="$bridge_port" \
        QEECLAW_HERMES_AGENT_DIR="$QEECLAW_HERMES_AGENT_DIR" \
        QEECLAW_HUD_DIR="$QEECLAW_HUD_DIR" \
        QEECLAW_HUD_PORT="$QEECLAW_HUD_PORT" \
        HERMES_HOME="$HERMES_HOME" \
        QEECLAW_KB_VECTOR_BACKEND="$QEECLAW_KB_VECTOR_BACKEND" \
        QEECLAW_KB_DIR="$QEECLAW_KB_DIR" \
        QEECLAW_KB_EMBEDDING_MODEL="$QEECLAW_KB_EMBEDDING_MODEL" \
        QEECLAW_KB_EMBEDDING_ENGINE="$QEECLAW_KB_EMBEDDING_ENGINE" \
        QEECLAW_KB_EMBEDDING_MODEL_FILE="$QEECLAW_KB_EMBEDDING_MODEL_FILE" \
        QEECLAW_KB_EMBEDDING_API_URL="$QEECLAW_KB_EMBEDDING_API_URL" \
        QEECLAW_KB_EMBEDDING_DEVICE="$QEECLAW_KB_EMBEDDING_DEVICE" \
        QEECLAW_KB_EMBEDDING_DIMENSION="$QEECLAW_KB_EMBEDDING_DIMENSION" \
        QEECLAW_KB_TOP_K="$QEECLAW_KB_TOP_K" \
        QEECLAW_KB_CHUNK_SIZE="$QEECLAW_KB_CHUNK_SIZE" \
        QEECLAW_KB_CHUNK_OVERLAP="$QEECLAW_KB_CHUNK_OVERLAP" \
        TOKENIZERS_PARALLELISM="${TOKENIZERS_PARALLELISM:-false}" \
        "$QEECLAW_HERMES_BRIDGE_PYTHON" "$WORKSPACE_BRIDGE_SCRIPT")"
    save_pid bridge "$pid"
    echo "   ✅ workspace hermes-bridge 已启动 (PID: $pid, URL: $bridge_url)"
    if wait_url_ok "$bridge_url/health" 30 1 && check_workspace_bridge_ready "$bridge_url"; then
        echo "   ✅ workspace hermes-bridge 健康检查通过"
    else
        echo "   ❌ workspace hermes-bridge 启动失败，查看日志: $bridge_log"
        exit 1
    fi
}
verify_channels() {
    echo "🔒 本地隐私模式"
    echo "   VITE_BRIDGE_URL=$VITE_BRIDGE_URL"
    echo "   VITE_CHANNELS_BRIDGE_URL=$VITE_CHANNELS_BRIDGE_URL"
    echo "   VITE_HUBOS_API_URL=$VITE_HUBOS_API_URL"
    echo ""
    echo "   🔎 校验 channels 本地接口..."

    local base="$VITE_CHANNELS_BRIDGE_URL"
    local checks=(
        "$base/api/platform/channels?team_id=1|channels 总览接口"
        "$base/api/platform/channels/wechat-personal-plugin/config?team_id=1|个人微信插件配置接口"
        "$base/api/platform/channels/wechat-personal-openclaw/config?team_id=1|OpenClaw 配置接口"
        "$base/api/platform/channels/wechat-personal-openclaw/qr/status?team_id=1|OpenClaw 二维码状态接口"
    )
    for entry in "${checks[@]}"; do
        local url="${entry%%|*}" name="${entry##*|}"
        if check_url_ok "$url"; then
            echo "   ✅ $name 可用"
        else
            echo "   ❌ $name 不可用: $url"
            exit 1
        fi
    done

    echo "   🧪 校验个人微信插件绑定链路..."
    local smoke_url="$base/api/platform/channels/bindings/validate?team_id=999999&channel_key=wechat_personal_plugin"
    local resp="$(curl -fsS "$smoke_url")"
    local ready="$(printf '%s' "$resp" | json_read "data.ready")"
    local writable="$(printf '%s' "$resp" | json_read "data.storage_writable")"
    local count="$(printf '%s' "$resp" | json_read "data.bindings_count")"

    if [ "$ready" != "true" ] || [ "$writable" != "true" ]; then
        echo "   ❌ 绑定链路校验失败"; echo "   响应: $resp"; exit 1
    fi
    echo "   ✅ 绑定链路可用（当前绑定数: $count）"
    echo ""
}
# ── 命令实现 ──────────────────────────────

cmd_start() {
    echo "=========================================="
    echo "  qeeshu-hubos 启动"
    echo "=========================================="
    echo ""

    init_env
    check_deps

    # 启动 bridge_server
    local bridge_target_url="$VITE_BRIDGE_URL"
    local bridge_target_port="$(url_port "$bridge_target_url")"
    local bridge_fallback_active="false"

    echo "🚀 启动 bridge_server ($bridge_target_port)..."
    cd "$WORKSPACE_BRIDGE_DIR"

    if lsof -Pi :$bridge_target_port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local port_pid="$(lsof -Pi :$bridge_target_port -sTCP:LISTEN -t | head -n 1)"
        local port_cmd="$(describe_pid "$port_pid")"
        echo "   ⚠️  端口 $bridge_target_port 已被占用，跳过启动"
        echo "   ℹ️  当前占用进程: PID=$port_pid $port_cmd"

        if is_workspace_bridge_process "$port_pid" "$port_cmd"; then
            if check_workspace_bridge_ready "$bridge_target_url"; then
                echo "   ✅ 复用已有 workspace hermes-bridge: $bridge_target_url"
                save_pid bridge "$port_pid"
            else
                echo "   ↪️  当前 workspace hermes-bridge 缺少最新能力，正在重启"
                kill "$port_pid" && sleep 1
                start_workspace_bridge "$bridge_target_url" "$bridge_target_port"
            fi
        elif [ "$bridge_target_port" = "$BRIDGE_PORT_DEFAULT" ]; then
            # 尝试 fallback 端口
            local fallback_url="$(replace_url_port "$BRIDGE_URL_DEFAULT" "$BRIDGE_FALLBACK_PORT")"
            if lsof -Pi :$BRIDGE_FALLBACK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
                local fb_pid="$(lsof -Pi :$BRIDGE_FALLBACK_PORT -sTCP:LISTEN -t | head -n 1)"
                if is_workspace_bridge_process "$fb_pid" "$(describe_pid "$fb_pid")"; then
                    export VITE_BRIDGE_URL="$fallback_url"
                    export VITE_CHANNELS_BRIDGE_URL="$fallback_url"
                    bridge_target_url="$fallback_url"
                    bridge_fallback_active="true"
                    if check_workspace_bridge_ready "$fallback_url"; then
                        echo "   ↪️  切换到备用端口: $fallback_url"
                        save_pid bridge "$fb_pid"
                    else
                        echo "   ↪️  备用端口存在不健康 workspace hermes-bridge，正在重启: $fallback_url"
                        stop_bridge_children "$fb_pid"
                        stop_pid "$fb_pid" "备用端口 hermes-bridge"
                        start_workspace_bridge "$fallback_url" "$BRIDGE_FALLBACK_PORT"
                    fi
                else
                    echo "   ❌ 默认端口和备用端口均被占用"; exit 1
                fi
            else
                export VITE_BRIDGE_URL="$fallback_url"
                export VITE_CHANNELS_BRIDGE_URL="$fallback_url"
                bridge_target_url="$fallback_url"
                bridge_fallback_active="true"
                echo "   ↪️  切换到备用端口: $fallback_url"
                start_workspace_bridge "$fallback_url" "$BRIDGE_FALLBACK_PORT"
            fi
        fi
    else
        start_workspace_bridge "$bridge_target_url" "$bridge_target_port"
    fi

    verify_channels
    # 启动 HubOS API
    echo "🚀 启动 HubOS 产品后端 ($HUBOS_API_PORT)..."
    cd "$SCRIPT_DIR"
    if lsof -Pi :"$HUBOS_API_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local hubos_pid="$(lsof -Pi :"$HUBOS_API_PORT" -sTCP:LISTEN -t | head -n 1)"
        echo "   ⚠️  端口 $HUBOS_API_PORT 已被占用，跳过启动"
        save_pid hubos "$hubos_pid"
    else
        local hubos_pid
        hubos_pid="$(start_detached /tmp/hubos_api.log env \
            HUBOS_SERVE_STATIC="$([ "$HUBOS_FRONTEND_MODE" = "static" ] && echo 1 || echo 0)" \
            HUBOS_API_PORT="$HUBOS_API_PORT" \
            HUBOS_FRONTEND_MODE="$HUBOS_FRONTEND_MODE" \
            "$HUBOS_NODE_BIN" server/index.cjs)"
        save_pid hubos "$hubos_pid"
        echo "   ✅ HubOS API 已启动 (PID: $hubos_pid)"
        sleep 2
        if curl -s "http://127.0.0.1:$HUBOS_API_PORT/api/hubos/health" > /dev/null 2>&1; then
            echo "   ✅ HubOS API 健康检查通过"
        else
            echo "   ❌ HubOS API 启动失败，查看日志: /tmp/hubos_api.log"; exit 1
        fi
    fi
    echo ""

    if [ "$HUBOS_FRONTEND_MODE" = "static" ]; then
        echo "🚀 前端静态资源由 HubOS 产品后端提供"
        echo "访问地址: http://127.0.0.1:$HUBOS_API_PORT/CENTAUR-HUBOS/"
        return 0
    fi

    # 启动前端
    echo "🚀 启动前端开发服务器 ($HUBOS_FRONTEND_PORT)..."
    cd "$SCRIPT_DIR"
    if lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local fe_pid="$(lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t | head -n 1)"
        echo "   ⚠️  端口 $HUBOS_FRONTEND_PORT 已被占用"
        save_pid frontend "$fe_pid"
        if [ "$bridge_fallback_active" = "true" ]; then
            if frontend_process_matches_bridge_env "$fe_pid"; then
                echo "   ✅ 当前前端已对齐 bridge: $VITE_BRIDGE_URL"
            else
                echo "   ℹ️  已切换 bridge 到 $VITE_BRIDGE_URL，请重启前端开发服务器"
            fi
        fi
        echo ""
        echo "访问地址: http://localhost:$HUBOS_FRONTEND_PORT/CENTAUR-HUBOS/"
    else
        echo "   启动中..."
        local fe_pid
        fe_pid="$(start_detached /tmp/qeeshu_hubos_frontend.log npm run dev -- --host 127.0.0.1 --port "$HUBOS_FRONTEND_PORT")"
        save_pid frontend "$fe_pid"
        echo "   ✅ 前端开发服务器已启动 (PID: $fe_pid)"
        if wait_url_ok "http://localhost:$HUBOS_FRONTEND_PORT/CENTAUR-HUBOS/" 20 0.5; then
            if lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
                save_pid frontend "$(lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t | head -n 1)"
            fi
            echo "   ✅ 前端 dev server 健康检查通过"
            echo ""
            echo "访问地址: http://localhost:$HUBOS_FRONTEND_PORT/CENTAUR-HUBOS/"
        else
            echo "   ❌ 前端 dev server 启动失败，查看日志: /tmp/qeeshu_hubos_frontend.log"; exit 1
        fi
    fi
}

cmd_stop() {
    echo "=========================================="
    echo "  qeeshu-hubos 停止"
    echo "=========================================="
    echo ""

    init_env

    local services=(frontend hubos bridge)
    local labels=("前端开发服务器" "HubOS API" "hermes-bridge")
    local ports=("$HUBOS_FRONTEND_PORT" "$HUBOS_API_PORT" 0)

    for i in "${!services[@]}"; do
        local name="${services[$i]}" label="${labels[$i]}" port="${ports[$i]}"
        local pid="$(read_pid "$name")"

        if pid_alive "$pid"; then
            if [ "$name" = "bridge" ]; then
                stop_bridge_children "$pid"
            fi
            stop_pid "$pid" "$label"
            clear_pid "$name"
        elif [ "$port" -gt 0 ] && lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            pid="$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)"
            stop_pid "$pid" "$label"
            clear_pid "$name"
        else
            echo "ℹ️  $label 未运行"
            clear_pid "$name"
        fi
    done

    # bridge 可能在默认或 fallback 端口
    for port in $(bridge_ports); do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid="$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)"
            local cmd="$(describe_pid "$pid")"
            if is_workspace_bridge_process "$pid" "$cmd"; then
                stop_bridge_children "$pid"
                stop_pid "$pid" "额外 bridge 进程"
            fi
        fi
    done

    # HUD 是 bridge_server.py 拉起的子进程；旧版本 bridge 收到 SIGTERM 时不会清理它。
    # restart 前显式清理 workspace HUD，避免 8134 残留导致新 bridge 启动失败。
    if lsof -Pi :"$QEECLAW_HUD_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local hud_pid="$(lsof -Pi :"$QEECLAW_HUD_PORT" -sTCP:LISTEN -t | head -n 1)"
        local hud_cmd="$(describe_pid "$hud_pid")"
        if is_workspace_hud_process "$hud_pid" "$hud_cmd"; then
            stop_pid "$hud_pid" "HUD Dashboard"
        else
            echo "ℹ️  HUD 端口 $QEECLAW_HUD_PORT 被非 workspace 进程占用: PID=$hud_pid"
        fi
    fi
}

cmd_restart() {
    cmd_stop
    echo ""
    sleep 1
    cmd_start
}

cmd_status() {
    echo "=========================================="
    echo "  qeeshu-hubos 状态"
    echo "=========================================="
    echo ""

    init_env

    # bridge
    local bridge_running=false
    for port in $(bridge_ports); do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid="$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)"
            local cmd="$(describe_pid "$pid")"
            local url="http://127.0.0.1:$port"
            if is_workspace_bridge_process "$pid" "$cmd"; then
                if check_url_ok "$url/health"; then
                    echo "✅ hermes-bridge  运行中  PID=$pid  端口=$port  健康"
                else
                    echo "⚠️  hermes-bridge  运行中  PID=$pid  端口=$port  不健康"
                fi
                bridge_running=true
            else
                echo "ℹ️  端口 $port 被非 workspace 进程占用: PID=$pid"
            fi
        fi
    done
    $bridge_running || echo "⏹  hermes-bridge  未运行"

    # hubos
    if lsof -Pi :"$HUBOS_API_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid="$(lsof -Pi :"$HUBOS_API_PORT" -sTCP:LISTEN -t | head -n 1)"
        if curl -s "http://127.0.0.1:$HUBOS_API_PORT/api/hubos/health" > /dev/null 2>&1; then
            echo "✅ HubOS API      运行中  PID=$pid  端口=$HUBOS_API_PORT  健康"
        else
            echo "⚠️  HubOS API      运行中  PID=$pid  端口=$HUBOS_API_PORT  不健康"
        fi
    else
        echo "⏹  HubOS API      未运行"
    fi

    # frontend
    if [ "$HUBOS_FRONTEND_MODE" = "static" ]; then
        if [ -f "$SCRIPT_DIR/dist/index.html" ]; then
            echo "✅ 前端静态资源  可用  路径=$SCRIPT_DIR/dist"
        else
            echo "⚠️  前端静态资源  缺失  路径=$SCRIPT_DIR/dist"
        fi
    elif lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid="$(lsof -Pi :"$HUBOS_FRONTEND_PORT" -sTCP:LISTEN -t | head -n 1)"
        echo "✅ 前端 dev server 运行中  PID=$pid  端口=$HUBOS_FRONTEND_PORT"
    else
        echo "⏹  前端 dev server 未运行"
    fi

    # HUD
    if lsof -Pi :"$QEECLAW_HUD_PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid="$(lsof -Pi :"$QEECLAW_HUD_PORT" -sTCP:LISTEN -t | head -n 1)"
        local cmd="$(describe_pid "$pid")"
        if is_workspace_hud_process "$pid" "$cmd"; then
            echo "✅ HUD Dashboard  运行中  PID=$pid  端口=$QEECLAW_HUD_PORT"
        else
            echo "ℹ️  HUD 端口 $QEECLAW_HUD_PORT 被非 workspace 进程占用: PID=$pid"
        fi
    else
        echo "⏹  HUD Dashboard  未运行"
    fi
}

# ── 入口 ──────────────────────────────────

case "${1:-}" in
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    status)  cmd_status ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
