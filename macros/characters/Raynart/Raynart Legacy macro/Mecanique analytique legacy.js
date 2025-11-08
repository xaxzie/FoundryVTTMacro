let targets = canvas.tokens.controlled;
let effect;

if (targets.length !== 0) {
    for (target of targets) {

        if(Sequencer.EffectManager.getEffects({ name: "Analyse", object: target }).length !=0) {

           Sequencer.EffectManager.endEffects({ name: "Analyse", object: target })
        }
        else {
            new Sequence()
        .effect()
        .file("jb2a_patreon.extras.tmfx.outpulse.circle.02.slow")
        .atLocation(target)
        .scale(10)
        .waitUntilFinished(-1000)
     .effect()
        .file("jb2a.divine_smite.caster.blueyellow")
        .atLocation(target)
        .scale(2)
        .waitUntilFinished(-600)
/*     .effect()
        .file("modules/Animation%20Custom/Raynart/cercle%20analytic_VP9.webm")
        .fadeIn(1500, {ease: "easeOutCubic", delay: 500})
        .fadeOut(500)
        .scaleIn(20, 2500, {ease: "easeInOutCubic"})
        .scaleOut(0.33, 1500,{ease: "easeInOutCubic"})
        .atLocation(t)
        .scaleToObject(1)
        .duration(5000)
        .waitUntilFinished(-500)
*/

    .effect()
        .file("modules/Animation%20Custom/Raynart/cercle%20analytic_VP9.webm")
        //.fadeIn(1500, {ease: "easeOutCubic", delay: 500})
        .fadeIn(3000)
        .fadeOut(3000)
        .scaleToObject(3)
        .scaleIn(0.3, 4000, {ease: "easeInOutCubic"})
        .scaleOut(2, 3000, {ease: "easeInCirc"})
        .atLocation(target)
        .waitUntilFinished(-12000)
        .belowTokens()
        .attachTo(target)
        .persist()
        .name("Analyse")
    .effect()
        .file("jb2a_patreon.template_circle.out_pulse.02.burst.tealyellow")
        .atLocation(target)
        .scale(0.6)
        .play()

        }
    }


}
else Sequencer.EffectManager.endEffects({ name: "Analyse"})
