# Tour 1 — `tech-lead` · `dossier-copilote` it4

**RISQUE** — « Brouillon **sans identité** » reste une **convention** tant que `tsc` ne la tient pas. Si la forme re-résolue s'écrit `Partial<Personnage>` ou porte un `id?`, alors `{...brouillon}` dans `monde.personnages[]` **compile**, et le modèle frappe l'identifiant le jour où quelqu'un « harmonise ». Parade : forme **fermée sur deux clés de prose**, jamais `Partial`, plus un `@ts-expect-error` sur `const p: Personnage = brouillon`. Second risque, **invisible avant la fusion** : sans identifiant, la clé React et la clé de `decisions` sont **LA POSITION** — les cinq cartes livrées clefent par identifiant, la sixième ne le peut pas.

**OBJECTION** — La définition ne dit pas que le **synopsis est REQUIS** : elle le liste comme source parmi quatre. Sans lui il n'y a rien à éclater — et c'est ce requis qui débloque la seule dette de registre de l'itération. ⚠ **`libelles.ts:10` refuse `canon.mj.synopsis_mj` au motif ÉCRIT « il n'est jamais requis, donc aucune branche ne peut le nommer », phrase RÉPÉTÉE dans `PanneauCanon.tsx:27-30` et dans la spec ([it2]). L'it4 produit cette branche : les TROIS deviennent fausses le même jour.** Seconde objection : la mesure 4 invite à élargir `CHAMPS_PROPOSABLES` — ce serait rendre **représentable** une demande de prose sur une entité **qui n'existe pas**.

**PROPOSITION** — Deux lots séquentiels (**15 / 9** fichiers, propriété disjointe). Élément réseau à **deux** champs, **14** prédicats. `LIBELLE_DES_CHAMPS` passe à **cinq** entrées, extraction verbatim, **trois docstrings réécrites dans le lot 1**. **Zéro valeur neuve au baril.**

**VERDICT** — **recevable sous réserve**.

---

## 0 — Les mesures de l'orchestrateur : vérifiées, une correction

| # | Verdict |
|---|---|
| 1 | **Confirmée** — `types.ts:842-845`. Quatre requis avec `id`. |
| 2 | **Confirmée à la ligne près**. |
| 3 | **Confirmée**, conséquence technique au § 3. |
| 4 | **Confirmée, ET JE LA RETOURNE** : ce n'est pas un manque à combler, c'est une **frontière à ne pas franchir** (REJETÉ n° 2). |
| 5 | **Le renversement est sûr, pour un motif que le cadrage ne donne pas** : le motif 3b/3c était le **POINT DE VUE D'UN PORTEUR**. **Ici il n'y a pas de porteur.** Précédent qui désamorce la moitié structurelle : **`personnage-prose` injecte DÉJÀ `synopsis_mj` tout en écrivant `description_joueur`** (`registres.ts:27-40`). Ce qui reste — la pression de fuite est **plus forte** ici, le synopsis étant **dominant** et non un bloc parmi douze — est **du terrain de `narratif-ia`**, pas de mon veto. |
| 6 | **Confirmée**, non re-dérivée. |
| ⚠ **Mesure ABSENTE du cadrage** | **`schemaSortie.ts` fait 638 lignes**, `contexte.test.ts` 2 173. Le 6ᵉ validateur est **le plus chargé des six** : **la projection à ~750 l. doit être MESURÉE, pas supposée**. |

## 1 — La création d'entité : **côté carte**, comme les cinq acceptations précédentes

> ⚠ **Discriminant, décidable et non débattu : une GRAINE DE VALEUR monte dans `brain/` ; une FORME D'ÉCRITURE reste au site.** La première diverge **en silence** (`0` et `0` sont verts) — `INTENSITE_INITIALE`, `STATS_INITIALES`, `CURSEURS_INITIAUX`, `PORTEE_INITIALE`. La seconde est tenue par **`tsc`** : un champ requis manquant **ne compile pas, aux deux sites à la fois**.

Des quatre clés semées, **une seule est une valeur** (`portee`) — et elle **sort déjà** du baril. Les deux autres sont `[]`, et l'`id` est un appel. **Il ne reste rien à promouvoir.** Une `creerPersonnageBrouillon()` serait **KR-109 déguisé en KR-165**.

```ts
const nouveau: Personnage = {
	id: frapperIdentifiant('pnj'),
	portee: PORTEE_INITIALE,
	plan_actions: [],
	savoirs: [],
	fonction: brouillon.fonction,
	description_joueur: brouillon.description_joueur,
}
```
⚠ **SIX clés écrites. `{ ...brouillon }` est INTERDIT** — il compile aujourd'hui (les deux clés du brouillon *sont* des clés du document) et **porterait en silence toute clé future**. **Même interdiction qu'à 3c, RETOURNÉE** : là-bas l'étalement portait des clés parasites, ici il en porterait de **légitimes-aujourd'hui**, ce qui est **pire à relire**.
⚠ **`frapperIdentifiant` est appelée DANS le gestionnaire d'acceptation** — jamais au rendu, jamais au lancer, jamais dans un `useMemo`. Témoin : **une ligne refusée ne consomme aucun identifiant**, et deux acceptations donnent **deux identifiants distincts**.

## 2 — La forme de sortie : **une liste d'éléments à deux proses**

**3c en rend la moitié structurelle.** Ce qui est neuf : **les deux champs sont de la prose**, aucun n'est un jeton, **et il n'y a pas de cible**.
```ts
interface FigureRendue   { charge: string; reputation: string }      // RÉSEAU, non ré-exporté
interface FiguresRendues { figures: readonly FigureRendue[] }
export interface FicheBrouillon          { fonction: string; description_joueur: string }
export interface PropositionDistribution { ajouts: readonly FicheBrouillon[] }
```
- **`figures`, jamais `personnages`** : nom de la collection ⇒ *nommer le champ* (veto 3b).
- **`charge`/`reputation`, jamais `role`/`fonction`** : ce sont **les mots des JSDoc du schéma** (`types.ts:860-878`) — ils **enseignent** ; `fonction`/`description_joueur` **nomment la destination**.
- ⚠ **`role` est VETO comme nom de champ d'élément** : collision avec `CorpsDemande.role` **et** `Cible*.role`.
- ⚠ **`FicheBrouillon` n'est PAS assignable à `Personnage`** (quatre requis manquants) : **la décision actée devient un INVARIANT DE COMPILATION, pas une convention.** C'est le critère qui ferme le RISQUE.

**14 prédicats** : (1) objet simple · (2) clés exactement `['figures']` · (3) `Array.isArray` · (4) longueur ≥ 1 ⇒ **`vide`** · (5) ≤ borne ⇒ **refus jamais troncature** · (6) élément objet simple, clés exactement `['charge','reputation']` ; puis **par champ, ×2** : (7/8) chaîne · (9/10) non vide après `trim()` · (11/12) aucun `MARQUEUR_A_ECRIRE` **importé** · (13/14) `porteUnIdentifiant` **par champ, jamais un `join`**.
**Motifs atteints : 4 sur 5.** ⚠ **`'rang-inconnu'` est INATTEIGNABLE** — aucun jeton. `MotifIllisible` **inchangée** ; ce rôle **ne la nomme pas en entier, à rebours de 3c. À écrire, pas à taire.**
**Borne** : ressort `pm`/`narratif`. **Ma seule mesure** : **3 coûte zéro** (`BORNE_EN_TOUTES_LETTRES[3] = 'trois au plus'` existe) ; **toute autre valeur coûte une entrée** + son mot français.

## 3 — Le nœud `nom` : **personne ne le nomme, et c'est la PARITÉ**

| Issue | Coût | Verdict |
|---|---|---|
| **(a) Aucun `nom`**, l'auteur nomme dans la fiche | **ZÉRO** — optionnel, `localiserEntite` déjà exporté et consommé, `handleAjouter` crée **déjà** sans nom | **RETENUE** |
| (b) Le modèle rend le `nom` | +1 champ, +2 prédicats, audience `auteur` (KR-195), **nom inventé ratifié d'un clic** | rejetée |
| (c) Champ de saisie dans la ligne | *accepter/refuser* → *accepter/**éditer**/refuser* : **classe d'interaction neuve**, et requis **plus strict que le schéma** | rejetée |
| (d) `nom` dérivé de `fonction` | Seconde règle de nommage **silencieuse** + optionnel semé (KR-221) | rejetée |

**(a) est la moins chère ET la seule à PARITÉ avec le geste manuel** — arbitrage exact de `MENTION_RELATION_CREEE` à 3c. Le texte **ne doit pas promettre** que le copilote nomme.

## 4 — Le baril : chaque symbole, son précédent *(leçon BUG-116)*

**Lu ligne à ligne.** Ajoutés : `CibleDistribution` (4 précédents) · `ReponseDistribution` (4) · `PropositionDistribution` (5) · `FicheBrouillon` (**`LienResolu`**, membre de la forme publique qu'une feature doit pouvoir **nommer**). **ZÉRO valeur neuve** — `frapperIdentifiant`, `PORTEE_INITIALE`, `localiserEntite`, `LIBELLE_DES_CHAMPS`, `MotifIllisible`, `MotifRefusContexte`, `EchecCopilote` **sortent déjà**. La 5ᵉ entrée de `LIBELLE_DES_CHAMPS` **n'ajoute aucune ligne** : `CheminLibelle` est `keyof typeof`, **elle s'élargit seule**.
**NE SORTENT PAS** : `FiguresRendues`/`FigureRendue`, `validerDistribution`, `CLES_SORTIE_DISTRIBUTION`, `FIGURES_PROPOSEES_MAX`, `GABARIT_SORTIE`, `assemblerDistribution`, `CHAMPS_INJECTES`, `DEROGATIONS_AUDIENCE`, `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`, `CANDIDATS_MAX`.

## 5 — LE DÉCOUPAGE : **2 lots séquentiels**

### Lot 1 — `distribution-contrat` · **`contrat`** · **15 fichiers**
`copilote/types.ts` · `copilote/schemaSortie.ts` · **`copilote/contexte/distribution.ts` (N)** · `contexte/registres.ts` · `contexte/index.ts` · `CopiloteService.ts` · **`dossier/libelles.ts`** · `brain/index.ts` · `schemaSortie.test.ts` · `contexte.test.ts` · `CopiloteService.test.ts` · `worker/index.ts` · `worker/index.test.ts` · `worker/frontiere.test.ts` · **`dossier-canon/components/PanneauCanon.tsx`**

⚠ **Pourquoi `PanneauCanon.tsx` est dans le LOT CONTRAT** : promouvoir la chaîne **sans repointer son écran d'origine** laisserait **deux sources** pour un même libellé le temps d'un commit — **KR-117**, exactement ce que l'extraction de l'it1 a fermé pour `TON`. **Précédent de propriété croisée** : le lot contrat de 3c possédait `useEcritureRelationsPresence.ts`. **L'isolation n'est pas entamée** : `dossier-canon` importe de `brain/`.

**Signature EXPOSÉE** :
```ts
export interface CibleDistribution { role: 'monde-distribution' }   // charge VIDE
export type ReponseDistribution = { statut: 'propose'; proposition: PropositionDistribution } | EchecCopilote
export interface FicheBrouillon { fonction: string; description_joueur: string }
export interface PropositionDistribution { ajouts: readonly FicheBrouillon[] }
```
⚠ **PREMIÈRE cible à charge VIDE.** **Conséquence perverse à nommer** : `{ ...cible, contexte }` serait **inoffensif ici** (rien à fuiter) — **et c'est exactement pourquoi il reste interdit** : il serait **généralisé aux cinq autres**.
⚠ **Nom du rôle `'monde-distribution'`** — arbitrable, mais **trois contraintes dures** : classe `[a-z-]+`, **sans accent**, distinct des cinq livrés. C'est **le segment de route, la clé de quatre registres et le discriminant** : le renommer coûte une route, une invite et trois tests.

**Refus** : `a-ecrire(synopsis_mj)` → `a-ecrire(canon.ton)` → `trop-long`. ⚠ **`'cible-a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES — à dire, pas à taire.** Et **`PARTIES_REQUISES` à DEUX entrées est une première** : sur cinq rôles, le `chemin` de `'a-ecrire'` **n'a jamais pu valoir que `'canon.ton'`** — cette itération lui donne sa **seconde valeur**, ce qui est la différence entre une charge et **une constante déguisée**. ⚠ **L'ORDRE décide quel champ l'écran nomme.**

**Ce que le lot 1 doit MESURER** : (1) `M`, chemins assertés non vides · (2) **`TAILLE_MAX_CORPS_IA` re-dérivé sur les SIX rôles** — *il a bougé à 3c* · (3) `max_tokens` dérivé, `P` re-compté, **pire ratio pris ET dit**, coïncidence dite · (4) gabarit confronté à `ENTREE_GABARIT` **avant** l'invite · (5) **`tsc` sur le lot 1 SEUL** : la 6ᵉ surcharge ne casse aucun bouchon, **et l'élargissement de `CheminLibelle` ne fait bouger aucune des cinq cartes** — ⚠ *si c'est faux, le découpage est faux* · (6) `@ts-expect-error` vus rouges, dont **`const p: Personnage = brouillon`** · (7) ⚠ **lignes de `schemaSortie.ts` (638 avant) — DÉCIDÉ D'AVANCE : si le fichier franchit 800, la scission se fait DANS CE LOT** · (8) `BORNE_EN_TOUTES_LETTRES` · (9) mutants vus rouges · (10) `git diff --numstat`, **pas un grep**.

### Lot 2 — `carte-distribution` · feature · **9 fichiers**
`CarteEclaterSynopsis.tsx` (**N**) · `LigneFiche.tsx` (**N**) · `CarteAssistant.tsx` (R) · `PanneauCopilote.tsx` (R) · `styles.ts` (R) · `textes.ts` (R) · `tests/distribution.test.tsx` (**N**) · `tests/panneauCopilote.test.tsx` (R) · `tests/cablage.test.ts` (R)

**Trois trouvailles mesurées** :
1. ⚠ **`CarteAssistant.badge?` perd son UNIQUE consommateur** — la seule occurrence de `badge=` est le placeholder que cette carte remplace. **La prop ET l'import `Badge` partent dans ce lot**, sinon c'est une surface publique à zéro appelant (KR-109), **livrée le jour même**.
2. **`CARD3_TITRE` survit**, **`CARD3_BADGE` disparaît**, **`CARD3_CORPS` passe du FUTUR au PRÉSENT** (« Proposera… » devient une **promesse fausse** une fois la carte active).
3. ⚠ **`LigneFiche` est la PREMIÈRE ligne qui nomme légitimement des champs**, **sans une seule chaîne retapée** (précédent `LigneProposition.tsx:66`). **Le corollaire TL3a-3 ne s'applique pas** : il visait une ligne rendant **une** prose anonyme ; **ici il y en a deux, et rien ne les distinguerait.**

**Invariants d'écran** : **clé React et clé de `decisions` = LA POSITION** · **aucune garde « porteur disparu »** (il n'y a pas de porteur) · **accepter N fois ⇒ N identifiants distincts, refuser n'en consomme aucun** · zéro `localStorage`, zéro `useEffect` d'état dérivé.

### Fichiers HORS de tout lot
⚠ **Le témoin « zéro diff sur `dossier/types.ts` » REVIENT**, différence lisible avec 3c : **cette itération n'ajoute aucun champ au schéma et aucune graine.** Le seul fichier de `brain/dossier/` touché est `libelles.ts`, **diff purement additif**.

## 6 — Une proposition chiffrable, **cuttable sans dommage**
**Injecter `monde.personnages[].fonction` des existants**, en **liste négative**. Coût : +1 chemin (**déjà `'ia'`, déjà injecté par trois rôles**), +1 ligne d'invite, +1 test. **Aucun rang, aucune table** — donc **aucun** des risques de 3c. Gain : au second lancer le modèle ne repropose pas le forgeron. **Bénéfice secondaire : `entitesInjectees` cesse d'être toujours `[]` — l'audit de confinement a quelque chose à auditer.** ⚠ **Si le comité la coupe, la coupe est SAINE** : le doublon est un coût **visible**. **Pas de veto.**

## REJETÉ — pour le registre (BUG-082)

| # | Rejeté | Motif |
|---|---|---|
| 1 | **Fabrique `creerPersonnageBrouillon()` dans `brain/`** | `tsc` tient la **FORME** ; `INTENSITE_INITIALE` fermait une divergence de **VALEUR**, silencieuse. **KR-109 déguisé en KR-165.** |
| 2 | **Étendre `CHAMPS_PROPOSABLES` / `ChampProseChemin`** | Rendrait représentable une demande **sur une entité qui n'existe pas**. **Le rôle EST les champs.** |
| 3 | **`'cible-a-ecrire'` pour le synopsis manquant** | ⚠ **Décisif** : le motif dit « l'entité **CIBLE** n'a rien d'écrit ». Ici la cible est `monde.personnages[]`, **vide par définition** — **cas nominal**. |
| 4 | **Promouvoir `ACCROCHE JOUEUR` « puisqu'on y est »** | Injectée, **jamais requise** ⇒ **ligne de registre sans producteur** (KR-235). |
| 5 | **Un second lot contrat** | Disjoint **mais sans gain** : `PARTIES_REQUISES` ne compile qu'une fois `CheminLibelle` élargi. |
| 6 | **Un 3ᵉ lot « worker »** | `frontiere.test.ts:68/74` **soude** worker et brain : **rouge seul**. |
| 7 | **Scinder `schemaSortie.ts` préventivement** | **638 l. mesurées** ; due **seulement** au franchissement de 800. **C'est la dernière itération** — aucun 7ᵉ validateur en vue. |
| 8 | **Prédicat d'unicité sur `charge`** | **Deux gardes portent légitimement la même fonction.** Et **il n'y a pas de jeton**. |
| 9 | **Réutiliser `LigneReplique` deux fois par fiche** | **Deux boutons « Accepter » pour un brouillon indivisible** ; et `LigneReplique` reste réutilisable **parce qu'elle ne porte aucun membre propre à un consommateur**. |
| 10 | **`role` comme champ réseau** | **VETO** — collision `CorpsDemande.role` / `Cible*.role`. |
| 11 | **Clé de liste `personnages`** | Nom de collection ⇒ nommer le champ. |
| 12 | **Clé React = l'identifiant** | **Il n'existe pas avant l'acceptation.** |
| 13 | **Faire nommer par le modèle** | KR-195 ; **parité** : la création manuelle ne nomme pas non plus. |
| 14 | **Dériver `nom` de `fonction`** | Seconde règle **silencieuse** + optionnel semé (KR-221). |
| 15 | **Champ de saisie du nom** | **Classe d'interaction neuve**, requis **plus strict que le schéma**. |
| 16 | **Injecter `canon.objectifs[]`** | **Zéro clé `'ia'`**. Décision actée. |
| 17 | **`{ ...cible, contexte }`** | **Inoffensif ici — et c'est pourquoi il reste interdit** : il serait **généralisé aux cinq autres**. |
| 18 | **Un 3ᵉ champ de prose (`apparence`)** | +4 prédicats, +~35 % de `max_tokens`, **et son retrait ne coûte aucune information**. |
| 19 | **Aligner la borne sur les jumelles** | 6ᵉ instance du refus du registre partagé. |
| 20 | **`type ContexteDistribution = ContexteProse`** | Abstraction à un seul appelant — `ContexteProse` est **déjà** réutilisé **sans alias** par trois rôles. |

## 7 — Ce que personne ne pourra vérifier
- ⚠ **Une `reputation` qui trahit le synopsis MJ au joueur** — `description_joueur` est la prose **lue par le joueur**, et ici le synopsis est la source **dominante**. **Moitié validateur impossible** (KR-229). **À traiter par `narratif-ia`.**
- Une distribution sans rapport avec le synopsis.
- **Deux figures qui sont la même personne dite deux fois** — sans nom ni identifiant, **rien ne peut le constater**.

## 8 — Pour les `open_questions`
Le **rattachement aux objectifs** (n° 10) · le **`nom` re-projeté** (n° 10) · ⚠ **la scission `copilote/demandes/**` : condition « 6ᵉ rôle OU 600 lignes » — LE 6ᵉ RÔLE ARRIVE ICI**, donc `CopiloteService.ts` est à re-mesurer dans le lot 1 ; s'il franchit 600, **la condition est échue et la décision revient au comité, pas à l'ouvrier**.
