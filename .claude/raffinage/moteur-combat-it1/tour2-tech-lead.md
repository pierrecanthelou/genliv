# Tech Lead — moteur-combat it1 — Tour 2

## Réponses aux objections croisées

**PM, 4 lots.** Son « moteur » se coupe : l'évaluateur est evaluate.ts (brain, lot 1), le rejeu est rencontre.ts (player, lot 2). Séparer moteur et écran ne révèle aucun parallélisme. D2-bis n'est pas un lot.

**QA, D2-bis.** Ni bug ni règle écrite. combatEngine.ts:239-244 rend l'égalité transparente. Ordre KR-130 : une phrase dans REGLES-PLAY, puis une sonde de caractérisation.

**UX.** Primitives dans brain/components/. Recommande aucune extension. Le tabindex itinérant change la tabulation de 23 appelants (non additif). `wide` fait d'IconButton un autre composant. Bouton local à EcranCombat sur tokens.

**QA, moteurSansIA.** Balayage dérivé du disque : aucune extension. Ni /ia/ ni CopiloteService dans le lot 2.

**NIA.** Le lot 1 couvre sa liste, plus evaluate.ts, monstre.ts et la fixture saturée.

## Statut de mes objections

- Évaluateur : maintenue, portée corrigée. Le garde evaluate.test.ts:490 ne balaie que brain/dossier/.
- destinations.ts : maintenue, sur le nom seul.
- pending* : levée par BilanCombat.
- **Verdict : approuvé, aucun veto.**

## ANNEXE — Lots révisés

### Lot 1 — contrat-combat (brain/, seul, en premier)

**R** : session.ts, evaluate.ts, commandes.ts, alea.ts, sessionDestinations.ts, __fixtures__/session-saturee.ts, index.ts + tests associés, sessionCouverture.test.ts (si rougi).
**N** : monstre.ts, monstre.test.ts.

Signatures : EtatCombat, BilanCombat, IssueCombat, resoudreRencontre, jouerPosture, cloreCombat, evenementARencontrer, RefusCommande += 'combat_en_cours', DomaineAlea += 'combat', monstreDeLaReference.

### Lot 2 — feature-combat (player/ + play-mode/, après lot 1)

**N** : rencontre.ts, rencontre.test.ts, EcranCombat.tsx, EcranCombat.test.tsx.
**R** : EcranPartie.tsx (+ test), BandeauHeros.tsx (+ test), useTourDeJeu.ts (+ test), jalonAuJournal.test.tsx, verrouDeTour.test.tsx, combatEngine.test.ts (sonde D2-bis), docs/REGLES-PLAY.md.
**D** : useCombat.ts, CombatScreen.tsx.
**Non touchés** : combatEngine.ts, capacityEffects.ts, moteurSansIA.test.ts, brain/components/*.
