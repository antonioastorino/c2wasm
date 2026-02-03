let memory = undefined;
let g_keyPressed = 0;
let g_next_frame_cb = undefined;
let g_get_wall_rect = undefined;
let g_dt = 0;
let g_wall_pairs = [];
let g_window_height = 0;
let g_window_width = 0;
let g_fov_max_z = 0;
let g_fov_min_z = 0;
let g_num_of_walls = 0;

const WALL_SEPARATION = 300;

class WallPair {
  leftWall;
  rightWall;
  constructor(canvas) {
    this.leftWall = document.createElement("div");
    this.leftWall.style.position = "absolute";
    this.leftWall.style.backgroundColor = "white";
    this.rightWall = document.createElement("div");
    this.rightWall.style.position = "absolute";
    this.rightWall.style.backgroundColor = "white";

    canvas.appendChild(this.leftWall);
    canvas.appendChild(this.rightWall);
  }

  update(x, y, z, w, h, brightness) {
    console.log(brightness);
    const color = `rgb(${brightness}, ${brightness}, ${brightness})`;
    this.leftWall.style.left = `${x - WALL_SEPARATION / z}px`; // position.x
    this.leftWall.style.bottom = `${y}px`; // position.y
    this.leftWall.style.width = `${w}px`; // size.w
    this.leftWall.style.height = `${h}px`; // size.h
    this.leftWall.style.zIndex = Math.round(g_fov_max_z - z + 100);
    this.leftWall.style.backgroundColor = color;
    this.rightWall.style.left = `${x + WALL_SEPARATION / z}px`; // position.x
    this.rightWall.style.bottom = this.leftWall.style.bottom;
    this.rightWall.style.width = this.leftWall.style.width;
    this.rightWall.style.height = this.leftWall.style.height;
    this.rightWall.style.zIndex = this.leftWall.style.zIndex;
    this.rightWall.style.backgroundColor = color;
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

function jsUpdateWallRect(wallNumber, struct_p, brightness) {
  const [x, y, z, w, h] = new Float32Array(memory.buffer, struct_p, 5);
  g_wall_pairs[wallNumber].update(x, y, z, w, h, brightness);
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
  g_next_frame_cb();
  requestAnimationFrame(nextFrame);
}

function applyWallStyle(wall) {
  wall.style.position = "absolute";
  wall.style.backgroundColor = "white";
}

function jsGetDt() {
  return g_dt;
}

const importObj = {
  env: { jsLogVector3D, jsLogCStr, jsLogInt, jsLogFloat, jsGetDt, jsSetEngineParams, jsUpdateWallRect },
};

window.onload = () => {
  const canvas = document.getElementById("canvas");
  const body = document.getElementById("body");
  body.style.backgroundColor = "#101010";
  body.style.overflow = "hidden";
  canvas.style.position = "absolute";
  canvas.style.backgroundColor = "blue";

  WebAssembly.instantiateStreaming(wasmFile, importObj).then((result) => {
    memory = result.instance.exports.memory;
    result.instance.exports.engine_init();

    for (let i = 0; i < g_num_of_walls; i++) {
      g_wall_pairs.push(new WallPair(canvas));
    }
    canvas.style.width = `${g_window_width}px`;
    canvas.style.height = `${g_window_height}px`;
    canvas.style.top = `calc(50% - ${g_window_height / 2}px)`;
    canvas.style.left = `calc(50% - ${g_window_width / 2}px)`;
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
