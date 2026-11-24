#!/usr/bin/env bash
cd "/home/dropt1m/DecompFlow" || exit 1
exec "/home/dropt1m/DecompFlow/node_modules/electron/dist/electron" "/home/dropt1m/DecompFlow/packages/desktop/dist/main/index.js" --no-sandbox --no-zygote --disable-gpu "$@"
