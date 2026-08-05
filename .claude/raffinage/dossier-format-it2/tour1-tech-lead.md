# Tour 1 — `tech-lead` · `dossier-format` it2

**RISQUE** — it2 réécrit le contrat que quinze features consomment, sans écran, et double la surface d'un schéma tenu par **deux** sources de vérité manuelles : les interfaces de `types.ts` et les tables déclaratives du validateur (`RACINES`, `CHAMPS_REQUIS`, `COLLECTIONS_IDENTIFIEES`). Un champ typé sans ligne de table est muet : `tsc` passe, le round-trip passe (les clés inconnues traversent intactes), et l'auteur écrit faux pour toujours.

**OBJECTION 1** — « par construction » est **faux tel qu'écrit**. TypeScript est **structurel** — c'est le désaccord 1 d'it1, `RETENU`. Une projection bâtie par `{...jalon}` satisfait le type et sérialise `declencheur_expr`. La propriété est portée par le code qui construit champ par champ, jamais par le type. Sans instrument, décision B rejoue les trois majeurs de la PR d'it1 (KR-169).

**OBJECTION 2** — la décision A fait de `brain/dossier/types.ts` un fichier que **quatre** features rouvriront. Corollaire non écrit : chacune aura donc un lot `contrat`, et `types.ts` n'est **jamais** un fichier de lot feature. Non posé maintenant, la n° 4 produira un plan où un lot de formulaire l'édite en parallèle d'un lot de forme.

**PROPOSITION**

1. `projeterCharpente` bâtie champ par champ depuis une table fermée. Deux instruments : balayage `Object.keys` en profondeur (aucune clé `_expr`, `obligatoire`, `lieu_id`) et un `@ts-expect-error` — `tsconfig.include=["src"]`, donc sous la porte. ~50 lignes, 3 tests.
2. `type DeltaBrut = Record<string, unknown>` : rejette la chaîne à la compilation sans inventer une clé. Plus `CHEMINS_DE_DELTAS` (4 entrées) et le code `delta-en-prose`. Le nom `Delta` reste libre pour it4.
3. `meta` : **pas une racine**. `titre` l'est déjà, `ton` est sous `canon` ; le reste n'a ni éditeur ni lecteur. Une racine de plus est un seau d'audience de plus à classer dans chaque projection future.

**VERDICT** — **recevable sous réserve** des trois propositions, et d'**un seul lot**.

---

## ANNEXE — Découpage en lots

### Le fait mesuré qui décide du découpage

**it2 ne touche aucun fichier de `src/features/**`.** Vérifié, et c'est porteur :

- `IssueList.tsx` rend `location` / `message` / `dossierIssueRemediation(issue)` — **aucune branche par code** ;
- la seule branche par code de la feature est `FILE_ERROR_MESSAGES[inspection.code]` (`ImportDossierDialog.tsx:104`), fermée sur `FileReadErrorCode` (3 valeurs, intouchées par it2) ;
- le balayage d'exhaustivité des libellés vit dans `validate.test.ts:382`, pas côté feature.

Ajouter des codes d'anomalie, des racines et des types **ne force donc aucun fichier de feature**. Il n'existe pas de second lot à propriété disjointe : tout candidat (« schéma » vs « validateur ») est la coupe **horizontale** que la skill interdit et que le cadrage d'it1 a déjà payée ; tout candidat par racine nommerait `types.ts`, `validate.ts`, `index.ts` et la fixture dans les deux lots — collision.

**Conséquence : 1 lot, type `contrat`, exécuté seul.** L'essaim garde son sens (plan → ouvrier → intégrateur → QA mode B → dossier de revue) ; il perd seulement le parallélisme. Pas de worktree, pas de fusion, donc **zéro risque d'intégration** sur l'itération qui réécrit le contrat.

### Lot 1 — `contrat-dossier-it2` · type `contrat` · seul, en premier

**Ouvrier** : `dev-contrat`, effort élevé.

**Fichiers créés (N) — 3** : `src/brain/dossier/projection.ts` · `projection.test.ts` · `couverture.test.ts`

**Fichiers remplacés (R) — 9** : `types.ts` (les six formes) · `identifiers.ts` (`ESPACES_DE_NOMS` 9 → 11 : `evenement`, `climat`) · `issues.ts` (union 8 → 10 codes) · `validate.ts` (`CHEMINS_DE_DELTAS`, `PORTES_DE_REVELATION`, résolution `monstre_ref`) · `validate.test.ts` · `identifiers.test.ts` · `roundtrip.test.ts` · `__fixtures__/dossier-minimal.json` · `src/brain/index.ts`

**Non touchés** : `bestiary.ts`, `characteristics.ts`, `challenge.ts`, `freeze.ts`, `read.ts`, `DossierService.ts`, `CloudSyncService.ts`. **Zéro fichier dans `src/features/**` et `src/player/**`.**

### Signatures exposées

```ts
export type DeltaBrut = Record<string, unknown>   // objet, jamais chaîne ; `Delta` reste libre pour it4

export interface PlanAction { etape: number; action: string }
export interface Revelation {
	confianceMin?: number
	jet?: { carac: Characteristic; tc: ChallengeTier }
	contrepartie?: string
	apresIndiceId?: string
}
export interface Savoir { indice_id: string; revele_si?: Revelation }
export interface Personnage extends Entite { portee: 'premier' | 'second'; plan_actions: PlanAction[]; savoirs: Savoir[] }
export interface Resolution { resultat: string; consequence: DeltaBrut[] }
export interface Evenement extends Entite { monstre_ref?: string; resolutions: Resolution[] }
export interface Quete extends Entite { recompense: DeltaBrut[] }
export interface Climat extends Entite { effetsRegles: DeltaBrut[] }
export interface Conditions { climat: Climat[] }
export interface Jalon extends Entite { declencheur_texte: string; effet: DeltaBrut[] }
export interface Fin extends Entite { condition_texte: string }
```

```ts
// projection.ts — la SEULE lecture de charpente destinée au modèle
export interface ProjectionCharpente {
	readonly jalons: readonly string[]
	readonly fins: readonly string[]
}
export function projeterCharpente(charpente: Charpente): ProjectionCharpente
```

> Variante à trancher par le comité si la n° 10 doit **attribuer** une phrase : `readonly { id: string; texte: string }[]`.

### Instruments exigés (§ 10)

| Propriété nommée | Instrument |
|---|---|
| La projection ne porte que les `…_texte` | balayage `Object.keys` en profondeur sur la fixture réelle : aucune clé `_expr`, `obligatoire`, `lieu_id` |
| Le type interdit l'élargissement | `// @ts-expect-error` — sous la porte, `tsconfig.include = ["src"]` |
| `projection.ts` seul lecteur exporté de `charpente` | test-grep, même patron que l'unicité de `deepFreeze` |
| Aucun delta n'est de la prose | chaîne aux 4 chemins → `delta-en-prose` bloquant ; objet passe le round-trip intact |
| Portes de révélation fermées | clé hors des quatre dans `revele_si` → `porte-inconnue` |
| `monstre_ref` pendant | `bestiaire.<inconnu>` → `reference-pendante`, contre `BESTIARY_BY_TEMPLATE` |
| **Anti-dérive types ↔ tables** | chaque feuille terminale de la fixture couverte par une table, ou listée dans `HORS_VALIDATION` avec motif |

### Si le comité rouvre le périmètre

Le lot unique tient **parce que** la décision A retire la forme complète. Si le comité la réintroduit, it2 repasse au-dessus de 8 critères et 4 lots : coupe pré-enregistrée — **it2a** `monde.personnages` + `monde.evenements` ; **it2b** `charpente` + projection + deltas de jalon/quête/climat.
