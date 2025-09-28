// SIMPLEST METHOD - Just get the stance (using name)
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find(e => ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase()))?.name || 'No stance'

// SIMPLEST METHOD - Just get the injuries (using name)
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find(e => e.name?.toLowerCase().includes('blessures'))?.flags?.statuscounter?.value || 0

    // Full version (stance + injuries)
    (() => { const t = canvas.tokens.controlled[0]; if (!t?.document?.actor?.effects?.contents?.length) return "No token/effects"; const e = t.document.actor.effects.contents; const stanceEffect = e.find(f => { const label = (f.label || f.name || '').toLowerCase(); return label === 'focus' || label === 'offensif' || label === 'defensif'; }); const stance = stanceEffect ? stanceEffect.label || stanceEffect.name : 'None'; const injury = e.find(f => (f.label || f.name || '').toLowerCase().includes('blessures')); const stacks = injury?.flags?.statuscounter?.value || 0; return `${t.name}: Stance=${stance}, Injuries=${stacks ? stacks + ' stacks (-' + stacks + ' dice)' : 'None'}`; })()
