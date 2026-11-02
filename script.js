// the Zed LiveServer extension is not loading MediaPipe files correctly
// either switch to VS Code with its LiveServer extension... or, in Zed:
// change directory in Terminal to mp_example with "cd mp_example" command
// then, launch server with:
// "python3 -m http.server 8000" on macOS
// "python -m http.server 8000" on Windows
// then, open your browser window at 127.0.0.1:8000

// again, starting with professor guy's example code

import {
  FilesetResolver,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";
import { classifyPose } from "./controls.js";

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
);

const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "./models/pose_landmarker_full.task",
  },
  runningMode: "VIDEO"
});

const video = document.getElementById("video");
const gameFrame = document.querySelector("#game-section iframe");

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
  if (video.currentTime !== lastVideoTime) {
    const timeStamp = performance.now();
    const poseLandmarkerResults = poseLandmarker.detectForVideo(
      video,
      timeStamp
    );
    processPose(poseLandmarkerResults);
    lastVideoTime = video.currentTime;
  }
  requestAnimationFrame(renderLoop);
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

  if (hasPerson) {
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    document.getElementById("left-wrist").textContent =
      `Left wrist x: ${leftWrist.x.toFixed(2)} y: ${leftWrist.y.toFixed(2)}`;
    document.getElementById("right-wrist").textContent =
      `Right wrist x: ${rightWrist.x.toFixed(2)} y: ${rightWrist.y.toFixed(2)}`;
  }

  const seen = classifyPose(landmarks, video.videoWidth || 640, video.videoHeight || 480);
  if (seen === candidate) {
    candidateFrames++;
  } else {
    candidate = seen;
    candidateFrames = 1;
  }
  if (candidateFrames >= FRAMES_TO_CONFIRM) command = candidate;

  document.getElementById("current-pose").textContent = `Current pose: ${command}`;

  // call these functions to process the poses
  strafeLeft(command);
  strafeRight(command);
  flyUp(command);
  diveDown(command);

  // Tell the game what the pilot is doing. Sent every frame so the game can
  // tell the camera is still alive (it falls back to arrow keys otherwise).
  gameFrame.contentWindow.postMessage({ type: "pose", command }, "*");
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
  let body = document.querySelector("body");
  let flyAudio = document.getElementById("wind-sound");
  let swimAudio = document.getElementById("water-sound");
  body.style.background = "linear-gradient(rgb(157, 222, 250) 85%, rgb(255, 168, 98) 99%)";
  swimAudio.pause();
  flyAudio.play();
}

// switch the website to swimming mode
function switchToSwimming() {
  let body = document.querySelector("body");
  let swimAudio = document.getElementById("water-sound");
  let flyAudio = document.getElementById("wind-sound");
  body.style.background = "linear-gradient(rgb(47, 102, 219) 85%, rgb(0, 54, 170) 99%";
  flyAudio.pause();
  swimAudio.play();
}

startCamera();
switchToFlying();

// adding event listeners for the buttons
document.getElementById("swim-button").addEventListener("click", switchToSwimming);
document.getElementById("fly-button").addEventListener("click", switchToFlying);
