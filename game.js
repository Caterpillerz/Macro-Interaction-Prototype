// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/17WoOqgXsRM
// using this as a template to build the flying

var stars = [];

var speed;

// creates the canvas where the game happens.
// The iframe places it in the desired spot.
function setup() {
  createCanvas(1200, 800);

  // just ignore this for now
//   let sky = createImage(600, 600);
//   sky.loadPixels();
//   for (let i = 0; i < sky.pixels.length; i += 1) {
//     sky.pixels[i] = 0;
//     sky.pixels[i + 1] = 0;
//     sky.pixels[i + 2] = 0;
//     sky.pixels[i + 3] = 255;
//   }
//   sky.updatePixels();
//   image(sky, 17, 17);

  for (var i = 0; i < 800; i++) {
    stars[i] = new Star();
  }
}

// draws each star (or cloud or bubble or wave, etc in our case)
function draw() {
  speed = map(mouseX, 0, width, 0, 50);
  background(157, 222, 250);
  translate(width / 2, height / 2);
  for (var i = 0; i < stars.length; i++) {
    stars[i].update();
    stars[i].show();
  }
}

function Star() {
  this.x = random(-width, width);
  this.y = random(-height, height);
  this.z = random(width);
  this.pz = this.z;

  this.update = function() {
    this.z = this.z - speed;
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
      this.pz = this.z;
    }
  }

  this.show = function() {
    fill(255);
    noStroke();

    var sx = map(this.x / this.z, 0, 1, 0, width);
    var sy = map(this.y / this.z, 0, 1, 0, height);

    var r = map(this.z, 0, width, 16, 0);
    ellipse(sx, sy, r, r);

    var px = map(this.x / this.pz, 0, 1, 0, width);
    var py = map(this.y / this.pz, 0, 1, 0, height);

    this.pz = this.z;

    stroke(255);
    line(px, py, sx, sy);

  }
}