let targets = canvas.tokens.controlled;
let effect;

let params =
[{
    filterType: "shadow",
    blur: 1,
    quality: 5,
    distance: 0.2,
    alpha: 1.,
    padding: 100,
    color: 0xff0000,
    animated:
    {
        blur:
        {
           active: true,
           loopDuration: 500,
           animType: "syncCosOscillation",
           val1: 2,
           val2: 4
        },
     }
},
{
    filterType: "electric",
    color: 0xff0000,
    time: 0,
    blend: 2,
    intensity: 8,
    animated :
    {
      time :
      {
        active: true,
        speed: 0.0015,
        animType: "move"
      }
    }
}];

if (targets.length !== 0) {
    for (target of targets) {

        if(Sequencer.EffectManager.getEffects({ name: "GodSpeed", object: target }).length !=0) {

           Sequencer.EffectManager.endEffects({ name: "GodSpeed", object: target })
           await TokenMagic.deleteFiltersOnSelected();
        }
        else {
            new Sequence()
    .effect()
        .file("jb2a_patreon.static_electricity.02.dark_red")
        //.fadeIn(1000)
        .fadeOut(3000)
        .scaleToObject(2)
        .atLocation(target)
        .attachTo(target)
        .persist()
        .name("GodSpeed")
        .play()

await TokenMagic.addFiltersOnSelected(params);
        }
    }



}
else Sequencer.EffectManager.endEffects({ name: "GodSpeed"})
