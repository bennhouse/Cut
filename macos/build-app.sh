#!/bin/zsh
# Builds Cut for Apple Silicon: electron-vite, then electron-builder (an app folder, not signed),
# copies it to build/Cut.app, signs it with the local identity in signing/ (macos/setup-signing.sh
# creates it), installs it in /Applications (replacing the copy there) and launches it.
#   macos/build-app.sh               build, sign, install
#   NO_INSTALL=1 macos/build-app.sh  only build/Cut.app
#
# Needs Node (the repository's own Yarn in .yarn/releases is used). The first run installs the
# dependencies and downloads the FFmpeg build LosslessCut bundles (script/downloadFfmpeg.ts).
# ADHOC=1 signs ad hoc instead of with the local identity.
set -euo pipefail
cd "$(dirname "$0")/.."

Y=(node .yarn/releases/yarn-4.18.0.cjs)
[[ -d node_modules ]] || $Y install
[[ -x ffmpeg/darwin-arm64/ffmpeg && -x ffmpeg/darwin-arm64/ffprobe ]] || node script/downloadFfmpeg.ts darwin-arm64

swift macos/make-symbols.swift "$PWD" >/dev/null # the SF Symbols of the interface
$Y electron-vite build >/dev/null
rm -rf dist/mac-arm64
$Y electron-builder --mac dir --arm64 -c.mac.notarize=false -c.mac.identity=null >/dev/null

APP="build/Cut.app"
rm -rf "$APP"; mkdir -p build
ditto dist/mac-arm64/Cut.app "$APP"

ID="local.cut.Cut"
KC="$PWD/signing/cut.keychain-db"
# The helpers, frameworks and ffmpeg inside are signed with the app (--deep).
if [[ "${ADHOC:-0}" == "1" ]]; then
    codesign --force --deep --sign - --identifier "$ID" "$APP"
elif [[ -f "$KC" ]]; then
    security unlock-keychain -p cut "$KC"
    OLD=("${(@f)$(security list-keychains -d user | sed 's/^ *"//; s/"$//')}")
    security list-keychains -d user -s "${OLD[@]}" "$KC"
    codesign --force --deep --keychain "$KC" --sign "Cut Local Signing" --identifier "$ID" "$APP" || STATUS=$?
    security list-keychains -d user -s "${OLD[@]}"
    [[ -z "${STATUS:-}" ]] || exit $STATUS
else
    echo "error: signing/cut.keychain-db not found. Run macos/setup-signing.sh, or ADHOC=1." >&2
    exit 1
fi
codesign --verify --deep --strict "$APP"

if [[ "${NO_INSTALL:-0}" != "1" ]]; then
    osascript -e 'tell application id "local.cut.Cut" to quit' 2>/dev/null || true
    rm -rf "/Applications/Cut.app"
    ditto "$APP" "/Applications/Cut.app"
    open "/Applications/Cut.app"
    echo "Installed and launched /Applications/Cut.app"
else
    echo "Built $PWD/$APP"
fi
