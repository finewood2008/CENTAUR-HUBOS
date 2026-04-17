#!/bin/bash
# qeeshu-hubos SDK 集成验证脚本

echo "=========================================="
echo "  qeeshu-hubos SDK 集成验证"
echo "=========================================="
echo ""

# 检查 bridge_server 是否运行
echo "1. 检查 bridge_server (21747)..."
if curl -s http://127.0.0.1:21747/health > /dev/null 2>&1; then
    echo "   ✅ bridge_server 运行正常"
else
    echo "   ❌ bridge_server 未运行"
    echo "   启动命令: cd qeeclaw-sdk/packages/hermes-bridge && python3 bridge_server.py"
    exit 1
fi

echo ""
echo "2. 测试核心 SDK 端点..."

# billing
echo -n "   - billing/wallet: "
if curl -s http://127.0.0.1:21747/api/billing/wallet | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# tenant
echo -n "   - users/me/context: "
if curl -s http://127.0.0.1:21747/api/users/me/context | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# models
echo -n "   - platform/models: "
if curl -s http://127.0.0.1:21747/api/platform/models | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# agent
echo -n "   - agent/my-agents: "
if curl -s http://127.0.0.1:21747/api/agent/my-agents | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# channels
echo -n "   - platform/channels: "
if curl -s http://127.0.0.1:21747/api/platform/channels | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# knowledge
echo -n "   - platform/knowledge/list: "
if curl -s "http://127.0.0.1:21747/api/platform/knowledge/list?team_id=1" | grep -q '"documents"'; then
    echo "✅"
else
    echo "❌"
fi

# devices
echo -n "   - platform/devices: "
if curl -s http://127.0.0.1:21747/api/platform/devices | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# audit
echo -n "   - platform/audit/summary: "
if curl -s http://127.0.0.1:21747/api/platform/audit/summary | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# approval
echo -n "   - platform/approvals: "
if curl -s http://127.0.0.1:21747/api/platform/approvals | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

# workflow
echo -n "   - workflows: "
if curl -s http://127.0.0.1:21747/api/workflows | grep -q '"code": 0'; then
    echo "✅"
else
    echo "❌"
fi

echo ""
echo "3. 检查前端开发服务器..."
if curl -s http://localhost:5173/CENTAUR-HUBOS/ > /dev/null 2>&1; then
    echo "   ✅ 前端服务器运行正常 (http://localhost:5173/CENTAUR-HUBOS/)"
else
    echo "   ⚠️  前端服务器未运行"
    echo "   启动命令: cd qeeshu-hubos && npm run dev"
fi

echo ""
echo "=========================================="
echo "  验证完成！"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:5173/CENTAUR-HUBOS/"
echo "查看页面顶部状态栏确认 SDK 连接状态"
echo ""
