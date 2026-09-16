# Tour 1 — ux-designer — dossier-controles it7

RISQUE — le « point dur n° 2 » du cadrage (un objectif tout juste posé allumerait un BLOQUANT permanent) ne se vérifie **qu'à moitié**. `objectif-sans-chemin` ne peut PAS se déclencher sur un dossier écrit via l'UI actuelle : `ObjectifsCanon.tsx` n'a aujourd'hui **aucun widget qui écrive `reussi_si_expr`** (seul `reussi_si_texte`, prose libre) — la règle ne se déclenche que sur un import forgé à la main. `canon-sans-objectif`, lui, EST bloquant dès `DossierService.create()` — mais c'est le précédent **déjà accepté** depuis l'it1 (`texte_ouverture_joueur` bloquant à t=0), pas un cas neuf : le voyant rouge refusé (REJETÉ it1) était le **VERDICT GLOBAL affiché en bandeau**, pas une ligne du rapport.

OBJECTION — le critère exige qu'`objectif-sans-chemin` « nomme la feuille fautive » sans jamais afficher un id brut ni une clé de prédicat (registre de langue). **Aucune fonction du dépôt ne rend aujourd'hui une phrase française d'un `ExprNode`**, et l'arité 2 de `pnj_a_revele` casse tout gabarit à un seul patron. Je fournis un patron minimal en annexe, mais son extension aux 7 prédicats reste un arbitrage tech-lead/narratif.

PROPOSITION — badge/pastille : **zéro changement requis**. La règle d'élision (it2) et `plusGrave()` sont déjà génériques par section, `canon` compris (vérifié dans `sections.ts` / `pastilles.ts`). Chiffrable : 0 composant touché, 0 token neuf.

VERDICT — recevable sous réserve (patron du message d'`objectif-sans-chemin`, arité 2 comprise, à valider tour 2).

---

# ANNEXE — Contrat de design

**0. Constat général — aucune surface neuve.** Les deux règles vivent entièrement dans le registre `CONTROLES`, au même titre que les cinq précédentes. Zéro fichier de `components/` touché, zéro token neuf, zéro composant maison. L'anatomie OÙ/QUOI/QUOI FAIRE + pastille fusionnée (KR-218) est celle déjà livrée.

**1. Règle `canon-sans-objectif`**

- `niveaux: ['bloquant']`, `section: 'canon'`.
- **Condition exacte** : `dossier.canon.objectifs.length === 0`. Rien d'autre — pas de garde de vacuité inverse, la collection vide EST la cause.
- **location (OÙ)**, champ semé, calqué sur `PROSES_AMORCE` : « CANON · OBJECTIFS — décide si la partie est gagnée ou perdue ».
- **message (QUOI)** : « Aucun objectif n'est posé : rien ne dit au moteur quand cette aventure est gagnée ou perdue. »
  *Vérification anti-BUG-088* : la condition établit strictement « collection vide » ; le message n'affirme rien de plus — pas qu'une fin est inatteignable, seulement l'absence de définition de victoire/défaite.
- **remediation** : « Posez au moins un objectif (Objectifs). »
- `path` proposé : `'canon.objectifs'`. `entityId` : absent.
- **Pastille de section** : `canon` a `compte() = SANS_COMPTE` → badge « BLOQUANT » seul (règle d'élision d'it2, INCHANGÉE), ton `bad`. Si une alerte d'amorce coexiste, `plusGrave()` retient `'bloquant'` — comportement générique déjà testé, **zéro ligne de `pastilles.ts` à toucher. Vérifié, pas supposé.**
- **Clavier** : la ligne est un `<button>` natif déjà livré.

**2. Règle `objectif-sans-chemin`**

- `niveaux: ['bloquant']`, `section: 'canon'`.
- **Condition exacte**, par objectif, sur `reussi_si_expr` SEUL : l'expression existe ET au moins une feuille porte un couple prédicat/cible dont la table ne trouve aucun producteur — sous KR-224, `lieu_visite` et `lieu_courant_est` sont TOUJOURS productibles, la règle ne se déclenche donc JAMAIS sur ces deux prédicats. Gardes de silence : `reussi_si_expr === undefined` → silence (c'est `condition-sans-expr` qui parle) ; `canon.objectifs === []` → silence (c'est `canon-sans-objectif`) — jamais les deux causes sur le même dossier (KR-164).
- **location (OÙ)** : `localiserEntite('objectif', objectif, index)`.
- **message (QUOI)**, patron arité 1 : « Le prédicat « {label} » de cet objectif désigne {localisation de la cible}, que rien dans ce dossier ne peut produire : cette condition de réussite ne pourra jamais s'accomplir. »
  *Vérification anti-BUG-088* : la condition établit « zéro producteur pour CETTE cible précise » ; le message dit exactement cela — jamais « cet objectif est inatteignable » (une autre branche sous un `ou` pourrait réussir), toujours « cette condition ».
  **Extension arité 2 (`pnj_a_revele`)**, à valider : « … désigne {personnage} et {indice}, que rien dans ce dossier ne peut établir ensemble : … »
- **remediation**, générique : « Reliez cette condition à un fait que le dossier peut produire, ou choisissez un autre prédicat (Objectifs → Condition de réussite). »
- `path` : `'canon.objectifs[].reussi_si_expr'`. `entityId` : `objectif.id`.

**3. REJETÉ que je pose**

- **REJETÉ (UX) — nommer le prédicat par sa clé technique** (`indice_connu`, `pnj_a_revele`…) plutôt que `PREDICATES[…].label` : violerait le registre de langue et le précédent déjà en usage pour ce rôle.
- **REJETÉ (UX) — nommer la cible par son id brut** (ex. `indice.lettre-de-la-vigie`) : le seul précédent qui le fait sert un AUTRE axe (`severity: error`, jamais persisté, KR-225) ; `controles.ts` doit résoudre via `localiserEntite`, comme les trois règles qui le font déjà.
