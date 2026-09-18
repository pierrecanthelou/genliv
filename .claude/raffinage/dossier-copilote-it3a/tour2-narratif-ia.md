# Tour 2 — `narratif-ia` · `dossier-copilote` it3a

**RISQUE** — Ce n'est plus le canal de prose : c'est que **l'invite et le validateur soient écrits par deux postes qui ne se relisent pas**. Une invite qui demande trois répliques devant un validateur qui en refuse trois est une machine à `illisible` — deux appels, rejeu compris, état terminal — **sur le cas modal**, pas sur un cas limite. Les deux moitiés restent vertes chacune de son côté, et **aucun test du dépôt ne les confronte**.

**OBJECTION** — Deux textes de l'annexe UX **affirment faux**, et c'est un fait de mon poste : (1) `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` n'a **plus aucun producteur** dès que la liste vide est un refus ; (2) `MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES` promet « une réplique acceptée jamais », alors que la cible est **absente du contexte** — une réplique acceptée n'est pas injectée, donc elle **peut** revenir. La mention dit à l'auteur **l'inverse** de ce que fait le code.

**PROPOSITION** — Rôle `'personnage-repliques'`, clé `repliques`, cible `{personnageId}` (TL3a-5 intégré), sortie bornée par `REPLIQUES_PROPOSEES_MAX = 3`, invite disant « trois au plus **et au moins une** » — **jamais « deux »**. Un garde d'une ligne épingle l'accord invite ↔ validateur. Contexte à **10 chemins**.

**VERDICT** — **recevable sous réserve**. Veto **MAINTENU** sur les curseurs ; veto **NEUF** sur `CURSEURS_INITIAUX` semé à l'acceptation.

---

# ANNEXE

## A1. `TL3a-7` — je maintiens, et voici le fait qui tranche

> **Le nombre de propositions acceptables n'est pas `PARLER_REPLIQUES`. Il vaut `PARLER_REPLIQUES − parler.length`, et il VARIE d'un personnage à l'autre.**

1. Validateur à 2, invite muette → le modèle rend 3 à 5 sur une demande ouverte → `schema` → rejeu (corps **identique**) → **terminal**. Le mode de panne devient le cas **modal**.
2. Validateur à 2, invite disant « deux au plus » → sur un personnage portant **déjà une** réplique (`pnj.corvin-le-marchand` sur la fixture), **l'invite est fausse** : il n'y a qu'une place. **Une invite qui récite une borne de document est fausse dans la majorité des états du document.**
3. `PARLER_REPLIQUES` est documentée `curseurs.ts:138-151` comme **borne d'INTERFACE**, explicitement absente de `validate.ts`. L'importer dans un validateur de sortie IA lui donnerait un **second sens** qu'elle n'a pas.

**Ce que TL3a-7 m'arrache quand même** : la duplication qui subsiste — « trois » dans l'invite du worker contre `REPLIQUES_PROPOSEES_MAX = 3` dans le client — est **inévitable** (aucun import `worker/` → `src/`) et **aujourd'hui non gardée**, y compris pour `PROPOSITIONS_MAX` livré à l'it2. Une duplication que je ne peux pas supprimer, je la **garde** :

```ts
it('la borne de sortie ecrite dans l invite est celle du validateur', () => {
	expect(REPLIQUES_PROPOSEES_MAX).toBe(3)
	expect(INVITES['personnage-repliques'].systeme).toContain('trois au plus')
})
```
**Limite déclarée** : ce garde épingle **le mot**, pas la sémantique. Il rougit si l'un des deux bouge seul ; il ne dit pas que « trois » veut dire 3. **Rétrofit sur `PROPOSITIONS_MAX` : hors 3a**, condition d'ouverture = la première itération qui rouvre l'entrée `indice-detenteurs`.

## A2. `TL3a-5` — INTÉGRÉ, sans réserve

Sa mesure est juste. **Mon `PropositionRepliques { entiteId, textes }` du tour 1 est retiré.** Deux corrections que je porte comme conséquence de **mon propre** arbitrage, et qu'il n'avait pas à voir :
- Ma paire tour-1 `RepliquesRendues { repliques }` + `PropositionRepliques { …, repliques }` aurait **violé « zéro clé commune »** (KR-231). La sienne était saine ; **la mienne ne l'était pas.**
- `textes` est écarté : **à une lettre de `PropositionResolue.texte`** — son propre critère, appliqué symétriquement. Le champ s'appelle **`ajouts`** : il nomme la sémantique d'écriture (AJOUT, jamais remplacement) et **ferme le piège du `parler:`** — un champ homonyme aurait invité `{...caractere, parler: proposition.parler}`, c'est-à-dire un **écrasement**.

## A3. `TL3a-17` — la conclusion tient, le MOTIF ne tient plus

`synopsis_mj` retiré **et** la cible absente ⇒ le rôle injecte **dix des douze**, et le chemin retiré est **de loin le plus gros bloc** : `dossier-reference.json:9` ≈ **610 caractères** (compté à la main), **~1/3** du contexte prose mesuré. Attendu : **M ≈ 1200-1350 ⇒ budget 4000 ou 5000**, donc **distinct de 6000**, donc la ligne 384 resterait **verte**.

**Cela ne sauve pas la ligne, ça l'aggrave.** Une ligne sur-contrainte verte **par coïncidence de mesure** est la panne de la famille BUG-084 : le vert est ce que l'instrument produit, et personne ne saura qu'il ne tenait qu'à 610 caractères de synopsis. **Sa correction est requise indépendamment de la valeur mesurée.** Et : si le budget déplaît, **on retire un chemin, on ne le monte jamais** — et **on ne le baisse pas non plus pour faire verdir une ligne**.

## A4. `qa`, point 2 — sa prémisse tombe, sa séparabilité s'obtient autrement

Sa demande était **conditionnée** à « liste vide = succès ». Une fois le vide refusé, les deux cas sont deux refus. La séparabilité s'obtient par **deux ENTRÉES distinctes, pas deux motifs** : `{"repliques": []}` tue le mutant « supprimer (6) » ; `{"repliques": ["une phrase juste", "   "]}` tue « supprimer (7) », **élément fautif à l'index ≥ 1**. Chacun rougit seul.

**Sa question ouverte, tranchée** : *« un identifiant à cheval sur deux éléments joints doit-il compter ? »* → **non, et la question ne se pose pas : on ne joint jamais.** Deux fragments dans deux cases distinctes ne sont pas un identifiant — aucun lecteur ne les lira collés, puisqu'ils deviennent deux entrées séparées de `parler[]`. **Interdiction à écrire** : aucun `join` avant scan, sinon le scanner cesse de localiser l'élément fautif **et fabrique un faux positif à la frontière**.

## A5. Le discriminant du vide — **recopiable tel quel**

> **DÉSIGNATION vs RÉDACTION.** Un rôle de **DÉSIGNATION** demande de **choisir dans un ensemble fermé que le contexte a fourni**. La question porte sur un **fait du monde** — « qui pourrait savoir ceci ? » — et « personne » en est une réponse **vraie**. Liste vide = **SUCCÈS** ; la punir fabrique une machine à complaisance.
> Un rôle de **RÉDACTION** demande d'**écrire un texte que rien ne fournit**. « Comment parle-t-il ? » a toujours une réponse dès qu'il existe quelqu'un pour parler. « Je n'écris rien » est une **non-réponse** — le cas scalaire de l'it1. Liste vide = **REFUS**, motif `vide`.
> **Le cas « il n'y a personne pour parler » est traité AVANT l'appel**, par `cible-a-ecrire` : la liste vide ne peut donc jamais être l'écho légitime d'un dossier muet.
> **Test de rattachement, décidable sans rouvrir le débat** : *le rôle rend-il des **jetons que le contexte a fournis** (désignation), ou de la **prose que rien ne fournit** (rédaction) ?*

## A6. `MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES` **dit faux** — texte corrigé

```ts
export const MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES =
	'Chaque lancer repart de zéro : le copilote ne voit pas les répliques déjà écrites de ce personnage, et peut en proposer une très proche.'
```

## B. Statuts

**Le veto curseurs — MAINTENU**, et la forme de réouverture du § A5 du tour 1 **reste la bonne, recopiée telle quelle**. `TL3a-2`/`TL3a-16` le renforcent **depuis un autre poste, sur une mesure** ; mes trois motifs de fond sont inchangés. **Aucun ne dépend de l'autre — c'est ce qui rend la décision robuste.**

**Mes trois objections** : toutes **MAINTENUES** (scalaires hors 3a · liste vide non transportée · budget et `max_tokens` annoncés — désormais satisfaits).

**Les `REJETÉ` du § I** : tous maintenus, plus **un neuf** (n° 13, `join` avant scan) et **un durci en VETO** :
> **VETO — Semer `CURSEURS_INITIAUX` en créant le bloc `caractere`.** Accepter une réplique sur un personnage sans bloc **crée** ce bloc. Le compléter écrirait **six valeurs que l'auteur n'a jamais vues, par un geste qui en ratifiait une seule** — le goal dit « rien n'entre dans le dossier sans un geste de l'auteur », et six entiers non montrés ne sont ratifiés par **aucun** geste. Second dégât : un bloc tout au plancher est **indistinguable d'un réglage délibéré** (KR-221) — le voyant s'éteint sans que personne ait réglé quoi que ce soit. **Écriture imposée : `caractere: { parler: [...déjà, texte] }`, et rien d'autre.**

**RETIRÉS de mon tour 1** : G1 (ciblage par le linter, § D1) · G2 (mention « l'acceptation éteint le constat » — les deux mentions d'état portent déjà l'information) · G3 (réutiliser `PROSE_PERSONNAGE_SANS_VOIX.remediation` — coupler un texte du copilote au registre des contrôles, c'est **un texte à deux lecteurs qui doivent bouger pour des raisons différentes**).

## C. Contrat de sortie IA — FINAL

**Rôle `'personnage-repliques'`** — ⟨entité CIBLE⟩-⟨ce qu'on demande⟩. **`'personnage-voix'` écarté** : ce qu'on demande n'est pas *une voix* (abstraction qui invite une **description** de la voix) mais **des répliques**. Un seul mot traverse le rôle, la clé, le validateur et la borne : **aucune surface d'« harmonisation »**. ⚠ **Sans accent** — `'personnage-répliques'` sortirait de `[a-z-]+`, le gabarit ne serait pas extrait, et la totalité rougirait **par le mauvais message**.

**Contexte — 10 chemins, ordre figé** : `canon.ton` (**REQUIS**) · `canon.interdits_ton[]` · `canon.partage.accroche_joueur` · `…fonction` · `…apparence` · `…description_joueur` · `…but.libelle` · `…but.pourquoi` · `…caractere.jamais` (**la limite : elle borne ce qu'il peut dire**) · `…plan_actions[].action` (**non tronqué** — la troncature à 1 est propre à `assemblerDetenteurs`).

**RETIRÉS** : `canon.mj.synopsis_mj` (asymétrie du regret — une réplique qui le paraphrase sera **prononcée** par le rôle acteur au Temps 2, alors qu'une note de fiche est **lue** par un narrateur) · `cede_si` (prédicat sans sujet) · `curseurs.*` (veto) · **la CIBLE `caractere.parler[]`, par ABSENCE et jamais par saut**.

**Témoin de confinement à DEUX côtés** (sinon inerte, BUG-087) :
```ts
expect(assemblerRepliques(d, cible).texte).not.toContain('canon.mj.synopsis_mj')
expect(assemblerProse(d, cibleProse).texte).toContain('canon.mj.synopsis_mj')   // le cas POSITIF
```

**Formes** :
```ts
export interface RepliquesRendues { repliques: readonly string[] }                        // FRANCHIT
export interface PropositionRepliques { personnageId: string; ajouts: readonly string[] } // JAMAIS
export const CLES_SORTIE_REPLIQUES = ['repliques'] as const
export const REPLIQUES_PROPOSEES_MAX = 3
GABARIT_SORTIE['personnage-repliques'] = '{"repliques": ["…", "…"]}'
```
⚠ **Le gabarit montre DEUX emplacements pour une borne de TROIS, et c'est volontaire** : le gabarit dit la **forme**, le compte vit dans l'invite et le validateur. Précédent : `'{"detenteurs": ["P1", "P2"]}'` pour `PROPOSITIONS_MAX = 3`. **Ne pas « corriger ».**

**Dix prédicats** : (1) objet simple · (2) clés exactes · (3) tableau · (4) chaque élément une **chaîne** (un `{texte:"…"}` emballé meurt ici ; **jamais** `String(élément)`) · (5) ≤ `REPLIQUES_PROPOSEES_MAX`, refus jamais troncature · (6) ≥ **1** → `vide` · (7) chaque élément non vide après `trim()` → `vide` · (8) **distincts** après `trim()` → `schema` · (9) `MARQUEUR_A_ECRIRE` importé → `marqueur` · (10) `porteUnIdentifiant` **par élément, jamais sur un `join`** → `identifiant`.

**Motif du (8)** : deux répliques identiques sont un **remplissage** — un menu de 2 présenté comme un menu de 3, produit par un modèle qui « complète » pour atteindre la borne. Défaut de **forme** avec un producteur nommé.

**Invite — mot pour mot** (les quatre décisions à ne pas « corriger » : dire la **DESTINATION** jamais le champ · une réplique est une **phrase prononcée**, pas une note de fiche · « trois au plus » **en plus** du contrat · **« et au moins une »**, moitié symétrique de l'it2 sans laquelle invite et validateur se contrediraient) :

```
Tu assistes l'AUTEUR d'un livre-jeu qui règle la façon de parler d'un personnage.
À partir du contexte fourni, tu proposes des répliques types : de courtes phrases que CE personnage-là pourrait dire, telles qu'il les dirait.

Tu réponds par un objet JSON et rien d'autre, de la forme {"repliques": ["…", "…"]} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque réplique est un ÉCHANTILLON DE VOIX : elle servira plus tard à faire parler ce personnage dans des scènes que tu ne connais pas, elle ne sera jamais lue telle quelle à un joueur.
Tu en donnes trois au plus, et au moins une : même quand le contexte est maigre, une fonction et un but suffisent à faire entendre une voix.
Elles sont toutes différentes, chacune tenant en une ou deux phrases.
Chaque réplique ne dit que ce que CE personnage sait et dirait lui-même : ni ce que l'auteur sait, ni ce qui va se passer, ni ce qu'un autre personnage tait.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**`max_tokens: 400`** — dérivé : plus longue réplique **attestée sur deux sources** (`types.ts:744-745` et `dossier-minimal.json:133`) = **74** ; `3 × 74 + 27` d'enveloppe ⇒ L ≈ 249 ; `r = 2` (pire) ⇒ 373,5 ⇒ **400**. ⚠ **Le résultat dépend du ratio** (300 vs 400) — ce n'est **pas** robuste comme l'était l'entrée détenteurs. On prend le pire, **et on le dit**. Mode d'échec nommé : trois répliques très longues feraient **tronquer le JSON** ⇒ `schema` ⇒ rejeu ⇒ terminal. C'est le **bon** échec, déclaré ici plutôt que découvert au runtime.

**Mémoire : aucune.** Asymétrie par rapport à l'it2, à écrire : un détenteur accepté devenait **inénonçable** ; **une réplique acceptée n'est pas injectée**, donc elle **peut** être re-proposée. **Contrepartie obligatoire du rejet n° 5** : ce que le modèle ne voit pas, **l'AUTEUR le voit** — les répliques déjà écrites s'affichent, **gelées au lancement**. Économie pour l'UX : ce bloc **remplace** `MENTION_UNE_REPLIQUE` (qui dit le compte) par la liste elle-même (qui dit le compte **et** le contenu).

**Canal de paraphrase — ROUVERT** : fuite MJ (arrêtée par le contexte, **instrumentée**) · identifiant (prédicat 10) · vide (6) · élément vide (7) · nombre gonflé (5) · doublons (8) · réplique générique (**partiellement** — le refus se teste, la généricité non) · **pastiche du contexte : NON COUVERT, déclaré** · **redite d'une réplique écrite : NON COUVERT, déclaré**.

## D. Les deux conflits rendus à l'orchestrateur

### D1. **C7 — le ciblage par le linter : je RETIRE**, et c'est **ma propre mesure** qui m'y oblige
Le prédicat du constat est `length > 0`, **pas** `length >= PARLER_REPLIQUES`. Il ne partitionne donc **pas** les personnages en « il y a quelque chose à demander » / « rien à demander » : corvin porte **1** réplique pour un plafond de **2** — il a une place libre et le linter est muet sur lui. Un ciblage qui part du constat le rendrait **inatteignable**. Ce n'était pas le cas à la carte 2, où `indice-sans-source` **est** le prédicat de « il y a quelque chose à faire ».
Le bon prédicat existe et il est **local** : `parler.length < PARLER_REPLIQUES`, en ligne au rendu — le même que celui qui désactive « Lancer ». **Une seule expression, un seul endroit.** Conclusion plus large que celle du tech-lead : **`controlerDossier` sort entièrement de la tranche 3a, écran compris.**

### D2. **C8 — conflit NON listé : le garde par ligne**
`TL3a-15` (tour 1) rejetait le plafond à l'acceptation comme « un TROISIÈME état de ligne **pour rien** ». **L'arithmétique dit le contraire :**

| `parler.length` | « Lancer » | Menu | Acceptations possibles | Lignes à neutraliser |
|---|---|---|---|---|
| 0 | actif | ≤ 3 | **2** | jusqu'à 1 |
| 1 | actif | ≤ 3 | **1** | jusqu'à 2 |
| 2 | **désactivé** | — | 0 | — |

Sans garde par ligne, accepter les trois propositions écrit **trois** répliques. Le troisième état sert dans **les deux états où la carte est lançable**.
**Ce que la mesure du tech-lead établit, et que je ne conteste pas** : un document à 3 répliques **n'est pas un état illégal**. Mon C5-1 est donc **requalifié** : pas un invariant du document, une **préférence produit** — le copilote deviendrait le seul producteur d'un état que l'éditeur manuel ne sait pas atteindre. **Ce n'est pas mon veto.** Recommandation : garde par ligne, il coûte un booléen déjà spécifié.
**Invariant qui tient dans les deux cas** : le plafond est lu de **`PARLER_REPLIQUES` importée** (déjà exportée, zéro ligne), **jamais retapée**, et il vit **au site d'écriture** — jamais dans l'invite ni dans le validateur.

## E. Ce que je n'ai PAS mesuré
`M`, le budget, `E`, la re-dérivation de `TAILLE_MAX_CORPS_IA` (aucun shell) — l'estimation 4000-5000 sert **uniquement** à montrer qu'un motif écrit au plan serait faux, **pas à écrire un chiffre** · les comptages de caractères, **faits à la main** (74/72/64 ; ~610 ; 27) · **la distribution réelle de sortie du modèle**, prémisse de mon § A1, **non mesurable ici** · le canari croisé et ses transpositions, **à écrire puis VOIR ROUGE** · le garde invite↔validateur — **un `toContain` est inerte tant que son cas négatif n'a pas été fabriqué** · le témoin de confinement — **l'assertion négative est inerte seule**, c'est le cas **positif** qui lui donne son pouvoir séparateur · le remontage du panneau · `BUG-106`, 3ᵉ occurrence prévisible, **hors périmètre, nommé, non corrigé**.
