# Plan d'itération — `dossier-registres` · itération `2`

> Statut : `validé` (2026-08-17)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-17
> Composition : `4 rôles` — motif : décision actée au cadrage de la feature, confirmée en it1 : cette feature est schéma + écrans, aucune nouvelle frontière prompt/moteur/mémoire de session. `narratif-ia` non convoqué.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut compléter le registre Jalons & fins de son dossier. » |
| **Tranche** | `PanneauJalonsFins`/`FicheJalon`/`FicheFin` (écran) → `DossierService.update()` (`brain/dossier`) → persistance existante, réutilisée sans changement |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | `Jalon.effet` rendu (pas d'`EditeurEffets` avant it3) · badge D1 sur la fiche Jalon (silencieux par design) · graphe visuel (`tree-canvas`) · `lieux[].acces` · retrait (suppression) d'un jalon/fin persisté |
| **Reporté** | vigilance UX sur le double usage de `SegmentedControl` (bascule ici, filtre en it4) → à relire au raffinage d'it4 · retrait d'un jalon/fin → `open_questions` niveau feature, même statut que le retrait d'indice (it1) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut compléter le registre Jalons & fins de son dossier — le texte que le moteur émettra au joueur à l'arrivée sur une fin (`Fin.texte`, consommateur futur n° 15), et l'avertissement D1 (déclencheur sans expression) rendu visible **uniquement sur chaque fiche Fin** — un Jalon reste silencieux par design (`alerteSansExpr: false`, `tables.ts:656`), et ce n'est pas une omission de l'écran.

## 2 — Hors périmètre

- **`Jalon.effet` (`Delta[]`)** : le champ existe depuis `dossier-format` et reste au type, mais N'EST RENDU PAR AUCUN ÉCRAN cette itération — `EditeurEffets`, le composant qui rend un `Delta[]`, naît en it3 (Quêtes) et n'existe pas encore. Une entité créée cette itération écrit `effet: []` par défaut.
- **Badge D1 sur la fiche Jalon** : `FAMILLES_DE_CONDITIONS` porte `alerteSansExpr: false` pour Jalon (`tables.ts:653-657`) — un jalon dont `declencheur_texte` est renseigné sans `declencheur_expr` reste calme, par construction, depuis `dossier-format`. `FicheJalon` reçoit la même prop `avertissements` que `FicheFin` (§5, piège 3) mais elle est TOUJOURS vide côté jalon — le silence est celui du validateur, jamais celui du composant.
- **Graphe visuel des indices/relations** (repointage `tree-canvas`) : hors périmètre total de la feature (KR-204, cadrage).
- **`lieux[].acces`** : hors périmètre (KR-205, cadrage).
- **Retrait (suppression) d'un jalon ou d'une fin déjà persisté(e)** : hors périmètre, même statut qu'it1 pour les indices — engagerait une confirmation modale (CLAUDE.md § Dangerous Actions) et un lot de plus. Un BROUILLON incomplet, lui, s'abandonne SANS dialogue (§3) : rien n'a jamais été écrit dans le document, donc rien à confirmer.
- **`declencheur_expr` / `condition_expr`** : aucun éditeur d'expression cette itération (n° 14) — ces champs restent illisibles/inéditables depuis l'écran, une Fin conforme au schéma actuel ne peut donc naître QUE `condition_expr` absent, ce qui rend l'avertissement D1 quasi systématique sur toute Fin fraîchement écrite. C'est le comportement voulu (même régime que `canon.objectifs[]` depuis `dossier-canon` it3), pas une régression — nommé explicitement en test (§7).

*(Écrit par le PM, corrigé au tour 2 par la convergence à trois rôles sur le périmètre de D1.)*

## 3 — Contrat de design

Composants réutilisés tels quels : `Field`, `ListRow`, `Card`, `IconButton`, `SegmentedControl`, `IssueList`, `HIT_TARGET_MIN`. Aucun composant neuf, aucun token neuf.

**Le problème résolu par ce contrat** : `Jalon.enonce_texte`, `Jalon.declencheur_texte` et `Fin.condition_texte` sont dans `CHAMPS_REQUIS` (`tables.ts:128-130`) — `validateDossier` REFUSE une chaîne vide (`validate.ts:288`, anomalie bloquante `champ-requis-vide`). Le geste d'it1 (« + Ajouter » committe `{id}` nu) est donc impossible tel quel. Décision (§8, désaccord 1) : **brouillon différé**, précédent direct `useEcriturePlan.ts` (`dossier-fiches`, `plan_actions[].action`/`contre_mesures[].action`), étendu au cas à DEUX champs requis simultanés (Jalon).

**`PanneauJalonsFins.tsx`** (remplace l'état vide de la section « jalons-fins », index 10 de `sections.ts`) :
1. Eyebrow panneau (token existant) : `JALONS & FINS`.
2. `SegmentedControl` (`role="tablist"`, pleine largeur) : `{ value: 'jalons', label: 'JALONS' }` / `{ value: 'fins', label: 'FINS' }`, défaut `'jalons'`. Aucune prop nouvelle sur `SegmentedControl.tsx` (§4, contrainte dure) — la sémantique « bascule » est de l'appelant, pas du composant.
3. Corps à deux colonnes, réutilisant `pageStyle`/`colonneListeStyle`/`colonneFicheStyle` de `styles.ts` (it1) : liste `ListRow` + 2 `IconButton` Monter/Descendre frères (précédent `PanneauIndices.tsx`) + fiche à droite. **Deux sélections indépendantes** (`selectionJalon`, `selectionFin`), calculées en ligne, jamais réinitialisées au changement d'onglet — revenir sur un onglet retrouve la même fiche. **Deux compteurs distincts**, jamais fusionnés (reflète `compte()` de `sections.ts` : `${jalons} jalon(s) · ${fins} fin(s)`).
4. État vide (par collection, glyphe `❏` réutilisé) : `Aucun jalon — cliquez « + Ajouter un jalon… » pour commencer.` / `Aucune fin — cliquez « + Ajouter une fin… » pour commencer.`

**Séquence d'ajout** (identique pour Jalon et Fin) :
1. Clic sur « + Ajouter un jalon… »/« + Ajouter une fin… » : un `id` est frappé (`frapperIdentifiant('jalon'|'fin')`) et un BROUILLON local (hors `charpente`) apparaît en dernière position de la `ListRow`, auto-sélectionné. Libellé de ligne tant que `nom` est vide : `Nouveau jalon` / `Nouvelle fin` (même repli que toute entité sans nom ailleurs dans la feature). Focus posé sur le champ NOM (précédent `intentionFocus`).
2. La fiche affiche des `Field` réellement vides, placeholders gris HTML classiques (liste ci-dessous) — AUCUNE valeur pré-écrite.
3. À chaque blur d'un champ requis : si TOUS les champs requis de l'entité sont désormais non vides — Jalon : `enonce_texte` ET `declencheur_texte` ; Fin : `condition_texte` seul (`texte`, la prose de fin, N'EST PAS dans `CHAMPS_REQUIS` — reste un `Field` optionnel classique, jamais gatant) — un commit ATOMIQUE écrit l'entité dans `charpente.jalons[]`/`fins[]` (`nom` omis si encore vide, `effet: []` par défaut sur un Jalon). Avant ce point, AUCUNE écriture, et AUCUN bandeau de refus (l'entité n'existe pas encore, rien à refuser).
4. Abandon silencieux, SANS dialogue de confirmation (hors du champ des « actions dangereuses » — rien n'a jamais été persisté) : changer d'onglet, sélectionner une autre ligne, ou quitter le panneau avec un brouillon incomplet le fait disparaître. Un second clic sur « + Ajouter… » pendant qu'un ajout est déjà en cours ne l'écrase pas.
5. Une fois l'entité committée, elle se comporte EXACTEMENT comme une entité d'it1 : brouillon local classique (`brouillons`, committé au blur), réordonnancement, bandeau de refus indexé par id (précédent `RefusEnCours`).

**`FicheJalon.tsx`**, dans l'ordre :
1. `Field label="NOM DU JALON" hint="interne" placeholder="Le pacte avec l'Archiviste"`
2. `Field label="DÉCLENCHEUR" hint="auteur — jamais injecté au modèle" multiline rows={2} placeholder="Le joueur montre le sceau brisé à l'Archiviste."`
3. `Field label="ÉNONCÉ" hint="IA — injecté au modèle une fois ce jalon atteint" multiline rows={2} placeholder="L'Archiviste sait désormais que le sceau a été brisé."`
4. Aucune région D1 (§2).
5. Bandeau de refus (`role="status"`, motif `FicheIndice.tsx`, `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"`) — n'apparaît qu'une fois l'entité committée.

**`FicheFin.tsx`**, dans l'ordre :
1. `Field label="NOM DE LA FIN" hint="interne" placeholder="Le Gouffre refermé"`
2. `Field label="CONDITION" hint="phrase factuelle pour le moteur, jamais de fiction" multiline rows={2} placeholder="Le héros porte la Clé d'Aldûr et a vaincu le Gardien."`
3. `Field label="TEXTE DE FIN" hint="lu par le joueur, à l'arrivée sur cette fin" multiline rows={3} placeholder="Le sceau se referme derrière toi ; Val-Cendre s'efface dans la brume, pour toujours."` — registre fiction, présent, deuxième personne. Non gatant (§3).
4. **Région D1** (`role="status"`, DISTINCTE du bandeau de refus, eyebrow identique à `ObjectifsCanon.tsx` : `ENREGISTRÉ, AVEC AVERTISSEMENT`, corps `IssueList` sur `validateDossier(dossier).warnings` filtré à l'entité affichée) — visible dès que `condition_texte` est non vide et `condition_expr` absent, donc jamais avant le premier commit, et attendu quasi systématiquement tant qu'aucun éditeur d'expression n'existe (§2).
5. Bandeau de refus (`role="status"`, motif inchangé, indexé par id de la fin affichée).

**Clavier** : Tab suit l'ordre visuel — eyebrow → `SegmentedControl` (flèches gauche/droite natives) → liste (`ListRow` + `IconButton` Monter/Descendre) → bouton `+ Ajouter…` → champs de la fiche → bandeaux de statut (non focusables). `Entrée` dans un champ mono-ligne (NOM) blur-committe ; dans un `Field multiline`, insère un saut de ligne. `Échap` sur un champ d'un brouillon incomplet ne committe rien ; sur une entité déjà committée, comportement inchangé (motif `FicheIndice.tsx`).

*(Écrit par l'UX, corrigé au tour 2 : brouillon différé retenu, placeholders reconduits de l'annexe tour 1 sans changement.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Fin extends Entite` | type | fournit | `+= texte?: string` — MOTEUR, prose émise VERBATIM au joueur à l'arrivée sur cette fin (consommateur futur n° 15), même régime que `charpente.depart.texte_ouverture_joueur`. AUCUNE ligne dans `BUDGETS_DE_MOTS` (précédent `Objet.description_joueur`, KR-203). |
| `DESTINATION_DES_CHAMPS` (`destinations.ts`) | registre | fournit | `+= { 'charpente.fins[].texte': 'moteur' }` |
| dispense `couverture.test.ts` | registre | fournit | `+= { 'charpente.fins[].texte': PROSE_D_ENTITE_LIBRE }` (précédent exact : `monde.indices[].verite`/`formulation_joueur`) |
| `SegmentedControl` | component | consomme | INCHANGÉ — zéro prop nouvelle, zéro fichier `brain/`/`design_handoff` touché cette itération (contrainte dure tech-lead, évite une collision de fichier avec it4) |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |
| `{Card, Field, ListRow, IconButton, IssueList, HIT_TARGET_MIN}` | component | consomme | inchangés |
| `frapperIdentifiant('jalon'|'fin')`, `localiserEntite('jalon'|'fin', ...)` | function | consomme | déjà enregistrés depuis `dossier-format` (`identifiers.ts:48-49`) |

Aucune ligne neuve dans `tables.ts` (hors la dispense `couverture.test.ts` déjà listée), `validate.ts` ou `identifiers.ts` : `FAMILLES_DE_CONDITIONS`, `CHEMINS_DE_DELTAS` et les espaces de noms `jalon`/`fin` sont COMPLETS depuis `dossier-format` — vérifié par lecture directe au tour 1/2, pas supposé.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `jalons-fins-contrat` — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : donner sa forme à `Fin.texte`, la seule extension de schéma de cette itération, et fermer sa destination + sa dispense de couverture.
- **Fichiers** :
  - R `src/brain/dossier/types.ts`
  - R `src/brain/dossier/destinations.ts`
  - R `src/brain/dossier/couverture.test.ts`
  - R `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - R `src/brain/dossier/__fixtures__/dossier-reference.json`
- **Expose/consomme** : voir §4. Le lot NE TOUCHE PAS `tables.ts`, `validate.ts`, `identifiers.ts`, `amorce.ts`, `amorce.test.ts` ni `brain/index.ts` — aucune table neuve, aucune garde neuve, `MARQUEUR_A_ECRIRE` reste interne à `brain/dossier/amorce.ts` (§8, désaccord 1 : le semis par marqueur est REJETÉ).
- **Bornes pour `dev-contrat`, à ne pas redécouvrir en revue** :
  1. Les deux fixtures instancient `texte` sur une fin existante — sinon « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » rougit. La fin de `dossier-minimal.json` GARDE son `condition_expr` : cette fixture doit rester sans avertissement (`couverture.test.ts:420`).
  2. `Fin.texte` est optionnel (KR-191 : rien de déjà persisté ne devient invalide) et NE figure PAS dans `CHAMPS_REQUIS` — ne pas l'y ajouter par réflexe de symétrie avec `condition_texte`.
- **Critères couverts** : #1, #2.

### Lot 2 — `jalons-fins-ecran`
- **Ouvrier** : `dev-lot`
- **But** : panneau + fiches Jalon/Fin, câblés à `App.tsx`, remplaçant l'état vide de la section « Jalons & fins » — y compris le geste d'ajout à brouillon différé (§3).
- **Fichiers** :
  - N `src/features/dossier-registres/components/PanneauJalonsFins.tsx`
  - N `src/features/dossier-registres/components/FicheJalon.tsx`
  - N `src/features/dossier-registres/components/FicheFin.tsx`
  - N `src/features/dossier-registres/tests/panneauJalonsFins.test.tsx`
  - R `src/features/dossier-registres/components/styles.ts` (réutilisation des styles it1 ; ajouts strictement additifs)
  - R `src/features/dossier-registres/index.ts`
  - R `src/App.tsx` (une entrée `'jalons-fins': <PanneauJalonsFins dossierId={route.dossierId} />`)
  - *Conditionnel, KR-112* : si `PanneauJalonsFins.tsx` franchit 400 lignes, extraire N `src/features/dossier-registres/hooks/useEcritureJalons.ts` et N `.../useEcritureFins.ts` (`commit`/`refus` restent au panneau, un seul bandeau à la fois — précédent `useSocleEcriturePersonnages`). Décision laissée à `dev-lot` sur la mesure réelle, pas anticipée par ce plan.
- **Expose/consomme** : consomme uniquement `type Jalon`, `type Fin`, `type DossierIssue`, `validateDossier`, `frapperIdentifiant`, `localiserEntite`, `useOpenDossier`, `useBrain().dossiers.update`, `{Card, Field, ListRow, IconButton, SegmentedControl, IssueList, HIT_TARGET_MIN}`. Démarre une fois le lot 1 figé, le lit comme donnée immuable. **Zéro fichier `src/brain/` dans ce lot** — y compris `SegmentedControl.tsx`, laissé intact pour it4.
- **Trois pièges nommés, à ne pas redécouvrir en revue** :
  1. Garde d'ajout DANS LE BLUR, en amont de tout `commit()` — Jalon exige DEUX champs non vides, Fin en exige UN : `if (fusion.enonce_texte.trim() === '' || fusion.declencheur_texte.trim() === '') return`. Un second clic sur « + Ajouter… » pendant un ajout en cours ne l'écrase pas.
  2. Le chemin d'une anomalie porte l'INDEX (`charpente.fins[2].condition_texte`), la sélection porte l'ID — l'index se DÉRIVE de l'id au rendu (`fins.findIndex(...)`), jamais stocké.
  3. `FicheJalon` reçoit la MÊME prop `avertissements` que `FicheFin` (toujours vide côté jalon, par le validateur, jamais par omission du composant) — sinon le critère #6 (silence du côté jalon) est vrai par absence de code, pas par preuve.
- **Vérifié à la lecture** : `DossierEditorScreen.tsx:14` (`panneaux?: Partial<Record<SectionId, ReactNode>>`) et `sections.ts` (`SECTIONS[9].id === 'jalons-fins'`) existent déjà — aucun fichier de `bascule-editeur`, `dossier-canon` ou `tree-canvas` n'entre dans ce lot (KR-184/204/205 tenus par construction).
- **Critères couverts** : #3 à #8.

*(2 lots, exécution séquentielle — pas d'essaim parallèle, le lot 2 dépend du contrat figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** le dossier de référence, **quand** le lot 1 est livré, **alors** les jalons et fins déjà persistés restent acceptés par `validateDossier` sans régression de leurs champs hors du lot en cours — *niveau : contrat* — *lot 1*
2. **Étant donné** une fin dont `texte` est renseigné, **quand** le balayage de couverture s'exécute sur les deux fixtures, **alors** `charpente.fins[].texte` résout la destination `moteur` et n'apparaît dans aucune ligne morte — *niveau : contrat* — *lot 1*
3. **Étant donné** la section « Jalons & fins » vide, **quand** l'auteur clique « + Ajouter un jalon… » (ou « + Ajouter une fin… »), **alors** une entrée LOCALE apparaît sélectionnée dans la liste (libellé « Nouveau jalon »/« Nouvelle fin »), et RIEN n'est écrit dans le dossier tant que ses champs requis restent vides — *niveau : composant* — *lot 2*
4. **Étant donné** un brouillon de jalon, **quand** l'auteur renseigne `déclencheur` ET `énoncé` puis quitte le second champ, **alors** un commit ATOMIQUE écrit le jalon dans `charpente.jalons[]` (symétriquement, un brouillon de fin commite dès que `condition` seule est renseignée), et l'entité est acceptée par `validateDossier` SANS `champ-requis-vide` — *niveau : composant* — *lot 2*
5. **Étant donné** un brouillon de jalon dont un seul des deux champs requis est renseigné, **quand** l'auteur change d'onglet, sélectionne une autre ligne, ou quitte le panneau, **alors** le brouillon disparaît SANS dialogue de confirmation et le dossier reste inchangé — *niveau : composant* — *lot 2*
6. **Étant donné** une fin dont `condition_texte` est renseigné sans `condition_expr`, et un jalon (fixture `jalon.second-guet`) dont `declencheur_texte` est renseigné sans `declencheur_expr`, **quand** leurs fiches respectives se rendent, **alors** la fiche Fin affiche une région `role="status"` D1 distincte du bandeau de refus, et la fiche Jalon N'AFFICHE AUCUNE région de statut — discriminance prouvée dans le MÊME test — *niveau : composant* — *lot 2*
7. **Étant donné** au moins deux jalons (respectivement deux fins), **quand** l'auteur active Monter ou Descendre sur une ligne (clic ou clavier), **alors** l'ordre persiste et la fiche affichée reste celle du même identifiant — *niveau : composant* — *lot 2*
8. **Étant donné** un jalon sélectionné dans l'onglet JALONS et une fin sélectionnée dans l'onglet FINS, **quand** l'auteur bascule entre les deux onglets, **alors** chaque onglet retrouve sa propre sélection et son propre compteur, JAMAIS fusionnés en un seul total — *niveau : composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `couverture.test.ts` extension | `charpente.fins[].texte` couvert par destination + dispense, sur les deux fixtures | contrat | — | 1 |
| `couverture.test.ts` non-régression | `charpente.jalons[].effet` reste dans `CHEMINS_DE_DELTAS`, couvert par les boucles génériques existantes — note de non-régression, PAS un test neuf (KR-211(a) déjà acquis depuis `dossier-format`) | contrat | KR-211 | 1 |
| `panneauJalonsFins.test.tsx` « ajout jalon différé » | 2 champs requis vides → aucune écriture ; les deux renseignés → commit atomique, `validateDossier` sans `champ-requis-vide` | composant | — | 2 |
| `panneauJalonsFins.test.tsx` « ajout fin différé » | 1 champ requis (`condition_texte`) suffit à committer ; `texte` reste éditable avant et après, jamais gatant | composant | — | 2 |
| `panneauJalonsFins.test.tsx` « abandon silencieux » | brouillon incomplet + changement d'onglet/sélection → disparition, aucun bandeau, dossier inchangé | composant | — | 2 |
| `panneauJalonsFins.test.tsx` « discriminance D1 à trois entités » | fin non conforme → 1 région `status` ; fin conforme → 0 ; jalon non conforme (`jalon.second-guet`) → 0, dans le même test | composant | KR-211(b), KR-197/199/202 | 2 |
| `panneauJalonsFins.test.tsx` « reorder clic + clavier » | jalons et fins, 2 cas, la fiche affichée reste celle du même id après permutation | composant | — | 2 |
| `panneauJalonsFins.test.tsx` « sélection indépendante par onglet » | changer d'onglet et revenir retrouve la même fiche sélectionnée, compteurs jamais fusionnés | composant | — | 2 |
| `panneauJalonsFins.test.tsx` « isolation des 9 autres sections » | test-grep de non-régression, les autres sections affichent toujours leur état intact | composant | KR-187 | 2 |

Cas limites à couvrir : registre vide (0 jalon, 0 fin) · `enonce_texte` dépassant `BUDGET_MOTS_JALON` (avertissement non bloquant, précédent existant) · brouillon abandonné avant complétion · D1 quasi systématique sur toute Fin neuve tant qu'aucun éditeur d'expression n'existe (comportement voulu, pas une régression — §2).

**Non vérifiable en l'état** — aucun. Le graphe visuel et l'éditeur d'expression sont explicitement hors périmètre (§2), pas seulement non testés.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Tech Lead (retourné au tour 2) vs PM vs UX | Créer un jalon/une fin neuf(ve) : semer `MARQUEUR_A_ECRIRE` sur les champs requis (commit immédiat, motif it1) vs brouillon différé (commit au premier contenu complet, motif `useEcriturePlan.ts`) | `RETENU` brouillon différé | Le marqueur allume l'avertissement D1 sur TOUTE fin fraîchement créée dès l'instant du semis (`validate.ts:751`, `alerteSansExpr:true` sur Fin) — contredit directement le principe déjà posé et testé par `amorce.test.ts:89-93` (« un dossier/une entité neuve ne s'ouvre jamais déjà en alerte »). L'UX ajoute : aucune interaction « sélectionner-et-remplacer un texte-marqueur » n'a de précédent dans ce dépôt, et rien ne détecte un marqueur oublié avant n° 7/9 — un champ resté au marqueur validerait silencieusement. La préférence PM (cohérence d'interaction avec it1) est entendue mais ne l'emporte pas sur une violation de règle concrète et déjà testée. |
| 2 | Tech Lead | Ouvrir le baril `brain/index.ts` à `MARQUEUR_A_ECRIRE`, réécrire l'assertion d'`amorce.test.ts` qui l'interdit avant n° 7/9 | `REJETÉ` (conséquence du #1) | Sans objet une fois le brouillon différé retenu — le lot contrat ne touche plus `amorce.ts`/`amorce.test.ts`/`brain/index.ts`. |
| 3 | PM / Tech Lead / QA (convergence à trois rôles) | Le goal tel qu'écrit (« l'avertissement D1... rendu visible sur chaque fiche ») peut se lire comme s'appliquant à Jalon ET Fin | `RETENU` — but corrigé (§1) | `Jalon` porte `alerteSansExpr: false` (`tables.ts:656`) depuis `dossier-format` — silencieux par design. Seul `Fin` (`alerteSansExpr: true`) porte le garde D1. |
| 4 | Tech Lead / QA | KR-211(a) : « couverture.test.ts étend sa table aux Delta[] de jalons/fins » comme travail neuf | `RETENU` — reformulé en note de non-régression | `charpente.jalons[].effet` est DÉJÀ dans `CHEMINS_DE_DELTAS` et couvert depuis `dossier-format` (`tables.ts:578`) ; `Fin` ne porte aucun `Delta[]` cette itération. Écrire un test « neuf » ici produirait du vert sans travail réel. |
| 5 | Tech Lead / QA | KR-211(b) : « un jalon/une fin conforme, un non conforme » comme critère de discriminance à deux entités | `RETENU` — reformulé en discriminance à TROIS entités (§6 critère 6, §7) | `alerteSansExpr:false` sur Jalon rend un « jalon non conforme qui avertit » impossible à observer — la discriminance réelle oppose fin-conforme / fin-non-conforme / jalon-non-conforme (silence). |
| 6 | QA | Absence de test couvrant qu'une entité jalon/fin fraîchement créée est acceptée par `validateDossier` sans `champ-requis-vide` | `RETENU` — ajouté (§6 critère 4, §7) | Trou révélé par la découverte tech-lead (`CHAMPS_REQUIS`) : le geste nu d'it1 y aurait rougi si copié tel quel. |
| 7 | UX | `SegmentedControl` porte deux sémantiques (filtre en it4, bascule ici) — risque de confusion ou de collision de fichier | `RETENU` — mitigation adoptée, vigilance maintenue | Deux sélections/compteurs strictement indépendants, D1 scopé à Fin seule, ZÉRO prop nouvelle et zéro fichier `SegmentedControl.tsx` touché cette itération (contrainte dure tech-lead, §4) — résout le risque de collision de fichier avec it4. La question de lisibilité (le composant se lit-il comme un filtre ?) reste une vigilance UX, reportée au raffinage d'it4 (Événements), qui réutilisera le même composant en filtre réel. |
| 8 | Tech Lead | Découpage en 3-4 lots (un par collection) | `REJETÉ` | Un lot « jalons » et un lot « fins » nommeraient quatre fichiers communs (panneau, styles.ts, index.ts, App.tsx) — propriété exclusive impossible ; un lot « bandeau D1 » serait une abstraction à un seul appelant. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

Aucune proposition hors-cadre cette itération.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non applicable (cette itération ne touche aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`dossier-registres` it1 en particulier — `panneauIndices.test.tsx`)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-registres-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — but corrigé (§1), désaccord #1 tranché contre sa préférence tour 2 mais motif accepté (convergence sur le fond du problème CHAMPS_REQUIS) |
| Tech Lead | recevable sous réserve | oui — veto tour 1 retiré, brouillon différé acté, lot contrat allégé (§5) |
| UX | recevable sous réserve | oui — brouillon différé aligné sur son propre motif tour 2, vigilance SegmentedControl maintenue non bloquante (§8-7) |
| QA | recevable sous réserve | oui — KR-211(a)/(b) reformulés, test manquant ajouté (§8-4/5/6) |
