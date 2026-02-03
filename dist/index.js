let memory = undefined;
let g_keyPressed = 0;
let g_next_frame_cb = undefined;
let g_get_wall_rect = undefined;
let g_dt = 0;
let g_walls = [];

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

function jsUpdateWallRect(struct_p) {
  const buffer = new Float32Array(memory.buffer, struct_p, 5);
  g_walls[0].style.left = `${buffer[0]}px`; // position.x
  g_walls[0].style.bottom = `${buffer[1]}px`; // position.y
  g_walls[0].style.width = `${buffer[3]}px`; // size.w
  g_walls[0].style.height = `${buffer[4]}px`; // size.h
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
  env: { jsLogVector3D, jsLogCStr, jsLogInt, jsLogFloat, jsGetDt, jsUpdateWallRect },
};

window.onload = () => {
  const canvas = document.getElementById("canvas");
  const body = document.getElementById("body");
  canvas.style.position = "absolute";
  canvas.style.top = "calc(50% - 300px)";
  canvas.style.left = "calc(50% - 400px)";
  canvas.style.backgroundColor = "blue";
  g_walls.push(document.createElement("div"));
  applyWallStyle(g_walls[0]);
  canvas.appendChild(g_walls[0]);
  WebAssembly.instantiateStreaming(wasmFile, importObj).then((result) => {
    memory = result.instance.exports.memory;
    canvas.style.width = `${result.instance.exports.engine_get_window_width()}px`;
    canvas.style.height = `${result.instance.exports.engine_get_window_height()}px`;
    body.onkeydown = (ev) => {
      ev.preventDefault();
      result.instance.exports.engine_key_down(ev.keyCode);
    };
    body.onkeyup = (ev) => {
      ev.preventDefault();
      result.instance.exports.engine_key_up(ev.keyCode);
    };
    result.instance.exports.engine_init();
    g_next_frame_cb = result.instance.exports.engine_update;
    requestAnimationFrame(nextFrame);
  });
};
