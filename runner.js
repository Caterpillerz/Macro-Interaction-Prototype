// The game engine shared by the flying game (game.js) and the swimming game
// (game2.js). Those files only describe what the game looks like (the GAME
// object); everything that moves happens here.
//
// Started from Daniel Shiffman's starfield: http://codingtra.in
// https://youtu.be/17WoOqgXsRM

// How positions work: anything at depth z is drawn at  offset * Z_HIT / z.
// So an offset is "how many pixels from the middle it will be when it reaches
// you". Far away things bunch up in the middle (the horizon) and spread out
// as they get close.
const Z_HIT = 60;           // depth where obstacles reach the player
const STEER_SPEED = 24;      // how fast steering moves you
const CAM_LIMIT = 900;      // how far you can wander from the middle
let PLAYER_Y;               // player sits near the bottom (set in setup)

var particles = [];
var obstacles = [];
var speed = 0;

// images, loaded in preload and shrunk in setup
let playerImg, playerHitImg, sceneryImg;
let obstacleImgs = [];

// where the player is. Steering changes this and the world slides past.
let camX = 0;
let camY = 0;

// pose command from the camera page (script.js); arrow keys if no camera
let poseCommand = "none";
let lastPoseTime = -Infinity;
let command = "none";

// game state
let gameOver = false;
let distance = 0;
let dodged = 0;
let framesUntilNextObstacle = 90;
let restartHold = 0;        // frames the player has held "arms up" on game over

// i HAVE to name this preload() apparently.
// it forces all the images to be loaded first
// before the rest of the js / app can create instances
// of them in setup
function preload() {
  playerImg = loadImage(GAME.player.src);
  sceneryImg = loadImage(GAME.scenery.src);
  obstacleImgs = GAME.obstacles.map(function (o) { return loadImage(o.src); });
}

function setup() {
  // PERFORMANCE: draw at normal resolution even on retina screens.
  // Otherwise the canvas is 2400x1600 and every frame costs 4x as much.
  pixelDensity(1);
  createCanvas(1200, 800);
  PLAYER_Y = height / 2 - 140;

  // PERFORMANCE: the art files are 2000-3000px wide but are never drawn
  // bigger than a few hundred pixels. Shrinking them once here is much
  // cheaper than shrinking them again every frame.
  // Tints are also "baked" in once here, because tint() is very slow in p5.
  playerImg = shrink(playerImg, GAME.player.size * 2);
  playerHitImg = bakeTint(playerImg, [255, 110, 110]);
  sceneryImg = shrink(sceneryImg, 512);
  obstacleImgs = obstacleImgs.map(function (img, i) {
    let small = shrink(img, 600);
    let t = GAME.obstacles[i].tint;
    return t ? bakeTint(small, t) : small;
  });

  for (var i = 0; i < GAME.scenery.count; i++) {
    particles[i] = new Scenery();
  }
}

// shrink in halves so the outlines stay smooth instead of jagged
function shrink(img, targetWidth) {
  while (img.width / 2 >= targetWidth) {
    img.resize(floor(img.width / 2), 0);
  }
  if (img.width > targetWidth) img.resize(targetWidth, 0);
  return img;
}

// make a recoloured copy of an image once, instead of tinting every frame
function bakeTint(img, rgb) {
  let g = createGraphics(img.width, img.height);
  g.pixelDensity(1);
  g.tint(rgb[0], rgb[1], rgb[2]);
  g.image(img, 0, 0);
  return g;
}

// PERFORMANCE: both games live on the page at once, but only one is shown.
// The hidden one skips its frames instead of drawing a game nobody can see.
function isHidden() {
  let frame = window.frameElement;
  return frame !== null && frame.offsetParent === null;
}

function draw() {
  if (isHidden()) return;

  background(GAME.background[0], GAME.background[1], GAME.background[2]);

  if (!gameOver) {
    speed = map(constrain(mouseX, 0, width), 0, width, 0, GAME.maxSpeed);
    steer();
    distance += speed / 10;
  } else {
    speed = 0;
    checkPoseRestart();
  }

  push();
  translate(width / 2, height / 2);
  drawingContext.globalAlpha = GAME.scenery.alpha;
  for (var i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].show();
  }
  drawingContext.globalAlpha = 1;
  updateObstacles();
  drawWarnings();             // optional, see the WARNING BOXES section
  drawPlayer();
  pop();

  drawHud();
  if (gameOver) drawGameOver();
}

// ---------- steering ----------

function steer() {
  command = poseCommand;
  // no pose for half a second = camera isn't running, use the keyboard
  if (performance.now() - lastPoseTime > 500) {
    command = "none";
    if (keyIsDown(LEFT_ARROW)) command = "left";
    else if (keyIsDown(RIGHT_ARROW)) command = "right";
    else if (keyIsDown(UP_ARROW)) command = "up";
    else if (keyIsDown(DOWN_ARROW)) command = "down";
  }

  if (command === "left") camX -= STEER_SPEED;
  if (command === "right") camX += STEER_SPEED;
  if (command === "up") camY -= STEER_SPEED;
  if (command === "down") camY += STEER_SPEED;
  camX = constrain(camX, -CAM_LIMIT, CAM_LIMIT);
  camY = constrain(camY, -CAM_LIMIT, CAM_LIMIT);
}

// the camera page sends { type: "pose", command } every frame
window.addEventListener("message", function (event) {
  if (event.data && event.data.type === "pose") {
    poseCommand = event.data.command;
    lastPoseTime = performance.now();
  }
});

// ---------- the player ----------

function drawPlayer() {
  push();
  // lean into turns, and bob a little so it feels alive
  let tilt = 0;
  if (command === "left") tilt = -0.25;
  if (command === "right") tilt = 0.25;
  let bob = gameOver ? 0 : sin(frameCount * 0.15) * 4;
  translate(0, PLAYER_Y + bob);
  rotate(tilt);
  imageMode(CENTER);
  let size = GAME.player.size;
  let img = gameOver ? playerHitImg : playerImg;
  image(img, 0, 0, size, size * (img.height / img.width));
  pop();
}

// ---------- obstacles ----------

function updateObstacles() {
  if (!gameOver && speed > 1) {
    framesUntilNextObstacle--;
    if (framesUntilNextObstacle <= 0) {
      obstacles.push(new Obstacle());
      framesUntilNextObstacle = floor(random(60, 120));
    }
  }

  for (let o of obstacles) o.update();
  obstacles = obstacles.filter(function (o) { return !o.done; });

  // draw the far ones first so close ones end up on top
  obstacles.sort(function (a, b) { return b.z - a.z; });
  for (let o of obstacles) o.show();
}

function Obstacle() {
  let pick = floor(random(obstacleImgs.length));
  this.img = obstacleImgs[pick];
  this.cfg = GAME.obstacles[pick];
  this.aspect = this.img.width / this.img.height;
  // optional per-obstacle settings (see game.js): scale = draw bigger/smaller,
  // hitW / hitH = how much of the image counts as solid (for pictures with
  // lots of empty space around them)
  this.scale = this.cfg.scale || 1;
  this.hitW = this.cfg.hitW || 0.4;
  this.hitH = this.cfg.hitH || 0.35;
  // aim it near the player so it's a real threat
  this.x = camX + random(-350, 350);
  this.y = camY + PLAYER_Y + random(-200, 200);
  this.z = width;
  this.flip = random() < 0.5;
  this.done = false;

  // where it is on screen at depth z (defaults to where it is right now)
  this.screenPos = function (z) {
    if (z === undefined) z = this.z;
    let h = map(z, 0, width, GAME.obstacleSize, 8) * this.scale;
    return {
      sx: ((this.x - camX) * Z_HIT) / z,
      sy: ((this.y - camY) * Z_HIT) / z,
      w: h * this.aspect,
      h: h,
    };
  };

  this.update = function () {
    this.z -= speed;
    if (this.z < Z_HIT) {
      // check exactly where it is as it reaches the player (it may have moved
      // a little past this point during the frame)
      this.z = Z_HIT;
      if (this.willHit()) gameOver = true;
      else dodged++;
      this.done = true;
    }
  };

  // if the player stays where they are, will this hit them when it arrives?
  this.willHit = function () {
    let p = this.screenPos(Z_HIT);
    return (
      abs(p.sx) < p.w * this.hitW + GAME.player.hitW &&
      abs(p.sy - PLAYER_Y) < p.h * this.hitH + GAME.player.hitH
    );
  };

  this.show = function () {
    let p = this.screenPos();
    push();
    imageMode(CENTER);
    translate(p.sx, p.sy);
    if (this.flip) scale(-1, 1);
    image(this.img, 0, 0, p.w, p.h);
    pop();
  };
}

// =====================================================================
// WARNING BOXES (optional)
// Shows where each obstacle will pass when it reaches you: a red box means
// it will hit you if you don't move, white dashes mean you're safe. A red
// ring also pulses around the player while something is about to hit.
//
// To remove this feature: delete this whole section and the
// drawWarnings() line in draw(). Nothing else uses it.
// =====================================================================

const WARN_Z = 1000;        // boxes fade in once obstacles are this close

function drawWarnings() {
  let danger = false;
  for (let o of obstacles) {
    if (o.z > WARN_Z) continue;
    drawWarningBox(o);
    if (o.willHit()) danger = true;
  }
  if (danger && !gameOver) drawDangerRing();
}

// outline of the obstacle's solid part, at the spot where it will reach you
function drawWarningBox(o) {
  let p = o.screenPos(Z_HIT);
  let fade = map(o.z, WARN_Z, Z_HIT, 0, 1);
  push();
  rectMode(CENTER);
  if (o.willHit()) {
    fill(255, 40, 40, 60 * fade);
    stroke(255, 40, 40, 255 * fade);
    strokeWeight(4);
  } else {
    noFill();
    stroke(255, 255, 255, 160 * fade);
    strokeWeight(2);
    drawingContext.setLineDash([12, 10]);
  }
  rect(p.sx, p.sy, p.w * o.hitW * 2, p.h * o.hitH * 2, 20);
  drawingContext.setLineDash([]);
  pop();
}

// pulsing red ring around the player = something is going to hit you, move!
function drawDangerRing() {
  let pulse = (sin(frameCount * 0.4) + 1) / 2;
  let bob = sin(frameCount * 0.15) * 4;   // follows the player's bob
  push();
  noFill();
  stroke(255, 50, 50, 140 + pulse * 115);
  strokeWeight(5);
  ellipse(0, PLAYER_Y + bob,
    GAME.player.hitW * 2 + 50 + pulse * 14,
    GAME.player.hitH * 2 + 50 + pulse * 14);
  pop();
}

// =====================================================================
// END OF WARNING BOXES
// =====================================================================

// ---------- background scenery (clouds / fish) ----------

function Scenery() {
  this.x = random(-width, width);
  this.y = random(-height, height);
  this.z = random(width);

  this.update = function() {
    this.z = this.z - speed;
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
    }
  }

  this.show = function() {
    var sx = (this.x * width - camX * Z_HIT) / this.z;
    var sy = (this.y * height - camY * Z_HIT) / this.z;
    // the z value controls the size: closer = bigger. The smallest size is
    // 1 (not 0) so things don't blow up to infinite size up close.
    var r = map(this.z, 0, width, GAME.scenery.maxSize, 1);
    image(sceneryImg, sx, sy, r * GAME.scenery.aspect, r);
  }
}

// ---------- score + game over ----------

function drawHud() {
  noStroke();
  fill(GAME.hud.box);
  rect(16, 16, 250, 70, 10);
  fill(GAME.hud.text);
  textSize(22);
  textAlign(LEFT, TOP);
  text("Distance: " + floor(distance), 30, 26);
  text(GAME.obstacleName + " dodged: " + dodged, 30, 54);
}

function drawGameOver() {
  noStroke();
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(72);
  text("GAME OVER", width / 2, height / 2 - 70);
  textSize(28);
  text("You " + GAME.verb + " " + floor(distance) + " and dodged " + dodged +
    " " + GAME.obstacleName.toLowerCase(), width / 2, height / 2);
  textSize(22);
  text("Raise both arms, click, or press space to " + GAME.restartWord + " again",
    width / 2, height / 2 + 50);
  if (restartHold > 0) {
    // progress bar for the "hold arms up" restart
    fill(255, 255, 255, 80);
    rect(width / 2 - 150, height / 2 + 90, 300, 12, 6);
    fill(255);
    rect(width / 2 - 150, height / 2 + 90, 300 * (restartHold / 45), 12, 6);
  }
}

// hold both arms up for a moment to restart (so it doesn't restart instantly
// if you crashed while moving upward)
function checkPoseRestart() {
  let cameraOn = performance.now() - lastPoseTime < 500;
  if (cameraOn && poseCommand === "up") {
    restartHold++;
    if (restartHold >= 45) restartGame();
  } else {
    restartHold = 0;
  }
}

function restartGame() {
  gameOver = false;
  obstacles = [];
  distance = 0;
  dodged = 0;
  camX = 0;
  camY = 0;
  restartHold = 0;
  framesUntilNextObstacle = 90;
}

function mousePressed() {
  if (gameOver) restartGame();
}

function keyPressed() {
  if (gameOver && key === " ") restartGame();
}
