# Cadrage — `dossier-controles`, itération 10 (n° 7, DERNIÈRE ; 9/10 livrées)

**Composition retenue : 5 rôles** — `pm-produit`, `tech-lead`, `ux-designer`, `qa` **+ `narratif-ia`**.
Motif : l'itération touche le dossier d'aventure, la frontière code/IA et une notion d'**état de session au tour zéro** qui appartient au moteur (n° 9) — la convoquer est la seule façon d'avoir un gardien sur cette frontière.

1. **GOAL BRUT (spec)** — « l'auteur voit qu'un objectif est ÉCHOUÉ avant que le joueur ait joué un seul tour ». REPORTÉ d'it7, repointé au raffinage d'it8. `canon-sans-victoire` (`controles.ts`) l'annonce nommément : « `echoue_si_*` N'EST JAMAIS LU : sens d'erreur inverse (une condition d'échec absente ne perd pas la partie, **une condition d'échec vraie au tour zéro la perd**), cause distincte, règle distincte le jour où elle aura un propriétaire. »

2. **RÉSERVE DE CADRAGE — CONFIRMÉE.** La notion d'**ÉTAT D'OUVERTURE** n'existe nulle part. `atteignabilite.ts` décide la **SATISFIABILITÉ** (« ce fait peut-il un jour être établi ? »), jamais la **VALEUR** d'une condition à t=0 : ce sont deux questions distinctes. Les champs de session (`lieu_courant`, `lieux_visites`, `indices_connus`, `jalons_atteints`, `evenements_consommes`, `pnj.<id>.a_dit`) sont **NOMMÉS en prose** dans `predicates.ts` et n'existent dans **aucun fichier** de `src/` (mesuré : grep → zéro occurrence hors commentaires et tests).

3. **MESURE A — le défaut réel, rejoué au cadrage.** `dossier-reference.json` → `canon.objectifs[1]` (`objectif.proteger-le-sceau`), `echoue_si_expr = non(possede_objet('objet.sceau-de-cendre'))`. Le héros ne part avec rien → **vraie au tour zéro**, l'objectif est perdu à l'ouverture. `canon.objectifs[0]` (`evenement_consomme('evenement.embuscade-a-la-tour')`) est le témoin **NÉGATIF dans la MÊME collection** — KR-197/202 servis par la fixture, sans aucune mutation.

4. **MESURE B — deuxième témoin négatif + ligne de base.** `dossier-minimal.json` → `objectifs[0].echoue_si_expr = ou(evenement_consomme, pnj_a_revele)` : **fausse** à t=0. Ligne de base rejouée ce jour : dossier neuf **4** contrôles (`jouable` false), minimal **1** (`jouable` true), référence **11** (`jouable` false). `objectif-sans-chemin` (it7) ne tire **sur aucun** des trois.

5. **MESURE C — LE PIÈGE, et il n'est pas théorique.** « tous les prédicats sont faux au tour zéro » est **FAUX** : `lieu_courant_est(X)` est **VRAI** à t=0 quand `X === charpente.depart.lieu_id` (`predicates.ts` : « Y répond `monde.lieu_courant` — **une valeur, pas une liste** »). Un modèle naïf déclarerait `non(lieu_courant_est(départ))` vraie à t=0 → **FAUX POSITIF**, la direction interdite. `dossier-minimal.json` porte déjà exactement ce motif dans `charpente.fins[0].condition_expr`. Le statut de `lieu_visite(départ)` à t=0 n'est tranché **nulle part**.

6. **MESURE D — une prose fausse dans le fichier qu'on va ouvrir.** `atteignabilite.ts`, cas `non` : « les sept prédicats lisent des champs de session qui partent VIDES, si bien que `non(P)` est vrai au tour zéro ». La **conclusion** (rendre `null` sans descendre) reste juste — sens d'erreur permis — mais le **MOTIF** est faux pour `lieu_courant_est`. Famille BUG-080 : un refus juste pour un motif faux cède au premier contradicteur.

7. **MESURE E — LE REMÈDE N'A PEUT-ÊTRE PAS DE GESTE.** L'éditeur n'offre **aucune** surface d'édition de `echoue_si_expr` : `ObjectifsCanon.tsx` n'écrit que `nom`, `camp`, `reussi_si_texte`, `echoue_si_texte` (mesuré). Et le schéma ne porte **aucun inventaire de départ** (H5, `Depart` = `{ lieu_id, texte_ouverture_joueur }`). À confronter à la doctrine d'it8 — « une capacité absente n'atteint le BLOQUANT que si l'éditeur offre AUJOURD'HUI le geste qui la restaure » — et à **BUG-090** (consigne circulaire : ne jamais nommer une surface inexistante). Contre-précédent dans la même feature : `objectif-sans-chemin` est **bloquant** et lit `reussi_si_expr`, tout aussi ineditable ; sa remédiation nomme les écrans **producteurs**, jamais l'éditeur de condition.

8. **CONTRAINTES D'ARCHITECTURE, MESURÉES.**
   (a) `expr.test.ts` épingle la liste **EXACTE** des lecteurs d'arbre : `expect(lecteurs).toEqual(['atteignabilite.ts', 'expr.ts'])`. Un 3ᵉ module portant `switch (….op)` **ou** `….op === '…'` la fait **rougir**. Tout lecteur « sémantique » admis doit être **EXHAUSTIF AU COMPILATEUR** : `default` passant à un paramètre `never`, **une fermeture `: never` par aiguillage**, et sa signature `noeud: ExprNode` lue en source.
   (b) `controles.test.ts:1936` interdit à `controles.ts` : `from './predicates'`, `from './expr'`, et le mot `ExprNode` — la couture d'it6. `controles.ts` conclut et raconte ; il ne lit pas d'arbre.
   (c) `controles.test.ts:1590` épingle la ligne de base des **trois** dossiers, ligne à ligne : un contrôle de plus sur la référence la fait bouger (attendu, précédent it7/it9 — un vrai positif s'épingle nommément).
   (d) `controles.test.ts:1647` s'intitule « les **huit** règles écrivent le même registre de langue, sur les deux colonnes ».

9. **KR applicables** : KR-164 (un code par CAUSE) · KR-199 (balayer depuis le registre, jamais N littéraux) · KR-197/202 (deux entités, même test) · KR-217 (jamais le canal `errors`/`warnings`) · KR-219 + KR-226 (section **DÉCLARÉE**, table `path → section`, **aucun découpage de chemin** dans le module) · KR-225 (aucune anomalie `error` exhibable) · KR-224 et H1–H5 (hypothèses datées, domiciliées dans `atteignabilite.ts`) · KR-117 (registre fermé, `ControleId` dérivé) · KR-013/113 (aucune mémoïsation, aucun cache) · KR-130 (`docs/REGLES-DU-JEU.md` fait foi pour toute valeur de règle).

10. **FICHIERS PROBABLES** : `src/brain/dossier/atteignabilite.ts` (+ `atteignabilite.test.ts`), `src/brain/dossier/controles.ts` (+ `controles.test.ts`), éventuellement `src/brain/dossier/expr.test.ts`. **Aucun fichier d'UI attendu** — « une règle de plus est une entrée de plus : zéro fichier d'UI touché ». `dossier-reference.json` : **à ne pas réparer par défaut** (précédent it7 — le défaut réel est épinglé comme vrai positif, pas corrigé).

---

## Questions ouvertes portées au comité (aucune n'est pré-tranchée)

- **Q1 — le niveau.** `bloquant` (symétrie avec `objectif-sans-chemin` : un objectif perdu d'avance est au moins aussi mort qu'un objectif sans chemin) ou `alerte` (doctrine d'it8 : l'aventure s'ouvre, se joue, se termine par `charpente.fins` ; et aucun geste d'éditeur ne restaure la capacité — mesure E) ?
- **Q2 — où vit l'état d'ouverture.** Dans `atteignabilite.ts` (seul lecteur sémantique admis aujourd'hui, contrainte 8a) ou dans un module neuf qui devra mériter son entrée dans la garde de couture ? Et le module dit-il « atteignabilité » ou autre chose, s'il porte désormais deux questions distinctes ?
- **Q3 — bivalué ou trivalué.** Faut-il un verdict `vrai / faux` (avec une hypothèse datée sur `lieu_visite(départ)`) ou `vrai / faux / indécidable`, la règle ne tirant que sur le **certain-vrai** ? Le sens d'erreur interdit est le faux positif.
- **Q4 — la portée.** Seulement `canon.objectifs[].echoue_si_expr`, ou aussi `charpente.fins[].condition_expr` (« une fin déjà atteinte à l'ouverture ») ? Mesuré : aucune fin des deux fixtures n'est vraie à t=0 ; un élargissement n'aurait donc **aucun témoin positif réel**.
