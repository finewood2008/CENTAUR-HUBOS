#!/bin/bash
# qeeshu-hubos 一键启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "  qeeshu-hubos 启动脚本"
echo "=========================================="
echo ""

# 检查依赖
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

# 检查 node_modules
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    cd "$SCRIPT_DIR"
    npm install
    echo ""
fi

# 启动 bridge_server
echo "🚀 启动 bridge_server (21747)..."
cd "$PROJECT_ROOT/qeeclaw-sdk/packages/hermes-bridge"

if lsof -Pi :21747 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  端口 21747 已被占用，跳过启动"
else
    python3 bridge_server.py > /tmp/bridge_server.log 2>&1 &
    BRIDGE_PID=$!
    echo "   ✅ bridge_server 已启动 (PID: $BRIDGE_PID)"
    sleep 2

    # 验证启动
    if curl -s http://127.0.0.1:21747/health > /dev/null 2>&1; then
        echo "   ✅ bridge_server 健康检查通过"
    else
        echo "   ❌ bridge_server 启动失败，查看日志: /tmp/bridge_server.log"
        exit 1
    fi
fi

echo ""

# 启动前端
echo "🚀 启动前端开发服务器 (5173)..."
cd "$SCRIPT_DIR"

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  端口 5173 已被占用"
    echo ""
    echo "访问地址: http://localhost:5173/CENTAUR-HUBOS/"
else
    echo "   启动中..."
    npm run dev
fi
