RISQUE — Le cadrage affirme que le dossier de référence porte « 3 objets, aucun référencé par une contrepartie de savoir ». J'ai vérifié `__fixtures__/dossier-reference.json` : c'est **faux**. `objet.lanterne-de-corvin` est bien la cible de `pnj.tobin-le-gamin.savoirs[0].revele_si.contrepartie.objet_id`. Pire : les deux autres objets sont eux aussi référencés ailleurs (`sceau-de-cendre` par deux `possede_objet` d'objectifs/fins, `amulette-scellee` par un delta `donner_objet` de quête) — validés par `REFERENCES_SIMPLES`/`CHEMINS_DE_DELTAS` dans `validate.ts`, donc bloquants eux aussi. **Aucun objet du dossier de référence n'est retirable.** Un test de discriminance qui s'y fierait échouerait ou mentirait sur la cause du refus.

OBJECTION — AC20 (retrait/discriminance) ne dit pas où vit la fixture à 2 objets ni que « non référencé » doit signifier zéro référence de tout type (pas seulement contrepartie). Sans le dire, l'implémenteur peut piocher dans `dossier-reference.json` et se tromper. Second point : « aucun pré-vol côté feature » n'est pas assez armé pour être observable — le précédent dossier-fiches it7 le prouve par (a) `toBeEnabled()` sur le bouton d'un élément référencé, (b) le spy `update()` appelé, et surtout (c) le test discriminant d'auto-référence (KR-194). Or `Objet` n'a **aucun champ auto-référençant** — ce 3e mécanisme ne transpose pas ici, et rien ne le remplace dans l'AC.

PROPOSITION — Nommer dans l'AC : fixture locale 2 objets (dossier-objets/tests, aucune réutilisation de `dossier-reference.json`) ; assertions requises pour « pas de pré-vol » = bouton actif avant tentative + `updateSpy` appelé + message affiché égal au message SSOT verbatim (à défaut d'auto-référence possible sur `Objet`).

VERDICT — recevable sous réserve (correction de la fixture citée + armement du critère « pas de pré-vol »).

---

Éléments consultés (chemins absolus) :
- `C:\Users\pierr\Desktop\genliv\src\features\dossier-objets\specification.json`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\__fixtures__\dossier-reference.json`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\tables.ts` (`REFERENCES_SIMPLES`, `CHEMINS_DE_DELTAS`)
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\validate.ts`
- `C:\Users\pierr\Desktop\genliv\src\features\dossier-fiches\tests\retraitPersonnage.test.tsx` (précédent : preuve d'absence de pré-vol, KR-194)
- `C:\Users\pierr\Desktop\genliv\bug_history.dossier-fiches.json` (BUG-064, BUG-076), `bug_history.dossier-canon.json` (BUG-078), `bug_history.json` (BUG-066)
- `C:\Users\pierr\Desktop\genliv\src\features\dossier-objets\tests\panneauObjets.test.tsx`
