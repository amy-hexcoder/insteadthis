#!/usr/bin/env bash
# Copies only the images the posts use from the old WordPress backup into public/images/uploads.
# Usage (from the project folder):
#   npm run copy-media -- ~/path/to/bitnami/apps/wordpress/htdocs/wp-content/uploads
set -u

if [ $# -lt 1 ]; then
  echo "Usage: npm run copy-media -- /path/to/wp-content/uploads"
  exit 1
fi

SRC="${1%/}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/images/uploads"
MANIFEST="$ROOT/scripts/media-manifest.txt"
MISSING="$ROOT/scripts/missing-media.txt"

if [ ! -d "$SRC" ]; then
  echo "Folder not found: $SRC"
  exit 1
fi

mkdir -p "$DEST"
: > "$MISSING"
copied=0
missing=0

while IFS= read -r file || [ -n "$file" ]; do
  [ -z "$file" ] && continue
  if [ -f "$SRC/$file" ]; then
    mkdir -p "$DEST/$(dirname "$file")"
    cp -p "$SRC/$file" "$DEST/$file"
    copied=$((copied + 1))
  else
    echo "$file" >> "$MISSING"
    missing=$((missing + 1))
  fi
done < "$MANIFEST"

echo "Copied $copied images to public/images/uploads"
if [ "$missing" -gt 0 ]; then
  echo "$missing files were not in the backup. The list is in scripts/missing-media.txt"
else
  rm -f "$MISSING"
fi
