// The flying game. This only describes how it looks; the game itself is in
// runner.js, which is shared with the swimming game.

const GAME = {
  background: [157, 222, 250],
  maxSpeed: 15,                      // top speed (mouse at the far right)
  verb: "flew",
  restartWord: "fly",
  obstacleName: "Obstacles",

  // the bird you control, at the bottom of the screen
  player: { src: "assets/Mainbird.png", size: 150, hitW: 55, hitH: 50 },

  // see-through clouds in the background. These can't hit you.
  scenery: { src: "assets/Clouds.png", count: 40, maxSize: 256, aspect: 1.75, alpha: 0.6 },

  // dark storm clouds, planes and rockets fly at you. Hitting one ends the game.
  // The plane and rocket pictures have empty space around them, so they're
  // drawn a bit bigger (scale) and only the middle part counts as a hit
  // (hitW / hitH = fraction of the picture's width / height from the centre).
  obstacles: [
    { src: "assets/Clouds.png", tint: [120, 125, 140] },
    { src: "assets/planeobstacle.png", scale: 1.4, hitW: 0.33, hitH: 0.22 },
    { src: "assets/rocketobstacle.png", scale: 1.4, hitW: 0.2, hitH: 0.32 },
  ],
  obstacleSize: 260,                 // how big obstacles get when they reach you

  hud: { box: [255, 255, 255, 190], text: [206, 41, 0] },
};
