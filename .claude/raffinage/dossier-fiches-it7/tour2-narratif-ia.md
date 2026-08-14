## Note — NARRATIF & IA · `dossier-fiches` it7 « retrait d'un personnage » · tour 2 (contre-lecture)

**RISQUE** — La classe corrigée n'est pas fermée par deux textes. Après amendement, `DOSSIER_ISSUE_LABELS` compte encore quatorze consignes qui disent « puis réimportez-le » / « dans le fichier », et `DossierService.update` revalide le document entier : tout code que `validate.ts` sait produire peut atterrir sous une fiche. `champ-requis-vide` et `element-non-objet` sont les plus proches. Le lot ferme les deux occurrences constatées ; la spec ne doit pas l'écrire comme s'il fermait KR-171.

**OBJECTION** — Au tech-lead, nommément, sur son invariant C.1 : le veto est le bon, sa formulation est trop étroite. « Aucun prédicat de pré-vol » n'interdit pas les deux formes qui arrivent en premier dans un panneau — `disabled={estReference(personnage)}` sur le bouton, et une phrase de modale conditionnée aux référents. Les deux recomptent la règle du SSOT, l'une en TSX, l'autre en français, et les deux se trompent sur KR-194. Le bouton est toujours actif, la modale toujours muette.

**PROPOSITION** — 1. Les deux textes UX sont adoptés tels quels ; ils passent mes trois contrôles (annexe A). 2. Veto reformulé en une phrase citable : « aucun code ni aucune phrase du panneau ne dépend de qui référence le personnage ; le bouton de retrait n'est jamais désactivé ». 3. Pas de KR neuf : KR-171 couvre déjà la classe, et « la prose ne se scanne jamais par nom » est une 1re occurrence — note de comité + une ligne d'`open_questions` (annexe B).

**VERDICT** — recevable sous réserve (2 et 3 écrits en spec avant codage).

### Statut de mes points du tour 1

| # | Point | Statut |
|---|---|---|
| OBJ 1 | `issues.ts:93` « puis réimportez-le » impossible dans l'éditeur | Maintenue — satisfaite par le texte amendé, élargie par le tech-lead à `texte-trop-long` (l.103), confirmé : `FichePersonnage.tsx:319` rend déjà `IssueList` sur les `warnings`. |
| OBJ 2 | Aucun pré-vol de référence côté feature | Durcie en veto, alignée sur C.1 du tech-lead, étendue à l'état désactivé du bouton et à la copie de la modale. |
| PROP 1 | Trois tests (relation tierce / `pnj_a_revele` imbriqué / auto-référence) | Maintenue — le test imbriqué reste non négociable. |
| PROP 2 | Interdit écrit en spec | Maintenue, fusionnée dans le veto ci-dessus. |
| PROP 3 | Texte de `issues.ts:93` | Maintenue — le texte UX est mot pour mot le mien ; j'ajoute le second (l.103). |
| PROP 4 | Un KR « la prose ne se scanne jamais par nom » | Retirée en tant que KR. Seuil du dépôt = 3e occurrence ; ceci est une 1re. Reconduite en note de comité + `open_questions`. |

---

## Annexe A — pourquoi les deux textes passent

1. **Vrais sur TOUTES les surfaces où le registre les rend.** « rétablissez l'élément correspondant » est vrai dans la modale d'import comme sous une fiche ; « ce n'est pas bloquant » l'est aussi.
2. **Référence par identifiant, jamais par nom libre.** Le QUOI FAIRE pointe `{champ}`, résolu par `feuilleDe(issue.path)` dans le registre ; le OÙ est résolu par `sitesDe`/`localiserEntite`. Rien n'est interpolé côté feature.
3. **Résiduel assumé, hors périmètre.** `{champ}` imprime une feuille de schéma : vocabulaire moteur sous les yeux de l'auteur, pertinent à l'import, discutable dans l'éditeur. Ne pas le « corriger » en it7 — poser sur `dossier-controles` (n°7).

**Tests.** Les assertions à chaîne exacte cassées se réécrivent sur `issue.code`. Exception voulue : une assertion sur `dossierIssueRemediation` épinglant l'ABSENCE de « réimportez » pour ces deux codes — garde de récurrence de KR-171.

## Annexe B — ligne à reporter telle quelle en `open_questions`

« Retirer une entité laisse son NOM dans la prose destinée `'ia'` (15 champs listés en `tour1-narratif-ia.md`, annexe A). Aucun code ne résout ces mentions et aucun ne doit le faire : un scan par `nom` rouvrirait la référence par nom libre que CLAUDE.md interdit. 1re occurrence relevée (it7, personnage) — pas de KR avant la 3e. Charge portée par la n° 10 (contexte), qui injecte ces champs tels quels. »

## Annexe C — contrat de sortie IA

Inchangé depuis le tour 1 : it7 ne déclenche aucun appel modèle. Deux conséquences aval (n°10 injection de prose devenue factuellement fausse ; n°9+ session indexant `monde.pnj.<id>.a_dit[]` rendue pendante) restent à NOMMER dans la spec, pas à traiter dans ce lot.
