#!/bin/bash
# 启动 bridge server（使用 Python 3.10）

BRIDGE_DIR="/Users/longxiping/Public/workspace/qs/ai/qs-nexus-aos/qeeclaw-sdk/packages/hermes-bridge"
PYTHON="/Users/longxiping/.pyenv/versions/3.10.10/bin/python3"

# 停止旧的 bridge
lsof -Pi :21747 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null

# 加载 ~/.hermes/.env 中的环境变量
if [ -f ~/.hermes/.env ]; then
    export $(grep -v '^#' ~/.hermes/.env | xargs)
    echo "✅ Loaded environment variables from ~/.hermes/.env"
fi

# 设置环境变量
export QEECLAW_HERMES_BRIDGE_PORT=21747
export QEECLAW_HERMES_AGENT_DIR="/Users/longxiping/Public/workspace/qs/ai/qs-nexus-aos/vendor/hermes-agent"

# 启动 bridge
cd "$BRIDGE_DIR"
OPENAI_API_KEY=sk-faaaabf8c30645f79ea13dd363ddf95d \
OPENAI_BASE_URL=https://paas.qeeshu.com/v1 \
$PYTHON bridge_server.py > /tmp/bridge_server_21747.log 2>&1 &

echo "Bridge server starting (PID: $!)"
sleep 3

# 检查健康状态
if curl -s http://127.0.0.1:21747/health > /dev/null 2>&1; then
    echo "✅ Bridge server is running"

    # 自动启动 WeChat adapter（如果凭证已配置）
    CREDS=$(curl -s http://127.0.0.1:21747/wechat/credentials)
    if echo "$CREDS" | grep -q '"configured": *true'; then
        echo "✅ WeChat credentials found, starting adapter..."
        RESULT=$(curl -s -X POST http://127.0.0.1:21747/wechat/adapter/start)
        if echo "$RESULT" | grep -q '"status": *"started"'; then
            echo "✅ WeChat adapter started successfully"
        else
            echo "⚠️  WeChat adapter start result: $RESULT"
        fi
    else
        echo "ℹ️  WeChat credentials not configured. Please scan QR code first."
    fi
else
    echo "❌ Bridge server failed to start. Check /tmp/bridge_server_21747.log"
    exit 1
fi
