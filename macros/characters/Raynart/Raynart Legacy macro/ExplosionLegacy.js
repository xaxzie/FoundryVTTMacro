let tokenD = canvas.tokens.controlled;

tokenD.forEach(t =>

    new Sequence()

    .effect()
        .file("modules/jb2a_patreon/Library/1st_Level/Cure_Wounds/CureWounds_01_Red_200x200.webm")
        .atLocation(t)
        .scale({
            x:1,
            y:1
        })
        .anchor({
            x:0.5,
            y:0.5
        })

    .wait(1000)
     .effect()
        .file("modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_02_Circle_Fast_500.webm")
        .atLocation(t)
        .scale({
            x:1,
            y:1
        })
        .anchor({
            x:0.5,
            y:0.5
        })

    .wait(300)
     .effect()
        .file("modules/jb2a_patreon/Library/2nd_Level/Shatter/Shatter_01_Red_400x400.webm")
        .atLocation(t)
        .scale({
            x:1,
            y:1
        })
        .anchor({
            x:0.5,
            y:0.5
        })

    .wait(1300)
     .effect()
        .file("modules/jb2a_patreon/Library/Generic/Explosion/Explosion_02_Orange_400x400.webm")
        .atLocation(t)
        .scale({
            x:1.5,
            y:1.5
        })
        .anchor({
            x:0.5,
            y:0.5
        })
        .effect()
        .file("jb2a.fireball.explosion.orange")
        .atLocation(t)
        .scale(0.8)
        .anchor({
            x:0.5,
            y:0.5
        })
.play()
);
new Sequence()
.sound("modules/Animation Custom/Boomv2.ogg")
.play();
