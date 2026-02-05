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

class Wall {
  wallDiv;
  obstacleDiv;
  constructor(canvas) {
    this.wallDiv = document.createElement("div");
    this.wallDiv.style.position = "absolute";
    this.wallDiv.style.borderStyle = "solid";
    this.obstacleDiv = document.createElement("div");
    this.obstacleDiv.style.position = "relative";
    this.obstacleDiv.style.backgroundColor = "red";
    this.obstacleDiv.style.width = "100px";
    this.obstacleDiv.style.height = "100px";
    this.obstacleDiv.style.display = "none";
    this.wallDiv.appendChild(this.obstacleDiv);
    canvas.appendChild(this.wallDiv);
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

  updateObstacle(x, y, w, h) {
    this.obstacleDiv.style.left = `${x}px`;
    this.obstacleDiv.style.top = `${y}px`;
    this.obstacleDiv.style.width = `${w}px`;
    this.obstacleDiv.style.height = `${h}px`;
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

function jsUpdateWall(wallNumber, wall_rect_p, brightness, border_width, obstacle_present, obstacle_rect_p) {
  const [x, y, z, w, h] = new Float32Array(memory.buffer, wall_rect_p, 5);
  if (obstacle_present == 1) {
    const [o_x, o_y, _, o_w, o_h] = new Float32Array(memory.buffer, obstacle_rect_p, 5);
    g_walls[wallNumber].obstacleDiv.style.display = "block";
    g_walls[wallNumber].updateObstacle(o_x, o_y, o_w, o_h);
  } else {
    g_walls[wallNumber].obstacleDiv.style.display = "none";
  }
  g_walls[wallNumber].update(x, y, z, w, h, brightness, border_width);
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

function jsGetRandom() {
  return Math.random();
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
  },
};

window.onload = () => {
  const canvas = document.getElementById("canvas");
  const body = document.getElementById("body");
  const player = document.getElementById("player");
  player.style.position = "absolute";
  player.style.backgroundImage = "url(./assets/player.png)";
  player.style.width = "100px";
  player.style.height = "100px";
  player.style.display = "block";
  player.style.left = "calc(50% - 50px)";
  player.style.bottom = "calc(50% - 50px)";
  player.style.zIndex = 100000;

  body.style.backgroundColor = "#101010";
  body.style.overflow = "hidden";
  canvas.style.position = "absolute";
  canvas.style.backgroundColor = "black";
  canvas.style.overflow = "hidden";

  WebAssembly.instantiateStreaming(wasmFile, importObj).then((result) => {
    memory = result.instance.exports.memory;
    result.instance.exports.engine_init();

    for (let i = 0; i < g_num_of_walls; i++) {
      g_walls.push(new Wall(canvas));
    }
    canvas.style.width = `${g_window_width}px`;
    canvas.style.height = `${g_window_height}px`;
    canvas.style.top = `calc(50% - ${g_window_height / 2}px)`;
    canvas.style.left = `calc(50% - ${g_window_width / 2}px)`;
    body.onkeydown = (ev) => {
      console.log(ev.keyCode);
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
