# TOUR 2 — Narratif & IA · `dossier-fiches` it2

## RÉPONSES AUX OBJECTIONS

**`tech-lead` (« rien du tout dans `tables.ts` »)** — conclusion juste, motif faux, et le vrai motif est plus fort que le sien. Le précédent n'est pas `Lieu` seul : `destinations.ts` porte **8 chemins de prose `ia` déjà livrés sans budget** (`canon.ton`, `canon.interdits_ton[]`, `plan_actions[].action`, `savoirs[].revele_comment`, les 3 de `lieux[]`, `evenements[].resolutions[].resultat`), quand `BUDGETS_DE_MOTS` n'en couvre que 3 (`canon.mj`, `canon.partage`, `jalons[].enonce_texte`). Deux des huit — `ton`, `interdits_ton` — sont **toujours chargés**, donc plus lourds par tour que n'importe quelle fiche. Budgéter les 9e–11e donnerait un instrument qui avertit à 61 mots sur `apparence` et se tait sur un `ton` de 900 : le silence cesserait de signifier « sous budget ». Incohérent, donc pire que rien — motif de mon poste, pas de son calendrier.

**Chiffres demandés** : par tour, 1 lieu courant × 3 proses (il *reste* en contexte tant que le joueur ne bouge pas) contre N PNJ en scène × 3 (n° 12 : un appel par PNJ qui parle) → 3:1 à N=3. Pas une différence de nature. Ma phrase du tour 1 (« un lieu entre une fois par déplacement ») était fausse ; je la retire.

**`qa`** — d'accord sur `refuse`, et je durcis : le `warning` de budget, lui, serait pleinement instrumenté. Ce qui manque n'est pas l'instrument, c'est la cohérence du périmètre.

**`ux`** — le coût d'écran est plus bas que dit : un budget se rend par un `<p data-etat>` sous le `Field` (précédent `PanneauCanon.tsx`), pas un bandeau ; KR-183 y est satisfait sans surface neuve. Argument disponible, je ne m'en sers pas.

## STATUT DE MES OBJECTIONS

1. **Discriminant** des trois champs non écrit — **MAINTENUE** (docstrings + placeholders ; ceux d'UX conviennent).
2. **Régime** « injecté, jamais émis verbatim », aucun renommage — **MAINTENUE**, non contestée.
3. **Budget de mots** — **RETIRÉE**.

## POSITION FINALE SUR LE BUDGET

Retirée. Repli : (a) rien dans `tables.ts`/`validate.ts`/`validate.test.ts` — je signe la liste « non touchés » ; (b) ce qu'on perd : **rien d'irréversible** — un budget est un `warning` non bloquant, il ne rejette aucun document, ne touche pas `schema: 1`, n'exige aucune migration (l'inverse d'une borne), et aucun dossier d'auteur réel n'existe ; (c) la charge part en **une** `open_questions` nommant les **11 chemins** (8 livrés + 3 entrants) comme un seul balayage — n° 10 pour les nombres, n° 7 pour le rendu par section. **Pas un KR** : une règle que 8 chemins livrés violent déjà se désactive dans le mois.

## VERDICT

**Recevable sous réserve** — objections 1 et 2 au lot contrat ; budget retiré ; découpage 2 lots signé.

---

## ANNEXE — FIXTURES VÉRIFIÉES

### Identifiants réels relevés

`__fixtures__/dossier-minimal.json` — **un seul** personnage : `pnj.aldur-le-sage` (l. 54 ; `portee: premier`, `camp: protagoniste`, `objectif_id: objectif.refermer-le-sceau`).

`__fixtures__/dossier-reference.json` — **six** : `pnj.selene-la-vigie` (l. 53), `pnj.corvin-le-marchand` (l. 75), `pnj.mira-la-guerisseuse` (l. 89), `pnj.tobin-le-gamin` (l. 117), `pnj.harek-le-forgeron` (l. 137), `pnj.aubry-l-intendant` (l. 151).

### Confirmation / correction de la proposition `tech-lead`

- **Minimale — CONFIRMÉ, et obligatoire, pas un choix** : les trois champs sur `pnj.aldur-le-sage`. `couverture.test.ts` balaie `dossier-minimal.json`, et « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » rougit sans instance.
- **Référence — CORRIGÉ** : « au moins 1 PNJ sur 6 » laisse la répartition au jugé d'un agent qui ne peut pas demander. Répartition nommée, sur identifiants vérifiés :
  - les **trois** sur `pnj.corvin-le-marchand` — vérifié `portee: premier`, **sans `camp` ni `objectif_id`** : prouve que l'identité ne dépend pas du rattachement ;
  - `fonction` **seule** sur `pnj.harek-le-forgeron` : une fiche partielle est un état calme ;
  - **aucun des trois** sur `pnj.tobin-le-gamin` (`portee: second`) : « absent ≠ vide » ;
  - les trois autres inchangés.
- **Contrainte vérifiée** : `suffisance.test.ts` exige clés(référence) ⊆ clés(minimale). Satisfait puisque la minimale porte les trois.
- **Correction de mon propre tour 1** : « prose courte obligatoire, `couverture` exige `warnings === []` » tombe avec le budget. Aucune contrainte de longueur ne s'applique, aucun `BUDGETS_DE_MOTS` ne couvrant ces chemins.

### Test nommé — modèle à copier

Copier **`couverture.test.ts` l. 451** (`camp`/`objectif_id`, *les DEUX fixtures*), **pas** l. 426 (proses de `Lieu`, minimale seule) : un champ instancié dans la minimale mais absent d'une aventure réelle « resterait vert partout ». Assertion sur la **valeur** (`` `${chemin} → ia` ``), jamais sur l'existence (KR-174).

### Piège du motif `PROSE_D_ENTITE_LIBRE`

Le tech-lead propose de généraliser la parenthèse « aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]` ». Factuellement vrai aujourd'hui, mais cette parenthèse n'est **vérifiée par rien**, et le garde d'auto-nettoyage ne porte que sur la corruption : le jour où la n° 7 / n° 10 posent le budget, la dispense affirmera silencieusement le contraire du dépôt. Deux issues :

1. **retirer la parenthèse** — le motif réel de la dispense est la corruption numérique non arbitrée par le schéma 1, la longueur n'y est pour rien ; ou
2. la garder **avec son assertion** exécutable.

Je recommande (1) : moins de texte, et une dispense qui ne dit que sa vraie raison.

### Report inchangé

Contradiction prose / caractéristique (`apparence` « très fort » vs `stats.FO`) : propriétaire n° 10. it2 ne livre que le `hint` — « l'apparence décrit, elle ne chiffre pas ».
