#!/bin/zsh
# Development: builds Cut, packs it (dist/mac-arm64, signed ad hoc) and runs it with a scratch
# config folder and window snapshots (a PNG of the window every second).
#   script/dev-run.sh <snapshot-dir> <config-dir> [file]
set -euo pipefail
cd "$(dirname "$0")/.."
Y=(node .yarn/releases/yarn-4.18.0.cjs)
swift macos/make-symbols.swift "$PWD" >/dev/null # the SF Symbols of the interface
$Y electron-vite build >/dev/null
$Y electron-builder --mac dir --arm64 -c.mac.notarize=false -c.mac.identity=null >/dev/null
APP=$(ls -d dist/mac-arm64/*.app | head -1)
codesign --force --deep -s - "$APP" 2>/dev/null
pkill -f "$PWD/$APP/Contents/MacOS" 2>/dev/null || true
sleep 0.5
open -n "$APP" --args --http-api 18321 --cut-snapshot "$1" --config-dir "$2" ${3:+"$3"}
