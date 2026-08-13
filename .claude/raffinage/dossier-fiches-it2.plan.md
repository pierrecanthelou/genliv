# Plan d'itération — `dossier-fiches` · itération `2`

> Statut : `validé` (2026-08-12) — porte 1 (mécanique) verte, porte 2 (humaine) franchie
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-12
> Composition : `5 rôles` — motif : l'itération touche le dossier d'aventure (`brain/dossier/types.ts`, `destinations.ts`) et fait entrer les trois premières proses `ia` de la fiche PNJ ; `docs/ROADMAP-BASCULE-IA.md` § 4 liste nommément la n° 4 comme feature à 5 rôles.
> Exécution : `séquentielle` (2 lots — lot contrat seul et en premier, puis lot feature). Aucun essaim, aucun worktree, aucune fusion.
> **Redécoupage acté le 2026-08-12** (contrôle de taille, étape 0) : l'ancienne it2 (« identité **et** 8 caractéristiques ») échouait la phrase de démo et pesait ≥ 9 critères. Les caractéristiques + le PV dérivé deviennent **it3** ; les anciennes it3/it4/it5 glissent en **it4/it5/it6**. La feature passe de 5 à 6 itérations.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « L'auteur peut écrire l'identité de son personnage — qui il est, à quoi il ressemble, ce que le joueur en sait. » |
| **Tranche** | Écran (bloc « Identité » de l'accordéon de `FichePersonnage`, section Personnages) → service `brain/` (`DossierService.update()`, patch étroit sur `monde.personnages`, retour `EcritureDossier` désormais LU) → persistance (`PersistenceService`, clone gelé rendu par `validateDossier`) |
| **Lots** | 2 lots · dont `contrat` : 1 (lot 1, seul et en premier) |
| **Hors périmètre** | Budget de mots sur les proses · caractéristiques + PV dérivé (it3) · retrait d'un personnage (it5) · tout appel IA · toute ligne dans `tables.ts` / `validate.ts` |
| **Reporté** | Budget de contexte des **11** chemins de prose `ia` → n° 10 (les nombres) / n° 7 (le rendu) · retrait d'un personnage → it5 · contradiction prose ↔ caractéristique → n° 10 |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut écrire l'identité de son personnage — `fonction`, `apparence`, `description_joueur` — dans le bloc « Identité » de l'accordéon de sa fiche.

*(Le durcissement d'écriture qui accompagne ce bloc — `commit()` qui rend `EcritureDossier` au lieu de le jeter, le bandeau indexé, le test d'écriture à deux personnages — n'est pas une seconde capacité : c'est la condition pour que celle-ci ne mente pas. Il est daté « premier geste du lot d'it2 » par la revue de PR d'it1, et le lot 2 le livre AVANT le premier champ de prose libre, pas après.)*

## 2 — Hors périmètre

- **Le budget de mots sur les trois proses.** Proposé par `narratif-ia` (60 mots, 3 lignes de `BUDGETS_DE_MOTS`), **retiré par son auteur au tour 2** : `destinations.ts` porte déjà **8 chemins de prose `ia` livrés sans budget**, dont deux (`canon.ton`, `canon.interdits_ton[]`) sont *toujours chargés*, donc plus lourds par tour que n'importe quelle fiche. Borner les 9e–11e donnerait un instrument qui avertit à 61 mots sur `apparence` et se tait sur un `ton` de 900 : le silence cesserait de signifier « sous budget ». Aucune ligne dans `tables.ts`, `validate.ts`, `validate.test.ts`.
- **Les caractéristiques, `stats`, le PV dérivé** — it3, contrat de schéma disjoint.
- **Le retrait d'un personnage** — it5 : aujourd'hui aucun retrait de personnage n'est refusable au SSOT ; `relations[].cible_id` (it5) est la première référence qui rend le refus réel. Le bouton arrivera avec sa preuve, pas avant.
- **Un critère sur la branche `statut:'refuse'`.** La branche est *construite* (elle vient de l'union du service, la retirer coûterait un `as`), mais **aucun critère, aucun mock** : `jest.spyOn(dossiers,'update').mockReturnValue({statut:'refuse'})` est **interdit** dans ce lot — il prouverait le rendu du bandeau, jamais qu'un auteur peut l'atteindre. Inscrit au § 7 « non vérifiable en l'état ».
- **Un compteur de mots, un bandeau d'avertissement, une seconde région `role="status"`** — conséquences du budget, tombent avec lui.
- **Tout appel au modèle** : aucune génération, aucun rôle R1–R4.
- **La destination de `Entite.nom`** (KR-195) : question transverse aux 8 collections nommées, propriété de la n° 10.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Bloc 2 « Identité » — trois `Field` multiline, ordre fixé.** Brouillon local indexé par `personnage.id`, commit au **blur** (idiome `nom` d'it1 / `BrouillonLieu`). Aucun composant neuf, aucun `role` supplémentaire, même `champsStyle` (`gap: var(--space-6)`) que la fiche actuelle.

| Ordre | `label` | `hint` | `rows` | Placeholder exact |
|---|---|---|---|---|
| 1 | `FONCTION` | `interne — jamais lu par le joueur` | `2` | `Ermite retiré du monde, gardien de la mémoire de Val-Cendre.` |
| 2 | `APPARENCE` | `interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques` | `3` | `Un vieil homme voûté à la barbe blanche tressée de perles d'os, les mains tachées d'encre et de cendre.` |
| 3 | `DESCRIPTION JOUEUR` | `lue par le joueur` | `3` | `Une silhouette voûtée émerge de la pénombre du sanctuaire, capuche rabattue sur un visage qu'on devine plus vieux que la voix ne le laisse entendre.` |

Trois décisions de registre, chacune motivée :

- Le libellé est `DESCRIPTION JOUEUR`, **jamais `DESCRIPTION`** : l'homonyme de `FicheLieu` porte l'audience *opposée* (« interne, jamais lu »). La désambiguïsation est dans le **libellé**, pas seulement dans le `hint`.
- Le `hint` de `DESCRIPTION JOUEUR` est `lue par le joueur`, **jamais « lue par le joueur, mot pour mot »** — cette formule est réservée aux champs `moteur` émis verbatim (`texte_ouverture_joueur`). Ce champ est **injecté**, comme les deux autres.
- Le discriminant demandé par `narratif-ia` (« l'apparence décrit, elle ne chiffre pas ») va dans le **`hint`**, jamais dans le `placeholder` : le placeholder est une amorce de fiction, y glisser une consigne d'interface mélangerait deux registres dans le même champ (arbitrage UX, tour 2).

**Recalage de `BLOCS_VIDES` — 7 entrées → 6**, textes produits par `placeholderDe(iteration)`, inchangé :

| id | titre | itération recalée |
|---|---|---|
| `caracteristiques` | `Caractéristiques` | **3** |
| `objectif-plan-actions` | `Objectif & plan d'actions` | **4** |
| `savoirs` | `Savoirs` | **5** |
| `relations` | `Relations` | **5** |
| `presence` | `Présence` | **5** |
| `caractere-exploitable` | `Caractère exploitable` | **6** |

L'accordéon garde **8 emplacements** ; `identite` quitte `BLOCS_VIDES` pour porter du contenu réel. Le bloc 1 reste ouvert par défaut à la sélection ; le bloc 2 **ne s'ouvre pas** automatiquement.

**Bandeau de refus — dernier enfant de la `Card`, sous l'`Accordion`** (position exacte de `FicheLieu.tsx`). `<div role="status">` + eyebrow, aucun composant neuf :

```
const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
```

- Eyebrow : `font-family: var(--font-mono)`, `font-size: var(--fs-eyebrow)`, `color: var(--bad)`, `letter-spacing: var(--track-eyebrow)`.
- Corps : **branché sur `statut`, pas sur `issues`** — `{ statut: 'absent' }` ne porte **aucun** `issues` (`DossierService.ts:57`), un `<IssueList issues={[]} />` rendrait un bandeau vide sous un eyebrow rouge. `absent` → `<p>{TEXTE_ABSENT}</p>` ; `refuse` → `<IssueList issues={refus.issues} />`.
- `--bad` est le bon ton : le dépôt n'a pas de troisième ton sémantique, et inventer un ambre serait une valeur hors `tokens/colors.css`.

**Clavier.** Aucune modale. Ordre `Tab` : `Field NOM` (en-tête) → en-tête bloc 1 → (déplié) CAMP → PLAN → OBJECTIF → en-tête bloc 2 → (déplié) `FONCTION` → `APPARENCE` → `DESCRIPTION JOUEUR` → en-têtes blocs 3-8. `Entrée` dans un `Field multiline` insère un saut de ligne — **jamais de commit-on-Enter**, commit au `blur` uniquement (idiome `SYNOPSIS MJ` / `DESCRIPTION` de `Lieu`).

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage` étendu | type | émet (lot 1) / consomme (lot 2) | `fonction?: string` · `apparence?: string` · `description_joueur?: string` — trois champs **optionnels, à plat**, après `objectif_id` ; aucun sous-objet `fiche{}` |
| `DESTINATION_DES_CHAMPS` étendu | registre | émet (lot 1) | `'monde.personnages[].fonction': 'ia'` · `'monde.personnages[].apparence': 'ia'` · `'monde.personnages[].description_joueur': 'ia'` |
| `DossierService.update(id, recette)` | service | consomme (lot 2) | signature inchangée — **c'est son RETOUR `EcritureDossier` qui cesse d'être jeté** |
| `EcritureDossier` | type | consomme (lot 2) | `{statut:'absent'}` \| `{statut:'refuse'; errors; warnings}` \| `{statut:'ecrit'; dossier; warnings}` — **`'absent'` ne porte NI `errors` NI `warnings`** |
| `dossier:updated` | event | émet (lot 2, via `update()`) | `{ dossierId: string }` |
| `brain/components/{Field, Card, IssueList, ListRow, Badge, Select, SegmentedControl}` | component | consomme (lot 2) | inchangés — `Field` porte déjà `multiline`, `rows`, `hint` |

**Aucun symbole neuf exporté** → `src/brain/index.ts` n'est **pas** touché (`Personnage` y est déjà exporté, `validateDossier` aussi).

*(Aucun contrat de sortie IA cette itération — § 4 bis supprimée.)*

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier, et son contrat est figé avant que le lot 2 démarre.

### Lot 1 — `contrat-identite-personnage` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser les trois proses d'identité sur `Personnage`, déclarer leur audience, les instancier dans les deux fixtures pour que la déclaration ne soit pas une ligne morte.
- **Fichiers** :
  - `src/brain/dossier/types.ts` (R)
  - `src/brain/dossier/destinations.ts` (R)
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R)
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R)
  - `src/brain/dossier/couverture.test.ts` (R)
- **Explicitement NON touchés** *(à écrire ici, sinon un agent les touchera)* : `tables.ts`, `validate.ts`, `validate.test.ts`, `suffisance.test.ts`, `issues.ts`, `read.ts`, `sections.ts`, `brain/index.ts`.
- **Expose** :

```ts
export interface Personnage extends Entite {
	portee: Portee
	plan_actions: PlanAction[]
	savoirs: Savoir[]
	camp?: CampPersonnage
	objectif_id?: string
	fonction?: string            // ia — ce que le personnage EST dans le monde (métier, rang, charge)
	apparence?: string           // ia — ce que le narrateur décrit à son entrée en scène
	description_joueur?: string  // ia — ce que le joueur peut en savoir sans enquête (réputation)
}
```

- **Docstring obligatoire sur les trois champs** (objection `narratif-ia` n° 1, RETENUE) : le discriminant écrit noir sur blanc — sans lui, `apparence` et `description_joueur` sont un champ payé deux fois, puis deux vérités concurrentes dans le même contexte de modèle.
- **Bloc de commentaire obligatoire dans `destinations.ts`** (objection `narratif-ia` n° 2, RETENUE) : le suffixe `_joueur` désigne l'**audience**, jamais le **régime** — `description_joueur` est **injectée**, pas émise verbatim ; les deux régimes coexistent déjà sous ce suffixe (`canon.partage.accroche_joueur` est `ia`, `charpente.depart.texte_ouverture_joueur` est `moteur` et reste la seule prose émise mot pour mot).
- **Fixtures — répartition NOMMÉE** (identifiants vérifiés dans les fichiers, `narratif-ia` tour 2) :
  - `dossier-minimal.json` : les **trois** champs sur `pnj.aldur-le-sage` (seul personnage). **Obligatoire, pas un choix** — `couverture.test.ts` balaie cette fixture, et l'assertion « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » rougit sans instance.
  - `dossier-reference.json` : les **trois** sur `pnj.corvin-le-marchand` (`portee: premier`, **sans `camp` ni `objectif_id`** — prouve que l'identité ne dépend pas du rattachement) · `fonction` **seule** sur `pnj.harek-le-forgeron` (une fiche partielle est un état calme) · **aucun des trois** sur `pnj.tobin-le-gamin` (`portee: second` — « absent ≠ vide »). Les trois autres PNJ inchangés.
- **`couverture.test.ts`** : trois entrées dans `LIBRES` réutilisant la constante `PROSE_D_ENTITE_LIBRE` — **et la parenthèse « (aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]`) » est RETIRÉE de son motif** (arbitrage n° 14) : le motif réel de la dispense est la corruption chaîne→nombre non arbitrée par le schéma 1, la longueur n'y est pour rien. Généraliser la parenthèse à six clés doublerait la surface d'une affirmation que **rien ne vérifie** (le garde d'auto-nettoyage ne porte que sur la corruption).
- Plus un test nommé sur le modèle de **`couverture.test.ts:451`** (`camp`/`objectif_id`, *les DEUX fixtures*), **pas** celui de la ligne 426 (proses de `Lieu`, minimale seule) : assertion sur la **VALEUR** (`` `${chemin} → ia` ``), jamais sur l'existence (KR-174, leçon de BUG-051).
- **Critères couverts** : #6, #7, #8 (partiel).

### Lot 2 — `bloc-identite-et-issue-d-ecriture` `feature`

- **Ouvrier** : `dev-lot` (démarre seulement une fois le lot 1 figé)
- **But** : le bloc « Identité », la remontée de `EcritureDossier`, le bandeau indexé par le personnage en cause, le recalage des placeholders, les deux tests à deux personnages.
- **Fichiers** :
  - `src/features/dossier-fiches/components/PanneauPersonnages.tsx` (R)
  - `src/features/dossier-fiches/components/FichePersonnage.tsx` (R)
  - `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` (R)
- **`BlocIdentite.tsx` n'est PAS créé** : projection ~265 lignes contre un seuil KR-112 à 400 — une extraction à un seul appelant serait la dette habituelle (auto-correction `tech-lead`, tour 2 ; `ux-designer` sans objection, le contrat de design est identique inline ou extrait).
- **Expose / consomme** :

```ts
// PanneauPersonnages.tsx — internes au lot, aucune sortie vers brain/
interface BrouillonPersonnage { nom: string; fonction: string; apparence: string; description_joueur: string }
type ChampTexte = keyof BrouillonPersonnage

// Indexé par le personnage EN CAUSE (KR-197). `statut` repris de l'union du service,
// jamais d'une taxonomie maison. `issues` reste VIDE pour 'absent' — le service n'en fournit aucun.
interface RefusEnCours { personnageId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }

function commit(personnages: Personnage[], personnageId: string): EcritureDossier
// 'ecrit'  → n'efface le refus courant QUE si refus.personnageId === personnageId
// 'refuse' → { personnageId, statut:'refuse', issues: resultat.errors }
// 'absent' → { personnageId, statut:'absent', issues: [] }
// INTERDIT : setX(resultat.warnings) ou tout état semé depuis le retour de commit() (KR-189).

// Repli PAR CHAMP, jamais par objet (BUG-058 en lecture) :
// brouillons[id]?.fonction ?? personnage.fonction ?? ''
// Un objet brouillon présent mais incomplet (clé arrivée après le montage par
// réconciliation cloud) doit encore retomber sur le document, champ par champ.

// FichePersonnage.tsx — props, delta d'it1
- onChangeNom: (valeur: string) => void
- onBlurNom: (valeur: string) => void
+ brouillon: BrouillonPersonnage
+ refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null   // DÉJÀ filtré par le parent
+ onChangeChamp: (champ: ChampTexte, valeur: string) => void
+ onBlurChamp: (champ: ChampTexte, valeur: string) => void
```

- **Les deux indexations du bandeau, nommées séparément (KR-197, 4e occurrence)** : **affichage** = `refus.personnageId === personnageAffiche.id` (sinon le bandeau s'allume sous la fiche d'un innocent — BUG-061) ; **invalidation** = un commit réussi n'efface que sur le **même** `personnageId` (sinon un succès ailleurs efface un refus non résolu — BUG-056). La fiche ne reçoit **jamais** d'identifiant : le filtrage appartient au parent, seul propriétaire de `dossierId` et de la sélection.
- **Critères couverts** : #1, #2, #3, #4, #5, #8 (partiel).

*(2 lots. Les trois candidats à un troisième lot — recalage, bandeau, retrait — nomment tous les mêmes fichiers ; un contrat extrait pour les séparer serait une abstraction à un seul appelant. Le découpage révèle le parallélisme, il ne le fabrique pas.)*

## 6 — Critères d'acceptation

1. **Étant donné** un personnage sélectionné dont le bloc « Identité » est déplié, **quand** l'auteur saisit une fonction, une apparence et une description joueur puis quitte chaque champ, **alors** `DossierService.update()` persiste les trois clés sur ce personnage, et un champ laissé vide n'écrit aucune clé. — *niveau : composant* — *lot 2*
2. **Étant donné** un dossier importé portant **deux** personnages aux trois proses distinctes, **quand** la fiche se monte **sans aucune interaction** puis que l'auteur clique la ligne du second, **alors** chaque champ rendu affiche la valeur du document — éprouvé sur des valeurs que le composant ne peut pas fabriquer (ni plancher de schéma, ni valeur par défaut du widget). — *niveau : composant* — *lot 2* — **BUG-064**
3. **Étant donné** deux personnages dont le **second** est sélectionné, **quand** l'auteur écrit dans un champ d'identité, **alors** seul le second est modifié — et la mutation `personnageAffiche.id → personnages[0].id` fait échouer **ce test précis**. — *niveau : composant* — *lot 2* — **KR-197**
4. **Étant donné** un dossier supprimé ailleurs pendant l'édition, **quand** l'auteur quitte un champ d'identité, **alors** `commit()` rend `{statut:'absent'}` et un bandeau `role="status"` l'annonce sous la fiche du personnage en cause — au lieu du no-op muet qu'it1 avalait. — *niveau : composant* — *lot 2*
5. **Étant donné** la fiche d'un personnage, **quand** l'accordéon se rend, **alors** il porte 8 emplacements dont le 2e est éditable, et les **6** restants affichent leur placeholder recalé (Caractéristiques → 3, Objectif & plan d'actions → 4, Savoirs/Relations/Présence → 5, Caractère exploitable → 6) — assertion de compte **exacte** (6, ni 5 ni 7). — *niveau : composant* — *lot 2*
6. **Étant donné** les trois chemins neufs, **quand** `couverture.test.ts` tourne, **alors** chacun vaut `'ia'` — assertion sur la **valeur**, pas sur l'existence — et chacun est **instancié dans les DEUX fixtures**. — *niveau : contrat* — *lot 1*
7. **Étant donné** le dossier de référence (6 personnages), **quand** le lot contrat est livré, **alors** les 6 restent acceptés par `validateDossier` sans erreur ni avertissement neuf, et `suffisance.test.ts` reste vert (clés(référence) ⊆ clés(minimale)). — *niveau : contrat* — *lot 1*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur (aucun import croisé `dossier-fiches` ↔ une autre feature, aucune couleur en dur) et les **9** sections non livrées affichent toujours l'état vide intact de `PanneauSection` (KR-187). — *niveau : lint + composant* — *lots 1 & 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `couverture.test.ts` — « les trois proses d identite sont ia et instanciees dans les DEUX fixtures » | `` `${chemin} → ia` `` sur les 3, + présence dans `cheminsDeLaFixture()` **et** dans les feuilles de la référence | contrat | KR-174 | 1 |
| `couverture.test.ts` — dispenses `LIBRES` | 3 entrées neuves, disjonction toujours verte (aucune dispense morte) | contrat | BUG-044 | 1 |
| `couverture.test.ts` — exhaustivité | aucun champ sans destination après ajout ; aucune ligne morte | contrat | — | 1 |
| `validate.test.ts` *(existant, non modifié)* — dossier de référence | `ok: true`, `warnings: []` sur les 6 personnages enrichis | contrat | — | 1 |
| `suffisance.test.ts` *(existant, non modifié)* | clés(référence) ⊆ clés(minimale) toujours vrai | contrat | — | 1 |
| `panneauPersonnages.test.tsx` — « identite: les trois proses persistent au blur » | `statut:'ecrit'`, 3 clés posées ; champ vide ⇒ aucune clé | composant | — | 2 |
| `panneauPersonnages.test.tsx` — « lecture au montage sur DEUX personnages, sans interaction » | 7 champs lus (nom, camp, portée, objectif_id, fonction, apparence, description_joueur), 2e atteint par clic de ligne | composant | BUG-064 | 2 |
| `panneauPersonnages.test.tsx` — « ecriture sur DEUX personnages, aucune fuite d indexation » | seul le personnage sélectionné change ; **sonde obligatoire** : muter `personnageAffiche.id → personnages[0].id` doit faire rougir ce test | composant | KR-197 | 2 |
| `panneauPersonnages.test.tsx` — « dossier supprime pendant l edition: bandeau, pas de silence » | `{statut:'absent'}` → `role="status"` + `TEXTE_ABSENT` ; **sans mock du service** (second `createBrain()` sur le même stockage, `remove()`, puis blur) | composant | KR-183 | 2 |
| `panneauPersonnages.test.tsx` — « six placeholders recales » | **réécriture** du test existant « 7 placeholders » (l. 202-228) : `toHaveLength(6)` + décomptes `1/1/3/1` par itération cible | composant | — | 2 |
| `panneauPersonnages.test.tsx` *(existants)* — création, nom, camp/plan, Select objectif | non-régression, aucun assouplissement | composant | KR-191 | 2 |

Cas limites couverts : champ vide (aucune clé écrite) · brouillon présent mais incomplet (repli **par champ**, BUG-058) · deux personnages (lecture **et** écriture) · dossier disparu en cours d'édition · référence orpheline (déjà couverte par it1, non régressée).

**KR cités sans test nommé — vérifiés par la porte ou par la revue, jamais comptés comme testés** :

| KR | Pourquoi aucun test ne peut le couvrir | Où il est vérifié |
|---|---|---|
| KR-189 (jamais un avertissement semé) | **aucun avertissement n'existe** sur ces trois champs cette itération : il n'y a rien à semer, donc rien à faire rougir. L'interdiction est préventive | lecture du diff en revue de PR — un `setX(resultat.warnings)` est un refus de PR |
| KR-112 (composant > 400 l.) | un comptage de lignes, pas un comportement | `wc -l` en fin de lot : `FichePersonnage.tsx` projeté ~265 l. |
| KR-109 (pas de promotion à `brain/components/` sans 2e appelant) | l'absence d'un fichier ne se teste pas | liste de fichiers du lot 2 : aucun fichier sous `src/brain/components/` |
| KR-190 (un seul lot contrat par itération) | propriété du plan, pas du code | § 5 : un seul lot marqué `contrat` |
| KR-195 (destination de `Entite.nom`) | le champ n'est pas touché | `destinations.ts` : `'monde.personnages[].nom': 'auteur'` inchangé — la ligne ne doit pas bouger |

**Non vérifiable en l'état** — à recopier tel quel dans la revue :

- La branche `statut:'refuse'` du bandeau est **construite mais non démontrée** : aucun champ de cette itération ne peut la produire (prose optionnelle, aucune règle de forme), et un mock du service prouverait le rendu, jamais l'atteignabilité. Elle deviendra démontrable sans réécriture le jour où un champ contraint entre (it3+).
- Le **poids réel en contexte** des trois proses (n° 12 : un appel par PNJ qui parle) : aucun instrument du dépôt ne le mesure. Reporté avec les 11 chemins (§ 8, n° 5).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Durcissement d'écriture greffé sur « 3 champs de prose » ; `refuse` inatteignable | `RETENU` — lot 2 | Réduit au seul statut atteignable (`'absent'`) ; objection retirée par le PM au tour 2, le lot 2 livrant exactement cette réduction |
| 2 | Tech Lead | « Rien du tout dans `tables.ts` » (contre le budget de mots) | `RETENU` dans son effet | Tech Lead s'est **rangé** au tour 2 (argument « fréquence d'injection ») ; c'est le retrait de `narratif-ia` qui tranche, pas cette objection — mais l'effet est le même : zéro ligne dans `tables.ts` |
| 3 | Narratif & IA | `BUDGET_MOTS_PROSE_PERSONNAGE = 60` + 3 lignes de `BUDGETS_DE_MOTS` | `REJETÉ` | **Retiré par son auteur au tour 2** : 8 chemins de prose `ia` sont déjà livrés sans budget, dont 2 toujours chargés — borner 3 sur 11 rendrait le silence de l'instrument mensonger. Veto PM (périmètre) convergent |
| 4 | Narratif & IA | Discriminant `fonction`/`apparence`/`description_joueur` non écrit | `RETENU` — lots 1 + 2 | Docstrings dans `types.ts` (lot 1) + `hint` d'`APPARENCE` (lot 2). Deux proses `ia` sans discriminant sont deux vérités concurrentes dans le même contexte |
| 5 | Narratif & IA | Régime : `_joueur` désigne l'audience, pas le régime — injecté, jamais émis verbatim | `RETENU` — lot 1 | Bloc de commentaire obligatoire dans `destinations.ts` ; non contesté au tour 2 |
| 6 | QA | Aucun critère sur `refuse` simulé par mock | `RETENU` | Branche construite, **ni critère ni mock** ; inscrite en « non vérifiable en l'état ». Tech Lead s'est rangé et a durci l'interdiction |
| 7 | UX | Un bandeau seul, sans le correctif `commit(): void` | `RETENU` — lot 2 | (a) et (b) sont livrés **couplés** : un seul point d'écriture, une seule garde. Objection retirée au tour 2, réserve satisfaite |
| 8 | UX | Libellé `DESCRIPTION JOUEUR`, jamais `DESCRIPTION` | `RETENU` — lot 2 | L'homonyme de `FicheLieu` porte l'audience opposée ; la désambiguïsation est dans le libellé, pas seulement dans le `hint` |
| 9 | UX vs Narratif & IA | Où va le discriminant « décrit, ne chiffre pas » | `RETENU` (position UX) | Dans le `hint`, jamais dans le `placeholder` : le placeholder est une amorce de fiction, y glisser une consigne d'interface mélange deux registres. Domaine UX (registres de langue) |
| 10 | Tech Lead | `{statut:'absent'}` ne porte aucun `issues` | `RETENU` — lot 2 | Correction load-bearing (`DossierService.ts:57`) : le bandeau branche sur `statut`, sinon `<IssueList issues={[]} />` rend un bandeau vide sous un eyebrow rouge |
| 11 | Tech Lead | `BlocIdentite.tsx` extrait ? | `REJETÉ` | Auto-correction au tour 2 : ~265 l. projetées contre un seuil KR-112 à 400 — extraction à un seul appelant. UX sans objection |
| 12 | Tech Lead / PM / UX | Retrait d'un personnage en it2 | `REPORTÉ` → **it5** | Aucun retrait de personnage n'est refusable au SSOT aujourd'hui ; `relations[].cible_id` (it5) est la première référence qui rend le refus réel. Le bouton arrive avec sa preuve |
| 13 | QA | Le budget porterait le compte à 9 critères (> 8) | `Sans objet` | Le budget est rejeté (n° 3) — l'itération tient à **8** critères exactement |
| 14 | Narratif & IA | Parenthèse « aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]` » dans `PROSE_D_ENTITE_LIBRE` | `RETENU` (option 1 : la retirer) | Réutilisée pour 3 chemins de plus, elle doublerait la surface d'une affirmation que **rien ne vérifie**. Le motif réel de la dispense est la corruption chaîne→nombre |
| 15 | Tech Lead | Jamais `setX(resultat.warnings)` (KR-189) | `RETENU` | Écrit comme interdiction explicite au § 5, lot 2 — l'argument « le budget donne un consommateur à `EcritureDossier` » était une erreur d'ingénierie, la lecture dérivée ne consomme pas ce retour |
| 16 | Narratif & IA | KR neuf : « toute prose `ia` entrant au schéma entre avec sa ligne de budget » | `REJETÉ` | Retiré par son auteur : une règle que 8 chemins livrés violent déjà se désactive dans le mois |
| 17 | Tech Lead | Repli **par champ**, jamais par objet | `RETENU` — lot 2 | Un brouillon présent mais incomplet (réconciliation cloud) afficherait vide puis réécrirait ce vide au blur — BUG-058 côté lecture |
| 18 | Narratif & IA | Contradiction prose ↔ caractéristique (`apparence` « très fort » vs `stats.FO`) | `REPORTÉ` → n° 10 | Le modèle ne voit jamais `FO` : c'est une dérivation de libellé, propriété de l'assembleur. it2 ne livre que le `hint` |
| 19 | Narratif & IA | Budget de contexte des **11** chemins de prose `ia` (8 livrés + 3 entrants) | `REPORTÉ` → n° 10 (les nombres) / n° 7 (le rendu) | Un seul balayage, jamais 3 chemins bornés sur 11. Rien d'irréversible : un budget est un avertissement non bloquant, il ne touche pas `schema: 1` et n'exige aucune migration |

*(Aucun désaccord ne disparaît sans statut. Aucun veto n'a survécu au tour 2 — le veto PM sur le budget est satisfait par le retrait de son auteur ; pas de bloc `ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition `INNOVATION` — le budget de mots, seule candidate à infléchir une règle existante, est rejetée. Section supprimée.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** : l'itération ne touche aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`)
- [ ] Tests du § 7 écrits et passants, **sonde de mutation du critère #3 exécutée à la main** (muter `personnageAffiche.id → personnages[0].id`, vérifier le rouge, restaurer)
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de `dossier-fiches`, `dossier-canon`, `bascule-editeur`
- [ ] Aucun fichier touché hors de la liste de son lot — en particulier **aucune ligne dans `tables.ts`, `validate.ts`, `validate.test.ts`, `brain/index.ts`**
- [ ] Relevé du budget de contexte (`docs/WORKFLOW.md` § Budget de contexte) : `code-knowledge.json` (76 356 o) et le couple `CLAUDE.md`+`WORKFLOW.md` (45 868 o) sont **à moins de 0,5 kio de leur plafond** — une compaction est probablement due dans le même lot que la doc
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | favorable, veto satisfait | budget de mots retiré d'it2 (n° 3) ; `refuse` réduit à `absent` (n° 1) |
| Tech Lead | recevable sous réserve | KR-189 écrit en interdiction (n° 15) ; `BlocIdentite` retiré (n° 11) ; 2 lots séquentiels |
| UX | pas de veto, objection retirée | (a)+(b) couplés (n° 7) ; discriminant dans le `hint` (n° 9) |
| QA | favorable sous réserve | aucun critère sur `refuse` mocké (n° 6) ; 8 critères, sous le plafond |
| Narratif & IA | recevable sous réserve | objections 1 et 2 au lot contrat (n° 4, n° 5) ; budget retiré et reporté (n° 19) |
