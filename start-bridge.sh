#!/bin/bash
# Compatibility wrapper. The supported entrypoint is run.sh so that the same
# bundled runtime and .env path resolution are used in dev and packaged builds.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/run.sh" start
