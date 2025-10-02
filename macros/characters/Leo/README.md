# Léo — Guerrier Électrifié

Ce répertoire contient les macros et exemples pour Léo, un guerrier spécialisé dans les attaques physiques amplifiées par la magie du métal/électricité.

## Aperçu du personnage

- Rôle : Guerrier / tank orienté mêlée
- Caractéristique principale : Physique (utilisée pour les jets d'attaque et la plupart des dégâts)
- Thème : Acier + Électricité — Léo insuffle de l'électricité dans sa hache pour augmenter les dégâts et produire des effets visuels spectaculaires

## Principes de jeu

- Les jets d'attaque utilisent la caractéristique `Physique` sous la forme `Physique d7` (ex. 4d7 + niveau) pour résoudre l'attaque.
- Les blessures réduisent la valeur effective de la caractéristique (système "blessures" présent dans les utilitaires).
- Les effets actifs (Active Effects) peuvent ajouter :
  - des bonus à la caractéristique (ex. `physique: { value: 1 }`)
  - des bonus de dégâts (ex. `damage: { value: 2 }`) — les sorts/directs en profitent
- Les bonus manuels (dans la boîte de dialogue) servent pour les objets, enchantements ou situations temporaires.

## Sorts / Macros inclus

- `electric-axe-strike.js` — Frappe Électrique

  - Description : Léo charge sa hache d'électricité et effectue une attaque corps-à-corps.
  - Coût : 1 mana (non focalisable)
  - Niveau : 1 (bonus de niveau pour l'attaque)
  - Dégâts : `1d9 + 4 + Physique + bonus manuels + bonus d'effets`
  - Type : Direct — bénéficie des bonuses `damage` des Active Effects
  - Animations : séquence Sequencer (charge sous le token, effet d'arme stretch vers la cible, impact, et aftermath de fissures au sol)

- `lightning-chain.js` — Chaîne d'Éclairs

  - Description : Léo libère une chaîne d'éclairs entrecoupée depuis sa hache.
  - Coût : 4 mana (focalisable — gratuit en Position Focus)
  - Niveau : 2 (sort de niveau 2)
  - Dégâts : `1d6 + 3 + Physique + bonus manuels + bonus d'effets` (sauf Serpent)
  - Type : Direct — exclut spécifiquement l'effet "Serpent" des bonus de dégâts
  - Animations : marqueur spectral bleu, chaîne en 8, foudre rouge finale

- `steel-lance.js` — Lance d'Acier
  - Description : Léo crée une lance d'acier qui transperce les ennemis dans une direction.
  - **Version Normale :**
    - Coût : 2 mana (focalisable — gratuit en Position Focus)
    - Zone : Ligne de 1 case de large
    - Dégâts : `1d4 + Physique + bonus manuels + bonus d'effets` (sauf Serpent)
  - **Version Électrique :**
    - Coût : 5 mana (focalisable — gratuit en Position Focus)
    - Zone : Ligne de 5 cases de large (touche les cibles adjacentes)
    - Dégâts : `1d4 + Physique + bonus manuels + bonus d'effets` (sauf Serpent)
  - Type : Direct — exclut spécifiquement l'effet "Serpent" des bonus de dégâts
  - Animations : javeline d'acier (gris) ou électrique (bleu), impacts et électricité statique

## Utilisation

1. Sélectionnez le token de Léo sur la carte.
2. Lancez la macro `electric-axe-strike.js` (ou utilisez le raccourci/macro placé dans la barre).
3. Configurez les bonus manuels (si besoin) dans la boîte de dialogue.
4. Utilisez l'outil Portal (si installé) pour choisir la cible sur la grille.
5. La macro jouera les animations et affichera le résultat combiné (attaque + dégâts) dans le chat.

## Personnalisation et réglages

- Le fichier `electric-axe-strike.js` contient un objet `SPELL_CONFIG` en tête du fichier.
  - Modifiez `animations` pour changer les fichiers JB2A / Sequencer.
  - `animations.aftermath` permet de régler le fichier, l'échelle, la couleur (tint), et la durée du motif de fissures.
  - `damageFormula`, `fixedDamageBonus` et `isDirect` peuvent être adaptés pour d'autres variantes de la frappe.
- Si vous préférez une couleur différente pour l'aftermath, changez `animations.aftermath.tint` (hex, ex. `#cc2200`).

## Bonnes pratiques et astuces

- Active Effects : utilisez des effets nommés et cohérents pour que la macro lise les flags `physique` et `damage` correctement.
- Blessures : appliquez le status effect `Blessures` (avec `statuscounter` flag) pour simuler la perte temporaire de Physique.
- Animations : Sequencer et JB2A offrent beaucoup d'options — testez les fichiers `.webm` pour obtenir le rendu voulu.

## Dépannage

- "Aucun acteur valide" : assurez-vous que le token du joueur est bien sélectionné.
- Portal ne répond pas : vérifiez que le module `Portal` est installé et activé.
- Pas d'animations : vérifiez que `Sequencer` et `JB2A` sont installés et que les chemins des fichiers sont valides.

## Contributions

- Suggestions d'amélioration, corrections d'animations et ajouts de sorts sont bienvenus. Ouvrez une issue ou proposez une PR.

---

README rédigé pour être cohérent avec les autres personnages (ex. `ora/README.md`). Pour une adaptation plus poussée (nouveaux sorts, conditions de dégâts critiques, ou FX spécifiques), dites-moi ce que vous voulez et je l'ajouterai.
