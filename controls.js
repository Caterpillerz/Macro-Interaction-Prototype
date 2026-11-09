// Turns MediaPipe pose landmarks into one flight command, matching the
// pictures on the page (assets/leanLeft, leanRight, armsUp, armsDown):
//
//   Arms out like wings, level ..... "none"  (keep flying straight)
//   Lean left  (left wing lower) ... "left"  (strafe left)
//   Lean right (right wing lower) .. "right" (strafe right)
//   Both arms raised ............... "up"    (fly upward)
//   Both arms lowered .............. "down"  (dive downward)
//
// "Left" and "right" are from the player's point of view. The camera preview is
// mirrored, so your left arm appears on the left of the preview.
//
// Each arm is measured as an ANGLE from the shoulder: 0° = straight out to the
// side, +90° = straight up, -90° = straight down. Angles don't depend on how far
// you stand from the camera, and they work whether your arms go out to the
// sides or forward towards the camera (like the up / down pictures).
// If a wrist is out of the camera frame, the elbow is used instead.
//
// MediaPipe landmark indexes: 11/12 = left/right shoulder,
// 13/14 = left/right elbow, 15/16 = left/right wrist. x, y are 0..1.

const LEAN_ANGLE = 25;    // one arm this many degrees lower than the other = lean
const UP_ANGLE = 30;      // both arms this far above level = fly up
const DOWN_ANGLE = -35;   // both arms this far below level = dive

const seen = (p, min) => p && (p.visibility === undefined || p.visibility >= min);

// Angle of one arm in degrees, or null if we can't see the arm.
function armAngle(shoulder, elbow, wrist, w, h) {
  const hand = seen(wrist, 0.3) ? wrist : seen(elbow, 0.3) ? elbow : null;
  if (!hand) return null;
  const dx = Math.abs(hand.x - shoulder.x) * w;
  const up = (shoulder.y - hand.y) * h; // image y grows downward
  return (Math.atan2(up, dx) * 180) / Math.PI;
}

// Returns the command plus the two arm angles (handy for the on-screen readout).
export function readPose(landmarks, videoWidth = 640, videoHeight = 480) {
  const result = { command: "none", left: null, right: null };
  if (!landmarks) return result;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  if (!seen(leftShoulder, 0.5) || !seen(rightShoulder, 0.5)) return result;

  const left = armAngle(leftShoulder, landmarks[13], landmarks[15], videoWidth, videoHeight);
  const right = armAngle(rightShoulder, landmarks[14], landmarks[16], videoWidth, videoHeight);
  result.left = left;
  result.right = right;
  if (left === null || right === null) return result;

  // Leaning: one wing clearly lower than the other.
  if (right - left > LEAN_ANGLE) result.command = "left";
  else if (left - right > LEAN_ANGLE) result.command = "right";
  // Both arms together: raised = climb, lowered = dive.
  else if (left > UP_ANGLE && right > UP_ANGLE) result.command = "up";
  else if (left < DOWN_ANGLE && right < DOWN_ANGLE) result.command = "down";

  return result;
}

export function classifyPose(landmarks, videoWidth, videoHeight) {
  return readPose(landmarks, videoWidth, videoHeight).command;
}
