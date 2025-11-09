let tokenD = canvas.tokens.controlled
let t = Array.from(game.user.targets)[0]

tokenD.forEach(vel =>

    new Sequence()
    .effect()
        .file("jb2a_patreon.energy_strands.range.standard.blue")
        .atLocation(vel)
        .stretchTo(t)
        .filter("Glow", { color: 0xffaa00, outerStrength: 1 })
        //.scaleToObject(2)
        .fadeIn(200)
        .belowTokens(true)
        .fadeOut(100)
        .waitUntilFinished(-1500)
    .effect()
        .file("jb2a_patreon.shield.03.loop.blue")
        .atLocation(t)
        .scaleToObject(2)
        .opacity(0.8)
        .fadeIn(200)
        .fadeOut(1000)
        .filter("Glow", { color: 0xffaa00, outerStrength: 2 })
        //0xFF0000
        .waitUntilFinished(-1500)
    .effect()
        .file("jb2a_patreon.shield.03.outro_explode.blue")
        .atLocation(t)
        .fadeIn(500)
        .opacity(0.8)
        .scaleToObject(2)
        .filter("Glow", { color: 0xFF0000, outerStrength: 1 })


.play()
);
