# Tour 2 — Tech Lead — `dossier-copilote` it1 (contre-lecture)

```
CONTRE-LECTURE

C1 · SCHÉMA DE SORTIE — JE CÈDE, et le motif du Narratif est plus fort que le mien.
Vérifié : `CLES_SORTIE = ['valeur'] as const` sert le garde KR-236 à l'exécution
exactement comme `['champ','texte']` — le validateur reste PILOTÉ par la liste
(égalité stricte d'ensembles de clés), le garde l'énumère. L'écho tombe (N-R7).
MAIS un garde au niveau de la CLÉ devient un piège de vacuité quand la clé est un
mot français courant : une invite contenant « …la valeur du personnage… » satisfait
`includes('valeur')` sans rien demander. Donc le garde porte sur `GABARIT_SORTIE`
(le littéral `{"valeur": "…"}`), jamais sur la clé nue — c'est-à-dire la pièce (1)
du Narratif, et elle devient PORTANTE, pas décorative. TL-6 survit : les deux types
restent (`PropositionRendue` ne porte plus AUCUNE référence d'entité — KR-231 est
même mieux servi). Je cède aussi `RoleCopilote = 'personnage-prose'` et le `champ`
du fil en CHEMIN DE FEUILLE complet : c'est ce qui aligne l'allow-list de sortie,
la table d'invites du worker et `DESTINATION_DES_CHAMPS` sur UN vocabulaire.

C2 · CONTEXTE — l'audience est son domaine, je ne conteste ni les 12 ni N-R12.
Vérifié en source (`amorce.ts` l. 103-105) : `synopsis_mj` ET `ton` portent le
marqueur sur tout dossier neuf. Donc exiger les deux n'élargit PAS l'atteignabilité
du refus, ça élargit le refus. TL-14 RETIRÉE. Sur LA FORME, `Record<Role, readonly
string[]>` ne peut pas porter la disjonction : je le remplace par `EXIGENCES_CONTEXTE`,
union discriminée `{sorte:'requis'|'parmi'}` — et je retire le `seuil: 1` du Narratif
(un nombre admet 0 et 6, deux états illégaux ; « parmi » veut déjà dire ∃ ; le tuple
`readonly [string,string,...string[]]` interdit le singleton et le vide À LA
COMPILATION). Attention : `DESTINATION_DES_CHAMPS` est typé `Record<string,
Destination>` — AUCUN chemin n'est vérifiable par le type. Le garde des chemins est
et reste un test (audience `'ia'`, cardinalité 12, inclusion dans `CHAMPS_INJECTES`).
Oui, 7→12 change ma mesure du § d : deux des douze sont des COLLECTIONS non bornées
(`caractere.parler[]`, `plan_actions[].action`), donc M sur la fixture n'est plus
une borne haute et le refus `trop-long` devient réellement atteignable. Protocole
inchangé, deux ajouts : la mesure se prend sur le personnage le plus rempli ET
l'ouvrier ASSERTE d'abord que les 12 chemins y résolvent non vides — sinon c'est un
plancher, pas une mesure.

C4 · LIBELLÉS — JE CÈDE À L'UX : 3 entrées, une seule feature « done » touchée.
J'applique ma propre docstring à ma propre table. `SYNOPSIS MJ` : plus aucun appelant
dès que N-R12 l'emporte → ligne supprimée. `TON` : son seul appelant possible était
un refus qui CITE le libellé d'écran ; comme le refus R2 nomme déjà une PARTIE et pas
un chemin, faire citer un libellé par R1 obligerait à DEUX formes de refus (état
illégal) — donc les deux refus nomment une partie, et `TON` perd son appelant aussi.
Compte exact justifié : 3 entrées × {libelle, hint} = 6 chaînes, second consommateur
réel et nommé. `PanneauCanon.tsx` SORT des lots. Deux corrections à l'UX :
(i) le fichier DOIT être ré-exporté par `brain/index.ts` — le précédent `amorce.ts`
ne vaut pas ici, il n'est pas ré-exporté PARCE QUE aucune feature ne le lit (sa
docstring le dit) ; deux features le lisent, c'est KR-109 à la lettre ;
(ii) l'édition de `BlocIdentite.tsx` est `label={LIBELLES.fonction.libelle}` — trois
accès EXPLICITES, jamais un indexage par `ChampTexte` (qui vaut
`keyof BrouillonPersonnage`, donc inclut `'nom'` : il ne compilerait pas contre une
table à 3 clés).

C5 · COUPE REMPLACEMENT — NEUTRE sur mes lots, et elle ne coûte pas le garde du
Narratif. Zéro fichier en moins, zéro signature changée : `LigneProposition.tsx` est
déjà propriété du lot 2. Ce n'est donc pas un gain de découpage, c'est un déplacement
(−1 variante, −1 test ; +1 précondition, +1 raison de désactivation, +1 test). Mais
l'argument du Narratif ne tombe PAS pour autant, il devient sans objet : le bloc AVANT
garde contre « le modèle rend la cible reformulée » ; en REMPLISSAGE la cible est vide
ou marquée, donc cette panne n'a plus d'objet. La paraphrase du CONTEXTE, elle,
n'était de toute façon PAS attrapée par le bloc AVANT. Condition non négociable de la
coupe : la précondition REMPLISSAGE est ENFORCÉE (le sélecteur de champ n'offre que
les champs vides ou marqués) — sinon la coupe retire une variante et laisse son cas
atteignable. Coût : 0 en `brain/`, ~15 lignes en feature.

C6 · TL-8 CONFIRMÉ, forme exacte. OUI, `worker/frontiere.test.ts` peut lire
`src/brain/copilote/schemaSortie.ts` EN TANT QUE SOURCE sans l'importer :
`fs.readFileSync` — `testMatch` ne gouverne que la DÉCOUVERTE, pas ce qu'un test lit.
Précédent exact mesuré : `amorce.test.ts` balaie tout `src/` par `readdirSync`.
Trois contraintes : (a) le test ne contient AUCUN des deux littéraux, il les EXTRAIT
des deux fichiers par la même regex ancrée et les compare entre eux (sinon il devient
lui-même un troisième porteur) ; (b) il asserte exactement UNE occurrence par fichier
(protection contre l'assertion vraie par vacuité) ; (c) cas négatif mesuré par
l'ouvrier : altérer un des deux littéraux fait rougir.

C10 · UN APPEL EN VOL — tient dans le lot 2, `useDemandeCopilote.ts`, sans déborder :
l'état `en-cours` est DÉJÀ exigé par le contrat de design. Mais `disabled` SEUL ne
prouve pas le critère : deux `fireEvent.click` synchrones passent avant le re-rendu.
Le garde est un `enVolRef` dans le hook, `disabled` n'en est que la face visible.
Mutant obligatoire à écrire : retirer le ref, garder `disabled` — le test des deux
clics doit rougir.

C12 · La mesure de la QA RETIRE une contingence de ma note 3. Son probe à docblock
node a traversé `jest.setup.cjs` (un `setupFilesAfterEnv`, donc appliqué à TOUS les
fichiers) et il est passé : `globalThis.crypto` existe dans l'environnement node de
cette machine. L'ordre interne du lot 1 perd sa première vérification : il reste
`testMatch` (une ligne) puis `tsconfig.include`, qui reste conditionnel à une mesure.
Le garde `typeof globalThis.crypto === 'undefined'` redevient un repli documenté.

TL-13 · Ma préférence, en une ligne : `App.tsx` écrit `panneauCopilote={() =>
<PanneauCopilote dossierId={…} />}` — une render-prop qui ne DÉCLARE pas le paramètre
qu'elle n'utilise pas type-checke, ne crée aucune variable inutilisée, et laisse la
prop sœur intacte pour le lien « Aller à Personnages » que l'UX a DIFFÉRÉ.

MES OBJECTIONS — statuées

OBJECTION 1 (encapsulation des libellés) — MAINTENUE, portée RÉDUITE de moitié.
  3 entrées (6 chaînes), lot contrat, ré-exporté par le baril. Le veto tombe si et
  seulement si le registre part avec le lot 1 ; il tient si un lot recopie une seule
  des six chaînes. L'exception au critère n° 14 ne nomme plus QU'UNE feature.
OBJECTION 2 (le 4ᵉ texte « vide-mais-réussi » sans producteur) — RETIRÉE.
  Motif : l'UX (§ 4 d) et la QA (§ b) fournissent l'instrument que je n'avais pas —
  la discriminance se prouve par UNICITÉ DES CONSTANTES, pas par un rendu des quatre
  chemins. La branche morte que je refusais disparaît parce qu'on cesse de RENDRE (d),
  pas parce qu'on le remplace. Mon remède devient faux de surcroît : `trop-long` est
  un CINQUIÈME texte réel, distinct de (c) par son verbe. TL-12 est résolu — par
  l'UX, pas par moi.
RÉSERVE 3 (test de liaison des deux plafonds dans le même lot) — MAINTENUE, renforcée
  par C1 : la liaison porte sur le GABARIT, pas sur la clé.
TL-14 (`synopsis_mj` requis) — RETIRÉE, vérifiée en source contre moi.

NOUVEAU · TL-15 — DÉFAUT DE MON PROPRE DÉCOUPAGE, corrigé.
  Le garde de placement lit le SOURCE de `App.tsx` (`dossierEditorScreen.test.tsx`
  l. 673-683). Placé au lot 1 comme je l'avais écrit, il exigerait `panneauCopilote=`
  dans un fichier que seul le lot 2 modifie : le lot 1 échouerait à sa propre porte.
  Il part au lot 2, dans un fichier à lui. Et il asserte l'ORDRE seul.

NOUVEAU · TL-16 — l'ORDRE DE COUPE en 5 étapes du Narratif est REPORTÉ à l'it2.
  La décision DÉGRADATION dit « en rédaction, le dégradé EST le refus » : à l'it1 on
  ne coupe rien, on refuse en NOMMANT le secteur le plus lourd.

VERDICT — recevable sous réserve

  1. le registre de libellés part avec le lot 1, et le critère n° 14 est amendé ;
  2. le garde KR-236 porte sur `GABARIT_SORTIE` (pas sur la clé), avec son cas
     négatif et le balayage de source à double extraction ;
  3. les deux plafonds sont MESURÉS dans le lot 1, après assertion que les 12 chemins
     résolvent non vides sur l'entité mesurée.
  Pas de veto. Mon veto d'encapsulation (TL-1) reste armé, borné à six chaînes : il
  se déclenche à la première recopie.
```

---

# ANNEXE

## A. Découpage DÉFINITIF — 2 lots, propriété de fichier disjointe

Vague 1 = LOT 1 (`contrat`, seul, en premier). Vague 2 = LOT 2 (`feature`, démarre contrat figé). **Exécution séquentielle : aucun worktree, aucune fusion.**

### LOT 1 — `contrat`

| # | Fichier | N/R | Contenu |
|---|---|---|---|
| 1 | `worker/index.ts` | R | route `POST /ia/:role` (regex `^/ia/([a-z-]+)$`, insérée APRÈS la garde `X-Sync-Key`, AVANT le `match` de `/kv/`), `POST` dans `BASE_CORS`, garde `TextEncoder`, `INVITES`, copie de `GABARIT_SORTIE` (TL-8), `TAILLE_MAX_CORPS_IA`, `IA_API_KEY?` dans `Env`. Les 7 réponses en JSON. |
| 2 | `worker/index.test.ts` | N | `/** @jest-environment node */` — les 7 branches de la route (KR-233) |
| 3 | `worker/frontiere.test.ts` | N | les TROIS liaisons : gabarit worker ≡ gabarit brain (double extraction de source) ; invite RENDUE ⊇ `GABARIT_SORTIE` + cas négatif ; plafond worker ≥ budget client converti (canari `€`) + les deux canaris de dépassement à ±1 |
| 4 | `jest.config.cjs` | R | `testMatch: [..., '<rootDir>/worker/**/*.test.ts']` |
| 5 | `tsconfig.json` | R **conditionnel** | `include: ["src","worker"]` — **après** avoir mesuré que `tsc --noEmit` reste vert ; sinon on n'y touche pas et la revue ÉCRIT que les tests du worker ne sont pas typés |
| 6 | `src/brain/copilote/types.ts` | N | rôle, chemins/clés de champ, `CHAMPS_PROPOSABLES`, les deux types de proposition |
| 7 | `src/brain/copilote/schemaSortie.ts` | N | `CLES_SORTIE`, `GABARIT_SORTIE`, `validerSortie` |
| 8 | `src/brain/copilote/schemaSortie.test.ts` | N | les prédicats + `JSON.parse(GABARIT_SORTIE)` ≡ `CLES_SORTIE` + scanner et ses **deux canaris littéraux**, rejoués |
| 9 | `src/brain/copilote/contexte.ts` | N | `CHAMPS_INJECTES` (12), `DEROGATIONS_AUDIENCE`, les exigences, `BUDGET_CARACTERES_CONTEXTE`, `assemblerContexte` |
| 10 | `src/brain/copilote/contexte.test.ts` | N | confinement (audience `'ia'` des 12, cardinalité, dérogations vides), exigences ⊆ injectés, filtre `MARQUEUR_A_ECRIRE`, **la mesure de M** et sa précondition de remplissage |
| 11 | `src/brain/CopiloteService.ts` | N | `estDisponible` + `demander`, 4 `statut`, rejeu unique, `AbortController` composé |
| 12 | `src/brain/CopiloteService.test.ts` | N | 1 appel si conforme ; 2 puis terminal (DEUX tests) ; jamais 3 ; aucune mémoire ; aucun rejeu sur 5xx/413/abort (N-R6) ; `update`/`set`/bus muets au terminal |
| 13 | registre de libellés | N | voir C4 |
| 14 | son test | N | balayage de source : chaque chaîne écrite ICI et nulle part ailleurs dans `src/` (précédent `amorce.test.ts`, fichiers de test exclus) |
| 15 | `src/brain/index.ts` | R | exporte `CopiloteService` + ses types + le registre de libellés. **Pas** `CHAMPS_INJECTES`, **pas** `assemblerContexte`, **pas** `DESTINATION_DES_CHAMPS`. Le commentaire l. 232-234 (« les LIBELLÉS restent côté feature — un seul consommateur réel ») est amendé sur place : la condition est tombée |
| 16 | `src/brain/BrainContext.tsx` | R | `copilote` dans `Brain` + `createBrain` (additif) |
| 17 | `src/features/dossier-fiches/components/BlocIdentite.tsx` | R | constantes → accès explicites au registre. **Aucune chaîne modifiée** |
| 18 | `src/features/bascule-editeur/components/DossierEditorScreen.tsx` | R | prop `panneauCopilote` + `ListRow` « Copilote » |
| 19 | `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R | nav Copilote via render-prop **bouchonnée** + entrée dans le `describe` paramétré des états vides. **PAS le garde de placement** (TL-15) |
| — | `src/brain/dossier/feuilles.ts` | N | promotion de `feuillesDeLaFixture` — la QA a MESURÉ qu'elle est nécessaire |
| — | `src/brain/dossier/couverture.test.ts` | R | ré-importe la fonction promue |

**Porte qualité seul : oui.** Aucun fichier de `dossier-copilote` n'existe ; le test de `DossierEditorScreen` bouchonne la render-prop ; les tests du service moquent `global.fetch` ; les tests de route tournent en `node`.

**Ordre interne (révisé par C12)** : `jest.config.cjs` → route worker + son test → `schemaSortie` → `contexte` (+ la mesure M) → `frontiere.test.ts` → `CopiloteService` → registre de libellés + `BlocIdentite` → prop sœur → `tsconfig.json` (conditionnel, en dernier).

### LOT 2 — `feature`

| # | Fichier | N/R |
|---|---|---|
| 1 | `src/features/dossier-copilote/index.ts` | N |
| 2 | `src/features/dossier-copilote/textes.ts` | N — les constantes de texte + les raisons de désactivation ; cible de l'assertion d'unicité |
| 3 | `src/features/dossier-copilote/components/PanneauCopilote.tsx` | N |
| 4 | `src/features/dossier-copilote/components/LigneProposition.tsx` | N |
| 5 | `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` | N — `enVolRef`, `AbortController`, nettoyage au démontage |
| 6 | `src/features/dossier-copilote/tests/panneauCopilote.test.tsx` | N |
| 7 | `src/features/dossier-copilote/tests/acceptation.test.tsx` | N |
| 8 | `src/features/dossier-copilote/tests/cablage.test.ts` | N — garde de placement sur le SOURCE de `App.tsx` : `panneauCopilote=` présent et AVANT `panneaux={{` (ordre seul) |
| 9 | `src/App.tsx` | R |

**Aucun fichier n'est nommé par les deux lots.** Vérifié ligne à ligne.

## B. Signatures littérales RÉVISÉES

```ts
// --- src/brain/copilote/types.ts ---

/** Table FERMÉE, une entrée par assistant. Nom cédé au Narratif : c'est aussi le
 *  segment de route (`/ia/personnage-prose`) et la clé de la table d'invites. */
export type RoleCopilote = 'personnage-prose'

/** La CLÉ DE PROPRIÉTÉ dans le document — ce que la recette de `update` écrit. */
export type ChampProseCle = 'fonction' | 'apparence' | 'description_joueur'

/**
 * Le pont entre les DEUX vocabulaires, et l'unique autorité sur leur
 * correspondance : la clé est le CHEMIN (ce qui franchit le réseau, ce que la
 * table d'invites indexe, ce que `DESTINATION_DES_CHAMPS` connaît), la valeur est
 * la CLÉ DE PROPRIÉTÉ. Aucune chirurgie de chaîne — jamais de `.split('.').pop()`.
 */
export const CHAMPS_PROPOSABLES = {
	'monde.personnages[].fonction': 'fonction',
	'monde.personnages[].apparence': 'apparence',
	'monde.personnages[].description_joueur': 'description_joueur',
} as const satisfies Record<string, ChampProseCle>

export type ChampProseChemin = keyof typeof CHAMPS_PROPOSABLES

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, aucune référence d'entité,
 *  aucun écho du champ (N-R7). Schéma FERMÉ : une clé en trop est un refus. */
export interface PropositionRendue { valeur: string }

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `entiteId` et `champ`
 *  viennent de l'état d'écran, jamais de la sortie du modèle (KR-231). */
export interface PropositionResolue {
	entiteId: string
	champ: ChampProseChemin
	texte: string
}
```

```ts
// --- src/brain/copilote/schemaSortie.ts ---

/** Les clés du schéma de sortie, en VALEUR (le garde KR-236 les énumère à
 *  l'exécution ; une `interface` n'existe plus au runtime). Le validateur est
 *  PILOTÉ par cette liste. */
export const CLES_SORTIE = ['valeur'] as const

/**
 * LE LITTÉRAL QUE L'INVITE INCRUSTE — et la seule chose sur laquelle le garde
 * KR-236 a le droit de porter. NE JAMAIS garder sur la clé nue : `valeur` est un
 * mot français courant, une invite qui dit « la valeur du personnage » ferait
 * passer un `includes('valeur')` sans rien demander au modèle.
 */
export const GABARIT_SORTIE = '{"valeur": "…"}'

export function validerSortie(brut: unknown): { ok: true; valeur: string } | { ok: false; motif: MotifIllisible }
```

```ts
// --- src/brain/CopiloteService.ts ---

export interface CibleCopilote {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProseChemin
}

export type RaisonIndisponible = 'non-configure' | 'injoignable' | 'annule'

/** QUATRE `statut` — l'enveloppe du goal est intacte. */
export type ReponseCopilote =
	| { statut: 'propose'; proposition: PropositionResolue }
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	| { statut: 'illisible'; motif: MotifIllisible }

export interface CopiloteService {
	/** VRAI si l'URL du worker et la clé de synchronisation sont réglées. AUCUN réseau. */
	estDisponible(): boolean
	demander(role: RoleCopilote, dossier: Dossier, cible: CibleCopilote, signal?: AbortSignal): Promise<ReponseCopilote>
}

export function createCopiloteService(settings: CloudSettingsService): CopiloteService
```

```ts
// --- src/features/dossier-copilote/hooks/useDemandeCopilote.ts ---

export type EtatDemande =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: PropositionResolue }
	| { phase: 'echec'; reponse: ReponseCopilote }
	| { phase: 'decide'; issue: 'accepte' | 'refuse' }

export interface UseDemandeCopiloteResult {
	etat: EtatDemande
	/** Ne fait RIEN si un appel est déjà en vol — le garde est un `ref`, pas le
	 *  `disabled` du bouton : deux clics synchrones passent avant le re-rendu. */
	lancer: (cible: CibleCopilote) => void
	annuler: () => void
	accepter: () => void
	refuser: () => void
}
```

## C. Ce que le lot 1 doit MESURER avant de se signer (jamais déduire)

1. `jest.setup.cjs` en environnement node — **déjà mesuré par la QA**, contingence retirée.
2. `tsc --noEmit` vert avec `"worker"` dans `include` — à mesurer ; sinon on n'y touche pas et la revue l'écrit.
3. Les 12 chemins résolvent **non vides** sur l'entité de mesure, AVANT de relever `M`.
4. Les deux canaris du scanner **rejoués contre le regex choisi**.
5. Le cas négatif du garde KR-236 : une invite fabriquée demandant `{"texte": …}` doit **rougir**.
6. Les deux canaris de plafond à ±1 octet / ±1 caractère.
7. Le mutant de C10 : hook sans `enVolRef` ⇒ le test des deux clics **rougit**.

## D. Registre des désaccords — MIS À JOUR

| # | Objet | Statut | Motif en une phrase |
|---|---|---|---|
| TL-1 | Libellés/hints recopiés dans `dossier-copilote` sans garde | **REJETÉ** | Texte appartenant à `BlocIdentite.tsx` lu à distance : rien ne rougit si le libellé change — promotion au lot contrat. |
| TL-2 | `App.tsx` dans le lot contrat | **REJETÉ** | Il devrait écrire `<PanneauCopilote/>`, qui n'existe qu'au lot 2 : le lot contrat échouerait à sa propre porte. |
| TL-3 | Un lot `worker` séparé du lot `brain` | **REJETÉ** | Les trois liaisons de `frontiere.test.ts` importent des deux côtés, et l'`open_question` exige « le même lot ». |
| TL-4 | Un lot `contrat de surface` séparé | **REJETÉ** | Vingt lignes ne valent pas un worktree ; gain de parallélisme nul, coût de fusion réel. |
| TL-5 | Lot 2 scindé en « UI » + « acceptation » | **REJETÉ** | Propriété non disjointe et la moitié UI ne se démontre pas. |
| TL-6 | `Proposition<TRef>` / `resoudre<T>()` / `TableDesRangs` à l'it1 | **REJETÉ** | Abstraction à un seul appelant (KR-109). Les DEUX types restent — `PropositionRendue` ne porte plus aucune référence, ce qui sert KR-231 mieux encore. |
| TL-7 | `fetchImpl` injectable / option `copilote?` dans `CreateBrainOptions` | **REJETÉ** | Injection à un seul appelant ; les tests moquent `global.fetch`. |
| TL-8 | Un import `worker/` → `src/brain/` pour partager le gabarit | **REJETÉ** | Traînerait du code client dans le paquet wrangler ; la liaison est un **balayage de source à double extraction**, jamais un import de production. |
| TL-9 | `body.length` comme mesure d'octets pour la garde IA | **REJETÉ** | Compte des unités de code UTF-16 ; la garde IA mesure en `TextEncoder`. |
| TL-10 | Factoriser `withTimeout` avec `CloudflareKVTransport.ts` | **REJETÉ** | On ne rouvre pas la synchronisation pour huit lignes ; commentaire nommant le jumeau + condition de promotion. |
| TL-11 | Corriger `ALLOWED_ORIGINS` / livrer un limiteur de débit | **REPORTÉ** | Hors périmètre ; exposition NOMMÉE dans la revue (KR-148). |
| TL-12 | 4ᵉ texte = « vide-mais-réussi » à l'it1 | **RÉSOLU (UX + QA)** | La discriminance se prouve par unicité des constantes, pas par un rendu. |
| TL-13 | `onSelectSection` non utilisé par `PanneauCopilote` | **préférence TL** | `App.tsx` écrit `() => <PanneauCopilote …/>` : une render-prop peut ne pas déclarer le paramètre qu'elle ignore. |
| TL-14 | `synopsis_mj` requis au contexte | **RETIRÉE** | Vérifié en source : `ton` ET `synopsis_mj` portent tous deux le marqueur, donc l'exiger n'élargit pas l'atteignabilité du refus, seulement le refus. |
| TL-15 | Le garde de placement d'`App.tsx` au lot contrat | **REJETÉ (défaut de mon propre découpage)** | Il exigerait `panneauCopilote=` dans un fichier que seul le lot 2 modifie. |
| TL-16 | L'ordre de coupe en 5 étapes à l'it1 | **REPORTÉ (it2)** | Décision DÉGRADATION : en rédaction le dégradé EST le refus. |
| TL-17 | Un garde au niveau de la CLÉ pour KR-236 | **REJETÉ** | `valeur` est un mot français courant : `includes('valeur')` serait vert sur une invite qui ne demande rien. |
| TL-18 | Un `seuil: number` sur la disjonction | **REJETÉ** | Un nombre admet 0 (vacuité) et 6 (insatisfiable) ; « parmi » dit déjà ∃. |
| TL-19 | Un `champ` court sur le fil (`'fonction'`) | **REJETÉ** | Forcerait une seconde table chemin↔clé ; le fil porte le CHEMIN. |
| TL-20 | Coupe C5 sans enforcement de la précondition REMPLISSAGE | **REJETÉ** | Retirer la variante en laissant son cas atteignable livre une écriture non couverte. |

## E. Signalé au PM, hors de mon veto

Avec `canon.ton` requis, **le premier geste d'un auteur sur un dossier neuf est un refus** : l'amorce écrit le marqueur dans `canon.ton`. C'est le cas nominal qui rend le critère démontrable, et c'est aussi la première chose que l'auteur voit. La phrase de démo suppose donc un dossier où le ton est écrit ET où au moins une prose ou un but du personnage est rempli — **à écrire dans la fiche de validation**, pas à découvrir à la recette.

## Fichiers lus (tour 2)

Les cinq notes de tour 1 + `cadrage.md`, SKILL.md, `src/brain/dossier/{amorce.ts,amorce.test.ts,destinations.ts}`, `src/brain/index.ts`, `jest.config.cjs`, `jest.setup.cjs`, `dossier-fiches/components/BlocIdentite.tsx`, `dossier-fiches/hooks/useEcritureIdentite.ts`, `dossier-canon/components/PanneauCanon.tsx` (l. 196-243), `bascule-editeur/{components/DossierEditorScreen.tsx,tests/dossierEditorScreen.test.tsx}`, `src/App.tsx`.
