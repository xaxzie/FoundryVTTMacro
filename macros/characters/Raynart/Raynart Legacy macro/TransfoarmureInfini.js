let targets = canvas.tokens.controlled;
let effect;


if (targets.length !== 0) {
    for (target of targets) {

        if(Sequencer.EffectManager.getEffects({ name: "fléau", object: target }).length !=0) {

           Sequencer.EffectManager.endEffects({ name: "fléau", object: target })
        }
        else {
new Sequence()

        .effect()
            .file("modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm")
            .atLocation(target)
            .scaleToObject(4)
            .center()
            .waitUntilFinished(-800)
            .fadeOut(1500)
            .scaleOut(0,2000)
            .rotateOut(150, 6000,{ease: "easeInSine"})
            .waitUntilFinished(-1800)


        .effect()
          .file("jb2a.divine_smite.caster.blueyellow")
          .atLocation(target)
          .scale(1.5)
          .waitUntilFinished(-1000)

      .effect()
          .file("jb2a.extras.tmfx.inpulse.circle.01.normal")
          .atLocation(target)
          .scale(2)
          .waitUntilFinished(-500)
    .effect()
          .file("jb2a.impact.ground_crack.01.orange")
          .atLocation(target)
          .scale(1)
          .waitUntilFinished(-5000)
          .belowTokens()
    .effect()
          .file("jb2a_patreon.ground_cracks.blue.01")
          .atLocation(target)
          .scale(1)
          .fadeIn(1000)
          .duration(10000)
          .fadeOut(500)
          .belowTokens()
    .effect()
          .file("jb2a.ground_cracks.orange.02")
          .atLocation(target)
          .scale(1)
          .fadeIn(1000)
          .duration(10000)
          .fadeOut(500)
          .belowTokens()
          .waitUntilFinished(-10000)
 .effect()
          .file("animated-spell-effects-cartoon.energy.01")
          .atLocation(target)
          .scale(1)
          .waitUntilFinished(-500)
 .effect()
          .file("animated-spell-effects-cartoon.fire.15")
          .atLocation(target)
          .scale(1)
          .waitUntilFinished(-500)
            .anchor({ x: 0.47, y: 0.5 })
            .filter("Glow", {distance: 10, outerStrength: 2, color: 0x70d2ff})

.effect()
          .file("animated-spell-effects-cartoon.fire.49")
          .atLocation(target)
          .scale(1)
          .waitUntilFinished(-1500)
          .filter("Glow", {distance: 10, outerStrength: 2, color: 0x70d2ff})
    .effect()
          .file("worlds/ft/TOKEN/Token%20anim%20v18.1_VP9.webm")
          .atLocation(target)
          .scaleToObject(1.3)
          .fadeIn(200)
          .name("fléau")
          .center()
          .attachTo(target)
          .persist()
          .fadeOut(1000)
          .waitUntilFinished(-1000)

    .effect()
          .file("animated-spell-effects-cartoon.fire.33")
          .atLocation(target)
          .scale(0.5)
            .anchor({ x: 0.47, y: 0.52 })

      .effect()
        .file("jb2a_patreon.template_circle.out_pulse.02.burst.tealyellow")
        .atLocation(target)
        .scale(0.6)

      .play()
        }
    }
}
else Sequencer.EffectManager.endEffects({ name: "fléau"})

//animated-spell-effects-cartoon.fire.15
//animated-spell-effects-cartoon.fire.37
//animated-spell-effects-cartoon.fire.118
//animated-spell-effects-cartoon.fire.49
