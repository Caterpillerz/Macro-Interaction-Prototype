function move() {
    let world = document.querySelector("#world-container > img");

    world.addEventListener("keydown", function() {
        while (event.key == "ArrowLeft") {
            console.log(event.key)
            world.left -= 100;
        }
    })
}