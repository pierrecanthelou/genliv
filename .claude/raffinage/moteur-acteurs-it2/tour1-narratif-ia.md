# Raffinage `moteur-acteurs` it2 — Tour 1 — Narratif & IA

## RISQUE
Trois fuites possibles, et le test 2×2 du critère n°4 n'en voit aucune :
- un PNJ qui « sait » une chose dont l'auteur n'a pas écrit le contenu, et qui l'invente ;
- un `every()` qui ouvre par vacuité un savoir sans porte ;
- un objet retiré parce que le modèle a choisi de parler.

## OBJECTION
1. **La ligne `S<n>` décrite n'a pas de contenu.** `certitude` et `revele_comment` disent *comment* le dire, pas *quoi*. Le contenu, c'est `Indice.formulation_joueur` (audience `ia`, `destinations.ts:254-257`). Mesuré sur la fixture : `indice.trace-du-guet` (le savoir de Tobin) n'en a pas. Un savoir dont l'indice n'a pas de contenu reste absent du contexte.
2. **Vacuité.** Un savoir sans porte « ne sera jamais dévoilé » (`types.ts:543`, et le message auteur de `validate.ts:701`). Or `porteOuverte` (`atteignabilite.ts:282`) rend `true` sur ce cas et ignore `confiance_min`/`jet` : c'est la polarité inverse. Elle ne doit jamais être réutilisée au runtime.
3. **`consomme: true` : veto.** Retirer l'objet parce que R4 a choisi de révéler, c'est le modèle qui décide d'une perte d'inventaire à partir d'une saisie libre, sans geste structuré du joueur. Fermé en it2. `consomme: false` (posséder l'objet suffit comme preuve) reste évaluable.
4. **Rangs ou identifiants.** Le modèle rend des rangs. La feature reçoit des identifiants (`ReponseActeur`), re-résolus avec la table de CET appel. Sinon la feature détient la table.

## PROPOSITION
Le détail est en annexe :
- trois états par savoir : absent, `S<n>` ou « déjà confié », partition sur `a_dit[pnj]` ;
- `rang-inconnu` pour tout rang hors de la table ;
- un seul écrivain atomique : réplique, `reveler_indice` et `a_dit` sur la même entrée ;
- au plus une révélation par réplique.

## VERDICT
**Veto sur 3 tel qu'écrit**, levé dès que `consomme: true` est fermé en it2. La note est alors **recevable sous réserve** de 1, 2 et 4.

---

## ANNEXE (hors quota) — Contrat de sortie IA, R4 · acteur, it2

### A. Évaluateur (code seul, `brain/dossier/`, zéro IA)
Fonction pure : `(dossier, session, pnjId)` → pour chaque savoir, dans l'ordre de la fiche, **un seul état** :
- **`deja_confie`** si `indice_id ∈ faits.pnj[pnjId].a_dit` (appartenance propre, KR-175). Testé **en premier**, sans réévaluer les portes.
- **`revelable`** si toutes ces conditions tiennent :
  - le savoir n'est pas `deja_confie` ;
  - `revele_si` est défini et porte au moins une clé ;
  - `confiance_min` et `jet` sont absents ;
  - `contrepartie` est absente, ou `consomme === false` et `PREDICATES.possede_objet.lit` est vrai ;
  - `apres_indice_id` est absent, ou `PREDICATES.indice_connu.lit` est vrai ;
  - l'indice a une `formulation_joueur` rédigée.
- **`absent`** dans tous les autres cas.

Deux règles de lecture : les faits se lisent par `PREDICATES[…].lit`, jamais par `faits.indices_connus.includes` (un seul lecteur des faits) ; `deja_confie` sans `formulation_joueur` passe en `absent` (le dossier a pu être édité entre deux sessions).

### B. Entrée injectée (`acteur.ts`)
Deux blocs neufs, après `TU AS DIT` et avant `ICI` :
```
CE QUE TU LUI AS DÉJÀ CONFIÉ
· tu le crois · <formulation_joueur>

CE QUE TU PEUX CONFIER
S1 · tu le sais · <formulation_joueur> · <revele_comment si rédigé>
```
- Libellé de certitude via un `Record<Certitude, string>` exhaustif.
- Rangs `S1…Sk` seulement pour les savoirs révélables, ordre de la fiche, recalculés à chaque appel, jamais persistés.
- `assemblerActeur` rend la table `ReadonlyMap<RangInjecte, indice_id>` (précédent `ContexteDetenteurs.rangs`) — seule source de `validerActeur` et de la re-résolution.
- Un savoir fermé est **absent** : aucun drapeau, aucune ligne « fermée ». Les lignes « déjà confié » n'ont ni rang ni didascalie.

N'entrent jamais : `indice_id`, `Indice.nom`, `Indice.verite`, `revele_si` et ses champs, l'objet de la contrepartie, `a_dit` tel quel, `indices_connus`, les savoirs d'un autre PNJ.

### C. Schéma de sortie (sur le fil)
- Gabarit : `{"replique": "…", "indices_reveles": []}` — `CLES_SORTIE_ACTEUR = ['replique','indices_reveles']`, TOUJOURS exigées, même sans bloc `S`.
- Nouvelle signature : `validerActeur(brut, dossier, rangsOuverts: ReadonlySet<RangInjecte>)`.
- Prédicats ajoutés : (9) `indices_reveles` est un tableau → `schema` ; (10) chaque élément est une chaîne → `schema` ; (11) longueur ≤ `REVELATIONS_PAR_REPLIQUE_MAX = 1` (refus, jamais troncature) → `schema` ; (12) chaque élément ∈ `rangsOuverts` → `rang-inconnu` (membre existant, précédent `validerDetenteurs`).
- **La liste vide est un succès** : refuser la réponse honnête pousserait le modèle à la complaisance.
- `PORTE_UN_CHIFFRE` reste appliqué à `replique` seul, jamais au tableau — garantit aussi qu'un « S1 » ne peut pas apparaître dans la prose.
- Frontière brain→feature : `ReponseActeur { replique; indices_reveles: readonly string[] }`, avec des IDENTIFIANTS D'INDICE re-résolus dans `CopiloteService`, jamais des rangs bruts qui fuiraient jusqu'à la feature.

### D. Échec de validation
Un rang hors de la table (inventé, ou pris dans le bloc « déjà confié ») donne `rang-inconnu`, et TOUTE la sortie est refusée, réplique comprise (elle a pu être écrite autour du contenu inventé). Rejeu une fois ; second échec → `illisible` → KR-283 (aucune réplique, aucune révélation, aucun `a_dit`, bannière existante). Jamais d'acceptation partielle.

### E. Application (code, après validation, jamais avant)
Un seul écrivain, au lot contrat de `session.ts`, seul appelant de `reveler_indice` depuis le dialogue, sur l'entrée `parler` du pas courant : (1) re-constate avec le MÊME évaluateur que chaque id est `revelable` — sinon lève (précondition KR-238, c'est un appelant fautif, pas le modèle) ; (2) `appliquerDelta(reveler_indice)` dans `deltas` de cette entrée (`applique` ou `sans_effet`) ; (3) `pnj[pnjId].a_dit += id` (premier écrivain de `a_dit` du dépôt — sans lui `pnj_a_revele` reste faux pour toujours) ; (4) `recit = replique` sur la même entrée ; (5) une seule session rendue, persistée une fois ; (6) la passe de jalons doit tourner sur la nouvelle session (point pour le Tech Lead). Aucun `retirer_objet` en it2.

### F. Mémoire
Ce qui a été confié reste su pour toujours, même si une porte se referme ensuite (le PNJ ne « dé-dit » pas, n'est plus révélable, journal pas pollué de `sans_effet`). Ce qui n'a pas été confié voit ses portes réévaluées à chaque appel. Un indice connu par une autre source mais pas confié par ce PNJ reste révélable (distingue `pnj_a_revele` d'`indice_connu`). `TU AS DIT` (K=4) garde les paroles ; « déjà confié » garde les faits, borné par la fiche, pas par le temps.

### G. Carnet (KR-231/284) : tient
Corps = `recit` de l'entrée qui porte le `reveler_indice` `applique` (réplique et delta écrits ensemble). Aucun `nom`/`verite`/`formulation_joueur` affiché. `faits_etablis: []` maintenu. Résidu non vérifiable par jest (KR-229) : le modèle cite un rang sans confier le savoir dans sa réplique, ou l'inverse — playtest. **Point hors de mon veto, pour l'UX** : `JournalRow` affiche `[reveler_indice:indice.xxx]`, un identifiant d'auteur visible par le joueur — à corriger.

### H. Budget
Les deux blocs appartiennent au terme dossier, bornés par la fiche (ne croissent pas avec les tours). `BUDGET_CARACTERES_DOSSIER_ACTEUR` à re-mesurer sur la fixture enrichie (×3), `TAILLE_MAX_CORPS_IA` re-vérifié, refus `trop-long` inchangé.

### I. Invite (révise la décision 4 d'it1)
Ajouts : ce que sont les repères `S` ; ne confier que ce qui figure dans « ce que tu peux confier », et seulement si l'échange y mène ; au plus un repère ou une liste vide ; parler avec l'assurance qu'indique la certitude ; ne pas contredire ce qui a déjà été confié. JAMAIS la logique des portes (objet/indice préalable/confiance/jet) — elle ne vit que dans l'évaluateur.

### J. Témoins qui font diverger les implémentations
Le mutant « `porteOuverte` recopiée » passe le 2×2 — branches à ajouter : savoir sans porte (`revele_si` absent ou `{}`) → absent ; deux portes vraies + `confiance_min`/`jet` posé → absent ; `consomme:true` + objet possédé → absent ; portes ouvertes mais indice sans `formulation_joueur` → absent (`indice.trace-du-guet`) ; déjà confié → ligne sans rang, résiste même si l'objet est ensuite retiré ; connu ailleurs (jalon) mais pas dans `a_dit` → reste `S<n>` ; isolation stricte entre PNJ (KR-282) ; la démo exige un PNJ présent/identifié dont le prérequis s'obtient EN JEU, le linter seul ne suffit pas (compte un savoir sans porte comme ouvert).

### K. Rejets à recopier au § 8 du plan
Réutiliser `porteOuverte` au runtime ; injecter `verite` à R4 une fois l'indice acquis ; retirer l'objet `consomme:true` sur décision de R4 ; laisser des rangs arriver jusqu'à la feature ; accepter une sortie en partie ; rendre visible au modèle un drapeau « fermé ». À reporter (`open_questions`) : un verbe `donner <objet> <pnj>` (consentement structuré) qui rouvrira `consomme:true`.

## Décisions prises en autonomie faute de spécification
- Contenu d'un savoir non spécifié → `formulation_joueur` seule → avec `verite`, un PNJ qui « croit » recevrait la vérité de l'auteur, rompant le point de vue.
- Savoir sans contenu écrit → absent du contexte → sinon R4 invente le lore (mesuré sur `trace-du-guet`).
- Sort de `consomme:true` → fermé en it2 → sinon la perte d'inventaire est décidée par le modèle (veto).
- Mémoire → partition par `a_dit`, testée avant les portes → en réévaluant à neuf, le PNJ oublie ce qu'il a dit ; en laissant ouvert, chaque mention ajoute du bruit `sans_effet`.
- Écrivain de `a_dit` → it2 → sinon `pnj_a_revele` ne devient jamais vrai.
- Nombre de révélations par réplique → au plus 1 → sinon deux lignes de carnet partagent le même corps, écart rang/réplique grandit.
- Rang hors table → refus de toute la sortie → garder la réplique seule laisserait passer une prose écrite autour d'une révélation inventée.
- Garde au site d'écriture → même évaluateur, qui lève → sinon un appelant futur contourne les portes.

## Fichiers vérifiés
`src/brain/dossier/types.ts` (322-350, 536-594, 1120-1177) ; `src/brain/dossier/deltas.ts` ; `src/brain/dossier/faits.ts` ; `src/brain/dossier/evaluate.ts` (38-171) ; `src/brain/dossier/atteignabilite.ts` (79-142, 275-292) ; `src/brain/dossier/destinations.ts` (245-302, 423-461) ; `src/brain/dossier/validate.ts` (695-703) ; `src/brain/dossier/session.ts` (60-129) ; `src/brain/copilote/contexte/acteur.ts` ; `src/brain/copilote/schemaSortie.ts` (176, 335-370, 1518-1606) ; `src/brain/copilote/types.ts` (710-762) ; `src/brain/CopiloteService.ts` (430-447, 895-937) ; `src/features/play-mode/hooks/useTourDeJeu.ts` (224-262) ; `src/features/play-mode/components/JournalRow.tsx` ; `worker/index.ts` (794-837) ; `src/brain/dossier/__fixtures__/dossier-reference.json` (181-312) ; `docs/PLAN-BASCULE-IA.dc.html` (431, 608) ; `docs/ROADMAP-BASCULE-IA.md` (172) ; `src/features/moteur-acteurs/specification.json` ; `.claude/raffinage/moteur-acteurs-cadrage/tour{1,2}-narratif-ia.md` ; `.claude/raffinage/moteur-acteurs-it1/tour2-narratif-ia.md`.
