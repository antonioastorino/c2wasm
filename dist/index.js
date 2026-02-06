let memory = undefined;
let g_keyPressed = 0;
let g_next_frame_cb = undefined;
let g_get_wall_rect = undefined;
let g_dt = 0;
let g_walls = [];
let g_window_height = 0;
let g_window_width = 0;
let g_fov_max_z = 0;
let g_fov_min_z = 0;
let g_num_of_walls = 0;
let g_player = undefined;
let g_canvas = undefined;
let g_beginView = undefined;
let g_overView = undefined;

const GameState = {
  BEGIN: 0,
  PAUSED: 1,
  RUNNING: 2,
  OVER: 3,
};

class Wall {
  wallDiv;
  obstacleDiv;
  constructor() {
    this.wallDiv = document.createElement("div");
    this.wallDiv.style.position = "absolute";
    this.wallDiv.style.borderStyle = "solid";
    this.obstacleDiv = document.createElement("div");
    this.obstacleDiv.style.position = "absolute";
    this.obstacleDiv.style.width = "100px";
    this.obstacleDiv.style.height = "100px";
    this.obstacleDiv.style.display = "none";
    this.wallDiv.appendChild(this.obstacleDiv);
    g_canvas.appendChild(this.wallDiv);
  }

  update(x, y, z, w, h, brightness, border_width) {
    const color = `rgb(${brightness}, ${brightness}, ${brightness})`;
    this.wallDiv.style.left = `${x}px`; // position.x
    this.wallDiv.style.bottom = `${y}px`; // position.y
    this.wallDiv.style.width = `${w}px`; // size.w
    this.wallDiv.style.height = `${h}px`; // size.h
    this.wallDiv.style.zIndex = Math.round((g_fov_max_z - z) * g_num_of_walls + 100);
    this.wallDiv.style.borderColor = color;
    this.wallDiv.style.borderWidth = `${border_width}px`;
  }

  updateObstacleRect(x, y, w, h) {
    this.obstacleDiv.style.left = `${x}px`;
    this.obstacleDiv.style.bottom = `${y}px`;
    this.obstacleDiv.style.width = `${w}px`;
    this.obstacleDiv.style.height = `${h}px`;
  }

  checkCollision() {
    const obstacleRect = this.obstacleDiv.getBoundingClientRect();
    const playerRect = g_player.getBoundingClientRect();
    if (
      obstacleRect.left < playerRect.right &&
      obstacleRect.right > playerRect.left &&
      obstacleRect.top < playerRect.bottom &&
      obstacleRect.bottom > playerRect.top
    ) {
      return true;
    }
    return false;
  }
}

const wasmFile = fetch("./src.wasm");

const jsLogCStr = (str_p) => {
  const buffer = new Uint8Array(memory.buffer, str_p);
  let string = "string: '";
  for (let i = 0; buffer[i] != 0; i++) {
    string += String.fromCharCode(buffer[i]);
  }
  string += "'";
  console.log(string);
};

const jsLogVector3D = (v_p) => {
  const buffer = new Float32Array(memory.buffer, v_p, 3);
  console.log(`vector3d: (${buffer[0]}, ${buffer[1]}, ${buffer[2]})`);
};

const jsLogInt = (v) => {
  console.log(`int: ${v}`);
};

const jsLogFloat = (v) => {
  console.log(`float: ${v}`);
};

function jsInitBomb(wallIndex) {
  g_walls[wallIndex].obstacleDiv.style.display = "block";
  g_walls[wallIndex].obstacleDiv.style.backgroundImage = "url(/assets/bomb.png)";
  g_walls[wallIndex].obstacleDiv.style.backgroundSize = "contain";
}

function jsInitCoin(wallIndex) {
  g_walls[wallIndex].obstacleDiv.style.display = "block";
  g_walls[wallIndex].obstacleDiv.style.backgroundImage = "url(/assets/spinning-coin.gif)";
  g_walls[wallIndex].obstacleDiv.style.backgroundSize = "contain";
}

function jsUpdateWall(wallIndex, wall_rect_p, brightness, border_width, obstacle_present, obstacle_rect_p) {
  const [x, y, z, w, h] = new Float32Array(memory.buffer, wall_rect_p, 5);
  if (obstacle_present == 1) {
    const [o_x, o_y, _, o_w, o_h] = new Float32Array(memory.buffer, obstacle_rect_p, 5);
    g_walls[wallIndex].updateObstacleRect(o_x, o_y, o_w, o_h);
  } else {
    g_walls[wallIndex].obstacleDiv.style.display = "none";
  }
  g_walls[wallIndex].update(x, y, z, w, h, brightness, border_width);
}

function jsSetEngineParams(params_p) {
  [g_window_height, g_window_width, g_fov_max_z, g_fov_min_z, g_num_of_walls] = new Int32Array(memory.buffer, params_p, 5);
}

let prevTimeStamp = 0;
function nextFrame(t_ms) {
  if (prevTimeStamp == 0) {
    prevTimeStamp = t_ms;
  }
  g_dt = (t_ms - prevTimeStamp) / 1000;
  if (g_dt > 0.05) {
    g_dt = 0.05;
  }
  prevTimeStamp = t_ms;
  const gameState = g_next_frame_cb();
  switch (gameState) {
    case GameState.BEGIN:
      g_beginView.style.display = "flex";
      break;
    case GameState.OVER:
      g_overView.style.display = "flex";
      break;
    default:
      g_beginView.style.display = "none";
      g_overView.style.display = "none";
  }
  requestAnimationFrame(nextFrame);
}

function applyWallStyle(wall) {
  wall.style.position = "absolute";
  wall.style.backgroundColor = "white";
}

function jsGetDt() {
  return g_dt;
}

function jsGetRandom() {
  return Math.random();
}

function jsCheckCollision(wallIndex) {
  return g_walls[wallIndex].checkCollision();
}

const importObj = {
  env: {
    jsLogVector3D,
    jsLogCStr,
    jsLogInt,
    jsLogFloat,
    jsGetDt,
    jsSetEngineParams,
    jsUpdateWall,
    jsGetRandom,
    jsInitBomb,
    jsInitCoin,
    jsCheckCollision,
  },
};

window.onload = () => {
  g_canvas = document.getElementById("canvas");
  const body = document.getElementById("body");
  g_beginView = document.getElementById("game-begin-view");
  g_overView = document.getElementById("game-over-view");
  g_player = document.getElementById("player");
  g_player.style.position = "absolute";
  g_player.style.backgroundImage = "url(./assets/player.png)";
  g_player.style.width = "100px";
  g_player.style.height = "100px";
  g_player.style.display = "block";
  g_player.style.left = "calc(50% - 50px)";
  g_player.style.bottom = "calc(50% - 50px)";
  g_player.style.zIndex = 99999;

  body.style.backgroundColor = "#101010";
  body.style.overflow = "hidden";
  g_canvas.style.position = "absolute";
  g_canvas.style.backgroundColor = "black";
  g_canvas.style.overflow = "hidden";
  g_beginView.style.position = "relative";
  g_beginView.style.width = "100%";
  g_beginView.style.height = "100%";
  g_beginView.style.backgroundColor = "blue";
  g_beginView.style.color = "white";
  g_beginView.style.justifyContent = "center";
  g_beginView.style.alignItems = "center";
  g_beginView.style.zIndex = 100000;
  g_beginView.style.fontSize = "xx-large";
  g_beginView.style.fontFamily = "monospace";

  g_overView.style.position = "relative";
  g_overView.style.width = "100%";
  g_overView.style.height = "100%";
  g_overView.style.backgroundColor = "red";
  g_overView.style.color = "white";
  g_overView.style.justifyContent = "center";
  g_overView.style.alignItems = "center";
  g_overView.style.zIndex = 100000;
  g_overView.style.fontSize = "xx-large";
  g_overView.style.fontFamily = "monospace";
  g_overView.style.textAlign = "center";
  WebAssembly.instantiateStreaming(wasmFile, importObj).then((result) => {
    memory = result.instance.exports.memory;
    result.instance.exports.engine_init();

    for (let i = 0; i < g_num_of_walls; i++) {
      g_walls.push(new Wall());
    }
    g_canvas.style.width = `${g_window_width}px`;
    g_canvas.style.height = `${g_window_height}px`;
    g_canvas.style.top = `calc(50% - ${g_window_height / 2}px)`;
    g_canvas.style.left = `calc(50% - ${g_window_width / 2}px)`;
    body.onkeydown = (ev) => {
      ev.preventDefault();
      result.instance.exports.engine_key_down(ev.keyCode);
    };
    body.onkeyup = (ev) => {
      ev.preventDefault();
      result.instance.exports.engine_key_up(ev.keyCode);
    };
    g_next_frame_cb = result.instance.exports.engine_update;
    requestAnimationFrame(nextFrame);
  });
};
