## Note d'ouverture PM, moteur-fins it1 (tour 1)

**RISQUE**
Deux tranches sous une phrase. Le « ou » (fin / mort) recouvre deux chemins de détection disjoints, que la spec acte elle-même (`resolved_decisions`). Et la mort s'arrête déjà : `hero-mort` laisse `combat` ouvert (`sessionCombat.ts:68`), `executerCommande` refuse tout en `combat_en_cours`, EcranCombat affiche « PARTIE TERMINÉE ». Reste à livrer un écran dédié, pas un arrêt.

**OBJECTION**
1. **Phrase non verticale (veto).** La valeur pour l'auteur, c'est sa prose, `Fin.texte` verbatim. La mort est un texte moteur constant.
2. **Le critère 4 se contredit.** `partie_terminee` tombe « après combat_en_cours », donc la mort répond `combat_en_cours`, jamais `partie_terminee`.
3. **Le critère 6 renverse du livré n°13.** Couper R5 au round `hero-mort` contredit `commentateur.ts:136`, qui écrit `'hero-mort': 'le héros est mort'` exprès. À rouvrir nommément, pas en passant.
4. **« Rejouer »** est au squelette sans critère et préempte it3. Un bouton à graine fraîche, réécrit ensuite, est un doublon.
5. **Garde R2/R3/R4.** Le squelette dit « R2/R3/R4 », le critère et le brief disent « R3 ».

**PROPOSITION**
It1 : « à la fin, l'auteur lit, mot pour mot, la fin qu'il a écrite quand sa condition devient vraie ».
- **4 lots :**
  1. `finAtteinte` + refus `partie_terminee`.
  2. Extraction d'EcranPartie (mécanique, sans changement de comportement).
  3. EcranFin + aiguillage.
  4. Garde unique dans `useTourDeJeu`, avant R2, qui coupe les trois rôles.
- **7 critères :** 1, 2, 3, 4 (fin seule), 6 réécrit en « aucun rôle IA appelé », 7, 8.
- **Ensuite :** it2 mort (avec arbitrage explicite sur R5), it3 reprise, it4 graine + Rejouer (sacrifiable).
- **Hors périmètre it1 :**
  - écran de mort ;
  - R5 ;
  - Rejouer ;
  - persistance ;
  - fin vraie dès l'ouverture ou avant la création du héros ;
  - tout champ nouveau.

**VERDICT**
**Veto sur le périmètre écrit** (phrase à « ou », donc pas une tranche verticale). **Levé si it1 = fin seule.**

---

## Décisions prises en autonomie faute de spécification

- Mort dans it1 ou non → **exclue, reportée en it2, placée avant la reprise** → si l'inverse : it1 passe à 5 lots et 9 critères, et embarque le conflit R5 avec n°13.
- Garde `partie_terminee` couvre-t-elle la mort ? → **fin seulement** (la mort est déjà refusée par `combat_en_cours`, livré en n°13) → si l'inverse : inverser l'ordre des gardes et réécrire un test de refus livré.
- Garde de `useTourDeJeu` : R3 seul ou les trois rôles ? → **une garde unique avant R2, qui coupe R2/R3/R4** → si l'inverse : une CarteJet peut s'afficher sur une partie finie.
- « Rejouer » en it1 → **exclu, reporté en it4** (la sémantique « même graine » s'y décide) → si l'inverse : un bouton à graine fraîche, à réécrire.
- Extraction d'EcranPartie → **acceptée comme lot mécanique** (le plafond de 400 lignes est un signal, pas un blocage ; le blocage est à 800) → si refusée : EcranPartie monte à environ 420 lignes, dette KR-112 reportée.
- Fin vraie dès l'ouverture, avant la création du héros → **hors périmètre** (l'aiguillage se place après la garde 7) → si l'inverse : un cas limite en plus dans le squelette.
- Lot `contrat` → **non requis** (`RefusCommande` vit dans `commandes.ts`, `Fin.texte` existe déjà) → si c'est faux : un lot `contrat` seul, en premier.

**Constats hors périmètre :**
- Le roadmap (ligne n° 15) renvoie à `.claude/raffinage/moteur-fins-cadrage/`, qui n'existe pas sur le disque. La spec est le seul index.
- Le test `combatParConsole.test.tsx` voit sa sortie changer (une fin devient vraie à la clôture du premier combat) : c'est une adaptation de test, pas du périmètre en plus.
