// the Zed LiveServer extension is not loading MediaPipe files correctly
// either switch to VS Code with its LiveServer extension... or, in Zed:
// change directory in Terminal to mp_example with "cd mp_example" command
// then, launch server with:
// "python3 -m http.server 8000" on macOS
// "python -m http.server 8000" on Windows
// then, open your browser window at 127.0.0.1:8000

// again, starting with professor guy's example code

var mode = "flying";
let body = document.querySelector("body");
let title = document.querySelector("h1");
let vidSect = document.getElementById("video-section");
let vidSectHeading = document.querySelector("#video-section > h2");
let vidSectControls = document.querySelector("#video-section > ul");
let flyGame = document.getElementById("game-section");
let swimGame = document.getElementById("game2-section");
let vidSectControlText = document.querySelectorAll("#video-section p");
let modeSect = document.getElementById("modes-section");
let modeSectHeading = document.querySelector("#modes-section > h2");
let buttons = document.querySelectorAll("button");
let flyAudio = document.getElementById("wind-sound");
let swimAudio = document.getElementById("water-sound");

import {
  FilesetResolver,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
import { readPose } from "./controls.js";

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
);

// PERFORMANCE: run pose detection on the graphics card (GPU). On the CPU it
// shares time with the game and slows it down. Falls back to the CPU if the
// browser can't use the GPU.
async function createPoseLandmarker(delegate) {
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "./models/pose_landmarker_full.task",
      delegate,
    },
    runningMode: "VIDEO"
  });
}

let poseLandmarker;
try {
  poseLandmarker = await createPoseLandmarker("GPU");
} catch (err) {
  console.warn("GPU pose detection unavailable, using CPU", err);
  poseLandmarker = await createPoseLandmarker("CPU");
}

const video = document.getElementById("video");
const gameFrame = document.querySelector("#game-section iframe");
const swimFrame = document.querySelector("#game2-section iframe");

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640,
      height: 480,
      facingMode: "user",
    },
    audio: false,
  });

  video.srcObject = stream;

  video.addEventListener("loadeddata", () => {
    renderLoop();
  });
}

let lastVideoTime = -1;

function renderLoop() {
  // Schedule the next frame first so one bad frame can't stop camera control.
  requestAnimationFrame(renderLoop);
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  try {
    const poseLandmarkerResults = poseLandmarker.detectForVideo(
      video,
      performance.now()
    );
    processPose(poseLandmarkerResults);
  } catch (err) {
    console.error("Pose frame failed", err);
  }
}

// A pose has to be seen for a few frames in a row before it counts. This stops
// the plane twitching when you move between poses.
const FRAMES_TO_CONFIRM = 3;
let candidate = "none";
let candidateFrames = 0;
let command = "none";

function processPose(results) {
  const hasPerson = results.landmarks.length > 0;
  const landmarks = hasPerson ? results.landmarks[0] : null;

  // Debug readouts — only written if the debug panel in index.html is enabled.
  // (Writing to missing elements used to crash this function every frame,
  // which stopped the pose from ever reaching the game.)
  const leftWristEl = document.getElementById("left-wrist");
  const rightWristEl = document.getElementById("right-wrist");
  if (hasPerson && leftWristEl && rightWristEl) {
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    leftWristEl.textContent =
      `Left wrist x: ${leftWrist.x.toFixed(2)} y: ${leftWrist.y.toFixed(2)}`;
    rightWristEl.textContent =
      `Right wrist x: ${rightWrist.x.toFixed(2)} y: ${rightWrist.y.toFixed(2)}`;
  }

  const pose = readPose(landmarks, video.videoWidth || 640, video.videoHeight || 480);
  const seen = pose.command;
  if (seen === candidate) {
    candidateFrames++;
  } else {
    candidate = seen;
    candidateFrames = 1;
  }
  if (candidateFrames >= FRAMES_TO_CONFIRM) command = candidate;

  const poseEl = document.getElementById("current-pose");
  if (poseEl) {
    const labels = {
      none: "Flying straight", left: "← Strafing left", right: "Strafing right →",
      up: "↑ Flying up", down: "↓ Diving down",
    };
    if (!hasPerson) poseEl.textContent = "Step into view of the camera";
    else if (pose.left === null || pose.right === null)
      poseEl.textContent = "Can't see both arms — step back a little";
    else poseEl.textContent = labels[command];
  }

  // call these functions to process the poses
  strafeLeft(command);
  strafeRight(command);
  flyUp(command);
  diveDown(command);

  // Tell the game what the pilot is doing. Sent every frame so the game can
  // tell the camera is still alive (it falls back to arrow keys otherwise).
  gameFrame.contentWindow.postMessage({ type: "pose", command }, "*");
  swimFrame.contentWindow.postMessage({ type: "pose", command }, "*");
}

// The game does the actual steering (see game.js). These hooks stay here in case
// you want to add something extra when a pose is recognised, such as a sound.
function strafeLeft(command) {
  if (command !== "left") return;
}

function strafeRight(command) {
  if (command !== "right") return;
}

function flyUp(command) {
  if (command !== "up") return;
}

function diveDown(command) {
  if (command !== "down") return;
}

// switch the website to flying mode
function switchToFlying() {
  let gust = document.getElementById("start-flying");

  title.textContent = "Flying Game";
  vidSectHeading.textContent = "Take to the skies!"
  modeSectHeading.textContent = "You're currently flying!"

  swimAudio.pause();
  gust.play();
  flyAudio.play();

  body.style.background = "linear-gradient(rgb(157, 222, 250) 85%, rgb(255, 168, 98) 99%)";
  title.style = "color: white; font-size: 72px; font-family: \"Knewave\", system-ui; font-weight: 400; font-style: normal; text-align: center; margin-top: 0;";
  vidSect.style.backgroundColor = "white";
  modeSect.style.backgroundColor = "white";
  vidSectHeading.style = "color: #ff7700;";
  modeSectHeading.style = "color: #ff7700;";
  for (let control of vidSectControlText) {
    control.style = "color: #ce2900;";
  }
  for (let b of buttons) {
    b.style = "color: #ce2900; background-color: #d5e0e6;";
  }
  flyGame.style.display = "block";
  swimGame.style.display = "none";

  mode = "flying";
}

// switch the website to swimming mode
function switchToSwimming() {
  let splash = document.getElementById("start-swimming");

  title.textContent = "Swimming Game";
  vidSectHeading.textContent = "Dive into the sea!"
  modeSectHeading.textContent = "You're currently swimming!"

  flyAudio.pause();
  splash.play();
  swimAudio.play();

  body.style.background = "linear-gradient(rgb(47, 102, 219) 85%, rgb(0, 54, 170) 99%";
  title.style = "color: #0f183b; font-size: 72px; font-family: \"Flavors\", cursive; font-weight: 400; font-style: normal; text-align: center; margin-top: 0;";
  vidSect.style.backgroundColor = "#0f183b";
  modeSect.style.backgroundColor = "#0f183b";
  vidSectHeading.style = "color: #44e65a";
  modeSectHeading.style = "color: #44e65a";
  for (let control of vidSectControlText) {
    control.style = "color: #20bb73";
  }
  for (let b of buttons) {
    b.style = "color: #20bb73; background-color: #232e5a;";
  }
  flyGame.style.display = "none";
  swimGame.style.display = "block";

  mode = "swimming";
}

export function getMode() {
  return mode;
}

startCamera();
switchToFlying();

// adding event listeners for the buttons
document.getElementById("swim-button").addEventListener("click", switchToSwimming);
document.getElementById("fly-button").addEventListener("click", switchToFlying);
