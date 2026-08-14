# NOTE DE TOUR 2 — narratif-ia — `dossier-fiches` it5

**RÉPONSE NOMINATIVE — à ux-designer et à qa, sur la frontière.**
**ux-designer**, ta légende Relations dit « l'intensité n'est jamais lue par le joueur » : vrai, mais ce n'est pas l'invariant. `intensite` est `moteur` — ni le joueur **ni le modèle** ne la lisent. Légende corrigée en annexe. Et ton libellé de `secret` (« n'entre jamais dans ce que le modèle voit d'un rôle qui ne doit pas la connaître ») recopie mot pour mot la tautologie que j'ai objectée au tour 1 : texte exact en annexe, dérivé du prédicat § C, pas une reformulation libre.
**qa**, ton cas limite « `secret` coché → ligne exclue du contexte du rôle non habilité » n'est **pas instrumentable en it5** : aucun assembleur n'existe, ce test fabriquerait la n° 10 pour pouvoir la tester. Testable ici : le drapeau persiste et se relit ; le prédicat est présent **aux deux sites** (JSDoc + commentaire de ligne de table) et nulle part ailleurs. L'exclusion réelle s'instrumente à la n° 10, avec son assembleur.

**TROIS TRANCHAGES.** `presence[].quand` → **`auteur` : maintenu** (tech-lead § B le confirme, même motif). `relations[].intensite` → **`moteur` : maintenu et durci** — registre `INTENSITES` neuf, jamais `CONFIANCES` ; tech-lead arrive à la même conclusion par les échelles. Gating de `secret` → **durci** : savoirs partant en it6, `relations[]` devient la **seule** famille d'it5 à injection dépendante du rôle — la phrase entre dans le **lot contrat**, pas au lot feature.

**§ F (R4 · acteur) — consigné, PAS dans § 4 bis.** L'écrire dans le plan d'it5 crée un second site pour un contrat que possède la n° 12 : c'est la duplication que je bloque par ailleurs. Trace suffisante : une ligne d'`open_questions` renvoyant à `.claude/raffinage/dossier-fiches-it5/tour1-narratif-ia.md` § F.

**VERDICT — recevable** (périmètre relations + présence, réserves 1 et 3 dans le lot contrat).

---

## ANNEXE (hors quota)

### A. `Relation.cible_id` — docstring exacte pour le lot contrat (`src/brain/dossier/types.ts`)

Tabulations, idiome de `Personnage.objectif_id`. À poser telle quelle, sans reformulation :

```ts
	/**
	 * Référence vers `monde.personnages[].id`. MOTEUR : un identifiant est un
	 * HANDLE, résolu par le code, jamais injecté tel quel — même règle que
	 * `objectif_id` et `charpente.depart.lieu_id`. Une référence orpheline est
	 * EXPOSÉE par `validateDossier`, jamais filtrée au rendu (KR-021).
	 *
	 * CE QU'IL RÉSOUT N'EST PAS ENCORE INJECTABLE, et c'est écrit ici pour que la
	 * n° 10 trouve les deux moitiés du problème au même endroit : le `nom` de la
	 * cible est destination `auteur` (KR-195, question transverse aux collections
	 * nommées, NON rouverte par cette feature). Une ligne de relation injectée
	 * aujourd'hui donnerait donc « son créancier » SANS DIRE DE QUI — la moitié
	 * de l'information. La moitié manquante est l'`open_question` « appellation
	 * re-projetée par le CODE à l'assemblage, jamais une seconde clé au schéma »
	 * (`specification.json`, n° 10 propriétaire) : la réponse est une projection
	 * de l'assembleur, PAS une bascule de `nom` vers `ia`, PAS un champ
	 * `appellation` de plus sur ce type.
	 *
	 * L'AUTO-RÉFÉRENCE EST LÉGALE (KR-194) : `cible_id === personnage.id` ne porte
	 * ni garde ni filtre — c'est une didascalie de conflit intérieur, jouable
	 * telle quelle. La n° 10 la rendra « envers lui-même » plutôt qu'en répétant
	 * le nom ; ce n'est pas une question de schéma.
	 */
	cible_id: string
```

Le troisième paragraphe (KR-194) est celui que tech-lead demande en § D et que qa veut tester : il doit exister **à un seul site**. S'il est écrit ici, il ne se recopie ni dans `BlocRelations.tsx` ni dans le test.

### B. Le site jumeau dans `destinations.ts` — un pointeur, jamais une copie

```ts
	// Un identifiant est un HANDLE technique : le code le résout, le modèle reçoit
	// le CONTENU. ⚠ ce qu'il résout n'est PAS injectable aujourd'hui (`nom` est
	// `auteur`, KR-195) — le raisonnement complet est au JSDoc de `Relation.cible_id`.
	'monde.personnages[].relations[].cible_id': 'moteur',
```

Les trois autres lignes (`lien` `ia`, `intensite` `moteur`, `secret` `moteur`) et les deux lignes de présence restent celles de ma § B / § A du tour 1, inchangées.

### C. Deux textes d'UI à figer (réponse à ux-designer)

- Légende du bloc Relations : *« Comment ce personnage se sent envers un autre — l'intensité reste au moteur ; c'est CE QUI LES LIE que le modèle joue. »*
- Libellé du `Toggle` `secret` : *« SECRÈTE — seul ce personnage la connaît : elle n'entre jamais dans le contexte du narrateur, ni dans celui d'un autre personnage. »* (dérivé du prédicat § C tour 1, forme courte ; le prédicat complet reste au JSDoc de `Relation.secret`.)

### D. Contrat de sortie IA de cette itération : **aucun**

It5 n'appelle aucun modèle, n'expose aucune route worker, ne consomme aucune sortie. Le contrat R4 · acteur (entrée injectée, schéma `{ replique, indices_reveles, delta_confiance }`, rejeu → repli déterministe) reste tel qu'écrit au tour 1 § F, propriété de la n° 12 `moteur-acteurs`. Rien à répercuter dans le plan.
