# Plan d'itération — `dossier-objets` · itération `1`

> Statut : `validé` (2026-08-16)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-16
> Composition : `4 rôles` — motif : `dossier-objets` (n°5) est nommément assigné **4 rôles** par `docs/ROADMAP-BASCULE-IA.md` § 2 (ligne 149). L'itération ajoute une prose destination `ia` à plat (`description_joueur`, même famille que `Lieu.description`/`Personnage.description_joueur`, déjà livrées sans convocation) et compose un réordonnancement par boutons ; aucun mécanisme de gating d'injection, aucun contrat de sortie IA, aucun contact avec les prompts, le moteur, la mémoire de session ou le mode jeu — `narratif-ia` non convoqué.
> Exécution : `séquentielle` (2 lots — lot 1 `contrat` seul et en premier, puis lot 2)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur tient son registre d'objets — nom, description lue par le joueur, réordonnancement par boutons Monter/Descendre — depuis un vrai panneau qui remplace l'état vide de la section Objets. » |
| **Tranche** | `PanneauObjets`/`FicheObjet` (formulaire, brouillon local) → `DossierEditorScreen` (slot `panneaux`, la clé `objets` est déjà un `SectionId` enregistré) → `DossierService.update()` → `PersistenceService`/`CloudSyncService` |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | retrait d'objet (it2) · `lieux[].acces` (KR-200) · glisser-déposer/drag natif · promotion des boutons vers `brain/components/` · toute borne de longueur sur `description_joueur` |
| **Reporté** | promotion de `ReorderControls` en primitive `brain/components/` — différée tant qu'un 2e appelant réel et nommé n'existe pas (§8, désaccord 10) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre un dossier, sélectionne la section Objets et y trouve un vrai panneau (et non plus l'état vide générique) : une liste à gauche (`ListRow`) et une fiche à droite (`Card`) pour l'objet sélectionné. Il ajoute un objet (« + Ajouter un objet… »), lui donne un nom et une description lue par le joueur — persistés au blur par `DossierService.update()` — et réordonne son registre par deux boutons Monter/Descendre posés en frères de chaque `ListRow`, opérables au clic comme au clavier. Aucun retrait n'est possible cette itération (it2, réservée à la discrimination de référence). Un seul champ neuf sur le schéma : `Objet.description_joueur?: string`, destination `ia`, sans borne de longueur.

## 2 — Hors périmètre

- Retrait d'un objet, et tout ce qui en découle (`Modal`, `IssueList`, refus indexé) — it2.
- `lieux[].acces` — hors périmètre de la feature **entière** (KR-200), pas seulement de cette itération ; aucun fichier de `dossier-canon` n'est touché.
- Glisser-déposer / drag HTML5 natif — écarté par les 4 rôles (tour 1 et 2, convergence indépendante) : sans équivalent clavier écrit nulle part dans le dépôt, non prouvable fidèlement en jsdom, et coûterait la réouverture de deux features closes (`dossier-canon`, `dossier-fiches`) s'il était porté par `ListRow`.
- Promotion des boutons Monter/Descendre en primitive `brain/components/` — reste dans la feature jusqu'à un 2e appelant réel et **nommé** (KR-109). Le roadmap n°6 `dossier-registres` ne mentionne aucun réordonnancement à ce jour : le second appelant est plausible, pas acquis.
- Toute borne de longueur sur `description_joueur` — décision déjà actée par le cadrage (KR-203), même famille que `Lieu.description`/`Personnage.description_joueur`.
- `brain/components/ObjectEditor.tsx` — écarté comme base d'écran ; ses contrôles d'équipement/renforcement appartiennent au modèle d'arbre condamné.
- Ajout d'une prop `disabled` à `IconButton.tsx` — évité : les boutons Monter/Descendre sont **omis**, jamais rendus désactivés, aux bornes de la liste (§8, désaccord 9).
- Toute modification de `PanneauSection.tsx` / `PANNEAU_PAR_SECTION` (bascule-editeur) ou de `dossierEditorScreen.test.tsx` — le slot d'injection existe déjà, la clé `objets` est déjà un `SectionId` : zéro ligne à changer chez le voisin.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Layout** — même patron que `PanneauLieux.tsx`/`FicheLieu.tsx` : deux colonnes dans `pageStyle` (`gap: var(--space-8)`, `padding: var(--space-8)`). Colonne gauche 320px fixe : eyebrow mono `OBJETS` (`--fs-eyebrow`, `--text-label`, `--track-eyebrow`), liste en `--space-3`, bouton `+ Ajouter un objet…` en pointillé accent (gabarit `+ Ajouter un lieu…`). Colonne droite : `<Card>` avec la fiche de l'objet sélectionné. Aucun accordéon (entité trop mince).

**Réordonnancement — composition, pas extension de `ListRow`** (§8, désaccord 3) : `PanneauObjets.tsx` rend chaque ligne comme

```tsx
<ul style={listeStyle}>
	{objets.map((objet, index) => (
		<li key={objet.id} style={ligneStyle /* display:flex; alignItems:center; gap:var(--space-2) */}>
			<ListRow
				title={localiserEntite('objet', objet, index)}
				subtitle={objet.id}
				selected={objet.id === objetAffiche.id}
				onSelect={() => setSelection(objet.id)}
			/>
			{index > 0 && (
				<IconButton label={libelleMonter(objet, index)} size={HIT_TARGET_MIN} onClick={() => deplacer(objet.id, -1)}>▲</IconButton>
			)}
			{index < objets.length - 1 && (
				<IconButton label={libelleDescendre(objet, index)} size={HIT_TARGET_MIN} onClick={() => deplacer(objet.id, 1)}>▼</IconButton>
			)}
		</li>
	))}
</ul>
```

`ListRow` prend `flex:1, minWidth:0` via le `<li>` qui l'entoure — **`ListRow.tsx` n'est pas modifié** (code inchangé, seul son docstring l.15-18 est réécrit pour inscrire l'arbitrage : le mécanisme retenu est composé par la feature, pas porté par le composant). Aux bornes de la liste, le bouton correspondant est **omis**, jamais rendu `disabled` (un `disabled` exigerait d'ajouter cette prop à `IconButton.tsx`, un fichier `brain/` de plus, pour un besoin qu'une simple condition de rendu couvre déjà).

Libellés (calculés dans `PanneauObjets.tsx`, jamais lus depuis `FicheObjet.tsx` — pas de recherche DOM à distance, § Encapsulation) :
- `Monter l'objet « {nom} »` / repli `Monter l'objet n°{index+1} (sans nom)`
- `Descendre l'objet « {nom} »` / repli symétrique

`deplacer(id, sens)` calcule le tableau permuté par identifiant (jamais par position) et appelle le même `commit()` que les autres champs — un refus reste possible (`statut:'absent'`), indexé par `objetId`, même patron `RefusEnCours` que `PanneauLieux`.

**`PanneauObjets.tsx`** :
- `EYEBROW_SECTION = 'OBJETS'`
- `TEXTE_VIDE = 'Aucun objet — cliquez « + Ajouter un objet… » pour commencer.'` — glyphe `❏` (`aria-hidden`), 3ᵉ occurrence de ce motif (après Lieux, Personnages).
- Sélection par défaut : premier objet, calculée en ligne (`objets.find(...) ?? objets[0]`), jamais un `useEffect` de resynchronisation (KR-013/113).

**`FicheObjet.tsx`** — composant PUREMENT de rendu, deux `Field` :

| Champ | `label` | `hint` | `placeholder` |
|---|---|---|---|
| `nom` | `NOM DE L'OBJET` | `interne` | `Le grimoire scellé d'Aldûr` |
| `description_joueur` | `DESCRIPTION` | `lue par le joueur` | `Une couverture de cuir craquelé, fermée par une lanière de plomb ; les pages, entrevues sous la reliure, semblent respirer.` |

Registre : `nom` reste de l'interface (frappe technique, jamais lu par le joueur) ; `description_joueur` est de la fiction — prose sensorielle, jamais un résumé mécanique (« objet magique qui donne +2 »). Pas de bouton retirer en it1.

**Composants réutilisés, aucun composant maison** : `ListRow`, `Card`, `Field`, `IconButton`, tous depuis `brain/components` via `'../../../brain'`.

**États** : Défaut (liste peuplée, fiche du premier objet) · Sélectionné (`ListRow selected`, `--accent`/`--accent-bg-2`) · Vide (0 objet : bandeau pointillé `❏` + `TEXTE_VIDE`) · Champ vide (placeholder ci-dessus) · Erreur/refus (hors périmètre it1).

**Clavier** : Tab traverse liste (`ListRow`, `<button>` natif) → boutons Monter/Descendre quand présents (vrais `<button>`, Entrée/Espace natifs, aucun `onKeyDown` maison) → `+ Ajouter…` → champs Nom/Description. Ajout d'un objet : focus posé sur le champ Nom (idiome `intentionFocus`/`useEffect` DOM impératif, précédent `PanneauLieux`, usage légitime KR-013).

*(Écrit par l'UX, révisé par l'arbitrage du §8. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Objet` | type | expose (nouveau) | `interface Objet extends Entite { description_joueur?: string }` |
| `Monde.objets` | type | expose (changé) | `Entite[]` → `Objet[]` |
| `ListRow.tsx` | composant | **inchangé** | docstring seul réécrit ; `ListRowProps` et le DOM rendu ne changent pas |
| `DossierService.update` | service | consomme | `update(id, recette): EcritureDossier` — signature inchangée |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |
| `brain/components/{Card, Field, IconButton}` | composant | consomme | inchangés |
| `frapperIdentifiant('objet')` / `localiserEntite('objet', o, i)` | fonction | consomme | déjà exportées, aucune ligne neuve dans `identifiers.ts` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier. Légende : (N) nouveau · (R) modifié.

### Lot 1 — `contrat-objet` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `Monde.objets` gagne sa forme réelle (`Objet extends Entite`, `description_joueur?`), sa destination `ia`, ses deux fixtures et sa couverture — `ListRow.tsx` ne gagne qu'une correction de docstring.
- **Fichiers** :
  - `src/brain/dossier/types.ts` (R) — `export interface Objet extends Entite { description_joueur?: string }` ; `Monde.objets: Objet[]`
  - `src/brain/dossier/destinations.ts` (R) — 1 ligne après `'monde.objets[].nom'` : `'monde.objets[].description_joueur': 'ia'`
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R) — `description_joueur` sur l'objet existant
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — `description_joueur` sur au moins un des 3 objets existants (`objet.sceau-de-cendre`, `objet.lanterne-de-corvin`, `objet.amulette-scellee`), aucun autre champ touché
  - `src/brain/dossier/couverture.test.ts` (R) — dispense `LIBRES`/`PROSE_D_ENTITE_LIBRE` pour `monde.objets[].description_joueur` (même motif que les 3 proses de `Lieu` et `Personnage.description_joueur`) + 1 test nommé (§7)
  - `src/brain/index.ts` (R) — export du type `Objet`
  - `src/brain/components/ListRow.tsx` (R) — **docstring seul** (l.15-18) : le réordonnancement est composé par la feature n°5, pas porté par ce composant ; zéro changement de `ListRowProps` ni du DOM rendu
- **Expose / consomme** : signatures du §4.
- **Critères couverts** : #2 (moitié contrat), #3 (moitié contrat), #5, #6, #8 (moitié)

### Lot 2 — `panneau-objets` *(contrat figé)*
- **Ouvrier** : `dev-lot`
- **But** : `PanneauObjets`/`FicheObjet` (liste + fiche + réordonnancement) remplacent l'état vide de la section Objets ; `App.tsx` câble `PanneauObjets`.
- **Fichiers** :
  - `src/features/dossier-objets/index.ts` (N)
  - `src/features/dossier-objets/components/PanneauObjets.tsx` (N)
  - `src/features/dossier-objets/components/FicheObjet.tsx` (N)
  - `src/features/dossier-objets/tests/panneauObjets.test.tsx` (N)
  - `src/App.tsx` (R) — import `PanneauObjets`, ajoute `objets: <PanneauObjets dossierId={route.dossierId} />` à `panneaux`
- **Expose / consomme** : consomme `Objet`, `EcritureDossier`, `DossierIssue`, `frapperIdentifiant`, `localiserEntite`, `useBrain().dossiers.update`, `useOpenDossier`, `ListRow`, `Card`, `Field`, `IconButton` (lot 1 + brain existant)
- **Critères couverts** : #1, #2 (moitié composant), #3 (moitié composant), #4, #7, #8 (moitié)

*(2 lots, exécution séquentielle — aucun 3e lot : `PanneauObjets`/`FicheObjet` sont une seule tranche verticale à un seul propriétaire de `dossierId`, du brouillon et de `commit()` ; les scinder inventerait entre deux agents qui ne se parlent pas le contrat de props `FicheObjetProps`. Aucun parallélisme à révéler : le lot 2 consomme le type figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** la section Objets vide, **quand** l'auteur clique « + Ajouter un objet… », **alors** un objet est créé (`frapperIdentifiant('objet')`), apparaît dans la liste (`ListRow`, repli « Objet n°N (sans nom) »), focus posé sur le champ Nom — *niveau : composant* — *lot 2*
2. **Étant donné** deux objets distincts dans le registre (champs différents), **quand** l'auteur sélectionne le second puis relit sa fiche **sans aucune interaction** (montage), **alors** les valeurs affichées (nom, `description_joueur`) sont celles du document, pour **chacun** des deux objets — non-régression du motif lecture-au-montage (BUG-064), discriminance à deux entités (KR-199) — *niveau : composant + contrat* — *lot 1+2*
3. **Étant donné** un objet sélectionné, **quand** l'auteur écrit son nom ou sa description et quitte le champ (blur), **alors** `DossierService.update()` persiste la valeur — *niveau : composant + contrat* — *lot 1+2*
4. **Étant donné** deux objets dans le registre, **quand** l'auteur active « Monter » (ou « Descendre ») sur le second — prouvé **au clic ET au clavier** (`Tab`+`Entrée`), deux assertions distinctes dans le même test —, **alors** l'ordre de `monde.objets` est persisté par `DossierService.update()` et reflété au rendu suivant ; la fiche affichée reste celle du **même objet** (sélection par identifiant, jamais par index) et son brouillon n'a pas suivi la position ; les boutons Monter/Descendre sont **omis** (jamais `disabled`) aux bornes de la liste — *niveau : composant* — *KR-197* — *lot 2*
5. **Étant donné** `description_joueur`, **quand** l'auteur y écrit un texte long, **alors** aucune troncature ni borne bloquante ne s'applique — cas positif prouvé dans `couverture.test.ts` (dispense `LIBRES`) — *niveau : contrat* — *KR-203* — *lot 1*
6. **Étant donné** le dossier de référence (3 objets nommés, `__fixtures__/dossier-reference.json`), **quand** le lot 1 est livré, **alors** les 3 objets restent acceptés par `validateDossier` sans modification de leurs champs hors de ce lot — lu depuis le fichier réel — *niveau : contrat* — *KR-156* — *lot 1*
7. **Étant donné** les 9 sections que cette feature ne livre jamais à cette itération, **quand** l'écran d'édition se rend, **alors** elles affichent toujours l'état vide honnête de `PanneauSection`, intact — vérifié en faisant tourner `dossierEditorScreen.test.tsx` **sans le modifier** — *niveau : composant* — *KR-187* — *lot 2*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : aucun import direct entre `dossier-objets` et `bascule-editeur` (KR-184), aucune couleur en dur, et aucun fichier de `dossier-canon`/`bascule-editeur` n'apparaît dans la liste de fichiers d'un lot de cette feature (KR-200) — *niveau : contrat (lint+tsc)* — *lot 1+2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `couverture.test.ts` — « la prose d'un objet est ia et instanciee dans les DEUX fixtures » | `DESTINATION_DES_CHAMPS['monde.objets[].description_joueur'] === 'ia'` ; le chemin a une instance dans `dossier-minimal.json` **et** `dossier-reference.json` | contrat | — | 1 |
| `couverture.test.ts` — « aucune ligne morte / 4e assertion » (suite existante, non modifiée) | reste verte après l'ajout de la ligne de destination + fixtures | contrat | — | 1 |
| `couverture.test.ts` — « description_joueur d'un objet, texte long, aucun avertissement » | `description_joueur` très long dans la référence → `validateDossier(...).warnings` ne contient aucune entrée `texte-trop-long` pour ce chemin | contrat | KR-203 | 1 |
| `validate.test.ts` (suite existante) — « le dossier de reference ne produit ni erreur ni avertissement » | reste vert après les fixtures modifiées | contrat | KR-156 | 1 |
| `panneauObjets.test.tsx` — « rendu initial: 3 objets de la reference dans la liste » | libellés lus depuis le fichier fixture réel, jamais recopiés | composant | KR-156 | 2 |
| `panneauObjets.test.tsx` — « ajouter un objet: apparait dans la liste, focus sur Nom » | clic « + Ajouter un objet… » → nouvelle `ListRow` + repli « Objet n°N (sans nom) » ; `document.activeElement` = champ Nom | composant | — | 2 |
| `panneauObjets.test.tsx` — « lecture au montage, deux objets distincts, sans interaction » | deux objets aux champs différents ; sélectionner le second (clic ligne) sans taper ; `nom`/`description_joueur` affichés = valeurs du document pour CHACUN | composant | KR-199/BUG-064 | 2 |
| `panneauObjets.test.tsx` — « edition nom/description au blur, persistee » | saisir puis blur → `dossiers.update` appelé une fois avec le nouveau texte ; relecture après remontage reflète la valeur | composant | — | 2 |
| `panneauObjets.test.tsx` — « Monter au clic: ordre permute, meme objet reste affiche » | 2 objets, clic « Monter » sur le second → `dossiers.update` reçoit `monde.objets` permuté ; la fiche affichée reste celle du même `id` (pas de saut d'index) | composant | KR-197 | 2 |
| `panneauObjets.test.tsx` — « Monter au clavier: Tab jusqu'au bouton puis Entree produit le meme effet » | `user-event.keyboard`, même assertion que le test précédent, chemin clavier distinct | composant | — | 2 |
| `panneauObjets.test.tsx` — « bornes: Monter absent sur le premier objet, Descendre absent sur le dernier » | `queryByRole('button', {name:/^Monter/})` absent sur la 1ère ligne ; `queryByRole('button', {name:/^Descendre/})` absent sur la dernière — jamais `disabled` | composant | — | 2 |
| `panneauObjets.test.tsx` — « grep KR-013/113: aucun useEffect de resynchronisation du brouillon » | lecture source : la sélection et le brouillon sont calculés en ligne, aucun effet ne recopie `dossier.monde.objets` après le montage | contrat (grep) | KR-013/113 | 2 |
| `dossierEditorScreen.test.tsx` (suite existante `bascule-editeur`, **non modifiée**) | reste verte : l'index `objets` retombe sur l'état vide générique, ce fichier n'est touché par aucun lot | composant | KR-187 | 2 (vérifié, non modifié) |
| `npm run lint` (règle existante `no-restricted-imports`) — « aucun import direct dossier-objets ↔ bascule-editeur » | zéro erreur sur les fichiers des 2 lots | contrat (lint) | KR-184 | 1+2 |

**Cas limites couverts** : liste vide (état calme) · un seul objet (aucun bouton de reorder, ni Monter ni Descendre) · deux objets, permutation aux deux extrémités · description_joueur très long (pas de troncature) · nom absent (repli numéroté) · lecture au montage sur une fixture réelle, jamais recopiée.

**Non vérifiable en l'état** : aucune — les 8 critères sont couverts par jest/RTL ou par grep de contrat.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM (tour 1) | La démo d'it1 porte un « et » liste/reorder — risque de transformer le squelette en chantier UI neuve | `RETIRÉ` (PM, tour 2) | La convergence des 3 autres rôles sur un mécanisme léger (boutons, zéro code `brain/`) supprime le risque nommé ; le PM confirme que la tranche reste cohérente et ne demande plus de fractionnement. |
| 2 | Tech Lead (tour 1) | Le critère #3 d'origine (« réordonne par la poignée de `ListRow` ») n'est observable par aucun instrument existant (pas de `DataTransfer` en jsdom, pas de clavier) | `RETIRÉ` (convergence tour 2) | Remplacé par le critère #4 de ce plan, réécrit sur le mécanisme boutons, prouvable par `user-event`. |
| 3 | Tech Lead vs UX (tour 1→2) | Où vit le code du réordonnancement : `ListRow.tsx` gagne deux props optionnelles `onMonter?`/`onDescendre?` (UX, tour 1) ou reste entièrement composé par la feature, zéro changement de code dans `ListRow.tsx` (Tech Lead) ? | `RETENU` (zéro code dans `ListRow.tsx`) | UX a retiré sa proposition au tour 2 après l'argument KR-109 de Tech Lead (une prop `brain/` à un seul appelant réel est la même dette que celle reprochée à `onReorder` d'origine) et son propre précédent cité (`Stepper.tsx` compose déjà `IconButton` en dehors du composant qu'il pilote). Aucune perte pour le design : DOM, clavier, tokens identiques dans les deux versions — seule la localisation du fichier change. |
| 4 | Tech Lead (tour 1) | Le critère #7 (KR-187, non-régression des 9 sections) ne doit pas se prouver en modifiant `dossierEditorScreen.test.tsx`, fichier d'une autre feature | `RETENU`, confirmé par la mesure | Ses sondes locales ne contiennent pas `objets` ; l'index retombe sur l'état vide générique et reste vert **sans modification**. Aucun fichier de `bascule-editeur` n'entre dans un lot de cette feature. |
| 5 | UX (tour 1) | Veto : livrer le glisser-déposer tel que présupposé par le `design_contract` d'origine rendrait la seule capacité neuve inopérable au clavier | `RETENU` (levé, tour 2) | Le mécanisme retenu (boutons, §3) satisfait l'opérabilité clavier nativement (vrais `<button>`, Tab/Entrée). |
| 6 | UX (tour 1) | Le `design_contract` du cadrage écrivait « la poignée de glisser […] réordonne » comme un mécanisme déjà tranché — ce n'était qu'une présupposition héritée du docstring de `ListRow.tsx`, jamais une décision UX actée | `RETENU` (correction) | Ce plan corrige le mécanisme (glisser → boutons Monter/Descendre) ; le report en `specification.json` (étape 7 du rituel) corrige `design_contract.reordonnancement` et `KR-201` en conséquence. |
| 7 | QA (tour 1) | Veto : le critère #3 d'origine ne nomme ni mécanisme ni niveau de test — inobservable | `RETIRÉ` (tour 2), sous réserve intégrée | La réserve de QA (« deux assertions dans le même test : clic et clavier ») est intégrée telle quelle au critère #4 et au test nommé correspondant (§7). |
| 8 | QA (tour 1) | Le critère #2 (BUG-064, lecture au montage) omettait la garde KR-199 : un test à une seule entité ne distingue pas une fiche correctement liée d'une fiche figée sur le premier objet | `RETENU`, durci | Le critère #2 de ce plan exige explicitement deux objets aux champs distincts, repris et renforcé par Tech Lead au tour 2 (assertion sur la recette passée à `dossiers.update`, pas seulement sur le rendu). |
| 9 | Tech Lead (annexe, tour 2) vs UX (tour 1, position explicite non recontestée) | Aux bornes de la liste, le bouton manquant doit-il être `disabled` (esquissé dans le sketch de code de Tech Lead) ou **omis** (position UX explicite, répétée corps + annexe : « un bouton omis, jamais désactivé ») ? | `RETENU` (omis, jamais `disabled`) | Tranché par l'orchestrateur (tour 3) : la position UX est explicite et motivée deux fois, jamais contestée par un veto ; elle évite en plus d'ajouter une prop `disabled` à `IconButton.tsx` (`brain/`), cohérent avec le principe « zéro code brain/ » que Tech Lead défend par ailleurs. Le sketch de Tech Lead au §5 de son annexe est corrigé en conséquence dans ce plan (§3). |
| 10 | Tech Lead (annexe, tour 2) | Faut-il promouvoir les boutons Monter/Descendre en primitive `brain/components/ReorderControls` dès maintenant ? | `REPORTÉ` (`open_questions`, feature) | Pas de second appelant réel et nommé aujourd'hui (le roadmap n°6 `dossier-registres` ne mentionne aucun réordonnancement). Déclencheur écrit : au premier autre écran qui en demande un, la paire migre vers `brain/components/ReorderControls.tsx` avec la signature `{ labelMonter, labelDescendre, onMonter?, onDescendre? }` — `dossier-objets` en devient le second appelant. |

*(Aucun désaccord ne disparaît sans statut. Aucun bloc `ESCALADE` : tout veto a été retiré ou requalifié en tour 2, ou tranché ici sans opposition entre domaines de veto légitimes.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `tsc --noEmit` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés touché ; `brain/dossier/` hors périmètre, KR-161)
- [ ] Tests du §7 écrits et passants
- [ ] Critères du §6 cochés un par un
- [ ] Aucun fichier touché hors de la liste de son lot (§5)
- [ ] `ListRow.tsx` : docstring seul modifié — aucune ligne de `ListRowProps` ni du JSX rendu
- [ ] `dossierEditorScreen.test.tsx` (`bascule-editeur`) : non modifié, suite verte
- [ ] Aucune prop `disabled` ajoutée à `IconButton.tsx`
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-objets-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | objection « et » retirée (désaccord #1) ; neutre sur le point ListRow (désaccord #3) |
| Tech Lead | recevable | critère #3 retiré (désaccord #2) ; position « zéro code ListRow » retenue (désaccord #3) ; KR-187 confirmé (désaccord #4) ; réserve « omis vs disabled » tranchée par l'orchestrateur contre son propre sketch (désaccord #9) — accepté, pas de perte fonctionnelle |
| UX | recevable | veto clavier levé (désaccord #5) ; correction du design_contract actée (désaccord #6) ; proposition de props sur `ListRow` retirée (désaccord #3) |
| QA | recevable | veto critère #3 retiré, réserve clic+clavier intégrée (désaccord #7) ; critère #2 durci (désaccord #8) |
