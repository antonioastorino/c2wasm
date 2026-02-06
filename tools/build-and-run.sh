#!/usr/bin/env zsh
set -eu

clang \
    -O3 \
    -Wall \
    -Wextra \
    -Werror \
    -pedantic \
    -std=c2x \
    --target=wasm32 \
    --no-standard-libraries \
    -Wl,--no-entry \
    -Wl,--allow-undefined \
    -Wl,--export=engine_update \
    -Wl,--export=engine_init \
    -Wl,--export=engine_key_down \
    -Wl,--export=engine_key_up \
    -o dist/src.wasm \
    src.c

cd dist
wasm2wat src.wasm -o src.wat
python3 -m http.server 8001
