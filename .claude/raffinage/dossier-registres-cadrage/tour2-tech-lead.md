RÉPONSE AUX OBJECTIONS

RISQUE — aucun `…_expr` n'est éditable dans ce dépôt : la n°3 a livré `…_texte` seul, alors que `dossier-format` promet « PREDICATES pilote le rendu des formulaires » pour les n°3/6/7. La n°6 hérite de la promesse sans le budget : elle livrera texte-seul comme la n°3, et le comité doit nommer un propriétaire (recommandation : n°7) plutôt qu'épaissir la dette d'une feature de plus.

OBJECTION — PM, nommément : « Graphe des indices » passe de hors-périmètre à VETO. (a) `demontageArbre.test.ts`, possédé par `bascule-editeur`, verrouille la non-atteignabilité de `TreeCanvas` — un lot de n°6 devrait éditer le fichier d'une autre feature et annuler un critère livré ; (b) `src/features/tree-canvas/` est inscrit à la démolition physique de la n°9 ; (c) la 3e source du graphe (`lieux[].acces`) reste hors n°6 (KR-200) et l'instrument navigateur est différé — l'itération ne franchit pas sa porte seule.

UX, nommément : « Quêtes d'abord » refusé, sur un critère neuf — aucun éditeur d'effets avant que les registres qu'il cible soient remplissables. `recompense: Delta[]` offre quatre effets ; deux visent `indice.` et `jalon.`, qu'aucun écran ne remplit aujourd'hui. La dépendance de donnée l'emporte : un composant s'extrait à son 2e appelant, un Select vide non. Je prends ta substance : un seul `EditeurEffets`, né en Quêtes, consommé sans fork par Événements.

PROPOSITION — 5 itérations : Indices · Jalons & fins · Quêtes · Événements · Climat. Jalons/fins RESTE en n°6 (écrit deux fois, je ne rouvre pas) et remonte en 2e : la moins chère (forme déjà complète), et elle rend `jalon.` remplissable. `Quete.lie_au_canon` écarté — dérivable, donc seconde vérité (précédent KR-192).

VERDICT — recevable, sous les corrections de roadmap en annexe.

---

Annexe A — les 5 itérations (une tranche de schéma chacune, KR-190) :

1. Indices (lot contrat) — `Indice extends Entite { portee?, verite?, formulation_joueur?, mene_a?: string[] }`, `monde.indices` cesse d'être `Entite[]` ; panneau + fiche, chaîne `mene_a` en LISTE TEXTUELLE.
2. Jalons & fins (lot contrat, minuscule) — `Fin.texte?` (prose ÉMISE au joueur, consommateur nommé n°15/EndScreen). `jalons[].obligatoire` ÉCARTÉ : sans consommateur. Section 10, deux listes, texte-seul.
3. Quêtes (lot contrat) — `donneur_id?`, `objectif?`, `etapes?`, `echeance?` ; `recompense: Delta[]` existe déjà. Panneau + naissance d'`EditeurEffets`.
4. Événements (lot contrat) — `lie_a_histoire?` (+ `nature?`, réserve : `'monstre'` dérivable de `monstre_ref`, à trancher au raffinage). Deux listes, Select bestiaire, `Resolution[]` réutilisant `EditeurEffets`.
5. Climat (lot contrat) — `Climat.libelle?`, `duree?`. Petit panneau, AUCUN `Delta[]` édité (DELTAS n'a pas d'opérande entier).

Notes de contrat pour le raffinage :
- `Indice.portee` OPTIONNEL (KR-191/KR-160) : `monde.indices[]` existe depuis la n°1, un champ requis invaliderait rétroactivement tout dossier persisté.
- Registre nommé `PORTEES_INDICE` / `PorteeIndice`, jamais réutiliser `PORTEES` (personnage) ni `PORTEES_CONTRE_MESURE` — précédent `CAMPS` vs `CAMPS_PERSONNAGE`.
- `etapes` = liste ORDONNÉE DE PROSE (`{ etape: number, libelle: string }`), SANS `declencheur_expr` : une 7e famille de conditions D1 est une extension que personne n'a demandée (D1 en énumère six).
- `EditeurEffets` reste dans `src/features/dossier-registres/components/` — ses consommateurs sont dans la même feature, KR-109 ne s'applique pas. Ne monte dans `brain/components/` que si n°7 ou n°8 le consomme.
- `src/App.tsx` prend une ligne par panneau, itérations sérielles ⇒ aucune collision inter-lots.

Annexe B — statut de mes items tour 1 :
1. `Climat.effets_regles` vs « effets chiffrés » — MAINTENU ET TRANCHÉ : `DELTAS` n'admet aucun opérande entier, l'itération 5 livre le climat en prose ; `effets_regles: []` reste légal. Ouvrir un `DeltaModificateur` exige REGLES-DU-JEU.md → table dorée → code (KR-130), hors n°6, propriétaire n°11/n°13.
2. Périmètre incomplet (jalons/fins) — RETIRÉE au profit d'un arbitrage : reste en n°6, itération 2. Motif du non-report : n°7 lit `fins[].condition_texte`/`jalons[].declencheur_texte` ; livrer le linter avant l'écran qui répare nommerait un défaut sans chemin de réparation.
3. tree-canvas hors périmètre — DURCIE EN VETO (corps du message).
4. `lieux[].acces` hors n°6 (KR-200) — MAINTENUE. Seul écran porteur = PanneauLieux.tsx/FicheLieu.tsx, possédés par dossier-canon : un lot de n°6 qui les éditerait viole la propriété exclusive. Propriétaire recommandé : réouverture de dossier-canon en it5, avant n°7.
5. `conditions.contraintes` — DURCIE : pas seulement « sans consommateur », mais dans le mauvais document. `faim/froid/poursuite` sont des états de SESSION (plan-cible, bandeau d'horloge), propriété de n°9.
6. Récompense en XP — MAINTENUE : réouverture par REGLES-DU-JEU.md §5 → rules.golden.test.ts → code, propriétaire n°11.
7. Corrections de roadmap — révisées, deux : §5 dernière ligne, `quetes[].etapes` passe de « n°1·n°9 » à « n°6 (la forme) · n°9 (l'avancement) » ; §1bis `tree-canvas | repointée (n°6)` → `en sommeil ; repointage NON ASSIGNÉ` ; §2 l.170 retirer « + son graphe » de la phrase de la n°6.