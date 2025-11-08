/**
 * Mécanique Armé - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Raynart enchante une arme avec des modifications mécaniques, offrant différents bonus.
 *
 * TYPES DE BUFFS :
 * - Allonge : +1 allonge, -1d7 au toucher (2 mana)
 * - Booster : +3 dégâts (1 mana)
 * - Bond : Permet de changer la trajectoire des projectiles (1 mana par utilisation)
 *
 * MÉCANIQUES :
 * - Ciblage : Portal pour sélectionner une cible alliée
 * - Durée : Jusqu'à annulation manuelle (utiliser endRaynartEffect.js)
 * - Coût variable selon le buff choisi
 * - Les buffs sont cumulables (peut appliquer plusieurs buffs sur une même cible)
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A (effets visuels)
 *
 * Usage : Sélectionner le token de Raynart, lancer la macro et choisir le type de buff
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Mécanique Armé",
        raynartActorId: "4bandVHr1d92RYuL",

        buffs: {
            allonge: {
                name: "Allonge Mécanique",
                displayName: "🔧 Allonge Mécanique",
                icon: "icons/weapons/polearms/spear-flared-blue.webp",
                description: "+1 Allonge, -1d7 au Toucher",
                manaCost: 2,
                color: "#2196f3",
                bgColor: "#e3f2fd",
                effectData: {
                    name: "Allonge Mécanique",
                    icon: "icons/weapons/polearms/spear-flared-blue.webp",
                    description: "Allonge augmentée de +1, Toucher réduit de -1d7",
                    flags: {
                        world: {
                            mechanicArmorType: "allonge",
                            mechanicArmorCaster: null, // Sera rempli avec l'ID de Raynart
                            allongeBonus: 1,
                            toucherMalus: -1
                        }
                    }
                }
            },
            booster: {
                name: "Booster de Dégâts",
                displayName: "⚡ Booster de Dégâts",
                icon: "icons/weapons/swords/sword-broad-serrated-blue.webp",
                description: "+3 Dégâts",
                manaCost: 1,
                color: "#ff9800",
                bgColor: "#fff3e0",
                effectData: {
                    name: "Booster de Dégâts",
                    icon: "icons/weapons/swords/sword-broad-serrated-blue.webp",
                    description: "Dégâts augmentés de +3",
                    flags: {
                        world: {
                            mechanicArmorType: "booster",
                            mechanicArmorCaster: null, // Sera rempli avec l'ID de Raynart
                            damage: 3 // Flag détecté par d'autres macros
                        }
                    }
                }
            },
            bond: {
                name: "Bond Projectile",
                displayName: "🎯 Bond Projectile",
                icon: "icons/magic/movement/trail-streak-zigzag-teal.webp",
                description: "Permet de changer la trajectoire d'un projectile (1 mana/utilisation)",
                manaCost: 1,
                color: "#00bcd4",
                bgColor: "#e0f7fa",
                effectData: {
                    name: "Bond Projectile",
                    icon: "icons/magic/movement/trail-streak-zigzag-teal.webp",
                    description: "Peut changer la trajectoire des projectiles (1 mana par utilisation pour Raynart)",
                    flags: {
                        world: {
                            mechanicArmorType: "bond",
                            mechanicArmorCaster: null, // Sera rempli avec l'ID de Raynart
                            bondActive: true
                        }
                    }
                }
            }
        },

        animation: {
            cast: "jb2a.aura_themed.01.inward.loop.metal.01.grey",
            buff: "jb2a.template_circle.aura.03.inward.004.loop.part02.blue",
            sound: null
        },

        targeting: {
            range: 150,
            color: "#2196f3",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        }
    };

    // ===== DETECT RAYNART =====
    let raynartToken = null;
    let raynartActor = null;

    for (const token of canvas.tokens.placeables) {
        if (token.actor?.id === SPELL_CONFIG.raynartActorId) {
            raynartToken = token;
            raynartActor = token.actor;
            break;
        }
    }

    if (!raynartToken || !raynartActor) {
        ui.notifications.error("❌ Impossible de trouver Raynart sur la scène !");
        return;
    }

    console.log(`[MecaniqueArme] Raynart detected: ${raynartActor.name}`);

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("❌ Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== DIALOG: SELECT BUFF TYPE =====
    const selectedBuff = await new Promise((resolve) => {
        const buffOptions = Object.entries(SPELL_CONFIG.buffs).map(([key, config]) => {
            return `
                <div class="buff-option" data-buff="${key}" style="
                    margin: 10px 0;
                    padding: 15px;
                    border: 2px solid ${config.color};
                    border-radius: 8px;
                    background: ${config.bgColor};
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${config.icon}" style="width: 48px; height: 48px; border-radius: 4px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; color: ${config.color};">${config.displayName}</h4>
                            <p style="margin: 4px 0 0 0; font-size: 0.9em; color: #666;">${config.description}</p>
                            <p style="margin: 4px 0 0 0; font-weight: bold; color: ${config.color};">Coût: ${config.manaCost} mana</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const dialogContent = `
            <style>
                .mecanique-arme-dialog { font-family: 'Signika', sans-serif; }
                .buff-option:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
            </style>
            <div class="mecanique-arme-dialog">
                <h3 style="color: #2196f3; margin-bottom: 15px;">🔧 Mécanique Armé</h3>
                <p style="margin-bottom: 15px;"><strong>Mage:</strong> ${raynartActor.name}</p>
                <p style="margin-bottom: 15px;">Choisissez le type d'enchantement mécanique :</p>
                ${buffOptions}
            </div>
        `;

        let resolved = false; // Empêche le double resolve

        const dialog = new Dialog({
            title: "🔧 Mécanique Armé",
            content: dialogContent,
            buttons: {
                cancel: {
                    label: "❌ Annuler",
                    callback: () => {
                        resolved = true;
                        resolve(null);
                    }
                }
            },
            default: "cancel",
            close: () => {
                if (!resolved) {
                    resolve(null);
                }
            },
            render: (html) => {
                html.find('.buff-option').click(function() {
                    const buffKey = $(this).data('buff');
                    resolved = true;
                    dialog.close();
                    resolve(buffKey);
                });
            }
        }, {
            width: 500
        });

        dialog.render(true);
    });

    if (!selectedBuff) {
        ui.notifications.info("❌ Mécanique Armé annulé.");
        return;
    }

    const buffConfig = SPELL_CONFIG.buffs[selectedBuff];
    console.log(`[MecaniqueArme] Selected buff: ${buffConfig.name}`);

    // ===== TARGETING: SELECT TARGET =====
    ui.notifications.info(`🎯 Sélectionnez la cible pour ${buffConfig.name}...`);

    const portalInstance = new Portal()
        .origin(raynartToken)
        .range(SPELL_CONFIG.targeting.range)
        .color(buffConfig.color)
        .texture(SPELL_CONFIG.targeting.texture);

    const portalResult = await portalInstance.pick();

    if (!portalResult || portalResult.cancelled) {
        ui.notifications.warn("❌ Ciblage annulé.");
        return;
    }

    // ===== FIND TARGET TOKEN =====
    function getTokenAtLocation(x, y) {
        const gridSize = canvas.grid.size;
        const tolerance = gridSize / 2;

        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
            const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
            );
            return tokenDistance <= tolerance;
        });

        if (tokensAtLocation.length === 0) return null;
        return tokensAtLocation[0];
    }

    const targetToken = getTokenAtLocation(portalResult.x, portalResult.y);

    if (!targetToken || !targetToken.actor) {
        ui.notifications.warn("❌ Aucune cible valide trouvée à cette position !");
        return;
    }

    const targetName = targetToken.name;
    console.log(`[MecaniqueArme] Target: ${targetName}`);

    // ===== ANIMATION =====
    const animationSequence = new Sequence()
        .effect()
            .file(SPELL_CONFIG.animation.cast)
            .scale(0.3)
            .atLocation(raynartToken)
            .waitUntilFinished(-500)
        .effect()
            .file(SPELL_CONFIG.animation.buff)
            .attachTo(targetToken)
            .scale(0.2)
            .fadeIn(300)
            .fadeOut(500)
            .tint(buffConfig.color)
            .duration(2000);

    await animationSequence.play();

    // ===== APPLY EFFECT TO TARGET =====
    const effectData = foundry.utils.duplicate(buffConfig.effectData);
    effectData.flags.world.mechanicArmorCaster = raynartActor.id;
    effectData.duration = { seconds: 86400 }; // 24h (jusqu'à annulation manuelle)

    try {
        if (targetToken.actor.isOwner) {
            await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[MecaniqueArme] Effect applied directly to ${targetName}`);
        } else if (globalThis.gmSocket) {
            const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);
            if (result?.success) {
                console.log(`[MecaniqueArme] Effect applied via GM socket to ${targetName}`);
            } else {
                throw new Error(result?.error || "GM socket failed");
            }
        } else {
            throw new Error("Cannot apply effect: not owner and no GM socket available");
        }
    } catch (error) {
        console.error("[MecaniqueArme] Error applying effect:", error);
        ui.notifications.error("❌ Impossible d'appliquer l'effet mécanique !");
        return;
    }

    // ===== CHAT MESSAGE =====
    const chatContent = `
        <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, ${buffConfig.bgColor}, #fff); padding: 15px; border-radius: 10px; border: 3px solid ${buffConfig.color};">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: ${buffConfig.color}; font-size: 1.5em;">
                    🔧 ${SPELL_CONFIG.name}
                </h3>
                <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                    <strong>Mage Mécanique:</strong> ${raynartActor.name}
                </div>
            </div>

            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${buffConfig.color};">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <img src="${buffConfig.icon}" style="width: 48px; height: 48px; border-radius: 4px;">
                    <div>
                        <h4 style="margin: 0; color: ${buffConfig.color};">${buffConfig.displayName}</h4>
                        <p style="margin: 4px 0 0 0; font-size: 0.9em; color: #666;">${buffConfig.description}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em; margin-top: 8px;">
                    <div><strong>Cible:</strong> ${targetName}</div>
                    <div><strong>Coût:</strong> ${buffConfig.manaCost} mana</div>
                </div>
            </div>

            <div style="background: #fff8e1; padding: 10px; border-radius: 6px; text-align: center; font-size: 0.85em; color: #666;">
                ℹ️ Utilisez "Terminer Effets de Raynart" pour annuler cet enchantement
            </div>
        </div>
    `;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: raynartToken }),
        content: chatContent,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    ui.notifications.info(`🔧 ${buffConfig.name} appliqué à ${targetName} ! (${buffConfig.manaCost} mana)`);

    console.log(`[MecaniqueArme] Spell complete - ${buffConfig.name} applied to ${targetName}`);

})();
