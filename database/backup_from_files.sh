#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$BASE_DIR/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/pos_db_files_dump_${STAMP}.sql"

mkdir -p "$BACKUP_DIR"

{
  echo "-- POS DB backup generated from schema.sql + seed.sql"
  echo "-- Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "SET NAMES utf8mb4;"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  echo
  echo "-- ===== schema.sql ====="
  cat "$BASE_DIR/schema.sql"
  echo
  echo "-- ===== seed.sql ====="
  cat "$BASE_DIR/seed.sql"
  echo
  echo "SET FOREIGN_KEY_CHECKS = 1;"
} > "$OUT_FILE"

echo "Backup written: $OUT_FILE"
