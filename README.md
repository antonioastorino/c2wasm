# DivGame - a "canvasless" game

The game is displayed in an HTMLDivElement, a.k.a. `div`. Every element in the game is an HTML element. The logic is implemented in C, compiled to WebAssembly.

## How to build
Run
```
./tools/build-and-run.sh
```
This will compile the game and start a minimal HTTP server listening to port 8001.

Open a Web browser at `localhost:8001`

## How to play
- 'w' to move UP
- 's' to move DOWN
- 'a' to move LEFT
- 'd' to move RIGHT

## Resources
- [Player image](https://www.hiclipart.com/free-transparent-background-png-clipart-dswvq/download?width=100)
