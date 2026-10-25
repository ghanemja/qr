#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
# Smoke-test, commit, rebase on origin/main, rebuild docs, push. Usage: tools/dev/ship.sh "message"
# (Append the session's attribution trailer lines to the message yourself if your setup needs them.)
set -e
cd "$(dirname "$0")/../.."
node tools/dev/smoke.cjs 2>&1 | tail -5
git add -A src docs data tools
git commit -qm "$1"
git fetch -q origin main
git pull --rebase -q origin main
npm run build >/dev/null 2>&1
git add -A docs
git diff --cached --quiet || git commit -qm "Rebuild docs"
for i in 1 2 3 4; do git push -q -u origin main && break || { sleep $((2**i)); git pull --rebase -q origin main; }; done
git log --oneline -1
