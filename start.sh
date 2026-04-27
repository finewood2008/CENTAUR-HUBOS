#!/bin/bash
# qeeshu-hubos 一键启动脚本

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

is_local_url() {
    case "$1" in
        http://127.0.0.1:*|http://localhost:*|http://0.0.0.0:*|http://[::1]:*|http://*.local:*|https://127.0.0.1:*|https://localhost:*|https://0.0.0.0:*|https://[::1]:*|https://*.local:*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

check_url_ok() {
    curl -fsS "$1" > /dev/null 2>&1
}

check_workspace_bridge_ready() {
    local bridge_url="$1"
    check_url_ok "$bridge_url/health" \
        && check_url_ok "$bridge_url/api/platform/channels/bindings/validate?team_id=999999&channel_key=wechat_personal_plugin"
}

describe_pid() {
    ps -p "$1" -o command= 2>/dev/null || true
}

pid_cwd() {
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

process_env_contains() {
    ps eww -p "$1" | grep -F "$2" > /dev/null 2>&1
}

frontend_process_matches_bridge_env() {
    local pid="$1"
    process_env_contains "$pid" "VITE_BRIDGE_URL=$VITE_BRIDGE_URL" \
        && process_env_contains "$pid" "VITE_CHANNELS_BRIDGE_URL=$VITE_CHANNELS_BRIDGE_URL"
}

url_port() {
    python3 -c '
from urllib.parse import urlparse
import sys

url = urlparse(sys.argv[1])
if url.port:
    print(url.port)
elif url.scheme == "https":
    print(443)
else:
    print(80)
' "$1"
}

replace_url_port() {
    python3 -c '
from urllib.parse import urlparse, urlunparse
import sys

url = urlparse(sys.argv[1])
port = int(sys.argv[2])
hostname = url.hostname or "127.0.0.1"
if ":" in hostname and not hostname.startswith("["):
    hostname = f"[{hostname}]"
netloc = hostname if port in (80, 443) else f"{hostname}:{port}"
print(urlunparse((url.scheme, netloc, url.path, url.params, url.query, url.fragment)))
' "$1" "$2"
}

is_workspace_bridge_process() {
    local pid="$1"
    local command="$2"
    local cwd="$(pid_cwd "$pid")"

    case "$command" in
        *"/qeeclaw-sdk/packages/hermes-bridge/bridge_server.py"*)
            return 0
            ;;
    esac

    [ "$cwd" = "$WORKSPACE_BRIDGE_DIR" ]
}

start_workspace_bridge() {
    local bridge_url="$1"
    local bridge_port="$2"
    local bridge_log="/tmp/bridge_server_${bridge_port}.log"

    QEECLAW_HERMES_BRIDGE_PORT="$bridge_port" \
    QEECLAW_HERMES_AGENT_DIR="$QEECLAW_HERMES_AGENT_DIR" \
    QEECLAW_HUD_DIR="$QEECLAW_HUD_DIR" \
    python3 "$WORKSPACE_BRIDGE_SCRIPT" > "$bridge_log" 2>&1 &
    BRIDGE_PID=$!
    echo "   ✅ workspace hermes-bridge 已启动 (PID: $BRIDGE_PID, URL: $bridge_url)"
    sleep 2

    if check_url_ok "$bridge_url/health"; then
        echo "   ✅ workspace hermes-bridge 健康检查通过"
    else
        echo "   ❌ workspace hermes-bridge 启动失败，查看日志: $bridge_log"
        exit 1
    fi
}

json_read() {
    python3 -c '
import json
import sys

path = sys.argv[1].split(".")
data = json.load(sys.stdin)
value = data
for part in path:
    if isinstance(value, list):
        value = value[int(part)]
    else:
        value = value[part]
if value is None:
    print("")
elif isinstance(value, bool):
    print("true" if value else "false")
else:
    print(value)
' "$1"
}

echo "=========================================="
echo "  qeeshu-hubos 启动脚本"
echo "=========================================="
echo ""

# 检查依赖
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 node"
    exit 1
fi

export VITE_BRIDGE_URL="${VITE_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
export VITE_CHANNELS_BRIDGE_URL="${VITE_CHANNELS_BRIDGE_URL:-$BRIDGE_URL_DEFAULT}"
export VITE_HUBOS_API_URL="${VITE_HUBOS_API_URL:-$HUBOS_API_DEFAULT}"
export QEECLAW_HERMES_AGENT_DIR="${QEECLAW_HERMES_AGENT_DIR:-$WORKSPACE_HERMES_AGENT_DIR_DEFAULT}"
export QEECLAW_HUD_DIR="${QEECLAW_HUD_DIR:-$WORKSPACE_HUD_DIR_DEFAULT}"

if ! is_local_url "$VITE_BRIDGE_URL"; then
    echo "❌ 错误: VITE_BRIDGE_URL 必须指向本地 hermes-bridge，当前为: $VITE_BRIDGE_URL"
    exit 1
fi

if ! is_local_url "$VITE_CHANNELS_BRIDGE_URL"; then
    echo "❌ 错误: VITE_CHANNELS_BRIDGE_URL 必须指向本地 hermes-bridge，当前为: $VITE_CHANNELS_BRIDGE_URL"
    exit 1
fi

if [ ! -d "$QEECLAW_HERMES_AGENT_DIR" ]; then
    echo "❌ 错误: 未找到 hermes-agent 目录: $QEECLAW_HERMES_AGENT_DIR"
    exit 1
fi

# 检查 node_modules
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    cd "$SCRIPT_DIR"
    npm install
    echo ""
fi

# ── 启动 bridge_server ─────────────────
BRIDGE_TARGET_URL="$VITE_BRIDGE_URL"
BRIDGE_TARGET_PORT="$(url_port "$BRIDGE_TARGET_URL")"
BRIDGE_FALLBACK_ACTIVE="false"

echo "🚀 启动 bridge_server ($BRIDGE_TARGET_PORT)..."
cd "$WORKSPACE_BRIDGE_DIR"

BRIDGE_PORT_PID=""
BRIDGE_PORT_COMMAND=""

if lsof -Pi :$BRIDGE_TARGET_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    BRIDGE_PORT_PID="$(lsof -Pi :$BRIDGE_TARGET_PORT -sTCP:LISTEN -t | head -n 1)"
    BRIDGE_PORT_COMMAND="$(describe_pid "$BRIDGE_PORT_PID")"
    echo "   ⚠️  端口 $BRIDGE_TARGET_PORT 已被占用，跳过启动"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   ℹ️  当前占用进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
    fi

    if is_workspace_bridge_process "$BRIDGE_PORT_PID" "$BRIDGE_PORT_COMMAND"; then
        if check_workspace_bridge_ready "$BRIDGE_TARGET_URL"; then
            echo "   ✅ 复用已有 workspace hermes-bridge: $BRIDGE_TARGET_URL"
        else
            echo "   ↪️  当前 workspace hermes-bridge 缺少最新 channels 校验能力，正在重启"
            kill "$BRIDGE_PORT_PID"
            sleep 1
            start_workspace_bridge "$BRIDGE_TARGET_URL" "$BRIDGE_TARGET_PORT"
        fi
    fi

    if [ "$VITE_BRIDGE_URL" = "$BRIDGE_URL_DEFAULT" ] \
        && [ "$VITE_CHANNELS_BRIDGE_URL" = "$BRIDGE_URL_DEFAULT" ] \
        && [ "$BRIDGE_TARGET_PORT" = "$BRIDGE_PORT_DEFAULT" ] \
        && ! is_workspace_bridge_process "$BRIDGE_PORT_PID" "$BRIDGE_PORT_COMMAND"; then
        FALLBACK_BRIDGE_URL="$(replace_url_port "$BRIDGE_URL_DEFAULT" "$BRIDGE_FALLBACK_PORT")"
        if lsof -Pi :$BRIDGE_FALLBACK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            FALLBACK_PID="$(lsof -Pi :$BRIDGE_FALLBACK_PORT -sTCP:LISTEN -t | head -n 1)"
            FALLBACK_COMMAND="$(describe_pid "$FALLBACK_PID")"

            export VITE_BRIDGE_URL="$FALLBACK_BRIDGE_URL"
            export VITE_CHANNELS_BRIDGE_URL="$FALLBACK_BRIDGE_URL"
            BRIDGE_TARGET_URL="$FALLBACK_BRIDGE_URL"
            BRIDGE_TARGET_PORT="$BRIDGE_FALLBACK_PORT"
            BRIDGE_FALLBACK_ACTIVE="true"

            if is_workspace_bridge_process "$FALLBACK_PID" "$FALLBACK_COMMAND"; then
                echo "   ↪️  发现已有 workspace hermes-bridge 占用备用端口 $BRIDGE_FALLBACK_PORT"
                if check_workspace_bridge_ready "$FALLBACK_BRIDGE_URL"; then
                    echo "   ✅ 复用已有 workspace hermes-bridge: $FALLBACK_BRIDGE_URL"
                else
                    echo "   ↪️  备用端口上的 workspace hermes-bridge 状态异常，正在重启"
                    kill "$FALLBACK_PID"
                    sleep 1
                    start_workspace_bridge "$BRIDGE_TARGET_URL" "$BRIDGE_TARGET_PORT"
                fi
            else
                echo "   ❌ 默认 bridge 端口被旧进程占用，且备用端口 $BRIDGE_FALLBACK_PORT 也被占用"
                echo "   当前 $BRIDGE_TARGET_PORT 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
                echo "   当前 $BRIDGE_FALLBACK_PORT 端口进程: PID=$FALLBACK_PID $FALLBACK_COMMAND"
                exit 1
            fi
        else
            export VITE_BRIDGE_URL="$FALLBACK_BRIDGE_URL"
            export VITE_CHANNELS_BRIDGE_URL="$FALLBACK_BRIDGE_URL"
            BRIDGE_TARGET_URL="$FALLBACK_BRIDGE_URL"
            BRIDGE_TARGET_PORT="$BRIDGE_FALLBACK_PORT"
            BRIDGE_FALLBACK_ACTIVE="true"

            echo "   ↪️  检测到默认端口不是当前工作区 hermes-bridge，切换到 $BRIDGE_TARGET_URL"
            start_workspace_bridge "$BRIDGE_TARGET_URL" "$BRIDGE_TARGET_PORT"
        fi
    fi
else
    start_workspace_bridge "$BRIDGE_TARGET_URL" "$BRIDGE_TARGET_PORT"
fi

echo "🔒 本地隐私模式"
echo "   VITE_BRIDGE_URL=$VITE_BRIDGE_URL"
echo "   VITE_CHANNELS_BRIDGE_URL=$VITE_CHANNELS_BRIDGE_URL"
echo "   VITE_HUBOS_API_URL=$VITE_HUBOS_API_URL"
echo ""

echo "   🔎 校验 channels 本地接口..."
if check_url_ok "$VITE_CHANNELS_BRIDGE_URL/api/platform/channels?team_id=1"; then
    echo "   ✅ channels 总览接口可用"
else
    echo "   ❌ channels 总览接口不可用: $VITE_CHANNELS_BRIDGE_URL/api/platform/channels?team_id=1"
    echo "   请确认 hermes-bridge 已启动，并且本地 bridge 实现了 /api/platform/channels 接口"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   当前 21747 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
    fi
    exit 1
fi

if check_url_ok "$VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-plugin/config?team_id=1"; then
    echo "   ✅ 个人微信插件配置接口可用"
else
    echo "   ❌ 个人微信插件配置接口不可用: $VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-plugin/config?team_id=1"
    echo "   请确认 hermes-bridge 的 channels 子路由完整可用"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   当前 21747 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
    fi
    exit 1
fi

if check_url_ok "$VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-openclaw/config?team_id=1"; then
    echo "   ✅ OpenClaw 配置接口可用"
else
    echo "   ❌ OpenClaw 配置接口不可用: $VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-openclaw/config?team_id=1"
    echo "   请确认 hermes-bridge 的 OpenClaw channels 配置子路由可用"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   当前 21747 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
    fi
    exit 1
fi

if check_url_ok "$VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-openclaw/qr/status?team_id=1"; then
    echo "   ✅ OpenClaw 二维码状态接口可用"
else
    echo "   ❌ OpenClaw 二维码状态接口不可用: $VITE_CHANNELS_BRIDGE_URL/api/platform/channels/wechat-personal-openclaw/qr/status?team_id=1"
    echo "   请确认 hermes-bridge 已启用 OpenClaw 二维码状态子路由"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   当前 21747 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
    fi
    exit 1
fi

echo "   🧪 校验个人微信插件绑定链路..."
SMOKE_TEAM_ID=999999
SMOKE_VALIDATE_URL="$VITE_CHANNELS_BRIDGE_URL/api/platform/channels/bindings/validate?team_id=$SMOKE_TEAM_ID&channel_key=wechat_personal_plugin"
SMOKE_VALIDATE_RESPONSE="$(curl -fsS "$SMOKE_VALIDATE_URL")"
SMOKE_BINDING_READY="$(printf '%s' "$SMOKE_VALIDATE_RESPONSE" | json_read "data.ready")"
SMOKE_BINDINGS_COUNT="$(printf '%s' "$SMOKE_VALIDATE_RESPONSE" | json_read "data.bindings_count")"
SMOKE_STORAGE_WRITABLE="$(printf '%s' "$SMOKE_VALIDATE_RESPONSE" | json_read "data.storage_writable")"

if [ "$SMOKE_BINDING_READY" != "true" ] || [ "$SMOKE_STORAGE_WRITABLE" != "true" ]; then
    echo "   ❌ 绑定链路无残留写路径校验失败"
    echo "   响应: $SMOKE_VALIDATE_RESPONSE"
    if [ -n "$BRIDGE_PORT_COMMAND" ]; then
        echo "   当前 21747 端口进程: PID=$BRIDGE_PORT_PID $BRIDGE_PORT_COMMAND"
        echo "   该进程可能不是最新的 hermes-bridge，或仍在提供旧版 channels stub 实现"
    fi
    exit 1
fi

echo "   ✅ 个人微信插件绑定链路可用（无残留写路径校验，当前绑定数: $SMOKE_BINDINGS_COUNT）"

echo ""

# ── 启动 HubOS 产品后端 ────────────────
echo "🚀 启动 HubOS 产品后端 (3456)..."
cd "$SCRIPT_DIR"

if lsof -Pi :3456 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  端口 3456 已被占用，跳过启动"
else
    node server/index.cjs > /tmp/hubos_api.log 2>&1 &
    HUBOS_PID=$!
    echo "   ✅ HubOS API 已启动 (PID: $HUBOS_PID)"
    sleep 2

    # 验证启动
    if curl -s http://127.0.0.1:3456/api/hubos/health > /dev/null 2>&1; then
        echo "   ✅ HubOS API 健康检查通过"
    else
        echo "   ❌ HubOS API 启动失败，查看日志: /tmp/hubos_api.log"
        exit 1
    fi
fi

echo ""

# ── 启动前端 ───────────────────────────
echo "🚀 启动前端开发服务器 (5173)..."
cd "$SCRIPT_DIR"

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_PID="$(lsof -Pi :5173 -sTCP:LISTEN -t | head -n 1)"
    echo "   ⚠️  端口 5173 已被占用"
    if [ "$BRIDGE_FALLBACK_ACTIVE" = "true" ]; then
        if frontend_process_matches_bridge_env "$FRONTEND_PID"; then
            echo "   ✅ 当前前端已对齐 bridge: $VITE_BRIDGE_URL"
        else
            echo "   ℹ️  已切换 bridge 到 $VITE_BRIDGE_URL"
            echo "   ℹ️  当前前端仍可能连到旧 bridge，请重启前端开发服务器。"
        fi
    fi
    echo ""
    echo "访问地址: http://localhost:5173/CENTAUR-HUBOS/"
else
    echo "   启动中..."
    npm run dev
fi
