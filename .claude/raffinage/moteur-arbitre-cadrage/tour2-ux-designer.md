# Cadrage n°11 `moteur-arbitre` — Tour 2 — UX

## RISQUE
La découpe tech-lead (it2 « carte cliquable, pas encore résolue ») ferait vivre un tour entier une `CarteJet` avec un bouton « Lancer le dé » qui ne produit aucun retour lisible : ni état vide (elle est remplie), ni chargement, ni résolu — un état que mon vocabulaire (§3 registre, §6 clavier) ne couvre pas et que QA nomme déjà via KR-263. J'appuie l'objection de QA depuis l'UX : un clic sans retour narratif casse la cadence de lecture au clavier que je protège.

## OBJECTION (réponse nommée à narratif-ia, correction de ma propre note tour1)
En relisant `src/features/play-mode/components/PlayerInputBar.tsx` (n°10, déjà livré), je découvre que le bloc `RÉCIT` existe déjà : `ENTETE_RECIT = 'RÉCIT'`, dérivé de `session.journal[].recit` pour le tour courant, rendu via `OutcomeBlock`. Ma proposition tour1 (§3 de mon annexe) d'un `OutcomeBlock entete="RÉCIT"` propre à `CarteJet` est donc **fautive** : elle créerait un second afficheur concurrent du premier — exactement le genre de duplication que KR-013 proscrit côté données et que ma propre règle « hiérarchie par filets, pas deux surfaces pour un même fait » proscrit côté écran. **Je corrige** : `CarteJet`, après résolution, affiche seulement les dés bruts + `Badge` (tone `good`/`bad`, RÉUSSITE/ÉCHEC + marge) — aucun `OutcomeBlock` à elle. Le texte de R3 (les deux lignes `CE PAS` concaténées dans `.recit`) remonte par le canal existant, sous le champ de saisie, comme l'ouverture et les clarifications de n°10.

## PROPOSITION — réponse directe aux bornes demandées
Je confirme 60/120, avec une précision : elles ne s'appliquent pas au même rendu.
- `enjeu_reussite` / `enjeu_echec` (≤120) rendent **dans** la carte, sur les deux lignes `SI RÉUSSITE` / `SI ÉCHEC` (label mono, contenu en `--font-ui`/`--fs-row`, wrap libre, jamais tronqué). 120 caractères ≈ 2 lignes à la largeur de `Card` standard : lisible, pas de scroll. Compatible.
- `pourquoi` (≤60) ne s'affiche **jamais** dans `CarteJet` — il n'alimente que la ligne `CE PAS` (« tente — <pourquoi> ») écrite par R3 et lue dans le bloc `RÉCIT` déjà existant de n°10, donc sans contrainte de largeur de carte. La borne de 60 est une économie narrative de narratif-ia, pas une contrainte de mise en page de mon côté — pas d'objection, mais je ne peux la justifier que comme compatible.

Sur l'ordre : mon découpage (héros+création d'abord, bandeau ensuite, carte en dernier) est un axe **écran** ; celui de narratif-ia (jet binaire → marge → XP) est un axe **logique de résolution**, orthogonal. Ils se combinent sans conflit à condition d'ajouter une règle : quelle que soit l'itération qui fait apparaître `CarteJet` à l'écran, elle porte **aussi** le retour résolu + récit dans le même lot — jamais une carte affichée sans son dénouement lisible.

## VERDICT
Objection tour1 (interdiction d'importer `HeroStatusBar.tsx`/`CharacterCreationScreen.tsx` verbatim, réutilisation sûre de `heroGen.ts`/`charCreation.ts`) : **maintenue telle quelle** — aucune note des quatre autres rôles ne la conteste.

Durcie sur un point neuf, découvert en tour 2 : **veto** sur toute itération qui affiche `CarteJet` (résolvable) sans livrer, dans le même lot, la résolution + le récit qui en découle — rejoint et matérialise KR-263 côté surface. Correction de ma propre annexe tour1 : retirer le `OutcomeBlock entete="RÉCIT"` propre à `CarteJet`, remplacé par « affiche Badge + dés bruts ; le récit s'affiche via le bloc `RÉCIT` déjà câblé par n°10, alimenté par `session.journal[].recit` — aucun second afficheur ».

## Fichiers consultés ce tour
`.claude/raffinage/moteur-arbitre-cadrage/tour1-ux-designer.md` (ma note tour1), `src/features/play-mode/components/PlayerInputBar.tsx` (bloc RÉCIT déjà câblé, lignes 44-46, 84-91, 126-146), `src/features/play-mode/components/OutcomeBlock.tsx` (pas de prop `variant` aujourd'hui, réservée explicitement « au premier appelant de jet (n°11) »), `design_handoff_gamebook_editor/components/surfaces/OutcomeBlock.{jsx,d.ts,prompt.md}` (référence tone success/failure).
