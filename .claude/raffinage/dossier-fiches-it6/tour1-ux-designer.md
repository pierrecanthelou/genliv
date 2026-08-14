RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE** — `FichePersonnage.tsx` (417 l.) et `useEcriturePlan.ts` (415 l.) sont déjà au-dessus du signal KR-112 avant que ce lot n'écrive une ligne. Écrire le contenu de Savoirs dans `FichePersonnage.tsx` avant d'extraire `BlocSavoirs.tsx` — comme la dette s'est déjà déplacée sans se résorber à it4/it5 — le repasse mécaniquement au-dessus, l'exact avertissement du plan.

**OBJECTION** — Le cadrage dit « zéro lot contrat » (vrai pour schéma/tables/destinations) mais ne nomme aucun registre de LIBELLÉS pour `Certitude` (`sait`/`croit`/`soupconne`) : sans lui le Select afficherait les clés internes brutes — l'erreur que `LIBELLES_CAMP`/`LIBELLES_PORTEE` existent déjà pour éviter. Et mon jet d'it5 (légende à la 2e personne « …il vous le révèle », « + Ajouter un savoir sur… ») rompt le moule terse à la 3e personne fixé depuis par `BlocRelations`/`BlocPresence` : il tient sur l'anatomie, pas mot pour mot.

**PROPOSITION** — (1) Extraire `BlocSavoirs.tsx` dès le premier commit du lot feature (~150-180 l.), jamais après. (2) Ajouter `LIBELLES_CERTITUDE` dans `FichePersonnage.tsx`, précédent `LIBELLES_CAMP`. (3) Réaligner légende et libellé d'ajout sur le moule d'it5 (textes exacts en annexe) ; nommer `CERTITUDE_INITIALE`/`JET_CARAC_INITIAL`/`JET_TC_INITIAL`/`CONTREPARTIE_CONSOMME_INITIALE`, jamais un index de registre implicite (précédent `PORTEE_INITIALE`). (4) `avertissementsD1Affiche` filtre par PRÉFIXE de chemin, pas par famille D1 : il captera sans wiring neuf l'avertissement « aucune condition de révélation » déjà écrit en `validate.ts` — zéro bandeau à construire, mais un nom de variable désormais trompeur, à signaler au tech-lead.

**VERDICT** — recevable sous réserve (extraction immédiate de `BlocSavoirs.tsx`, `LIBELLES_CERTITUDE` ajouté, textes réalignés sur le moule d'it5).

---

## ANNEXE — contrat de design

### Architecture

`BlocSavoirs.tsx` (nouveau, extrait dès l'écriture) reçoit `personnage.savoirs`, `monde.indices`, `monde.objets`, et les handlers du hook `useEcritureSavoirs.ts` (précédent `useEcritureRelationsPresence.ts`). Câblé dans `FichePersonnage.tsx` comme `BlocRelations`/`BlocPresence` (bloc 7 de l'accordéon, `BLOC_7_ID = 'savoirs'`, retiré de `BLOC_SAVOIRS`/`sectionPlaceholder`). Styles réutilisés tels quels : `eyebrowStyle`, `legendeStyle`, `listeLignesStyle`, `ligneStyle`, `enTeteLigneStyle`, `boutonPointilleStyle` — aucun style neuf. `LIBELLES_CERTITUDE: Record<Certitude, string> = { sait: 'Sait', croit: 'Croit', soupconne: 'Soupçonne' }` posé à côté de `LIBELLES_CAMP`/`LIBELLES_PORTEE` dans `FichePersonnage.tsx`.

### Légende de bloc

`LEGENDE_SAVOIRS = "Ce que ce personnage sait d'un indice, et la manière dont il le révèle — la certitude et le texte sont joués par le modèle ; les quatre portes de révélation restent au moteur."`

### État vide de collection (gate le corps entier, aucun bouton rendu)

`monde.indices.length === 0` → `TEXTE_AUCUN_INDICE_CANON = "Aucun indice défini dans le canon — ce personnage ne pourra rien révéler tant qu'aucun n'existe."` (moule identique à `TEXTE_AUCUN_LIEU_CANON`).

### Ajout (`indice_id` requis → Select-comme-geste-d'ajout, précédent `cible_id`/`lieu_id`)

`TEXTE_AJOUTER_SAVOIR = '+ Ajouter un savoir…'` — Select `ariaLabel="Ajouter un savoir"`, options `[{ value: '', label: TEXTE_AJOUTER_SAVOIR }, ...indices.map(...)]` via `localiserEntite('indice', indice, index)`. Choisir une option committe immédiatement `{ indice_id, certitude: CERTITUDE_INITIALE }` ; le Select revient à son placeholder.

### Ligne d'un savoir (`ligneStyle`, bordée)

- En-tête (`enTeteLigneStyle`) : eyebrow `SAVOIR ${index+1}` + `IconButton` `Retirer le savoir n°${index+1}`, `tone="danger"`, `size={HIT_TARGET_MIN}`.
- `Select` label `"CERTITUDE"`, options `CERTITUDES` via `LIBELLES_CERTITUDE`, valeur initiale `CERTITUDE_INITIALE = 'sait'` (constante nommée, jamais `CERTITUDES[0]` implicite).
- `Field` label `"COMMENT IL LE RÉVÈLE"`, hint `"injecté au modèle uniquement quand une porte s'ouvre — jamais un dialogue verbatim"`, `multiline rows={2}`, placeholder `"Elle sort la lettre d'une poche cousue dans sa cape, sans un mot."`, brouillon-par-champ, commit au blur (précédent `lien`/`quand`).
- Légende des 4 portes : `LEGENDE_PORTES = "Chaque porte est optionnelle ; un savoir sans aucune porte ouverte ne se révèle jamais de lui-même : un avertissement le signale, sans bloquer l'enregistrement."`

### Les 4 portes — état fermé = `boutonPointilleStyle`, état ouvert = widgets fermés + retrait

Chaque porte, une fois ouverte, committe TOUTES ses clés en un seul geste (même doctrine que la CTA caractéristiques d'it3 : jamais une clé structurée partiellement écrite).

1. **Confiance** — fermé : `"+ Exiger un niveau de confiance…"`. Ouvert : `Stepper` `"CONFIANCE MINIMALE"`, `min=CONFIANCE_MIN max=CONFIANCE_MAX prefix="+"` + `IconButton` `"Retirer la porte de confiance"` (efface `confiance_min`).
2. **Jet** — fermé : `"+ Exiger un jet…"`. Ouvert (commit conjoint `{carac: JET_CARAC_INITIAL, tc: JET_TC_INITIAL}`, constantes = premières valeurs des registres) : `Select` `"CARACTÉRISTIQUE"` (`CHARACTERISTIC_VALUES`, label `CHARACTERISTICS[carac].label`) + `Select` `"DIFFICULTÉ"` (`CHALLENGE_TIER_VALUES`, label `${tc} · ${CHALLENGE_TIERS[tc].label}` — ex. « TC1 · Simple ») + `IconButton` `"Retirer la porte de jet"`.
3. **Contrepartie** — fermé : `"+ Exiger une contrepartie…"`. Si `monde.objets.length === 0`, remplacé par `TEXTE_AUCUN_OBJET_CANON = "Aucun objet défini dans le canon — cette porte restera indisponible tant qu'aucun n'existe."`. Ouvert (commit conjoint `{objet_id: objets[0].id, consomme: CONTREPARTIE_CONSOMME_INITIALE=false}`) : `Select` `"OBJET"` (`localiserEntite('objet', …)`) + `Toggle` `"CONSOMMÉ À L'USAGE"` + `IconButton` `"Retirer la porte de contrepartie"`.
4. **Indice préalable** — fermé : `"+ Exiger un indice déjà connu…"`. Ouvert : `Select` `"INDICE PRÉALABLE"` (`monde.indices`, sans filtrer l'indice du savoir lui-même — même doctrine que `relations[].cible_id`, KR-194 : aucune garde tant qu'aucun besoin produit réel ne l'exige) + `IconButton` `"Retirer la porte d'indice préalable"`. Même garde `TEXTE_AUCUN_INDICE_CANON` si `monde.indices` vide (cas déjà couvert par l'état vide du bloc entier).

### Clavier

Ouvrir une porte (clic/Entrée sur le bouton pointillé) déplace le focus vers son premier contrôle (précédent `BlocCaracteristiques`, DOM impératif via `useEffect` post-commit) ; `IconButton` « Retirer cette porte » ramène le focus sur le bouton pointillé qui réapparaît. `Select` ferme natif à Entrée ; `Field` multiline insère une ligne, jamais de soumission implicite. Aucune modale dans ce lot.
