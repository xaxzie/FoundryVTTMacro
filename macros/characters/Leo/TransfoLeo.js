// This macro contains a small tutorial : how to work with non-infinite loops and halfCosOscillation animType

// Click once to transform your token and again to revert to the original shape (thank to halfCosOscillation)

// There is 9 types of metamorphose
// 1 - Simple transition
// 2 - Dreamy
// 3 - Twist
// 4 - Water drop
// 5 - TV Noise
// 6 - Morphing
// 7 - Take off/Put on you disguise!
// 8 - Wind
// 9 - Hologram

// change the type here
let transitionType = 4;

// change the target image here
let targetImagePath = "worlds/ft/TOKEN/Edgy_leo_token.png";

// declare filter id (think to change the id for personal macros)
// each filterId should be unique to a player or gm to prevent collisions
// example : "brutusChthulhuPolymorph"
let polymorphFilterId = "myPolymorph";

// we put our code into an async function that will be called later
let polymorphFunc = async function () {

    for (const token of canvas.tokens.controlled) {
        let params;

        // Is the filter already activated on the placeable ?
        if (token.TMFXhasFilterId(polymorphFilterId)) {

            // Yes. So we update the type in the general section and loops + active in the progress animated section, to activate the animation for just one loop.
            // "type" to allow you to change the animation type
            // "active" to say at Token Magic : "Hey filter! It's time to work again!"
            // "loops" so that Token Magic can know how many loops it needs to schedule for the animation.
            // Each animation loop decreases "loops" by one. When "loops" reach 0, "active" becomes "false" and the animation will be dormant again.
            // Thank to the halfCosOscillation, a loop brings the value of the property from val1 to val2. A second loop is needed to bring val2 to val1. This is useful for monitoring progress with back and forth movements.
            params =
                [{
                    filterType: "polymorph",
                    filterId: polymorphFilterId,
                    type: transitionType,
                    animated:
                    {
                        progress:
                        {
                            active: true,
                            loops: 1
                        }
                    }
                }];

        } else {

            // No. So we create the entirety of the filter
            params =
                [{
                    filterType: "polymorph",
                    filterId: polymorphFilterId,
                    type: transitionType,
                    padding: 70,
                    magnify: 1,
                    imagePath: targetImagePath,
                    animated:
                    {
                        progress:
                        {
                            active: true,
                            animType: "halfCosOscillation",
                            val1: 0,
                            val2: 100,
                            loops: 1,
                            loopDuration: 1000
                        }
                    }
                }];
        }

        // all functions that add, update or delete filters are asynchronous
        // if you are in a loop AND/OR you chain these functions, it is MANDATORY to await them
        // otherwise, data persistence may not works.
        // this is the reason why we use an async function (we cant use await in a non-async function)
        // avoid awaiting in a forEach loop, use "for" or "for/of" loop.
        await token.TMFXaddUpdateFilters(params);
    }

};

// polymorph async function call
polymorphFunc();
