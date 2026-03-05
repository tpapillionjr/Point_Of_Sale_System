#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-pos_db}"
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${DB_NAME}_dump_${STAMP}.sql"

mkdir -p "$BACKUP_DIR"

# Prompts for password if needed. Add -h / -P / -u options as required for your setup.
mysqldump -u root -p --single-transaction --routines --triggers "$DB_NAME" > "$OUT_FILE"

echo "Backup written: $OUT_FILE"
