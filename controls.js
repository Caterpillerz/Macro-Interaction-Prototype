// Turns MediaPipe pose landmarks into one flight command.
//
//   Arms down / relaxed ............ "none"  (keep flying straight)
//   LEFT hand raised, right down ... "left"  (strafe left)
//   RIGHT hand raised, left down ... "right" (strafe right)
//   BOTH hands raised .............. "up"    (fly upward)
//   Arms out to the sides (T-pose) . "down"  (dive downward)
//
// "Left" and "right" are from the player's point of view. The camera preview is
// mirrored in index.html, so your left hand appears on the left of the preview.
//
// MediaPipe landmark indexes: 11 = left shoulder, 12 = right shoulder,
// 15 = left wrist, 16 = right wrist. x and y are 0..1 across the image.

const HAND_UP = 0.6;      // wrist this far above the shoulder counts as "raised"
const HAND_LOW = 0.3;     // the other wrist must be below this to count as "not raised"
const LEVEL = 0.5;        // wrist within this of shoulder height counts as "level"
const REACH = 1.1;        // wrist this far out from the shoulder counts as "arm out"

// All distances are measured in shoulder widths, so the result does not depend
// on how far you stand from the camera.
export function classifyPose(landmarks, videoWidth = 640, videoHeight = 480) {
  if (!landmarks) return "none";

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  const seen = (p, min) => p && (p.visibility === undefined || p.visibility >= min);
  if (!seen(leftShoulder, 0.5) || !seen(rightShoulder, 0.5)) return "none";
  if (!seen(leftWrist, 0.4) || !seen(rightWrist, 0.4)) return "none";

  const shoulderWidth = Math.hypot(
    (leftShoulder.x - rightShoulder.x) * videoWidth,
    (leftShoulder.y - rightShoulder.y) * videoHeight,
  );
  if (shoulderWidth < 10) return "none";

  // positive = wrist is above the shoulder (image y grows downward)
  const lift = (wrist, shoulder) =>
    ((shoulder.y - wrist.y) * videoHeight) / shoulderWidth;
  const reach = (wrist, shoulder) =>
    (Math.abs(wrist.x - shoulder.x) * videoWidth) / shoulderWidth;

  const left = lift(leftWrist, leftShoulder);
  const right = lift(rightWrist, rightShoulder);
  const leftUp = left > HAND_UP;
  const rightUp = right > HAND_UP;

  if (leftUp && rightUp) return "up";
  if (leftUp && right < HAND_LOW) return "left";
  if (rightUp && left < HAND_LOW) return "right";

  const bothLevel = Math.abs(left) < LEVEL && Math.abs(right) < LEVEL;
  const bothOut =
    reach(leftWrist, leftShoulder) > REACH && reach(rightWrist, rightShoulder) > REACH;
  if (bothLevel && bothOut) return "down";

  return "none";
}
