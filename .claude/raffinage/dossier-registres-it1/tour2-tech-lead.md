RÉPONSE AUX OBJECTIONS

RISQUE — l'auto-exclusion proposée par UX fabrique un FAUX ORPHELIN : `avecOrpheline` teste `options.some(o => o.value === valeur)` ; l'option ayant été retirée par le filtre, une auto-référence déjà persistée s'affiche « Indice introuvable — indice.x » sur un indice qui existe.

OBJECTION — à UX, sur `portee` : je RETIRE la moitié « aucun consommateur ». `Destination = 'auteur'` nomme l'auteur comme lecteur légitime (précédents `titre`, `but.echeance`, `presence[].quand`) — rendu, le champ a un écrivain et un lecteur, mon critère de veto tombe. Je durcis en revanche contre le compromis PM : posé au type SANS rendu, `portee` n'a ni écrivain, ni lecteur, ni code, tout en coûtant cinq lignes de contrat. C'est KR-206 à l'état pur, la pire des trois options. Le choix est binaire : rendu, ou hors du type.

PROPOSITION —
1. Auto-référence : QA a raison au SSOT (aucune garde, KR-194) ; UX a raison à l'écran, mais SEULEMENT sur la ligne d'ajout — les lignes existantes lisent la liste complète.
2. Option A confirmée pour le 3e trou de validation, dans le budget du lot 1 : +1 fichier au manifeste (`issues.ts`), un seul code neuf.
3. Audiences : `verite` → `ia` sous condition d'état, `formulation_joueur` → `ia`, `mene_a[]` → `moteur`, `portee` (si retenu) → `auteur`.

VERDICT — recevable sous réserve : retrait hors it1.

---

Annexe A — statut de mes 6 points tour 1 :
- avecOrpheline privée → promotion brain/utils/references.ts — DURCIE EN VETO. 2 appelants réels le jour même.
- portee sans lecteur — RETIRÉE, remplacée par la borne binaire ci-dessus.
- Retrait hors périmètre — MAINTENUE, re-motivée par Dangerous Actions (Modal obligatoire si retrait entrait en it1).
- Comité tranche l'audience — TRANCHÉE (voir annexe B).
- Option A pour le 3e trou — MAINTENUE ET CONFIRMÉE.
- 2 lots séquentiels — MAINTENU, manifeste corrigé (issues.ts).

Annexe B — audiences avec motif :
- `monde.indices[].verite` → `ia`, sous condition d'état. Consommateur nommé : n°12 moteur-acteurs (roadmap l.197, « carnet d'indices »).
- `monde.indices[].formulation_joueur` → `ia`, injectée jamais verbatim (précédent objets[].description_joueur).
- `monde.indices[].mene_a[]` → `moteur`. Un identifiant est un handle ; le code résout.
- `monde.indices[].portee` → `auteur` s'il est retenu, jamais `moteur`.

Annexe C — lots révisés (manifeste corrigé) :

Lot 1 — contrat, seul, en premier : R types.ts, tables.ts, validate.ts, identifiers.ts, destinations.ts, issues.ts (NOUVEAU), __fixtures__/dossier-reference.json, __fixtures__/dossier-minimal.json, couverture.test.ts, validate.test.ts, identifiers.test.ts ; N brain/utils/references.ts, brain/utils/references.test.ts ; R brain/index.ts, dossier-fiches/components/BlocSavoirs.tsx (extraction seule, zéro changement de comportement, couvert par savoirs.test.tsx).

Trois correctifs portés, avec leur borne :
- validate.ts:386 → `if (site.valeur === undefined) continue`, puis non-chaîne ⇒ identifiant-invalide. Chaîne vide reste calme. Deux tests de non-régression nommés (objectif_id, apres_indice_id).
- identifiers.ts:211 → `feuille.replace(/\[\d*\]$/, '')`. Test dédié.
- 3e trou (Option A) — boucle calquée sur §6 quater, un seul code neuf (liste-non-textuelle), couvre mene_a ET caractere.parler par la même ligne de table, zéro fichier dossier-fiches touché.

Deux bornes pour dev-contrat : (1) la fixture doit porter un mene_a NON VIDE (sinon la clé `[]` n'est jamais exercée) ; (2) Monde.indices: Entite[] → Indice[] ne casse aucun appelant (Indice extends Entite, assignable), vérifié à la lecture.

Règle de rendez-vous mene_a (lot 2) :
```
// LIGNE D'AJOUT : self-exclusion — un indice ne se propose jamais lui-même
optionsAjout = optionsTousIndices.filter(o => o.value !== indice.id)
// LIGNE EXISTANTE : liste COMPLÈTE, self comprise — sinon une auto-référence
// persistée s'affiche « introuvable » alors qu'elle résout
optionsLigne = avecOrpheline(optionsTousIndices, valeur, 'indice')
```