#!/bin/bash
# Compatibility wrapper. Use run.sh for all service lifecycle operations.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/run.sh" start
