## Note UX-Designer — tour 2 (contre-lecture) — dossier-fiches it7

**RISQUE** — Le registre QUOI FAIRE n'est pas scopé à it7 : `reference-pendante` et `texte-trop-long` sont rendus tels quels par `dossier-format` (import) ET `dossier-canon` (bandeau `PanneauLieux`), avec assertions verbatim dans `validate.test.ts`. Amender un seul des deux codes ici laisse l'autre dans l'état que le commentaire d'`issues.ts:94-100` nomme lui-même (BUG-042/KR-171) : une consigne qui n'est vraie que dans une des versions où elle s'affiche.

**OBJECTION** — À narratif-ia, nommément : le texte proposé pour `reference-pendante` me convient tel quel — sobre, vrai à l'import comme en édition, cohérent avec `identifiant-invalide`/`racine-manquante`. Mais s'arrêter là laisse `texte-trop-long` (« l'import n'est pas bloqué », déjà rendu par `FichePersonnage.tsx`) porter le même défaut à moitié réparé : même classe, même fichier, même comité. Je l'amende dans la même passe.

**PROPOSITION** — Voir annexe pour les trois textes exacts. Sur les points du tech-lead et de QA : (1) confirme la garde en ligne — mon annexe tour 1 plaçait déjà l'état dans `PanneauPersonnages.tsx` ; ce n'est pas un déplacement, c'est un raffinement du même propriétaire. Bouton inchangé : `FichePersonnage.tsx`, fin de `champsStyle`, avant le bandeau de refus, via `onRetirer`. (3) Tranche pour QA : texte fixe générique, pas d'énumération dynamique — coût de dérivation disproportionné pour un gain que le texte peut obtenir par une seule reformulation (annexe).

**VERDICT** — recevable, aucun veto. Mon objection tour 1 (généralisation du précédent Lieu) : retirée — satisfaite par le consensus modale du tour 1.

---

## Annexe — textes exacts amendés

**`issues.ts:93` (`reference-pendante`, confirmé sans amendement du tech-lead) :**
`↪ Corrigez « {champ} » ou rétablissez l'élément correspondant.`

**`issues.ts:103` (`texte-trop-long`, amendement neuf, même motif) :**
`↪ Resserrez le texte si possible ; ce n'est pas bloquant.`
(retire « l'import » — faux en édition ; remplace par un rappel de sévérité valable dans les deux surfaces)

**Corps de `RetirerPersonnageDialog.tsx`, tranché pour QA (remplace le texte tour 1) :**
`Le personnage « Aldûr le Sage » sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`
Repli sans nom : `Le personnage n°4 (sans nom) sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`
— « tout contenu déjà renseigné » évite de sur-déclarer une perte sur un personnage à peine amorcé, sans introduire d'énumération conditionnelle par bloc.

**Annexe tour 1, section 3 (repli sans modale)** : caduque, à retirer — la modale est retenue.
