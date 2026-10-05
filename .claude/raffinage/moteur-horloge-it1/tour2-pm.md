# moteur-horloge it1 — tour 2 — PM

**RÉPONSES NOMMÉES**
- **TL, « ligne bloqué »** : diagnostic partagé, remède refusé. Une ligne à `tour − depuis === duree` n'est pas un lecteur : c'est un événement pour un état dérivé (KR-013), déjà refusé par UX (b) et NIA R-2. Pour l'auteur, pire que le silence : il lit « bloqué », or personne ne joue son `si_bloque` avant R3.
- **NIA, minuterie (J2 cas 2)** : refusée. Une étape k+1 sans déclencheur EST « durée écoulée sans déclencheur suivant » (`types.ts:433-446`, `BlocPlanActions.tsx:58`) : la minuterie avance là où l'éditeur promet « bloqué » — le R-1 que NIA rejette elle-même. Deux comportements dans la démo.
- **QA** : AC3 passe en it2 ; `changementsDe` en retour du tick, décision close. Gardés : plan vide, déclencheur absent, rang max.
- **Acquis NIA** : J2 écrit d'abord ; rang hors bornes = aucun effet.

**MES OBJECTIONS**
1. Veto goal/AC1 : **maintenu**, levé par « l'auteur peut lire au journal qu'un PNJ est passé à l'étape suivante dès que le déclencheur de cette étape est vrai ». Durée, minuterie ou « bloqué » dans it1 : **durci en veto**.
2. `depuis` sans lecteur : **maintenue**. `etape_plan?: { rang }` ; écart de calendrier à la décision `{rang, depuis}` (KR-249 prime), à consigner.
3. Sélecteur `evaluate.ts` et lot unique : **retirées** (TL, NIA les ont adoptés).
4. Ligne de journal : **maintenue** — identifiants, base 1, ni `action` ni `origine`.
5. Roadmap ligne 14 : **maintenue**.

**ITÉRATIONS** : 1 déclencheur (d'abord) ; 2 R3 « pendant ce temps » + PAS #n ; 3 durée → bloqué → `si_bloque` joué (`depuis` entre) ; 4 climat. Spec et roadmap : 3 → 4.

## Décisions prises en autonomie faute de spécification

- Entrée au rang 0 (rien ne la tranche) → écriture d'état silencieuse, aucune ligne ; étape 1 sans déclencheur entre au premier pas, étape k>1 sans déclencheur n'entre jamais → si l'inverse : une ligne « — → 1 » par PNJ au pas 1 (bruit pour l'auteur), ou des plans dont l'étape 1 n'a pas de déclencheur (cas le plus courant) jamais joués.
- Durée/bloqué en itération 3 propre, donc 4 itérations (la spec en compte 3) → si l'inverse (absorbée par it2) : it2 empile projection, bloc R3, bandeau et bloqué, soit plus d'une démo et plus de 8 critères.
- `etape_plan` = `{ rang }` seul en it1 → si l'inverse (`depuis` posé dès it1) : un champ de session sans lecteur de production (KR-249). Si c'est moi qui me trompe, `depuis` s'ajoute optionnel plus tard (KR-251), session non persistée avant la n° 15 : coût nul.
- Comptes de `sessionCouverture.test.ts` : un chemin au lieu de deux, donc chaque valeur du TL baisse de 1 (brutes 3 → 4, normalisées 2 → 3, `pnj` −1) → à recalculer depuis la doc, pas depuis le rouge ; si le TL garde deux chemins, il rouvre `depuis`.

---

Verdict sur le désaccord central : durée, `depuis`, bloqué et minuterie sortent d'it1 en bloc. Motifs, vérifiés dans le code :
- Le contrat déjà montré à l'auteur dit « durée écoulée sans déclencheur suivant = bloqué » (`types.ts:433-446`, aide `BlocPlanActions.tsx:58`). Le plan § 2.7 (« échue ou déclencheur rempli ») le contredit. L'éditeur livré prime, et AC1 est donc faux.
- La minuterie de NIA avance précisément quand l'éditeur promet « bloqué » (étape k+1 sans déclencheur). C'est le R-1 que NIA rejette elle-même.
- La ligne « bloqué » du TL n'est pas un lecteur de `depuis` (événement sur état dérivé, KR-013). Elle contredit UX (b) et NIA R-2, et elle induit l'auteur en erreur : personne ne joue `si_bloque` avant R3.

Deux points d'attention pour l'orchestrateur :
1. Mon `{ rang }` en it1 diffère de la décision close `{rang, depuis}` par le calendrier seulement. C'est un préfixe de la forme actée, et KR-249 (« depuis entre avec son lecteur ») prime. À consigner dans `deviations_from_plan`, avec la correction de la ligne 14 du roadmap (retrait de périmètre, mise à jour obligatoire par décision close).
2. Les comptes de `sessionCouverture` donnés par le TL (3 → 5, 2 → 4, `pnj: 4`) supposent deux chemins. Avec `rang` seul, chaque valeur baisse de 1, à recalculer depuis la doc.
