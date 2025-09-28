/**
 * Custom Status Effects Override Module
 * Registers core.statusEffects as a world setting to enable persistent customization
 */

// Register the core.statusEffects setting during Foundry initialization
Hooks.once('init', () => {
    console.log('Custom Status Effects Override | Registering core.statusEffects setting');

    // Get current CONFIG.statusEffects as the default (this will be Foundry's built-in defaults)
    const defaultStatusEffects = CONFIG.statusEffects || [];

    // Register the setting that makes status effects persistent
    game.settings.register('core', 'statusEffects', {
        name: 'CUSTOM_STATUS_EFFECTS.SettingName',
        hint: 'CUSTOM_STATUS_EFFECTS.SettingHint',
        scope: 'world',
        config: false, // Hidden from the settings UI - use your macro to manage
        type: Array,
        default: defaultStatusEffects,
        onChange: (value) => {
            console.log('Custom Status Effects Override | Status effects changed, updating CONFIG');
            CONFIG.statusEffects = value;
            // Refresh Token HUD for all users
            Hooks.callAll('renderTokenHUD');
        }
    });
});

// Apply the saved status effects after the setting is loaded
Hooks.once('ready', () => {
    console.log('Custom Status Effects Override | Applying saved status effects');

    try {
        // Get the saved status effects from world settings
        const savedEffects = game.settings.get('core', 'statusEffects');
        if (Array.isArray(savedEffects) && savedEffects.length > 0) {
            CONFIG.statusEffects = savedEffects;
            console.log(`Custom Status Effects Override | Applied ${savedEffects.length} saved status effects`);
        } else {
            console.log('Custom Status Effects Override | No saved effects found, using defaults');
        }
    } catch (error) {
        console.warn('Custom Status Effects Override | Error loading saved effects:', error);
    }

    // Refresh Token HUD to show current effects
    Hooks.callAll('renderTokenHUD');
});

console.log('Custom Status Effects Override | Module loaded');
