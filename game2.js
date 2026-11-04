// using this as a template to build the swimming

var particles = [];
var speed;
let fish;

// import { getMode } from "./script.js";

// i HAVE to name this preload() apparently.
// it forces all the images to be loaded first
// before the rest of the js / app can create instances
// of them in setup
async function preload() {
  fish = await loadImage("/assets/Solofish.png");
}

// creates the canvas where the game happens.
// The iframe places it in the desired spot.
function setup() {
  createCanvas(1200, 800);
  // for loop had 800 stars before
  // we do not need a whole lot of clouds
  for (var i = 0; i < 20; i++) {
    // load the image for the cloud, and then call the Cloud()
    // function to actually show the cloud image
    // cloud = await loadImage("/assets/Clouds.png");
    particles[i] = new Fish();
  }
}

// draws each star (or cloud or bubble or wave, etc in our case)
function draw() {
  // we should travel a bit slower while swimming
  speed = map(mouseX, 0, width, 0, 20);
  background(47, 102, 219);
  translate(width / 2, height / 2);
  for (var i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].show();
  }
}

function Fish() {
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
    var sx = map(this.x / this.z, 0, 1, 0, width);
    var sy = map(this.y / this.z, 0, 1, 0, height);

    // the z value controls the r because getting bigger
    // = moving forward in z. Making the last parameter
    // solves th giant clouds flashing us problem because
    // I think having the last param as 0 caused a division by 0
    // which made images infinitely big when they travel enough z??
    var r = map(this.z, 0, width, 256, 1);
    // stretching the clouds' width a little bit at spawn
    // because I think that makes them look better / more cloud-like
    image(fish, sx, sy, r, r);

    var px = map(this.x / this.pz, 0, 1, 0, width);
    var py = map(this.y / this.pz, 0, 1, 0, height);

    this.pz = this.z;
  }
}