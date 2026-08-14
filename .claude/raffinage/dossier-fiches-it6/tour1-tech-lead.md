## Note d'ouverture — TECH-LEAD, dossier-fiches it6/8

**RISQUE** — Les 4 portes sèment des valeurs `moteur` à l'ouverture. Trois se défendent (geste explicite de l'auteur, jurisprudence `stats` d'it3) ; une ment : `confiance_min` semée à `CONFIANCE_MIN` (−3) n'exige rien, tout en éteignant l'avertissement `revelation-sans-porte` (`validate.ts` § 8). L'auteur croit avoir posé une porte, le Temps 2 lira une révélation libre, et le seul instrument qui le disait s'est tu.

**OBJECTION 1** — Le jet de design d'it5 fait remplacer *tout* le corps du bloc quand `monde.indices` est vide : c'est mot pour mot le must-fix M1 d'it5 (`BlocRelations` masquait des relations déjà écrites, critère racine #11). Aucun éditeur d'indices n'existe avant la n° 6 — un dossier importé porte des savoirs qu'on ne peut pas créer ici. L'état vide ne vaut que si `savoirs.length === 0`.

**OBJECTION 2** — `objet_id` et `apres_indice_id` sont des références, et le validateur ignore une référence vide (arbitrage d'it1). Un bouton pointillé « + Exiger une contrepartie… » écrirait `objet_id: ''`, accepté en silence. Ces deux portes s'ouvrent par un Select (patron `handleAjouterRelation(cibleId)`), jamais par un bouton.

**PROPOSITION** — Un seul lot, séquentiel, pas d'essaim : tout second candidat renomme `FichePersonnage.tsx`. Mesuré : hook ~320 l., `BlocSavoirs` ~280 l., `FichePersonnage` 419 → ~437. Décharge KR-112 dans le même lot et avant le câblage (extraction des blocs 1–2, −85 l. → ~350), sinon it8 arrive sans marge.

**VERDICT** — recevable sous réserve : graine de `confiance_min` arbitrée ce tour ; et le contrat n'est pas vide (1 constante `brain/`, zéro ligne de schéma — vérifié).

---

## ANNEXE TECHNIQUE

### A. Vérification du lot contrat — mesurée, pas supposée

| Fichier `brain/` | État vérifié | Ligne à écrire à it6 |
|---|---|---|
| `src/brain/dossier/types.ts` (`Savoir`/`Revelation`, l. 424-463) | complet depuis n° 1 | 1 constante (voir ci-dessous) |
| `src/brain/dossier/tables.ts` | 5 lignes `ENUMERES_FERMES` (`certitude` requis, `confiance_min`, `jet.carac`/`jet.tc` requis, `contrepartie.consomme` requis), 3 lignes `REFERENCES_SIMPLES` (l. 437-439), 1 ligne `LISTES_REQUISES` (l. 305) | zéro |
| `src/brain/dossier/destinations.ts` | 9 lignes (l. 212-228), `indice_id`/`certitude`/`revele_comment` → `ia`, les 4 portes → `moteur` | zéro |
| `src/brain/dossier/validate.ts` § 8 (l. 602-636) | `porte-inconnue` (erreur) + `revelation-sans-porte` (avertissement) déjà implémentés | zéro |
| `__fixtures__/dossier-reference.json` | les 4 portes déjà instanciées (l. 77 `jet`, l. 174-175 `confiance_min`+`apres_indice_id`, l. 196 `contrepartie`) | zéro |
| `couverture.test.ts` / `suffisance.test.ts` / `validate.test.ts` | aucun chemin neuf ⇒ aucun garde à étendre | zéro |

**Le seul point de contact `brain/`** : `certitude` est `requis: true` et le geste d'ajout committe immédiatement ⇒ une valeur de plancher est écrite au document. Précédent exact `PORTEE_INITIALE` ⇒ `export const CERTITUDE_INITIALE: Certitude = 'sait'` dans `src/brain/dossier/types.ts`, ajoutée à la ligne d'export existante de `src/brain/index.ts` (l. 193). +1 si le comité tranche la graine de confiance : `CONFIANCE_INITIALE_PORTE` (valeur à arbitrer, ≠ `CONFIANCE_MIN`), même fichier, même ligne d'export.

Asymétrie assumée et à écrire en commentaire : `consomme: false` et `carac`/`tc` restent des littéraux/`DEFAULT_*` au site (`DEFAULT_CHARACTERISTIC='FO'`, `DEFAULT_CHALLENGE_TIER='TC1'`) — un booléen n'a ni registre ni ordre d'affichage dont dériver.

**Pourquoi ce n'est pas un lot contrat séparé** : un lot de 2 fichiers / ~12 lignes dont la seule preuve vit dans le test de l'autre lot ne passe pas la porte qualité isolément. Il devient le premier temps interne du lot unique. Cette dispense n'est légitime que parce qu'il n'y a pas de second lot ; si un lot parallèle apparaît, la constante redevient un lot contrat, seul et en premier.

### B. Mesure de taille (projetée depuis le précédent le plus proche, pas depuis l'estimation d'it5)

| Base mesurée | Projection savoirs |
|---|---|
| `useEcritureRelationsPresence.ts` = 389 l. pour 13 handlers / 6 champs / 2 brouillons | `useEcritureSavoirs.ts` ≈ 300-340 l. : 20 handlers / 9 champs, mais un seul brouillon de prose (`revele_comment`) et un helper `majSavoir(index, transform)` qui absorbe le `map` imbriqué `savoirs[] → revele_si` |
| `BlocRelations.tsx` = 142 l. (5 widgets), `BlocPlanActions.tsx` = 345 l. (3 sous-sections) | `BlocSavoirs.tsx` ≈ 260-300 l. : 9 widgets + 4 portes à deux états + 2 gardes de collection vide |
| `relationsPresence.test.tsx` = 441 l. | `savoirs.test.tsx` ≈ 400-450 l. |
| `FichePersonnage.tsx` = 419 l. (signal KR-112 franchi) | +18 l. de câblage ⇒ ~437 l. ; avec la décharge blocs 1-2 ⇒ ~350 l. |
| `useEcriturePersonnages.ts` (assembleur) = 91 l. | +22 l. de signature ⇒ ~113 l. |

L'estimation d'it5 (« ~300 lignes dans l'ancien monolithe ») est confirmée pour le hook seul et sous-estimait le total du volet (~1000 l. avec composant + tests + câblage) : c'est le volume d'un lot feature de cette feature (it5 : ~1200 l.), pas de deux.

### C. Le découpage — 1 lot (`savoirs`, séquentiel, aucun worktree, aucune fusion)

| # | Fichier | N/R | Contenu |
|---|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R | `CERTITUDE_INITIALE` (+ `CONFIANCE_INITIALE_PORTE` si retenue) |
| 2 | `src/brain/index.ts` | R | ajout à la ligne d'export `PORTEES, PORTEE_INITIALE, CERTITUDES, …` (l. 193) |
| 3 | `src/features/dossier-fiches/components/BlocSituation.tsx` | N | décharge — bloc 1 (camp/plan/rattachement) + `LIBELLES_CAMP`/`LIBELLES_PORTEE` |
| 4 | `src/features/dossier-fiches/components/BlocIdentite.tsx` | N | décharge — bloc 2 (3 `Field`) |
| 5 | `src/features/dossier-fiches/hooks/useEcritureSavoirs.ts` | N | la famille savoirs, `socle` en paramètre |
| 6 | `src/features/dossier-fiches/components/BlocSavoirs.tsx` | N | bloc 7 de l'accordéon |
| 7 | `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` | R | assembleur : `...savoirs` |
| 8 | `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | retrait de `BLOC_SAVOIRS`, câblage des 3 composants |
| 9 | `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | `indices`/`objets`/`savoirs` passés à la fiche (+ import des `LIBELLES_*` déplacés) — nommé au plan cette fois (écart d'it5) |
| 10 | `src/features/dossier-fiches/tests/savoirs.test.tsx` | N | test de la famille |
| 11 | `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R | compte de placeholders 2 → 1 (test l. 219) + titres dans l'ordre |
| 12 | `src/features/dossier-fiches/tests/fichePersonnage.test.tsx` | R | seulement si la décharge le retargete (précédent BUG-071 : une extraction casse un test épinglé sur le composant) |

**Ordre interne imposé** : (1-2) constante → (3-4) décharge + re-vert des tests → (5) hook → (6) composant → (7-9) câblage → (10-11) tests. Écrire `BlocSavoirs.tsx` avant la décharge remet mécaniquement `FichePersonnage.tsx` au-dessus de 430 l.

**Pourquoi pas 2 lots** : tout second découpage plausible (hook / composant, ou décharge / savoirs) nomme `FichePersonnage.tsx` et `useEcriturePersonnages.ts` des deux côtés, et le lot « composant » ne compile pas sans le type du lot « hook ». Précédents it2/it3/it4/it5, même conclusion.

**Hors lot, à ne pas ouvrir** : `tables.ts`, `destinations.ts`, `validate.ts` et leurs tests, les deux fixtures, `components/styles.ts` (styles existants suffisent), `Accordion.tsx`, `Stepper/Select/Toggle/IconButton`, `useSocleEcriturePersonnages.ts` (`commit` et ses deux indexations KR-197 se réutilisent, jamais se recopient), `useEcritureIdentite.ts`, `useEcriturePlan.ts`, `BlocCaracteristiques/BlocPlanActions/BlocRelations/BlocPresence`.

### D. Signature exacte exposée par le lot (point de rendez-vous unique)

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

`FichePersonnage` reçoit un seul prop groupé `savoirs: UseEcritureSavoirsResult` + `indices: Entite[]` + `objets: Entite[]` (précédent `relationsPresence`, motif KR-112) — pas 20 props individuelles.

### E. Gardes de revue (à écrire au plan, vérifiables une par une)

1. Fermer la dernière porte retire `revele_si`, jamais `revele_si: {}` (précédents `secret: false` et `quand` vide qui retirent la clé ; « absent ≠ vide »).
2. `consomme` est `requis: true` (`tables.ts` l. 271-274) : l'idiome d'it5 « `false` retire la clé » est ici un refus au SSOT. Le `Toggle` committe `false` explicitement.
3. Référence orpheline exposée, jamais absorbée (KR-021/KR-194) : un `indice_id`/`objet_id`/`apres_indice_id` hors collection rend une option « Indice introuvable — <id> » portant la valeur courante. Sans ça, le `<select>` retombe sur sa première option et la première édition réécrit silencieusement la référence.
4. Test contrasté, balayé depuis un registre (KR-199) : un tableau local des 4 portes, `it.each` dessus ; sonde `jest.spyOn` posée avant le rendu ; discriminance prouvée sur la ligne nommée ; deux personnages distincts pour tout ce qui touche le bandeau (KR-197).
5. Lecture au montage (critère racine #11, BUG-064) : un savoir portant les 4 portes, monté sans clic, sur deux personnages aux valeurs distinctes dont le second est atteint par un clic de ligne.
6. Moitié négative de l'avertissement : ajouter un savoir allume `revelation-sans-porte` dans le bandeau existant ; ouvrir une porte l'éteint ; la refermer le rallume. Les trois dans le même test.
