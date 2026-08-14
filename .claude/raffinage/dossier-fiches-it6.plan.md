# Plan d'itération — `dossier-fiches` · itération 6

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-14
> Composition : `5 rôles` — motif : le bloc touche le gating de révélation (`revele_si`, 4 portes) et la destination `ia`/`moteur` de `savoirs[]` — frontière code/IA directe, même terrain que `relations[].secret` en it5.
> Exécution : `séquentielle` (1 lot, marqué `contrat`)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur peut donner un savoir à son personnage — ce qu'il sait, comment il le révèle, sous quelles conditions. » |
| **Tranche** | Bloc 7 de l'accordéon (Savoirs) → `useEcritureSavoirs.ts` → `commit()` du socle → `DossierService.update()` → persistance. Aucune route `brain/` neuve : le schéma `Savoir`/`Revelation` est complet depuis `dossier-format` n° 1 — le lot ne fait que corriger 3 commentaires faux dans `destinations.ts`, ajouter 2 constantes de graine, et décharger `FichePersonnage.tsx` (KR-112) avant d'y câbler le bloc. |
| **Lots** | 1 lot · dont `contrat` : oui (touche `brain/dossier/types.ts`, `destinations.ts`, `index.ts` — corrections de commentaires + 2 constantes, zéro ligne de schéma/table) |
| **Hors périmètre** | retrait d'un personnage (it7) · caractère exploitable (it8) · l'éditeur de `monde.indices[]`/`monde.objets[]` (n° 5/n° 6 — ce lot les CONSOMME, ne les produit pas) · les libellés dérivés d'une valeur numérique pour un contexte de modèle (n° 10) · le contrat de sortie IA « R4 · acteur » qui consommera ces savoirs (n° 12) · le correctif du bug hérité `BlocPresence.tsx` (BUG-074, régression M1 non liée à ce lot) |
| **Reporté** | `open_questions` n° 6 (propriétaire) : `indices[].verite` / la formulation jouée du savoir — sans elle un savoir injecté n'a aucun contenu, seulement sa condition ; contrat de sortie IA R4 · acteur (n° 12), esquissé en annexe narratif-ia du raffinage d'it5 et de ce tour, volontairement pas écrit ici |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut donner un savoir à son personnage — ce qu'il sait d'un indice du canon, comment il le révèle, et sous quelles conditions (confiance, jet, contrepartie, indice préalable déjà connu).

## 2 — Hors périmètre

- Retrait d'un personnage (it7) et caractère exploitable / curseurs (it8).
- L'écran qui crée `monde.indices[]`/`monde.objets[]` (`dossier-registres` n° 6 / `dossier-objets` n° 5) — ce lot ne fait que les lire ; tant qu'ils sont vides, les portes concernées sont indisponibles (état vide nommé), jamais un blocage du reste du bloc.
- Le libellé dérivé d'une valeur numérique de jeu (seuil de confiance, TC, curseur) pour un contexte de modèle — hors périmètre décision A, propriété de n° 10, déjà REPORTÉ par it3/it5.
- Le contrat de sortie IA « R4 · acteur » (n° 12) qui recomposera ces savoirs en `{rang, contenu, certitude}` pour le modèle — esquissé en annexe (§ 12 ci-dessous) comme note de comité, pas écrit en code ici.
- La correction du bug hérité de `BlocPresence.tsx` (`presence[]` déjà écrites masquées par un état vide non gated sur sa propre collection, même défaut que le must-fix M1 d'it5 sur `BlocRelations.tsx` avant correction) — fichier hors liste de ce lot ; journalisé `BUG-074`, correctif au prochain lot qui touche ce fichier (it7 ou micro-commit indépendant).

*(Écrit par le PM.)*

## 3 — Contrat de design

*(Écrit par l'UX — tour 1 + amendements tour 2 fusionnés ; les portes Contrepartie/Indice préalable ont changé de forme entre les deux tours, seule la version ci-dessous fait foi.)*

### Architecture

`BlocSavoirs.tsx` (nouveau, extrait dès l'écriture — jamais après coup) reçoit `personnage.savoirs`, `monde.indices: Entite[]`, `monde.objets: Entite[]`, et les handlers de `useEcritureSavoirs.ts`. Câblé dans `FichePersonnage.tsx` comme bloc 7 de l'accordéon (`BLOC_7_ID = 'savoirs'`, remplace `sectionPlaceholder(BLOC_SAVOIRS)`). Styles réutilisés tels quels : `eyebrowStyle`, `legendeStyle`, `listeLignesStyle`, `ligneStyle`, `enTeteLigneStyle`, `boutonPointilleStyle` — aucun style neuf. `LIBELLES_CERTITUDE: Record<Certitude, string> = { sait: 'Sait', croit: 'Croit', soupconne: 'Soupçonne' }` posé à côté de `LIBELLES_CAMP`/`LIBELLES_PORTEE` (déplacés dans `BlocSituation.tsx` par la décharge — voir § 5 lot unique).

### Légende de bloc

`LEGENDE_SAVOIRS = "Ce que ce personnage sait d'un indice, et la manière dont il le révèle — la certitude et le texte sont joués par le modèle ; les quatre portes de révélation restent au moteur."`

### État vide de collection (§ 8 objection 1 du tech-lead — gate sur les savoirs, jamais sur `monde.indices`)

Le corps ENTIER du bloc n'est remplacé par `TEXTE_AUCUN_INDICE_CANON = "Aucun indice défini dans le canon — ce personnage ne pourra rien révéler tant qu'aucun n'existe."` que si `personnage.savoirs.length === 0 && monde.indices.length === 0` (conjonction, forme exacte de `BlocRelations.tsx` post-M1). Si des savoirs existent déjà (dossier importé) et que `monde.indices` est vide, ils restent rendus, chaque `indice_id` orphelin affichant une option non résolue « Indice introuvable — `<id>` » plutôt qu'une réécriture silencieuse vers la première option (KR-021/KR-194).

### Ajout (`indice_id` requis → Select-comme-geste-d'ajout, précédent `cible_id`/`lieu_id`)

`TEXTE_AJOUTER_SAVOIR = '+ Ajouter un savoir…'` — Select `ariaLabel="Ajouter un savoir"`, options `[{ value: '', label: TEXTE_AJOUTER_SAVOIR }, ...indices.map(...)]` via `localiserEntite('indice', indice, index)`. Choisir une option committe immédiatement `{ indice_id, certitude: CERTITUDE_INITIALE }` ; le Select revient à son placeholder.

### Ligne d'un savoir (`ligneStyle`, bordée)

- En-tête (`enTeteLigneStyle`) : eyebrow `` `SAVOIR ${index+1}` `` + `IconButton` `` `Retirer le savoir n°${index+1}` ``, `tone="danger"`, `size={HIT_TARGET_MIN}`.
- `Select` label `"CERTITUDE"`, options `CERTITUDES` via `LIBELLES_CERTITUDE`, valeur initiale `CERTITUDE_INITIALE = 'sait'` (constante nommée, jamais `CERTITUDES[0]` implicite — précédent `PORTEE_INITIALE`).
- `Field` label `"COMMENT IL LE RÉVÈLE"`, hint `"La manière dont il le révèle — jamais la condition : n'écrivez pas « si vous la mettez en confiance » ou « contre la fiole », ces règles vivent dans les portes ci-dessous. Injecté au modèle uniquement quand une porte s'est ouverte."` (texte final post-tour-2, converge UX/narratif-ia), `multiline rows={2}`, placeholder `"Elle sort la lettre d'une poche cousue dans sa cape, sans un mot."`, brouillon-par-champ, commit au blur (précédent `lien`/`quand`).
- Légende des 4 portes : `LEGENDE_PORTES = "Chaque porte est optionnelle ; un savoir sans aucune porte ouverte ne se révèle jamais de lui-même : un avertissement le signale, sans bloquer l'enregistrement."`

### Les 4 portes (forme finale post-tour-2 — Confiance/Jet en bouton pointillé, Contrepartie/Indice préalable en Select)

Chaque porte, une fois ouverte, committe TOUTES ses clés en un seul geste (doctrine « geste explicite », précédent `stats` it3). Fermer une porte retire la clé racine `revele_si.<porte>`, jamais `revele_si.<porte>: {}` (« absent ≠ vide »).

1. **Confiance** — fermé : bouton pointillé `"+ Exiger un niveau de confiance…"`. Ouvert (`confiance_min: CONFIANCE_INITIALE_PORTE = 1`, jamais `CONFIANCE_MIN` — une porte à `-3` n'exigerait rien tout en éteignant l'avertissement `revelation-sans-porte`) : `Stepper` `"CONFIANCE MINIMALE"`, `min=CONFIANCE_MIN max=CONFIANCE_MAX prefix="+"` + `IconButton` `"Retirer la porte de confiance"`.
2. **Jet** — fermé : bouton pointillé `"+ Exiger un jet…"`. Ouvert (commit conjoint `{carac: DEFAULT_CHARACTERISTIC, tc: DEFAULT_CHALLENGE_TIER}`) : `Select` `"CARACTÉRISTIQUE"` (`CHARACTERISTIC_VALUES`) + `Select` `"DIFFICULTÉ"` (`CHALLENGE_TIER_VALUES`, label `` `${tc} · ${CHALLENGE_TIERS[tc].label}` ``) + `IconButton` `"Retirer la porte de jet"`.
3. **Contrepartie** — un seul `Select`, JAMAIS de bouton pointillé (veto tech-lead tour 2 : un index de registre écrirait une référence que personne n'a choisie). `ariaLabel="Exiger une contrepartie"`, options `[{ value: '', label: '+ Exiger une contrepartie…' }, ...objets.map((o, i) => ({ value: o.id, label: localiserEntite('objet', o, i) }))]`. Choisir une option committe `handleOuvrirPorteContrepartie(index, objetId)` (porte fermée) ou `handleChangeContrepartieObjet(index, objetId)` (déjà ouverte) — `consomme: false` posé au même commit (`consomme` est `requis: true`, l'idiome « `false` retire la clé » ne s'applique pas ici). Porte ouverte : `Select` (valeur courante) + `Toggle` `"CONSOMMÉ À L'USAGE"` + `IconButton` `"Retirer la porte de contrepartie"`. Si `monde.objets.length === 0` : `TEXTE_AUCUN_OBJET_CANON = "Aucun objet défini dans le canon — cette porte restera indisponible tant qu'aucun n'existe."`, scopé à cette porte seule.
4. **Indice préalable** — même patron Select, options en SELF-EXCLUSION : `monde.indices.filter(i => i.id !== savoir.indice_id)`. `ariaLabel="Exiger un indice déjà connu"`, `handleOuvrirPorteApresIndice(index, indiceId)` / `handleChangeApresIndice(index, indiceId)`, `IconButton "Retirer la porte d'indice préalable"`. Si `indicesEligibles.length === 0` : `TEXTE_AUCUN_AUTRE_INDICE_CANON = "Aucun autre indice dans le canon — cette porte restera indisponible tant qu'un second n'existe."`, scopé à la porte seule.

### Clavier

Ouvrir une porte (clic/Entrée sur le bouton pointillé ou le Select) déplace le focus vers son premier contrôle (précédent `BlocCaracteristiques`). `IconButton` « Retirer cette porte » ramène le focus sur l'affordance qui réapparaît. `Select` ferme natif à Entrée ; `Field` multiline insère une ligne, jamais de soumission implicite. Aucune modale dans ce lot.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CERTITUDE_INITIALE: Certitude = 'sait'` | registre (constante) | provides | `src/brain/dossier/types.ts`, exportée par `brain/index.ts` |
| `CONFIANCE_INITIALE_PORTE: number = 1` | registre (constante) | provides | `src/brain/dossier/types.ts`, exportée par `brain/index.ts` — distincte de `CONFIANCE_MIN` |
| `destinations.ts` (commentaires `savoirs[].indice_id`/`.certitude`/`.revele_comment`/`contrepartie.objet_id`) | correction documentaire | provides | zéro changement de valeur (`'ia'`/`'moteur'` inchangés) — 3 sites corrigés, voir § 8 désaccord 4 |
| `Savoir.revele_comment` (JSDoc) | correction documentaire | provides | prédicat d'injection écrit mot pour mot aux deux sites (`types.ts` + `destinations.ts`), précédent `Relation.secret` |
| `DossierService.update(id, recette): EcritureDossier` | service | consumes | réutilisé sans changement de signature |

Aucune ligne de `tables.ts`/`validate.ts`, aucune fixture : vérifié par le tech-lead au tour 1 (9 destinations, 5 `ENUMERES_FERMES`, 3 `REFERENCES_SIMPLES` déjà écrits depuis `dossier-format` n° 1).

## 5 — Lot unique

> Marqué `contrat` parce qu'il touche `brain/` (2 constantes + 3 corrections de commentaires) — pas de second lot à protéger, donc pas de scission artificielle : `dev-contrat` exécute tout, effort élevé justifié par la densité (9 champs de fond, 4 portes, décharge KR-112).

### Lot 1 — `savoirs` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul)
- **But** : livrer le bloc Savoirs complet, décharger `FichePersonnage.tsx` avant d'y câbler le bloc (KR-112), corriger les 3 commentaires faux de `destinations.ts`.
- **Ordre interne imposé** (temps 0 à 6, ne pas réordonner — écrire `BlocSavoirs.tsx` avant la décharge remet `FichePersonnage.tsx` mécaniquement au-dessus de 430 lignes) :

| # | Fichier | N/R | Temps | Contenu |
|---|---|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R | 0 · contrat | `CERTITUDE_INITIALE`, `CONFIANCE_INITIALE_PORTE`, JSDoc `Savoir.revele_comment` (prédicat) |
| 2 | `src/brain/dossier/destinations.ts` | R | 0 · contrat | commentaires seuls (l. 209-211 `vérité` inexistant → renvoie n° 6 ; l. 224-225 `objets[].nom` = `auteur`, KR-195 ; l. 216-217 prédicat `revele_comment`) — zéro entrée de table modifiée |
| 3 | `src/brain/index.ts` | R | 0 | export des 2 constantes |
| 4 | `src/features/dossier-fiches/components/BlocSituation.tsx` | N | 1 | décharge — bloc 1 (camp/plan/rattachement) + `LIBELLES_CAMP`/`LIBELLES_PORTEE`, comportement inchangé |
| 5 | `src/features/dossier-fiches/components/BlocIdentite.tsx` | N | 1 | décharge — bloc 2 (3 `Field`), comportement inchangé |
| 6 | `src/features/dossier-fiches/hooks/useEcritureSavoirs.ts` | N | 2 | famille savoirs — signature § 6 bis ci-dessous |
| 7 | `src/features/dossier-fiches/components/BlocSavoirs.tsx` | N | 3 | bloc 7 de l'accordéon + descripteur local des 4 portes (§ 7) + `LIBELLES_CERTITUDE` |
| 8 | `src/features/dossier-fiches/hooks/useSocleEcriturePersonnages.ts` | R | 3 | renommage `avertissementsD1Affiche` → `avertissementsAffiches` (le filtre est par préfixe de chemin, pas par famille D1 — le nom mentait) ; `commit` et ses 2 indexations KR-197 INTOUCHÉS |
| 9 | `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` | R | 4 | assembleur : `...savoirs` |
| 10 | `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | 4 | retrait `BLOC_SAVOIRS`, câblage `BlocSituation`/`BlocIdentite`/`BlocSavoirs`, renommage `avertissementsAffiches` |
| 11 | `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | 4 | `indices`/`objets`/`savoirs` passés à la fiche |
| 12 | `src/features/dossier-fiches/tests/savoirs.test.tsx` | N | 5 | balayage des 4 portes par prédicat structurel (§ 7), lecture au montage, états vides |
| 13 | `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R | 5 | placeholders 2 → 1, titres, renommage `avertissementsAffiches` |
| 14 | `src/features/dossier-fiches/tests/fichePersonnage.test.tsx` | R | 5 | seulement si la décharge le retargete (précédent BUG-071) |
| 15 | `docs/ROADMAP-BASCULE-IA.md` | R | 6 · docs | CORRECTION inline sur la Décision A (l. 156) : `indices` a glissé de n° 5 à n° 6 depuis, seul `objets` reste en n° 5 — trouvé par `narratif-ia` |

- **Expose / consomme** : voir § 4 et § 6 bis.
- **Critères couverts** : #1 à #8 (tous).

## 6 — Critères d'acceptation

1. **Étant donné** le bloc Savoirs vide, **quand** l'auteur choisit un indice dans le Select d'ajout, **alors** un savoir est créé (`indice_id` + `certitude: CERTITUDE_INITIALE`), committé immédiatement, et le Select revient à son placeholder — *niveau : composant* — *lot 1*
2. **Étant donné** un savoir existant, **quand** l'auteur ouvre puis referme indépendamment chacune des 4 portes, **alors** chaque porte committe l'ensemble de ses clés en un seul geste à l'ouverture et retire la clé racine `revele_si.<porte>` à la fermeture (jamais un objet vide) — **prouvé séparément par porte**, pas par une scène unique — *niveau : composant* — *lot 1*
3. **Étant donné** un personnage portant déjà des savoirs, **quand** `monde.indices` est vide, **alors** ses savoirs restent rendus et éditables — seule l'affordance d'AJOUT est remplacée par `TEXTE_AUCUN_INDICE_CANON` — *niveau : composant* — *lot 1* (précédent must-fix M1 d'it5)
4. **Étant donné** `monde.objets` vide (resp. un seul indice total = celui du savoir), **quand** l'auteur regarde la porte Contrepartie (resp. Indice préalable), **alors** seule cette porte est indisponible, le reste du bloc reste actif — *niveau : composant* — *lot 1*
5. **Étant donné** un savoir sans aucune des 4 portes ouvertes, **quand** la fiche se rend, **alors** l'avertissement `revelation-sans-porte` (déjà produit par `validateDossier`) s'affiche dans le bandeau existant ; ouvrir une porte l'éteint, la refermer le rallume — les trois preuves dans le même test — *niveau : composant* — *lot 1*
6. **Étant donné** un dossier importé portant des savoirs aux 4 portes renseignées, **quand** la fiche se monte SANS interaction, **alors** chaque champ affiche la valeur du document, sur deux personnages aux valeurs distinctes dont le second est atteint par un clic de ligne, sur des valeurs non fabricables par les widgets — *niveau : composant* — *lot 1* (BUG-064, critère racine #11)
7. **Étant donné** le dossier de référence (6 personnages), **quand** ce lot est livré, **alors** il reste accepté par `validateDossier` sans modification de champs hors `savoirs[]` — *niveau : contrat* — *lot 1* (non-régression, critère racine #8)
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur ; le diff de `destinations.ts` ne contient QUE des lignes de commentaire (aucune entrée de la table `DESTINATIONS` modifiée) — *niveau : contrat* — *lot 1*

## 6 bis — Signature exacte du lot (point de rendez-vous unique)

```ts
// src/features/dossier-fiches/hooks/useEcritureSavoirs.ts
export interface BrouillonSavoir {
	indice_id: string
	certitude: Certitude
	revele_comment: string
	confiance_min: number | null                                  // null = porte non posée
	jet: { carac: Characteristic; tc: ChallengeTier } | null
	contrepartie: { objet_id: string; consomme: boolean } | null
	apres_indice_id: string | null
}

export interface UseEcritureSavoirsResult {
	savoirs: BrouillonSavoir[]
	handleAjouterSavoir: (indiceId: string) => void                // Select-comme-geste : '' n'ajoute rien
	handleChangeIndiceSavoir: (index: number, indiceId: string) => void
	handleChangeCertitudeSavoir: (index: number, certitude: Certitude) => void
	handleChangeRevelComment: (index: number, valeur: string) => void   // brouillon
	handleBlurRevelComment: (index: number, valeur: string) => void     // vide ⇒ retire la clé
	handleRetirerSavoir: (index: number) => void
	handleOuvrirPorteConfiance: (index: number) => void
	handleChangeConfiance: (index: number, valeur: number) => void
	handleFermerPorteConfiance: (index: number) => void
	handleOuvrirPorteJet: (index: number) => void
	handleChangeJetCarac: (index: number, carac: Characteristic) => void
	handleChangeJetTc: (index: number, tc: ChallengeTier) => void
	handleFermerPorteJet: (index: number) => void
	handleOuvrirPorteContrepartie: (index: number, objetId: string) => void   // id OBLIGATOIRE
	handleChangeContrepartieObjet: (index: number, objetId: string) => void
	handleChangeContrepartieConsomme: (index: number, consomme: boolean) => void
	handleFermerPorteContrepartie: (index: number) => void
	handleOuvrirPorteApresIndice: (index: number, indiceId: string) => void   // id OBLIGATOIRE
	handleChangeApresIndice: (index: number, indiceId: string) => void
	handleFermerPorteApresIndice: (index: number) => void
}

export function useEcritureSavoirs(socle: SocleEcriture | null): UseEcritureSavoirsResult
```

`FichePersonnage` reçoit un seul prop groupé `savoirs: UseEcritureSavoirsResult` + `indices: Entite[]` + `objets: Entite[]` (précédent `relationsPresence`, motif KR-112).

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| "ajout d'un savoir pose indice_id et certitude sans écrire avant, le Select revient au placeholder" | `updateSpy` non appelé avant le premier commit ; document final porte `{indice_id, certitude: 'sait'}` | jest/composant | — | 1 |
| "chaque porte s'ouvre et se retire indépendamment des 3 autres" (`it.each` sur le descripteur des 4 portes) | ouvrir une porte ne touche pas les clés des 3 autres ; la retirer efface `revele_si.<porte>` en une seule clé, jamais `{}` | jest/composant | KR-199 | 1 |
| "garde structurelle : les 4 portes du descripteur UI correspondent exactement aux chemins revele_si.* de tables.ts/destinations.ts" | dérive la liste des chemins `monde.personnages[].savoirs[].revele_si.*` depuis `ENUMERES_FERMES`/`REFERENCES_SIMPLES` (prédicat de préfixe, pas une liste recopiée à la main), `toHaveLength(4)`, correspondance exacte avec le descripteur local de `BlocSavoirs.tsx` | jest/contrat | KR-199 | 1 |
| "savoirs déjà écrits restent rendus quand monde.indices est vide" | `personnage.savoirs.length > 0 && monde.indices = []` ⇒ pas de `TEXTE_AUCUN_INDICE_CANON`, champs visibles et éditables | jest/composant | KR-021, KR-194 (précédent must-fix M1 it5) | 1 |
| "état vide monde.indices ET aucun savoir : tout le corps du bloc est remplacé, aucun bouton d'ajout" | `savoirs.length === 0 && indices.length === 0` ⇒ `TEXTE_AUCUN_INDICE_CANON` seul | jest/composant | — | 1 |
| "état vide monde.objets : seule la porte contrepartie est indisponible" | `indices` non vide, `objets = []` ⇒ `TEXTE_AUCUN_OBJET_CANON` scopé à la porte, reste du bloc actif | jest/composant | — | 1 |
| "porte indice préalable exclut l'indice propre au savoir (self-exclusion)" | un seul indice au total = celui référencé par `indice_id` ⇒ `TEXTE_AUCUN_AUTRE_INDICE_CANON`, même si `monde.indices.length !== 0` | jest/composant | KR-021, KR-194 | 1 |
| "avertissement revelation-sans-porte : allume / éteint / rallume, même test" | ajouter un savoir sans porte allume l'avertissement dans le bandeau existant ; ouvrir une porte l'éteint ; la refermer le rallume | jest/composant | — (critère #7 racine, doctrine 7a) | 1 |
| "lecture au montage sans interaction, 4 portes non fabricables, deux personnages distincts" | 2 personnages, savoirs aux 4 portes renseignées à des valeurs impossibles par défaut widget (`confiance_min != CONFIANCE_INITIALE_PORTE`, `carac`/`tc` non-premiers de leur registre, `objet_id` + `consomme:true`, `apres_indice_id` = un second indice) ; montage sans clic, second personnage atteint par clic de ligne | jest/composant | KR-199, BUG-064 (critère racine #11) | 1 |
| "non-régression : dossier de référence accepté sans modification de champs hors savoirs[]" | `validateDossier(dossierReference).errors === []` et diff des autres champs vide | jest/contrat | — (critère racine #8) | 1 |
| "diff de destinations.ts : commentaires seuls" | vérifié en revue (pas un test jest) — `git diff -- src/brain/dossier/destinations.ts` ne contient aucune ligne hors commentaire | revue manuelle | — | 1 |

Cas limites couverts : vide (indices/objets/2 formes) · référence orpheline (indice_id/objet_id/apres_indice_id non résolus, rendus tels quels) · doublon (self-exclusion apres_indice_id) · double geste (ouverture d'une porte déjà ouverte, idempotence attendue du Select).

**Non vérifiable en l'état** — aucun.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Le lot doit-il inclure la décharge `BlocSituation`/`BlocIdentite` (12 fichiers, comportement nul) ? | `RETENU` | Accepté par PM (hors de son domaine, architecture) sous réserve de traçabilité en `architecture_choices` distincte de Savoirs — journalisé § revue, pas absorbé en silence |
| 2 | QA | Critère racine #6 mal formé : une seule scène ne peut pas prouver que les 4 portes sont éditables | `RETENU` | Reformulé en critère #2 (« prouvé séparément par porte ») — voir § 6 |
| 3 | PM | `indice_id`/`objet_id` référencent des collections sans producteur avant n° 5/n° 6 | `RETENU` | Converge avec l'état vide déjà écrit par l'UX (`TEXTE_AUCUN_INDICE_CANON`/`TEXTE_AUCUN_OBJET_CANON`), gated sur `savoirs.length` (pas `indices.length`) suite à l'objection 1 du tech-lead — même solution, une seule écriture |
| 4 | Narratif & IA | `destinations.ts` (l. 209-228) justifie `indice_id: 'ia'` par un protocole `{indice_id, certitude, vérité}` dont `vérité` N'EXISTE PAS dans le schéma (`monde.indices` = `Entite[]`, propriété de n° 6) ; `contrepartie.objet_id` promet aussi d'injecter un `nom` qui est `auteur` (KR-195) | `RETENU` | 3 commentaires corrigés dans le lot (temps 0), zéro changement de valeur de destination — `indice_id` reste `'ia'` par CE protocole précis (le rang injecté par n° 12), documenté comme tel. Entrée `open_questions` n° 6 ajoutée : `indices[].verite` manquant |
| 5 | Tech Lead | Graine de `confiance_min` à `CONFIANCE_MIN` (−3) n'exigerait rien tout en éteignant l'avertissement `revelation-sans-porte` | `RETENU` | `CONFIANCE_INITIALE_PORTE = 1`, constante distincte de `CONFIANCE_MIN` |
| 6 | Tech Lead (veto) | Les portes Contrepartie/Indice préalable ne peuvent pas s'ouvrir sur un index de registre implicite (`objets[0].id`) — référence non choisie par l'auteur | `RETENU` | UX a réécrit les deux portes en Select-comme-geste (§ 3), veto levé sans réserve par l'UX elle-même |
| 7 | Tech Lead / UX | `BlocPresence.tsx` (livré à it5) porte encore la forme non corrigée du bug M1 (masque des présences déjà écrites) | `REPORTÉ` | Hors liste de fichiers de ce lot (règle de propriété de lot) — journalisé `BUG-074`, correctif au prochain lot touchant ce fichier (it7 ou micro-commit indépendant) |
| 8 | QA (veto conditionnel) | Le balayage `it.each` des 4 portes doit être dérivé par un prédicat STRUCTUREL (pas une seconde liste recopiée à la main), sinon une 5e porte oubliée des deux listes reste invisible | `RETENU` | Test dédié § 7 (« garde structurelle ») : la liste dérive des chemins réels de `tables.ts`/`destinations.ts` par préfixe `revele_si.`, comparée au descripteur du composant — veto levé |
| 9 | Tech Lead | `avertissementsD1Affiche` filtre en réalité par préfixe de chemin, pas par famille D1 — le nom ment | `RETENU` | Renommage `avertissementsAffiches`, 3 sites, zéro ligne de logique |
| 10 | Narratif & IA | Décision A du roadmap (l. 156) range `indices` en n° 5 ; le reste du document (table, § 2) le range en n° 6 depuis | `RETENU` | Correction inline sur `docs/ROADMAP-BASCULE-IA.md`, dans ce lot (§ 5, fichier 15) |

*(Aucun désaccord n'est resté sans statut ; aucun n'a nécessité d'`ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition `INNOVATION` ce tour — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : Prettier → `tsc --noEmit` → `npm run lint` → `jest`
- [ ] `npm run test:mutation` — **non requis** (aucun des 4 fichiers mutés — `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts` — touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste du lot (§ 5)
- [ ] `BUG-074` (`BlocPresence.tsx`) journalisé dans `bug_history.json`
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it6.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **recevable** | critère #6 reformulé, décharge journalisée distinctement |
| Tech Lead | recevable sous réserve → **recevable** | graine `confiance_min` tranchée, état vide gated sur `savoirs.length`, portes Contrepartie/Indice préalable en Select, `avertissementsAffiches` renommé, `destinations.ts` réintégré au lot |
| UX | recevable sous réserve → **recevable** | 2 portes réécrites en Select, hint `revele_comment` amendé, `BUG-074` journalisé |
| QA | recevable sous réserve → **recevable** | prédicat structurel nommé pour la garde des 4 portes, critère #6 observable, `BlocPresence.tsx` hors lot avec renvoi explicite |
| Narratif & IA | recevable sous réserve → **recevable** | `destinations.ts` réintégré au temps 0, hint `revele_comment` converge, entrée `open_questions` n° 6 ajoutée |

## 12 — Annexe (note de comité, hors code de ce lot)

Contrat de sortie IA « R4 · acteur » (n° 12, propriétaire) — reproduit tel qu'esquissé par `narratif-ia` pour ne pas se reperdre au raffinage de n° 12 :

- **Entrée injectée** : canon + fiche du PNJ (`fonction`, `apparence`, `description_joueur`, `but.*`, `plan_actions[].action`, `relations[]` du porteur filtrées par `secret`) + savoirs recomposés par le CODE sous la forme `{ rang: 1..n, contenu, certitude }` — `contenu` venant de `indices[].verite` (n° 6, à créer), jamais de `indice_id` ni de `nom`. Portes absentes du contexte : un savoir n'est injecté que si ses portes sont déjà constatées ouvertes par le moteur ; `revele_comment` l'accompagne, jamais avant.
- **Schéma de sortie** : `{ replique: string ≤ N mots, indices_reveles: number[] (rangs de la liste injectée, ensemble fermé 1..n), delta_confiance: -1 | 0 | 1 }`.
- **Échec de validation** : 1 rejeu avec le schéma rappelé ; second échec → repli déterministe (réplique écartée, `indices_reveles = []`, `delta_confiance = 0`).
