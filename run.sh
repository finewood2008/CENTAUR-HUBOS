#!/bin/bash
# qeeshu-hubos 服务管理脚本
# 用法: ./run.sh {start|stop|restart|status}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_BRIDGE_DIR="$PROJECT_ROOT/qeeclaw-sdk/packages/hermes-bridge"
WORKSPACE_BRIDGE_SCRIPT="$WORKSPACE_BRIDGE_DIR/bridge_server.py"
WORKSPACE_HERMES_AGENT_DIR_DEFAULT="$PROJECT_ROOT/vendor/hermes-agent"
WORKSPACE_HUD_DIR_DEFAULT="$PROJECT_ROOT/vendor/hermes-hudui"
BRIDGE_PORT_DEFAULT=21747
BRIDGE_FALLBACK_PORT=21748
HUD_PORT_DEFAULT=8134
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

ensure_bridge_python_import() {
    local module="$1" package="$2"
    if "$QEECLAW_HERMES_BRIDGE_PYTHON" -c "import ${module}" >/dev/null 2>&1; then
        return 0
    fi
    echo "📦 bridge Python 缺少 ${module}，正在安装 ${package}..."
    "$QEECLAW_HERMES_BRIDGE_PYTHON" -m pip install --quiet "$package"
}

frontend_process_matches_bridge_env() {
    local pid="$1"
    process_env_contains "$pid" "VITE_BRIDGE_URL=$VITE_BRIDGE_URL" \
        && process_env_contains "$pid" "VITE_CHANNELS_BRIDGE_URL=$VITE_CHANNELS_BRIDGE_URL"
}

url_port() {
    python3 -c '
from urllib.parse import urlparse; import sys
url = urlparse(sys.argv[1])
print(url.port or (443 if url.scheme == "https" else 80))
' "$1"
}

replace_url_port() {
    python3 -c '
from urllib.parse import urlparse, urlunparse; import sys
url = urlparse(sys.argv[1]); port = int(sys.argv[2])
h = url.hostname or "127.0.0.1"
if ":" in h and not h.startswith("["): h = f"[{h}]"
nl = h if port in (80,443) else f"{h}:{port}"
print(urlunparse((url.scheme, nl, url.path, url.params, url.query, url.fragment)))
' "$1" "$2"
}

json_read() {
    python3 -c '
import json, sys
path = sys.argv[1].split(".")
v = json.load(sys.stdin)
for p in path:
    v = v[int(p)] if isinstance(v, list) else v[p]
if v is None: print("")
elif isinstance(v, bool): print("true" if v else "false")
else: print(v)
' "$1"
}

resolve_bridge_python() {
    if [ -n "${QEECLAW_HERMES_BRIDGE_PYTHON:-}" ]; then
        echo "$QEECLAW_HERMES_BRIDGE_PYTHON"
        return
    fi

    local candidate
    for candidate in \
        "$WORKSPACE_BRIDGE_DIR/.venv/bin/python3" \
        "$PROJECT_ROOT/.venv/bin/python3" \
        "$PROJECT_ROOT"/qeeclaw-server/release/*/.venv/bin/python3
    do
        if [ -x "$candidate" ]; then
            echo "$candidate"
            return
        fi
    done

    command -v python3
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
    python3 - "$log_file" "$@" <<'PY'
import subprocess
import sys

log_path = sys.argv[1]
cmd = sys.argv[2:]
with open(log_path, "ab", buffering=0) as log:
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
        close_fds=True,
    )
print(proc.pid)
PY
}

init_env() {
    export VITE_BRIDGE_URL="${VITE_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
    export VITE_CHANNELS_BRIDGE_URL="${VITE_CHANNELS_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
    export VITE_HUBOS_API_URL="${VITE_HUBOS_API_URL:-$HUBOS_API_DEFAULT}"
    export QEECLAW_HERMES_AGENT_DIR="${QEECLAW_HERMES_AGENT_DIR:-$WORKSPACE_HERMES_AGENT_DIR_DEFAULT}"
    export QEECLAW_HUD_DIR="${QEECLAW_HUD_DIR:-$WORKSPACE_HUD_DIR_DEFAULT}"
    export QEECLAW_HUD_PORT="${QEECLAW_HUD_PORT:-$HUD_PORT_DEFAULT}"
    export QEECLAW_HERMES_BRIDGE_PYTHON="$(resolve_bridge_python)"
}

check_deps() {
    command -v python3 &>/dev/null || { echo "❌ 未找到 python3"; exit 1; }
    command -v node &>/dev/null || { echo "❌ 未找到 node"; exit 1; }
    [ -x "$QEECLAW_HERMES_BRIDGE_PYTHON" ] || { echo "❌ bridge Python 不可执行: $QEECLAW_HERMES_BRIDGE_PYTHON"; exit 1; }
    ensure_bridge_python_import "pypdf" "pypdf>=5.0.0"

    if ! is_local_url "$VITE_BRIDGE_URL"; then
        echo "❌ VITE_BRIDGE_URL 必须指向本地: $VITE_BRIDGE_URL"; exit 1
    fi
    if ! is_local_url "$VITE_CHANNELS_BRIDGE_URL"; then
        echo "❌ VITE_CHANNELS_BRIDGE_URL 必须指向本地: $VITE_CHANNELS_BRIDGE_URL"; exit 1
    fi
    if [ ! -d "$QEECLAW_HERMES_AGENT_DIR" ]; then
        echo "❌ 未找到 hermes-agent 目录: $QEECLAW_HERMES_AGENT_DIR"; exit 1
    fi
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
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
    pid="$(QEECLAW_HERMES_BRIDGE_PORT="$bridge_port" \
    QEECLAW_HERMES_AGENT_DIR="$QEECLAW_HERMES_AGENT_DIR" \
    QEECLAW_HUD_DIR="$QEECLAW_HUD_DIR" \
    QEECLAW_HUD_PORT="$QEECLAW_HUD_PORT" \
    TOKENIZERS_PARALLELISM="${TOKENIZERS_PARALLELISM:-false}" \
    start_detached "$bridge_log" "$QEECLAW_HERMES_BRIDGE_PYTHON" "$WORKSPACE_BRIDGE_SCRIPT")"
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
    echo "🚀 启动 HubOS 产品后端 (3456)..."
    cd "$SCRIPT_DIR"
    if lsof -Pi :3456 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local hubos_pid="$(lsof -Pi :3456 -sTCP:LISTEN -t | head -n 1)"
        echo "   ⚠️  端口 3456 已被占用，跳过启动"
        save_pid hubos "$hubos_pid"
    else
        local hubos_pid
        hubos_pid="$(start_detached /tmp/hubos_api.log node server/index.cjs)"
        save_pid hubos "$hubos_pid"
        echo "   ✅ HubOS API 已启动 (PID: $hubos_pid)"
        sleep 2
        if curl -s http://127.0.0.1:3456/api/hubos/health > /dev/null 2>&1; then
            echo "   ✅ HubOS API 健康检查通过"
        else
            echo "   ❌ HubOS API 启动失败，查看日志: /tmp/hubos_api.log"; exit 1
        fi
    fi
    echo ""

    # 启动前端
    echo "🚀 启动前端开发服务器 (5173)..."
    cd "$SCRIPT_DIR"
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local fe_pid="$(lsof -Pi :5173 -sTCP:LISTEN -t | head -n 1)"
        echo "   ⚠️  端口 5173 已被占用"
        save_pid frontend "$fe_pid"
        if [ "$bridge_fallback_active" = "true" ]; then
            if frontend_process_matches_bridge_env "$fe_pid"; then
                echo "   ✅ 当前前端已对齐 bridge: $VITE_BRIDGE_URL"
            else
                echo "   ℹ️  已切换 bridge 到 $VITE_BRIDGE_URL，请重启前端开发服务器"
            fi
        fi
        echo ""
        echo "访问地址: http://localhost:5173/CENTAUR-HUBOS/"
    else
        echo "   启动中..."
        local fe_pid
        fe_pid="$(start_detached /tmp/qeeshu_hubos_frontend.log npm run dev)"
        save_pid frontend "$fe_pid"
        echo "   ✅ 前端开发服务器已启动 (PID: $fe_pid)"
        if wait_url_ok "http://localhost:5173/CENTAUR-HUBOS/" 20 0.5; then
            if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
                save_pid frontend "$(lsof -Pi :5173 -sTCP:LISTEN -t | head -n 1)"
            fi
            echo "   ✅ 前端 dev server 健康检查通过"
            echo ""
            echo "访问地址: http://localhost:5173/CENTAUR-HUBOS/"
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
    local ports=(5173 3456 0)

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
    for port in $BRIDGE_PORT_DEFAULT $BRIDGE_FALLBACK_PORT; do
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
    for port in $BRIDGE_PORT_DEFAULT $BRIDGE_FALLBACK_PORT; do
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
    if lsof -Pi :3456 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid="$(lsof -Pi :3456 -sTCP:LISTEN -t | head -n 1)"
        if curl -s http://127.0.0.1:3456/api/hubos/health > /dev/null 2>&1; then
            echo "✅ HubOS API      运行中  PID=$pid  端口=3456  健康"
        else
            echo "⚠️  HubOS API      运行中  PID=$pid  端口=3456  不健康"
        fi
    else
        echo "⏹  HubOS API      未运行"
    fi

    # frontend
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid="$(lsof -Pi :5173 -sTCP:LISTEN -t | head -n 1)"
        echo "✅ 前端 dev server 运行中  PID=$pid  端口=5173"
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
