# RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE** — Trois des champs de ce lot référencent des collections **sans aucun producteur** : `Savoir.indice_id` (requis), `Revelation.contrepartie.objet_id` et `Revelation.apres_indice_id` pointent vers `monde.indices[]`/`monde.objets[]`. Vérifié dans `brain/dossier/amorce.ts` : tout dossier créé aujourd'hui les sème à `[]` — aucun écran n'existe avant n°5/n°6 pour les peupler. Sans état dédié, ces Select rendent une liste vide muette, et « widgets fermés » devient un formulaire qu'aucun auteur ne peut jamais remplir.

**OBJECTION** — Le cadrage dit « Bloc 5 » (singulier) mais le code déjà livré (`BLOCS_VIDES`) tient TROIS emplacements d'accordéon séparés — `savoirs`/`relations`/`presence`, chacun déjà titré, itération 5 — qui préservent l'invariant testé depuis it1 (« accordéon à 8 emplacements », compte de placeholders qui diminue de 1 par bloc livré : 8→7→6→…). Fusionner en un seul bloc casse cet invariant et fabrique exactement le fichier monolithique que le point 4 du cadrage met en garde contre.

**PROPOSITION** — (1) Garder les 3 emplacements existants, titres inchangés (« Savoirs », « Relations », « Présence »), chacun extrait en composant propre (~100-150 l., précédent `BlocCaracteristiques.tsx`). (2) Reprendre tel quel le garde `objectifsCanon.length === 0` (précédent `TEXTE_AUCUN_OBJECTIF_CANON`) pour `indices`/`objets` — 3 textes nommés en annexe. (3) Étendre `Stepper` : `{value >= 0 ? prefix : ''}{value}` (1 ligne, additif) — sans quoi `confiance_min`/`intensite` négatifs s'affichent « +-2 ».

**VERDICT** — recevable sous réserve (3 emplacements conservés, états vides des collections sans producteur nommés, correctif Stepper dans le même lot).

---

## ANNEXE — contrat de design

### Architecture des 3 emplacements (inchangée dans `BLOCS_VIDES`, retirés de la table au fil du lot)

`{ id: 'savoirs', titre: 'Savoirs' }`, `{ id: 'relations', titre: 'Relations' }`, `{ id: 'presence', titre: 'Présence' }` — chacun extrait en `BlocSavoirs.tsx` / `BlocRelations.tsx` / `BlocPresence.tsx`, câblés dans `FichePersonnage.tsx` comme `BlocCaracteristiques`/`BlocPlanActions`. Remontage au changement de personnage hérité de `key={personnage.id}` sur `<Accordion>` — aucun de ces 3 blocs n'a besoin de ref d'identité propre.

### Bloc « Savoirs »

- Légende (`legendeStyle`, sous l'eyebrow) : *« Ce que ce personnage sait des indices du monde, et sous quelle condition il vous le révèle. »*
- **État vide de collection** (`monde.indices.length === 0`) : remplace TOUT le corps du bloc, aucun bouton d'ajout rendu — `TEXTE_AUCUN_INDICE_CANON = "Aucun indice défini dans le canon — ce personnage ne pourra rien révéler tant qu'aucun n'existe."` (précédent `TEXTE_AUCUN_OBJECTIF_CANON`, mot pour mot le même moule).
- **Ajout** : `indice_id` étant requis (pas de sentinelle « aucun »), l'affordance n'est PAS le bouton pointillé habituel mais un `Select` dédié dont la première option est un intitulé d'action, jamais une vraie valeur : `{ value: '', label: '+ Ajouter un savoir sur…' }` suivi des indices (`localiserEntite('indice', …)`). Choisir une vraie option committe la ligne immédiatement avec `indice_id` posé ; le Select revient ensuite à son placeholder pour l'ajout suivant. Aucune ligne locale « à moitié écrite » n'existe pour ce champ.
- **Ligne d'un savoir** (`ligneStyle`, bordée, précédent étape) :
  - En-tête : eyebrow `SAVOIR N` + `IconButton` « Retirer le savoir n°N », `tone="danger"`.
  - `Select` « CERTITUDE » (`CERTITUDES`), labels `Sait`/`Croit`/`Soupçonne` ; valeur initiale à l'ajout = constante nommée `CERTITUDE_INITIALE = 'sait'` (jamais `CERTITUDES[0]` implicite — précédent `PORTEE_INITIALE`).
  - `Field` « COMMENT IL LE RÉVÈLE », hint *« interne — didascalie pour l'IA, injectée seulement si la porte s'ouvre »*, multiline rows=2, placeholder *« Elle sort la lettre d'une poche cousue dans sa cape, sans un mot. »*
  - Légende des 4 portes : *« Chaque porte est optionnelle ; un savoir sans aucune porte ouverte ne se révèle jamais de lui-même. »*
  - **Porte CONFIANCE** : bouton pointillé `+ Exiger un niveau de confiance…` → `Stepper` « CONFIANCE MINIMALE », `min=CONFIANCE_MIN max=CONFIANCE_MAX`, prefix sign-aware, + `IconButton` « Retirer cette porte » (efface `confiance_min`).
  - **Porte JET** : `+ Exiger un jet…` → `Select` « CARACTÉRISTIQUE » (`CHARACTERISTIC_VALUES`) + `Select` « DIFFICULTÉ » (`CHALLENGE_TIER_VALUES`, labels `TC1`…`TC4`) + retirer.
  - **Porte CONTREPARTIE** : `+ Exiger une contrepartie…` → `Select` « OBJET » (`monde.objets`) + `Toggle` « CONSOMMÉ À L'USAGE » + retirer. Si `monde.objets.length === 0`, l'affordance est remplacée par `TEXTE_AUCUN_OBJET_CANON = "Aucun objet défini dans le canon — cette porte restera indisponible tant qu'aucun n'existe."`
  - **Porte INDICE PRÉALABLE** : `+ Exiger un indice déjà connu…` → `Select` « INDICE PRÉALABLE » (`monde.indices`, hors l'indice propre à ce savoir) + retirer ; même garde `TEXTE_AUCUN_INDICE_CANON` si vide.

### Bloc « Relations »

- Légende : *« Comment ce personnage se sent envers un autre — l'intensité n'est jamais lue par le joueur. »*
- État vide (aucun AUTRE personnage) : `TEXTE_AUCUN_AUTRE_PERSONNAGE = "Aucun autre personnage à qui rattacher une relation — créez-en un second dans cette section."`
- Ligne : eyebrow `RELATION N` + retirer ; `Select` « PERSONNAGE » (`cible_id`, autres personnages, `collectIds`/`localiserEntite`) ; `Field` « CE QUI LES LIE » multiline rows=2, hint *« interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur »*, placeholder *« Elle lui doit la vie depuis l'incendie du beffroi, et ne l'a jamais dit à personne. »* ; `Stepper` « INTENSITÉ » signée `-3..+3`, prefix sign-aware, légende sous le stepper *« − hostilité, + attachement »* ; `Toggle` « SECRÈTE — n'entre jamais dans ce que le modèle voit d'un rôle qui ne doit pas la connaître ».
- Ajout : même traitement Select-comme-geste-d'ajout que Savoirs (`cible_id` requis).

### Bloc « Présence »

- Légende : *« Où l'on peut trouver ce personnage, et à quel moment. »*
- État vide (`monde.lieux.length === 0`) : `TEXTE_AUCUN_LIEU_CANON = "Aucun lieu défini dans le canon — ce personnage ne pourra être situé tant qu'aucun n'existe."`
- Ligne : eyebrow `PRÉSENCE N` + retirer ; `Select` « LIEU » (`lieu_id`) ; `Field` « QUAND » (optionnel, une ligne, précédent `échéance`), placeholder *« Au crépuscule, avant que le marché ne ferme. »*, hint à figer selon la destination tranchée ce tour (`auteur` → *« interne — note d'auteur, jamais lue par le modèle »*, précédent exact `HINT_BUT_ECHEANCE`).

### Clavier (tous blocs)

Entrée dans un `Select` ferme la liste native, pas de comportement custom. `Field` multiline : Entrée insère une ligne (jamais de soumission implicite). Chaque `IconButton` « Retirer » est atteignable au Tab immédiatement après son champ. Aucune modale dans ce lot — pas de piège de focus à gérer.
