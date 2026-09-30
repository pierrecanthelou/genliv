# Tour 1 — Tech Lead — moteur-interprete it4

## RISQUE
Le vrai risque n'est pas l'absence de dégradation, c'est que la cascade prévue (suggestions → fenêtre → faits) n'atteigne jamais le bloc `EN SA POSSESSION` (narrateur.ts:187-201, 413-417), non borné et croissant avec l'inventaire du joueur (aucun retrait mécanique fréquent) : une fois ce bloc seul suffisant à dépasser `BUDGET_CARACTERES_NARRATEUR`, le refus redevient permanent malgré la cascade — l'AC « jamais un refus complet » se casse en fin de partie sur tout dossier riche en objets. Le code le documente déjà lui-même (narrateur.ts:177-180) sans le résoudre.

## OBJECTION
Le cadrage présente la fusion KR-261 comme l'assemblage d'UNE valeur numérique partagée entre R1 (`interprete.ts`, qui n'a AUJOURD'HUI aucune garde de budget — vérifié en lisant le fichier, et nommé comme dette explicite à `worker/index.ts:779`, « fermeture nommée : la constante unique de KR-261, it4 ») et R3 (`narrateur.ts`). Or `registres.ts` documente une doctrine opposée déjà livrée et testée : « un scalaire partagé ferait desserrer la garde du rôle ÉTROIT par la mesure du rôle LARGE, sans un seul test rouge » (KR-235). Fusionner en une seule VALEUR violerait ce précédent — ce qui doit fusionner est la FORMULE (le module), pas le chiffre : chaque rôle continue de dériver SON plafond.

## PROPOSITION
1. Un module/export partagé porte la formule KR-261 une fois, importé par les deux assembleurs, chacun calculant son propre plafond (R1 en gagne un pour la première fois, fermant la dette `worker/index.ts:779`).
2. Borner `EN SA POSSESSION` par `objets_possedes.slice(-K)` : `avecAjout` (deltas.ts) pousse en fin de liste, l'ordre d'acquisition existe DÉJÀ dans le tableau — aucun champ neuf, KR-013 tenu, exact précédent de `faitsPertinents` (memoire.ts).
3. Lire « suggestions retirées d'abord » comme un retrait côté CONSOMMATION (le champ optionnel déjà rendu par `suggestions.length > 0 &&` dans `PlayerInputBar.tsx` continue d'exister mais n'est plus affiché/compté en mode dégradé) plutôt qu'un changement de schéma `worker/`, pour ne pas rouvrir la surface auditée « Worker Route Parity » pour un gain marginal de jetons de sortie.

## VERDICT
Recevable sous réserve : lot unique `contrat`, à condition que (a) la fusion KR-261 reste « une formule, deux plafonds dérivés » et jamais un scalaire partagé entre R1/R3, et (b) le cap des possessions dérive l'ordre existant plutôt que d'introduire un champ stocké.

---

## ANNEXE

### Où vit réellement it4 — un seul lot, entièrement `brain/`

`PlayerInputBar.tsx` : `issueNarrateur.suggestions.length > 0 && (...)` — un tableau vide s'affiche déjà correctement, vide. Le `design_contract` de la spec dit explicitement que la dégradation est SILENCIEUSE, sans message. **Conséquence directe : aucun fichier de `src/features/play-mode/` n'a besoin d'être touché pour it4**, à condition que l'option 3 ci-dessus soit retenue (retrait côté consommation, pas côté schéma). Le walking skeleton de cette itération est donc une tranche verticale qui commence et finit dans `brain/` — pas de lot feature à créer artificiellement.

### Lot unique — `contrat`, seul, exécuté en entier avant tout autre travail

| # | Type | Fichiers (N=crée, R=remplace/modifie) |
|---|---|---|
| 1 | **contrat** | R `src/brain/copilote/contexte/narrateur.ts` — cascade de dégradation remplace le refus sec ; cap `EN SA POSSESSION` ; restructuration de la constante KR-261 |
| | | R `src/brain/copilote/contexte/interprete.ts` — gagne sa première garde de budget (fermeture de la dette nommée `worker/index.ts:779`) |
| | | R `src/brain/dossier/memoire.ts` — nouvelle fonction de sélection des possessions injectées, symétrique de `faitsPertinents` (même fichier, même doctrine de rétention) |
| | | N *(ou export existant réutilisé)* module portant la formule KR-261 partagée — un seul si le nom `BUDGET_CARACTERES_NARRATEUR` est conservé et simplement importé par `interprete.ts` |
| | | M `worker/index.ts` — `TAILLE_MAX_CORPS_IA` re-mesuré pour intégrer le budget désormais non-nul de `interprete`, commentaire de fermeture mis à jour |
| | | M `src/brain/copilote/contexte.test.ts`, `src/brain/dossier/memoire.test.ts`, `worker/frontiere.test.ts` — tests de la cascade, du cap, et de la nouvelle formule partagée |

Aucun autre lot. Rien dans `src/features/play-mode/`, `src/brain/CopiloteService.ts` reste inchangé (l'assembleur rend un `texte` dégradé au lieu de `{ok:false}` — le service ne voit pas la différence, aucun changement de signature côté `demander('narrateur', …)`).

### Contrat exposé

```ts
// ContexteNarrateur reste {ok:true, texte, ancres, condensation} | {ok:false, motif}
// ok:false ne doit plus jamais être atteint par 'trop-long' sauf au-delà d'un budget-plancher
// absolu (ex. le lieu courant seul dépasse déjà le budget) — cas dégénéré, pas la cascade normale.
assemblerNarrateur(dossier: Dossier, cible: CibleNarrateur): ContexteNarrateur

// R1 gagne le même contrat de refus que ses cinq voisins auteur : refus AVANT fetch,
// jamais de troncature.
assemblerInterprete(dossier, cible): ContexteInterprete // ok:false motif:'trop-long' devient atteignable
```

### Ordre imposé
Un seul lot : pas d'ordre à arbitrer entre lots. En interne : (1) formule partagée + cap possessions dans `memoire.ts`/`narrateur.ts` → (2) garde de budget sur `interprete.ts` → (3) re-mesure `worker/index.ts` → (4) tests. Ce lot doit être marqué `contrat` (il touche des registres et un service `brain/`) même s'il est seul.

### Ce qui casse dans l'existant si mal fait
- **KR-013** : la tentation la plus probable pour borner `EN SA POSSESSION` est de stocker un ordre ou un flag de dégradation sur `EtatSession` — veto immédiat. L'ordre existe déjà dans `objets_possedes` (append-only via `avecAjout`), donc le cap se calcule inline à chaque assemblage, jamais persisté.
- **KR-235 / doctrine `registres.ts`** : fusionner R1 et R3 sur une seule VALEUR de budget (au lieu d'une seule FORMULE à deux plafonds dérivés) romprait un précédent déjà livré et testé par `dossier-copilote` — veto principal si le lot part dans cette direction.
- **Isolation des features** : non menacée — tout reste dans `brain/`, aucun import ne traverse `features/`.

### Décisions prises en autonomie faute de spécification tranchée
- **Où vit le cap des possessions (`memoire.ts` vs `narrateur.ts`)** → proposé `memoire.ts`, qui possède déjà toute la politique de rétention → sinon, politique de rétention éclatée entre deux fichiers pour la même session.
- **Interprétation de « suggestions retirées d'abord »** → recommandé consommation (aucun changement worker) plutôt que schéma → sinon, un `CorpsDemande` étendu et une re-vérification complète de `worker/frontiere.test.ts`. **À trancher explicitement au tour 3, pas par moi seul.**
- **Nom/emplacement du module portant la formule KR-261 partagée** → recommandé réutiliser l'export existant `BUDGET_CARACTERES_NARRATEUR` → sinon, coût purement cosmétique.
