#!/usr/bin/env bash
# Build the HubOS runtime package for customer machines.
#
# qeeclaw-server is deployed as a sibling package and owns Python, bridge,
# hermes-agent, and hermes-hudui. HubOS owns the frontend/backend and Node.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$APP_DIR/.." && pwd)"
RELEASE_ROOT="${HUBOS_RELEASE_ROOT:-$APP_DIR/release}"
VERSION="$(node -p "require('$APP_DIR/package.json').version")"
STAMP="$(date +%Y%m%d%H%M%S)"
PACKAGE_NAME="${HUBOS_PACKAGE_NAME:-CENTAUR-HUBOS-$VERSION-$STAMP}"
PACKAGE_DIR="$RELEASE_ROOT/$PACKAGE_NAME"
ARCHIVE_PATH="$RELEASE_ROOT/$PACKAGE_NAME.tar.gz"

usage() {
    cat <<'EOF'
Usage:
  ./scripts/package-runtime.sh

Default layout:
  Put qeeclaw-server and qeeshu-hubos under the same parent directory.
  The script automatically uses:
    ./runtime/node or ../runtime/node

Optional:
  HUBOS_NODE_RUNTIME_DIR    Override Node runtime directory.
  HUBOS_RELEASE_ROOT        Output directory. Defaults to qeeshu-hubos/release.
  HUBOS_PACKAGE_NAME        Package directory/archive basename.
  HUBOS_SKIP_BUILD=1        Skip npm build when dist already exists.

The package keeps the same relative layout as the source tree:
  CENTAUR-HUBOS/
    qeeshu-hubos/
    qeeclaw-sdk/packages/{core-sdk,product-sdk,runtime-sidecar}/
    runtime/node/
EOF
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

copy_dir() {
    local src="$1" dest="$2"
    [ -d "$src" ] || { echo "Missing directory: $src" >&2; exit 1; }
    mkdir -p "$(dirname "$dest")"
    rsync -a --delete \
        --exclude '.git' \
        --exclude '.venv' \
        --exclude '__pycache__' \
        --exclude '.pytest_cache' \
        --exclude '.mypy_cache' \
        --exclude '.DS_Store' \
        "$src/" "$dest/"
}

copy_file() {
    local src="$1" dest="$2"
    [ -f "$src" ] || { echo "Missing file: $src" >&2; exit 1; }
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
}

resolve_node_runtime() {
    local runtime_dir="${HUBOS_NODE_RUNTIME_DIR:-}"
    if [ -z "$runtime_dir" ]; then
        local candidate
        for candidate in \
            "$APP_DIR/runtime/node" \
            "$PROJECT_ROOT/runtime/node"
        do
            if [ -x "$candidate/bin/node" ]; then
                runtime_dir="$candidate"
                break
            fi
        done
    fi

    [ -n "$runtime_dir" ] || {
        echo "Cannot find bundled Node runtime automatically." >&2
        echo "Expected qeeshu-hubos/runtime/node or runtime/node under the shared parent directory." >&2
        echo "Override with HUBOS_NODE_RUNTIME_DIR only for non-standard build layouts." >&2
        exit 1
    }
    runtime_dir="$(cd "$runtime_dir" && pwd)"
    [ -x "$runtime_dir/bin/node" ] || {
        echo "HUBOS_NODE_RUNTIME_DIR must contain executable bin/node: $runtime_dir" >&2
        exit 1
    }
    printf '%s\n' "$runtime_dir"
}

prepare_frontend_deps() {
    if [ ! -d "$APP_DIR/node_modules" ]; then
        echo "Installing HubOS npm dependencies..."
        (cd "$APP_DIR" && npm install)
    fi
}

build_frontend() {
    if [ "${HUBOS_SKIP_BUILD:-0}" = "1" ]; then
        [ -f "$APP_DIR/dist/index.html" ] || {
            echo "HUBOS_SKIP_BUILD=1 but dist/index.html is missing." >&2
            exit 1
        }
        return
    fi
    echo "Building HubOS frontend..."
    (cd "$APP_DIR" && npm run build)
}

build_qeeclaw_packages() {
    local pkg
    for pkg in core-sdk product-sdk runtime-sidecar; do
        if [ ! -d "$PROJECT_ROOT/qeeclaw-sdk/packages/$pkg/dist" ]; then
            echo "Building @qeeclaw/$pkg..."
            (cd "$PROJECT_ROOT/qeeclaw-sdk/packages/$pkg" && npm install && npm run build)
        fi
    done
}

write_env_file() {
    local env_path="$1"
    cat > "$env_path" <<'EOF'
# HubOS packaged runtime configuration.
# Path values below are relative to the package root that contains qeeshu-hubos/.

HUBOS_FRONTEND_MODE=static
HUBOS_ALLOW_SYSTEM_PYTHON=0
HUBOS_ALLOW_PIP_INSTALL=0
HUBOS_ALLOW_NPM_INSTALL=0

HUBOS_API_PORT=3456
HUBOS_FRONTEND_PORT=5173
QEECLAW_HERMES_BRIDGE_PORT=21747
QEECLAW_HUD_PORT=8134

VITE_BRIDGE_URL=http://127.0.0.1:21747
VITE_CHANNELS_BRIDGE_URL=http://127.0.0.1:21747
VITE_HUBOS_API_URL=http://127.0.0.1:3456
EOF
    printf '# Auto-detected by run.sh in the default package layout:\n' >> "$env_path"
    printf '# HUBOS_NODE_BIN=runtime/node/bin/node\n' >> "$env_path"
    cat >> "$env_path" <<'EOF'
# QEECLAW_HERMES_BRIDGE_DIR=qeeclaw-server/release/<standalone>
# QEECLAW_HERMES_BRIDGE_PYTHON=qeeclaw-server/release/<standalone>/.venv/bin/python3
# QEECLAW_HERMES_AGENT_DIR=qeeclaw-server/release/<standalone>/vendor/hermes-agent
# QEECLAW_HUD_DIR=qeeclaw-server/release/<standalone>/vendor/hermes-hudui

# Keep customer data outside the immutable app directories.
HERMES_HOME=~/.qeeclaw_hermes

# Local knowledge vector store. The embedding model must be packaged locally;
# runtime will not download models or call cloud embedding APIs.
QEECLAW_KB_VECTOR_BACKEND=lancedb
QEECLAW_KB_EMBEDDING_MODEL=BAAI/bge-base-zh-v1.5
QEECLAW_KB_EMBEDDING_ENGINE=auto
QEECLAW_KB_EMBEDDING_DEVICE=cpu
QEECLAW_KB_EMBEDDING_DIMENSION=768
# Default layout auto-discovers these from sibling qeeclaw-server:
# QEECLAW_KB_DIR=qeeclaw-server/release/<standalone>/data/knowledge
# QEECLAW_KB_EMBEDDING_MODEL_DIR=qeeclaw-server/release/<standalone>/models/bge-base-zh-v1.5

# LLM runtime. Fill these on the customer machine or seed auth.json under HERMES_HOME.
# DeepSeek:
# HERMES_PROVIDER=deepseek
# HERMES_MODEL=deepseek/deepseek-v3.2-exp
# DEEPSEEK_API_KEY=
# DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
#
# DashScope/Qwen:
# HERMES_PROVIDER=alibaba
# HERMES_MODEL=qwen-plus
# DASHSCOPE_API_KEY=
# DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
EOF
}

NODE_RUNTIME_DIR="$(resolve_node_runtime)"

prepare_frontend_deps
build_qeeclaw_packages
build_frontend

rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR/qeeshu-hubos" "$PACKAGE_DIR/qeeclaw-sdk/packages" "$PACKAGE_DIR/runtime"

echo "Copying HubOS app..."
copy_dir "$APP_DIR/dist" "$PACKAGE_DIR/qeeshu-hubos/dist"
copy_dir "$APP_DIR/server" "$PACKAGE_DIR/qeeshu-hubos/server"
copy_dir "$APP_DIR/node_modules" "$PACKAGE_DIR/qeeshu-hubos/node_modules"
copy_file "$APP_DIR/run.sh" "$PACKAGE_DIR/qeeshu-hubos/run.sh"
copy_file "$APP_DIR/package.json" "$PACKAGE_DIR/qeeshu-hubos/package.json"
[ -f "$APP_DIR/package-lock.json" ] && copy_file "$APP_DIR/package-lock.json" "$PACKAGE_DIR/qeeshu-hubos/package-lock.json"
write_env_file "$PACKAGE_DIR/qeeshu-hubos/.env"
chmod +x "$PACKAGE_DIR/qeeshu-hubos/run.sh"

echo "Copying QeeClaw SDK packages..."
copy_dir "$PROJECT_ROOT/qeeclaw-sdk/packages/core-sdk" "$PACKAGE_DIR/qeeclaw-sdk/packages/core-sdk"
copy_dir "$PROJECT_ROOT/qeeclaw-sdk/packages/product-sdk" "$PACKAGE_DIR/qeeclaw-sdk/packages/product-sdk"
copy_dir "$PROJECT_ROOT/qeeclaw-sdk/packages/runtime-sidecar" "$PACKAGE_DIR/qeeclaw-sdk/packages/runtime-sidecar"

echo "Copying bundled Node runtime..."
copy_dir "$NODE_RUNTIME_DIR" "$PACKAGE_DIR/runtime/node"

cat > "$PACKAGE_DIR/README-RUNTIME.md" <<'EOF'
# CENTAUR-HUBOS Runtime Package

Start:

```bash
cd qeeshu-hubos
./run.sh start
```

Open:

```text
http://127.0.0.1:3456/CENTAUR-HUBOS/
```

Stop:

```bash
./run.sh stop
```

Expected deployment layout:

```text
deploy-root/
  qeeclaw-server/
  qeeshu-hubos/
```

Do not edit runtime/node on the customer machine. Rebuild the package on the build machine when dependencies change.
EOF

mkdir -p "$RELEASE_ROOT"
rm -f "$ARCHIVE_PATH"
echo "Creating archive..."
(cd "$RELEASE_ROOT" && tar -czf "$ARCHIVE_PATH" "$PACKAGE_NAME")

echo ""
echo "Package directory: $PACKAGE_DIR"
echo "Archive: $ARCHIVE_PATH"
