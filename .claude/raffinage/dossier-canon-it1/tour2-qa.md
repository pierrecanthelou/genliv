# Tour 2 — QA — `dossier-canon` it1

RISQUE — le signal du compteur ("--bad" via un token couleur) est structurellement invisible à jsdom : `ListRow.test.tsx` (bascule-editeur it3) documente déjà que `cssstyle` élague les valeurs `var(...)` — un test qui viserait le `tone`/la couleur du compteur serait vert sur un compteur cassé. Cibler le TEXTE du compteur (proposition tech-lead/UX) contourne le problème, mais le texte seul ("601/600 mots") ne prouve pas que l'état visuel bascule, seulement que le nombre est juste.

OBJECTION — `IssueList` "promu dans brain/" est un composant neuf, pas encore dans le §4/§5 du plan : sans lot contrat qui l'expose (même patron que `ListRow` en bascule-editeur it3), le lot 2 l'écrirait dans `dossier-canon/` puis un futur consommateur (n°4 à n°6, mêmes bandeaux d'erreur) le dupliquerait — violation KR-109 en germe, pas encore commise.

PROPOSITION — (1) je concède le `role="status"` : pas de raison de le maintenir, c'est une affordance d'accessibilité hors cadre (décision projet) ; j'ajoute en échange une exigence de testabilité non visuelle, un attribut `data-etat="normal"|"avertissement"` sur le compteur, nommé par l'UX au §3, qui ne change rien au design. (2) `IssueList.tsx` + son test rejoignent le lot 1 `contrat`, pas le lot 2. (3) Je confirme : le champ affiche ce que l'auteur a tapé après refus, jamais un revert — signalé au tech-lead ci-dessous.

VERDICT — recevable sous réserve : lot 1 gagne `brain/components/IssueList.tsx`+test ; §3 nomme le texte exact du compteur et l'attribut `data-etat`.

## Signalé nommément au tech-lead

Le revert contredit le patron déjà établi KR-053 (brouillon local seedé UNE FOIS, jamais re-synchronisé depuis le store) : ne rien faire après un refus EST le comportement par défaut de ce patron — reverter exigerait un code neuf qui réécrit le brouillon local, une seconde source de vérité pour le champ, et un risque de clobber si l'auteur a déjà retapé pendant l'aller-retour. Je recommande le retrait de la proposition de revert plutôt qu'un compromis.

## Tests corrigés

| Test | Assertion (corrigée) | Niveau | Lot |
|---|---|---|---|
| `dossier-canon` — « 600 mots pile : aucun avertissement » | `getByText('600/600 mots')` présent ; l'élément **n'a pas** `data-etat="avertissement"` (jamais une assertion de couleur `var()`) | composant | 2 |
| `dossier-canon` — « 601 mots : avertissement du compteur » | `getByText('601/600 mots')` présent ; l'élément **a** `data-etat="avertissement"` ; le champ reste écrit (non bloqué) | composant | 2 |
| `dossier-canon` — « synopsis vidé puis blur : refus, rien reverté, bandeau global » | `DossierService.get(id).canon.mj.synopsis_mj` INCHANGÉ (ancien texte) ; le CHAMP affiche `''` (ce que l'auteur a tapé, pas de revert) ; `getByText("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")` visible ; `IssueList` rend le message exact de `dossierIssueRemediation` pour `canon.mj.synopsis_mj` (code `champ-requis-vide`) | composant | 2 |
| `IssueList.test.tsx` (neuf) — « rend un `DossierIssue[]`, un message par ligne » | liste de 2 `DossierIssue` fixture → 2 lignes, texte = `issue.message` | composant | 1 (contrat) |
