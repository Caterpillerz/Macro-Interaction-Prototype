// The swimming game. This only describes how it looks; the game itself is in
// runner.js, which is shared with the flying game.

const GAME = {
  background: [47, 102, 219],
  maxSpeed: 8,                      // we travel slower while swimming
  verb: "swam",
  restartWord: "swim",
  obstacleName: "Obstacles",

  // the fish you control. The image has lots of empty space around the
  // fish, so it's drawn big and the hitbox is kept small.
  player: { src: "assets/fishguypng.png", size: 260, hitW: 40, hitH: 55 },

  // little fish swimming by in the background. These can't hit you.
  scenery: { src: "assets/Solofish.png", count: 20, maxSize: 150, aspect: 1, alpha: 1 },

  // sharks, whales and submarines. Hitting one ends the game.
  obstacles: [
    { src: "assets/SharkObstacle.png" },
    { src: "assets/WhaleObstacle.png" },
    { src: "assets/SubmarineObstacle.png" },
  ],
  obstacleSize: 300,

  hud: { box: [15, 24, 59, 170], text: [255, 255, 255] },
};
