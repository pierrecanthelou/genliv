# Tour 2 — Tech Lead (contre-lecture)

**VERDICT — recevable. Zéro veto maintenu.** Deux concessions de fond (C2, C1), une clarification de contrat (C3), une acceptation (C8), un rejet motivé (C-narratif), un ralliement au PM (C7).

## C2 — `destinations.ts` : **JE CÈDE. Garde `destination === 'ia'` RETIRÉ.**
Mesuré dans `destinations.ts` :

| Chemin | Audience | Qui en a besoin |
|---|---|---|
| `canon.objectifs[].nom` | `auteur` (l. 127) | Éclater |
| `canon.objectifs[].reussi_si_texte` | `auteur` (l. 140) | Éclater |
| `canon.objectifs[].camp` | `moteur` (l. 131) | Éclater |
| `monde.indices[].nom` | `auteur` (l. 411) | Tisser |
| `monde.personnages[].nom` | `auteur` (l. 146) | les trois |

Mon garde interdit **les cinq**. Appliqué tel quel, « Éclater le synopsis » recevrait le synopsis **sans ses objectifs** — la moitié de son énoncé roadmap — et aucun assistant ne pourrait nommer une entité à l'auteur. **Ce n'est pas une réserve, c'est une amputation.**

Son garde à lui (existence de la clé) est **trop faible** : il rougit sur une coquille, jamais sur une fuite. **La troisième forme tient mes exigences et les siennes** :
```ts
export const DEROGATIONS_AUDIENCE: Record<RoleCopilote, readonly string[]>
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]>
```
`contexte.test.ts`, **quatre** assertions : (1) **existence** — tout chemin de `CHAMPS_INJECTES[r] ∪ DEROGATIONS_AUDIENCE[r]` est une clé de `DESTINATION_DES_CHAMPS` ; (2) **audience** — tout chemin de `CHAMPS_INJECTES[r]` est `'ia'` **ou** listé en dérogation ; (3) **énumération figée** — `toEqual` sur un littéral `[chemin, audience]` par dérogation, donc une dérogation neuve rougit et doit être recopiée à la main avec son motif ; (4) **aucune dérogation morte** — assertion de disjonction, précédent `SANS_DESTINATION` (BUG-044).

Deux bornes gardées : `DEROGATIONS_AUDIENCE` vit dans `brain/copilote/`, **jamais importée par `brain/dossier/` ni ré-exportée par `brain/index.ts`** — la n° 10 ne peut pas en hériter par accident.
**Ce que les assistants perdent : rien.** Les cinq champs passent.

**Objection nommée à `narratif-ia`, sur sa propre cohérence** : son § 1 écrit « jamais ce que le moteur LIT comme seuil, porte ou **drapeau de routage** », et `destinations.ts` l. 128-131 classe `camp` en « classification de moteur… à qui appartient la victoire » — **un drapeau de routage. Son invariant rejette sa propre demande.** Je tranche en sa faveur sur le fond, mais la phrase **doit être amendée** : « …drapeau de routage **lu pendant une partie** ». Sans cet amendement, l'ouvrier qui lit les deux paragraphes tranchera seul, et contre `camp`. `camp` sera la **seule dérogation `moteur` du dépôt** ; son commentaire doit dire que le motif de `destinations.ts` est un motif de **joueur**.

## C3 — `entiteId` : **ambiguïté reconnue. Deux types, pas un.**
Mon `ChampPropose` était la forme **après** re-résolution ; rien ne le disait. « C'est précisément le genre d'ambiguïté qu'un ouvrier tranche seul et dans le mauvais sens. »
```ts
export type RoleCopilote = 'tisser-indices' | 'completer-fiche' | 'eclater-synopsis'
/** FORME RENDUE PAR LE MODÈLE. Franchit le réseau. JAMAIS un identifiant. */
export interface ChampBrut { readonly cibleRang: number | null; readonly champ: string; readonly valeur: string }
/** FORME APRÈS RE-RÉSOLUTION PAR LE CODE. Ne franchit jamais le réseau. */
export interface ChampPropose { readonly entiteId: string | null; readonly champ: string; readonly valeur: string }
```
Ordre de validation **non négociable** : `JSON.parse` → schéma fermé → **balayage `FORME_IDENTIFIANT` sur le corps sérialisé BRUT** → rangs → bornes → prose. Le balayage court sur `ChampBrut`, **avant** toute résolution.

**Le détail qu'un ouvrier rate, inscrit dans la signature** — la table rang → identifiant est **rendue par l'assembleur**, jamais re-dérivée à la résolution (sinon un dossier modifié entre l'appel et l'acceptation décale les rangs, et on écrit dans le personnage n° 3 au lieu du n° 2 — mon RISQUE de tour 1 sous sa forme la plus sournoise) :
```ts
assemblerContexte(role, dossier, cible): { texte: string; rangs: readonly string[] } | { refus: MotifEchec }
resoudreRangs(bruts, rangs): readonly ChampPropose[] | null   // null = rang hors intervalle
```
**RISQUE de tour 1 MAINTENU**, désormais porté par ce couple de signatures plutôt que par une phrase.

## C8 — `Field.readOnly` : **accepté, et PAS dans l'it1.**
Vérifié : `Field.tsx` (127 l.) n'a pas de `readOnly`, et **il n'existe aucun `Field.test.tsx`**. Importé par ~20 fichiers ; prop optionnelle ⇒ aucun appelant ne change.
À l'UX : **j'accepte la réserve n° 1 et je refuse l'alternative** — un bloc « AVANT » maison dupliquerait l'objet `shared` de `Field.tsx` (l. 27-39, sept tokens `var(--…)`) dans une feature, exactement la duplication que la règle de fidélité interdit.
Avec l'ordre retenu, l'it1 (« Tisser ») ne rend que la variante REMPLISSAGE ⇒ `Field.tsx` + `Field.test.tsx` vont dans le **lot 2-A**. Autant de retiré de la tranche lourde.
**Point nommé, non vétoé** : `tabIndex: -1` sur le champ « AVANT » — un lecteur au clavier ne peut plus comparer AVANT/APRÈS. `readOnly` seul suffit. Je demande de laisser le champ dans l'ordre de tabulation ; l'inset et `--text-muted` gardés.

## C-narratif/architecture — `porte_suggeree` qui ouvre l'éditeur de la n° 4 : **REJETÉ sous cette forme.**
Vérifié sur pièces : l'éditeur est `dossier-fiches/components/BlocSavoirs.tsx`, feature `done` ; le seul canal est `onSelectSection`, et `DossierEditorScreen.tsx` l. 41-44 dit **pourquoi** — « `SectionId` SEUL traverse la frontière… donc le panneau ne peut pas fabriquer l'état illégal de BUG-082 » ; et **les quatre portes exigent toutes une valeur** (`BlocSavoirs.tsx` l. 57-60), donc « écrire un `revele_si` partiel » reviendrait à poser un défaut — **un seuil du modèle ratifié par le silence**, ses propres REJETÉS 2 et 3.
**Forme faisable, et c'est la seule** : `porte_suggeree` reste un **texte de recommandation NON ACCEPTABLE** rendu en `hint` sous la ligne, sans bouton « Accepter », plus un renvoi `onSelectSection('personnages')`. Si `narratif-ia` juge qu'une recommandation non acceptable n'a pas sa place dans un panneau dont tout le reste s'accepte — **argument que je trouve solide** — alors `porte_suggeree` sort du schéma A, sans perte pour l'it1.

## C1 — **Je me rallie à 3 itérations, dans l'ordre de `narratif-ia`.**
Réponse mesurée : **oui, ma « prose seule » est plus petite que « Tisser »** — trois chaînes plates sur une entité que l'auteur désigne dans un `Select`, donc **aucun `cibleRang`, donc pas de va-et-vient rang ↔ identifiant du tout**. Sur l'axe du contrat de sortie, j'avais raison.
**Et c'est sans objet, parce que cette victoire n'existe qu'à 4 itérations.** À 3, mon it1 devient « Compléter en entier » — curseurs (premiers entiers sortis d'un modèle) **et** `cible_rang`, dans la même tranche que toute l'infrastructure. Le plus lourd des trois it1 possibles. Le sien est le plus léger, et **j'ai vérifié son argument « zéro nombre »** : `Certitude` est une énumération fermée de chaînes (`types.ts` l. 296), donc **l'it1 ne fait sortir aucun entier d'un modèle**. L'échelle de risque devient lisible : **rangs → nombres → entités neuves**.
Je retire ma 4ᵉ itération. Motif franc : le roadmap dit 3, trois rôles disent 3, et **le plafond de lots n'exige pas la coupe** — l'it1-à-3 passe à **2 lots étanches**. Je n'ai qu'un argument de volume, qui n'est pas mon domaine de veto.

**Je rejette la coupe de secours de `narratif-ia`** (service sans écran) et **je donne raison à `pm-produit`** : même couche horizontale, un cran plus bas. `exportDossier` est une fonction pure sans interlocuteur ; `CopiloteService` sans écran est un tuyau dont personne ne prouve la sortie. **Si l'it1 déborde, la coupe est verticale** (un seul indice désigné, puis le balayage complet), pas horizontale.

À `ux-designer` : **ton ordre est rejeté sur un point, retenu sur l'autre.** « Éclater » en premier est rejeté — ton argument est vrai du **panneau** et faux du **chemin d'écriture**, celui qui frappe neuf identifiants. Mais tu as raison que sa variante de rendu est la plus simple, et c'est pourquoi il coûte peu en dernier. **Retenu intégralement de toi** : destination unique, `LigneProposition` locale, `Select` jamais `TargetPicker`, aucun `Modal`.

À `qa` : **AC7 change de destinataire.** Avec l'ordre retenu, « personnage neuf ⇒ `frapperIdentifiant` » n'est testable qu'à l'**it3** ; l'it1 doit porter à la place un AC nommé sur le **balayage `FORME_IDENTIFIANT`**. Sans quoi l'it1 livre le tuyau sans son garde, et l'it3 en hérite non prouvé. Ton AC6 est **maintenu** et c'est ce que ma règle « une proposition ne capture jamais le dossier » sert.

## C7 — **Je retire mon option (b), je me range à l'option (a) du PM.**
Motif venu de ma propre règle : **la compaction doit précéder l'écriture de la `specification.json`**, puisque `/cadrer` y écrit les `known_risks` que `CLAUDE.md` mandate de mirorer. Or la spec s'écrit **avant** le premier lot. Une compaction embarquée dans le lot contrat de l'it1 arriverait **après** que le fichier a été poussé plus loin au-dessus de son plafond — **elle rate sa cible. Mon option (b) était mal ordonnée.**
Pas de conflit avec « un lot contrat s'exécute seul et en premier » : **ce n'est pas un lot de cette feature**, c'est une tranche autonome qui la précède.
**Tranche `outillage-compaction-ck`** : `code-knowledge.json` (R) + `docs/ROADMAP-BASCULE-IA.md` (R, 347 o de marge et la colonne `Statut` va en consommer). **Change `.md`/`.json` uniquement ⇒ pas de PR tech-lead, pas de revue utilisateur** (`WORKFLOW.md`, « Review scope is by file type »), commit direct, PATCH +1. **Cible avec marge, pas au ras** : ~2 kio de KR à venir ; viser ≥ 2 kio sous le plafond re-dérivé, sinon l'écriture des KR rebrèche le jour même. Plafond re-dérivé vers le bas **dans cette tranche**, sur `git show :code-knowledge.json | wc -c`.

## Statut de mes objections du tour 1
| Objection | Statut |
|---|---|
| RISQUE — second écrivain du dossier | **MAINTENU**, porté par `assemblerContexte` → `rangs` → `resoudreRangs` |
| OBJECTION — infra + assistant qui CRÉE dans la même tranche | **MAINTENUE** — l'ordre retenu la satisfait mieux que le mien |
| PROPOSITION — 4 itérations | **RETIRÉE** |
| Garde `destination === 'ia'` | **RETIRÉ** |
| Arbitrage de surface (3ᵉ prop sœur) | **MAINTENU** — seul point où je resterais sur un veto ; non contesté |
| Triade Décision A jamais ouverte | **MAINTENU** |
| Clé d'API dans le worker seul | **MAINTENU**, non contesté |
| `POST` / `ALLOWED_ORIGINS` / plafond de corps / `testMatch` | **MAINTENUS** — convergent avec KR-235 |
| Rejouement puis abandon explicite | **MAINTENU et confirmé** par `narratif-ia` |
| L'invite vit dans le worker | **MAINTENU**, non contesté ; friction de redéploiement acceptée et notée |

**Aucun veto ne survit au tour 2. Pas d'escalade.**

## Lots — 3 itérations, 2 lots chacune, sériels, aucun fichier nommé deux fois
**Tranche préalable `outillage-compaction-ck`** (hors itérations, hors PR) : R `code-knowledge.json` · R `docs/ROADMAP-BASCULE-IA.md`.

**It1 « Tisser les indices »** — `1-A` contrat : N `worker/ia.ts`, N `worker/ia.test.ts`, R `worker/index.ts`, R `wrangler.toml`, R `jest.config.cjs`, N `src/brain/copilote/{types,contexte,valider}.ts` + 2 tests, N `src/brain/CopiloteService.ts` + test, R `src/brain/BrainContext.tsx`, R `src/brain/index.ts`, R `src/features/bascule-editeur/components/DossierEditorScreen.tsx` + son test. `1-B` feature : N `src/features/dossier-copilote/**`, R `src/App.tsx`.
**It2 « Compléter une fiche »** — `2-A` contrat : R `worker/ia.ts` + test, R `brain/copilote/*` + tests, **R `src/brain/components/Field.tsx`**, **N `src/brain/components/Field.test.tsx`**. `2-B` feature : `dossier-copilote/**` seul.
**It3 « Éclater le synopsis »** — `3-A` contrat : R `worker/ia.ts` + test, R `brain/copilote/*` + tests. `3-B` feature : `dossier-copilote/**` seul.

`specification.json` est écrite au `/cadrer`, **avant** les lots — elle n'appartient à aucun d'eux.
**Aucun lot ne nomme `types.ts`, `destinations.ts` ni `validate.ts`.**

## REJETÉS (mis à jour)
1-12. **MAINTENUS** (tour 1) : proposition persistée · diff en place chez une autre feature · import inter-features · événement `copilote:*` · SSE · clé d'API côté client · assembleur générique · `stats`/`Revelation.jet` · modèle frappant un identifiant · en-tête HTTP pour le rôle · rattrapage des tests `/kv/` · corps brut du fournisseur.
13. ~~Garde `destination === 'ia'`~~ — **RETIRÉ au tour 2** : ampute « Éclater » de ses objectifs.
14. ~~4ᵉ itération~~ — **RETIRÉE au tour 2** : sans effet à 3 itérations, le plafond de lots n'exige pas la coupe.
15. ~~Compaction embarquée dans le lot 1-A~~ — **RETIRÉE au tour 2** : mal ordonnée, elle rate sa cible.
16. **NEUF — `porte_suggeree` dont l'acceptation ouvre l'éditeur de la n° 4** — fichier de `dossier-fiches`, et élargir `onSelectSection` rouvre BUG-082.
17. **NEUF — écrire un `revele_si` partiel** — les quatre portes exigent une valeur ; en poser une par défaut, c'est le seuil du modèle ratifié par le silence.
18. **NEUF — `CopiloteService` livré sans écran** — couche horizontale ; si l'it1 déborde, la coupe est verticale.
19. **NEUF — « Éclater le synopsis » en it1** — rendu le plus simple, chemin d'écriture le plus dur.
20. **NEUF — élargir `onSelectSection` à une charge utile d'entité** — BUG-082.
21. **NEUF — un bloc « AVANT » maison** — duplique sept tokens de `Field.tsx` dans une feature.
22. **NEUF — `tabIndex: -1` sur « AVANT »** — non vétoé, demandé en retrait.

⚠ **Non mesuré** : volume réel de l'it1, couverture après l'it1, plafond de contexte en caractères, octet exact à viser pour la compaction. Aucun test exécuté ce tour ; les faits vérifiés le sont par lecture de fichier, cités avec leur ligne.
