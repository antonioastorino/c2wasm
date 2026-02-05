# DivGame - a "canvasless" game

The game is displayed in an HTMLDivElement, a.k.a. `div`. Every element in the game is an HTML element. The logic is implemented in C, compiled to WebAssembly using `clang`.

<img width="1026" height="623" alt="game" src="https://github.com/user-attachments/assets/06949c8b-adc8-4148-ac88-68347a7c75de" />


## How to build
Run
```
./tools/build-and-run.sh
```
This will compile the game and start a minimal HTTP server listening to port 8001.

Open a Web browser at `localhost:8001`

## How to play
- 'g' (for GO) to start
- 'w' to move UP
- 's' to move DOWN
- 'a' to move LEFT
- 'd' to move RIGHT
- 'p' to pause

## Resources
- [Player image](https://www.hiclipart.com/free-transparent-background-png-clipart-dswvq)
- [Bomb png](https://www.pngegg.com/en/png-khodp)
- [Coin gif](https://pixabay.com/gifs/coin-money-currency-coins-gold-20749/)
- [Compiling C to WASM](https://depth-first.com/articles/2019/10/16/compiling-c-to-webassembly-and-running-it-without-emscripten/)

## Compiler/linker errors on MacOS
When I tried to compile a `C` file to `wasm`, I couldn't get it to work, although I had followed all the possible guidelines I could find (e.g., the one above).
By adding the `-v` flag to the `clang` command, I was able to detect the lack of `wasm-ld` linker in my system.
Luckily, I found a comment on [starckoverflow](https://stackoverflow.com/questions/57322431/wasm-ld-not-found-after-performing-brew-install-wabt) stating that `wasm-ld` is shipped as part of `lld`.
