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

check_workspace_bridge_ready() {
    local bridge_url="$1"
    check_url_ok "$bridge_url/health" \
        && check_url_ok "$bridge_url/api/platform/channels/bindings/validate?team_id=999999&channel_key=wechat_personal_plugin"
}

describe_pid() { ps -p "$1" -o command= 2>/dev/null || true; }
pid_cwd() { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1; }
process_env_contains() { ps eww -p "$1" | grep -F "$2" > /dev/null 2>&1; }

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

is_workspace_bridge_process() {
    local pid="$1" command="$2" cwd="$(pid_cwd "$pid")"
    case "$command" in
        *"/qeeclaw-sdk/packages/hermes-bridge/bridge_server.py"*) return 0 ;;
    esac
    [ "$cwd" = "$WORKSPACE_BRIDGE_DIR" ]
}

pid_alive() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }

save_pid() { echo "$2" > "$PIDFILE_DIR/$1.pid"; }

read_pid() {
    local f="$PIDFILE_DIR/$1.pid"
    [ -f "$f" ] && cat "$f" || echo ""
}

clear_pid() { rm -f "$PIDFILE_DIR/$1.pid"; }
init_env() {
    export VITE_BRIDGE_URL="${VITE_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
    export VITE_CHANNELS_BRIDGE_URL="${VITE_CHANNELS_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
    export VITE_HUBOS_API_URL="${VITE_HUBOS_API_URL:-$HUBOS_API_DEFAULT}"
    export QEECLAW_HERMES_AGENT_DIR="${QEECLAW_HERMES_AGENT_DIR:-$WORKSPACE_HERMES_AGENT_DIR_DEFAULT}"
    export QEECLAW_HUD_DIR="${QEECLAW_HUD_DIR:-$WORKSPACE_HUD_DIR_DEFAULT}"
}

check_deps() {
    command -v python3 &>/dev/null || { echo "❌ 未找到 python3"; exit 1; }
    command -v node &>/dev/null || { echo "❌ 未找到 node"; exit 1; }

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

    QEECLAW_HERMES_BRIDGE_PORT="$bridge_port" \
    QEECLAW_HERMES_AGENT_DIR="$QEECLAW_HERMES_AGENT_DIR" \
    QEECLAW_HUD_DIR="$QEECLAW_HUD_DIR" \
    python3 "$WORKSPACE_BRIDGE_SCRIPT" > "$bridge_log" 2>&1 &
    local pid=$!
    save_pid bridge "$pid"
    echo "   ✅ workspace hermes-bridge 已启动 (PID: $pid, URL: $bridge_url)"
    sleep 2

    if check_url_ok "$bridge_url/health"; then
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
                    echo "   ↪️  切换到备用端口: $fallback_url"
                    save_pid bridge "$fb_pid"
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
        node server/index.cjs > /tmp/hubos_api.log 2>&1 &
        save_pid hubos $!
        echo "   ✅ HubOS API 已启动 (PID: $!)"
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
        npm run dev
    fi
}

cmd_stop() {
    echo "=========================================="
    echo "  qeeshu-hubos 停止"
    echo "=========================================="
    echo ""

    local services=(frontend hubos bridge)
    local labels=("前端开发服务器" "HubOS API" "hermes-bridge")
    local ports=(5173 3456 0)

    for i in "${!services[@]}"; do
        local name="${services[$i]}" label="${labels[$i]}" port="${ports[$i]}"
        local pid="$(read_pid "$name")"

        if pid_alive "$pid"; then
            kill "$pid" 2>/dev/null && echo "✅ $label 已停止 (PID: $pid)" || echo "⚠️  $label 停止失败 (PID: $pid)"
            clear_pid "$name"
        elif [ "$port" -gt 0 ] && lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            pid="$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)"
            kill "$pid" 2>/dev/null && echo "✅ $label 已停止 (PID: $pid, 端口: $port)" || echo "⚠️  $label 停止失败"
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
                kill "$pid" 2>/dev/null && echo "✅ 额外 bridge 进程已停止 (PID: $pid, 端口: $port)"
            fi
        fi
    done
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
