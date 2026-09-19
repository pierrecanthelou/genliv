# Tour 2 — `tech-lead` · `dossier-copilote` it3c

**RÉPONSE NOMMÉE — `narratif-ia`, objection structurelle : RATIFIÉE ET VÉRIFIÉE DANS LE CODE.** `CHAMPS_INJECTES` est bien une liste plate ; `detenteurs.ts:111` et `plan.ts:99` bouclent sur le seul préfixe. Porteur et candidats étant **tous deux** des personnages, huit inconnus livreraient leur `but.pourquoi`. **`assemblerRelations` fait les deux ensembles SANS toucher `noyau.ts`** : `PREFIXE_PERSONNAGE`, `textesRediges`, `textesDuChemin`, `ContexteDetenteurs` y sont **déjà exportés**. ⚠ **Liste POSITIVE, jamais `filter(≠ but.pourquoi)`** — un filtre négatif **ré-élargit en silence** au 9ᵉ chemin.

**DIVERGENCE CENTRALE — JE RETIRE MA LISTE.** **Mon « ermite » était faux** : « personne » n'est pas une sortie de ce rôle, **c'est `aucun-candidat` qui le dit, avant le `fetch`**. Ma forme coûtait **en plus** : 1 constante, 3 prédicats (dont le doublon intra-lot), 1 doctrine neuve à ratifier, 1 état d'écran indiscernable d'un échec, la famille BUG-109 au focus — **pour acheter un re-clic**. **Scalaire paire, 8 prédicats.**

**UX — je cède le nommage** : `CarteCompleterRelations` + `LigneRelation`. **Son motif bat le mien.**

**Ma scission `demandes/` : RETIRÉE** — *mon biais, un refactor non requis dans le lot le plus chargé.*

**VETO, MESURÉ** : `CopiloteService.ts:490-492` retombe sur `demanderRepliques` **par défaut**, et `CibleRepliques`/`CibleRelations` sont structurellement identiques ⇒ rôle annoncé A, validateur exécuté B, **`tsc` vert**.

**TROU NEUF, MESURÉ** : porteur supprimé ⇒ `map` **identité** ⇒ `statut:'ecrit'` ⇒ « acceptée » **sans rien écrire** (BUG-114).

---

# ANNEXE (hors quota)

## A. Statut de CHACUNE de mes objections du tour 1

| # | Objection | Statut |
|---|---|---|
| 1 | Union étiquetée, le paramètre `role` disparaît | **DURCIE EN VETO** — mesuré `CopiloteService.ts:490-492` |
| 2 | Doublon fermé à la **SÉLECTION** | **MAINTENUE** (convergence narratif) |
| 3 | Forme LISTE + borne + liste vide = succès | **RETIRÉE** — § B |
| 4 | Le lot contrat **possède les 4 cartes** | **DURCIE EN VETO** — sans elles le lot 1 est **rouge seul** |
| 5 | `INTENSITE_INITIALE` + repoint des écrivains | **MAINTENUE**, avec **témoin de remplacement** — § D |
| 6 | Scission `copilote/demandes/**` | **RETIRÉE** — § G note 2 |
| 7 | `intensite: 0` **en dur dans la carte** | **VETO MAINTENU** (KR-165) |
| 8 | `porteUnIdentifiant` sur le **jeton** | **VETO MAINTENU** (BUG-084/KR-235) |
| 9 | `CarteTisserLiens` / `LigneLien` | **RETIRÉS** devant l'UX |
| 10 | `acteurId` non renommé | **MAINTENUE** |
| 11 | Couper 3c en deux | **NON RETENU**, et **moins nécessaire** : le lot 1 perd 7 fichiers |
| **NEW** | **Porteur disparu ⇒ acceptation silencieuse** | **EXIGENCE NEUVE, MESURÉE** — § F-7 |

## B. La divergence — arbitrage contre moi-même

**Ce qui m'a fait tort** : la table de rangs est construite **par le code** depuis le dossier, moins le porteur, moins les cibles déjà liées. Si elle est non vide, l'auteur **a** des personnages à lier ; si elle est vide, `aucun-candidat` le dit **avant le moindre `fetch`**. **Un « personne » rendu par le modèle serait le modèle CONTREDISANT le dossier** — précédent exact du rôle plan, qui propose *la* prochaine étape et ne dit jamais « ce personnage n'a plus rien à faire ».

**Ce que ma forme coûtait EN PLUS** : (1) le **doublon intra-lot** existe à MAX=3 et exige un prédicat ; **à MAX=1 il n'est pas représentable** — *et c'est la meilleure garde (précédent 3b, que j'avais moi-même accepté ; l'appliquer contre moi est la seule lecture cohérente)* · (2) une constante + le garde de borne à réécrire · (3) **trois prédicats sur onze n'existent que parce que la liste existe** · (4) **un état d'écran neuf** : une réponse vide est un **succès qui n'affiche rien, indiscernable d'un échec** · (5) **la famille BUG-109 au focus** — à MAX=1, c'est la branche unique de `CarteCompleterPlan`, mot pour mot.
**Ce qu'elle achetait** : **un re-clic**. **Le rapport est indéfendable.**

**Ce que je garde** : le type de retour de `validerRelation` nomme **`MotifIllisible` EN ENTIER** et **les cinq motifs sont atteignables** — **premier validateur dans ce cas**, à épingler comme propriété : **c'est la preuve d'« aucun prédicat mort ».**

## C. L'objection structurelle — et deux durcissements

**VÉRIFIÉ par lecture** : `noyau.ts` exporte déjà les quatre symboles nécessaires ; `detenteurs.ts` déclare **ses propres** const de chemin locaux et filtre dans son corps. ⇒ **`noyau.ts` reste à ZÉRO DIFF, et c'est un témoin livrable.**

1. ⚠ **`CHEMINS_CANDIDAT` est une liste POSITIVE littérale**, jamais une soustraction — un `filter(c => c !== …)` **reste vert et ré-élargit tout seul** au 9ᵉ chemin (famille KR-235).
2. **Deux tests, pas un** : l'inclusion dans l'union (rouge si l'union rétrécit) **et** le canari d'absence de `but.pourquoi` (rouge si quelqu'un « harmonise »). **Le second ne se déduit pas du premier.**
3. ⚠ **Le témoin qui compte n'est pas sur les listes, il est sur LE TEXTE ASSEMBLÉ** : un candidat au `but.pourquoi` non vide et **distinct** ⇒ le texte contient celui **du porteur**, jamais celui du candidat. **Une assertion sur les listes seules resterait verte sur une boucle qui ignore la liste.**

## D. `dossier/types.ts` et `dossier-fiches` dans le lot contrat — ce qui a changé

**Le témoin de 3b était un CONSTAT DE NON-DÉBORDEMENT d'un lot, pas un invariant permanent** : rien à 3b n'introduisait de graine partagée, et le § 2 listait `dossier-fiches` hors périmètre au motif « churn ».

**Ce qui a changé** : 3c introduit une **graine d'écriture**, et `useEcritureRelationsPresence.ts` en est **l'écrivain existant**. Le repointer **n'est pas du churn, c'est l'application du contrat que le lot introduit**. Ne pas le faire livrerait une règle **à moitié appliquée** : une constante nommée + **deux** littéraux anonymes (l. **44** et l. **137** — ⚠ **correction de ma note du tour 1, qui n'en citait qu'un**), avec une divergence **qu'aucun instrument ne verrait**.
**La constante est la 4ᵉ instance d'une doctrine écrite** : `STATS_INITIALES`, `CONFIANCE_INITIALE_PORTE`, `CURSEURS_INITIAUX`. **Un `0` en dur au site d'écriture est KR-165, pas une préférence.**

**LE TÉMOIN DE REMPLACEMENT, plus fort que celui qu'il remplace** :
> `DOSSIER_SCHEMA` **inchangé** · **zéro diff** sur `destinations.ts`, `tables.ts`, `validate.ts`, `couverture.test.ts` · le diff de `dossier/types.ts` est **purement ADDITIF** (une constante + sa docstring), **aucun champ, aucune règle de validation, aucune entrée d'audience**.

*C'est ce que « zéro diff sur `brain/dossier/**` » voulait dire ; c'est maintenant dit **au bon grain**.*

## E. Réponse à l'UX — je cède, entièrement
Son motif est **décisif et de son terrain**. Retenu : **`CarteCompleterRelations.tsx`** (3ᵉ de la famille « Compléter… ») et **`LigneRelation.tsx`**, sœur et jamais variante. Je ratifie `MENTION_RELATION_CREEE`. **Sa réserve BUG-109 tombe avec la forme scalaire** — une proposition, une ligne, une branche.

## F. Les sept critères de fini — **mes trois et ses quatre sont DISJOINTS et tous requis**
1. **F-1** — worker non configuré **ET** ton marqué ⇒ `a-ecrire`, zéro `fetch`.
2. **F-2** — corps réseau par **`toEqual`**, jamais `toContain`.
3. **F-3 (re-visé)** — `rangs.size === N−2` (**porteur + déjà lié**).
4. **QA-1 — RETENU tel quel** : `"P2"` résout le **DEUXIÈME** id.
5. **QA-2 — RETENU et DURCI** : `toBe(INTENSITE_INITIALE)` **+** `expect(INTENSITE_INITIALE).toBe(0)`.
6. ⚠ **QA-3 — RETENU mais RÉ-ORIENTÉ, et je dis pourquoi** : tel qu'écrit il **contredit la conception**. **KR-194 dit que l'auto-référence est LÉGALE AU DOCUMENT, pas qu'elle est PROPOSABLE.** Deux assertions, **toutes deux** à livrer : (a) le porteur **n'a aucun rang** ; (b) une auto-relation **déjà écrite par l'auteur** est **intacte** après acceptation — **aucune purge « raisonnable »**.
7. ⚠ **QA-4 — RETENU, et ma mesure LE COUPE EN DEUX.** **Cible disparue** ⇒ `cible_id` pendant ⇒ `validateDossier` **l'expose** (KR-021) : chemin **déjà correct**. **Porteur disparu** ⇒ la recette est **l'identité** ⇒ dossier valide ⇒ **`statut:'ecrit'`** ⇒ « acceptée » **sans rien écrire**. **C'est BUG-114 mot pour mot.** **Garde exigée** : si le `personnageId` gelé ne résout plus, **aucun `update`**, texte dédié, **jamais `decision:'acceptee'`**.
   ⚠ **Le même trou existe dans `CarteCompleterPlan` (3b) et `CarteFaireParler` (3a)** — **préexistant**, **journalisé** `minor`, **non corrigé ici** (précédent `handleRetirerEtape`).

**Le trou d'instrument de la QA : RETENU EN CRITÈRE DE FINI.** Vérifié : `worker/index.test.ts:346, 476, 616` — **trois blocs écrits à la main**, un par rôle. **Le 5ᵉ n'hérite de rien.** À l'inverse `frontiere.test.ts:68/74` sont **dérivés** et s'étendent seuls.

## G. DÉCOUPAGE DÉFINITIF — 2 lots, **21 + 7 fichiers**

**LOT 1 `contrat`, seul et en premier, 21 fichiers** : `CopiloteService.ts` · `copilote/{types,schemaSortie}.ts` · `contexte/relations.ts` (**N**) · `contexte/{registres,index}.ts` · **`dossier/types.ts`** · `brain/index.ts` · les 3 tests de brain · `worker/{index,index.test,frontiere.test}.ts` · **les 4 cartes livrées** (~2 l. chacune) · **`useDemandeCopilote.ts` (DOCSTRING SEULE, zéro ligne de code** — l. 32-34 citent une signature fausse après le lot ; précédent `LigneReplique` à 3b) · **`tests/useDemandeCopilote.test.tsx` (docstring seule)** · **`dossier-fiches/hooks/useEcritureRelationsPresence.ts` (l. 44 ET l. 137)**.

**Note 2 — la scission `demandes/**` est RETIRÉE.** Mesuré : **502 l.**, ~570 avec la branche — **sous le bloqueur (800)**, et le signal à 400 **vise les composants et hooks, pas un service**. Elle ajoutait 7 fichiers **et un piège d'ordre invisible** (refus → acheminement → `fetch`) **au lot le plus chargé**. ⚠ **« Je m'applique ma propre règle : une abstraction sans second appelant nommé dans cette itération est une dette. »** **Condition d'ouverture** : le 6ᵉ rôle, **ou** 600 lignes.

**LOT 2 `feature`, 7 fichiers** : `CarteCompleterRelations.tsx` (N) · `LigneRelation.tsx` (N) · `textes.ts` · `styles.ts` (**possiblement zéro diff** — les 11 jetons sont déjà consommés ; **propriété du lot quand même**) · `PanneauCopilote.tsx` · `tests/relations.test.tsx` (N) · `tests/panneauCopilote.test.tsx`.

**Disjonction vérifiée fichier par fichier.**
⚠ **`specification.json` l. 35 est PÉRIMÉE** — elle décrit `demander(role, dossier, cible, signal?)`.
**ZÉRO DIFF annoncé comme témoin** : `contexte/{noyau,prose,detenteurs,repliques,plan}.ts` · `dossier/{destinations,tables,validate,couverture.test}.ts` · `{LigneDetenteur,LigneReplique,CarteAssistant,BarreLancer}.tsx` · `tests/{acceptation,detenteurs,repliques,planActions,cablage}` · `jest.config.cjs`. ⚠ **Relevé exigé : `git diff --numstat` sur cette liste, PAS un grep d'imports** (leçon n° 3 du `RETOUR-COMITÉ` de 3b).

## H. Signatures FIGÉES
```ts
export interface CibleRelations { role: 'personnage-relations'; personnageId: string }   // ×5 étiquetées
demander(dossier: Dossier, cible: CibleRelations, signal?): Promise<ReponseRelations>    // le paramètre `role` DISPARAÎT
// impl. : switch (cible.role) { … default: { const _exhaustif: never = cible; return _exhaustif } }
export interface RelationRendue { envers: RangInjecte; nature: string }                  // RÉSEAU, 1re forme à 2 clés
export interface PropositionRelations { personnageId: string; cibleId: string; lien: string }
export const CLES_SORTIE_RELATIONS = ['envers', 'nature'] as const
GABARIT_SORTIE['personnage-relations'] = '{"envers": "P2", "nature": "…"}'
export function validerRelation(brut, rangsConnus: ReadonlySet<RangInjecte>, dossier): …
export function assemblerRelations(dossier, cible: CibleRelations): ContexteDetenteurs   // SANS alias
export const INTENSITE_INITIALE = 0   // le point NEUTRE, jamais le plancher (INTENSITE_MIN = -3)
```
**La recette, figée** : `relations: [...(p.relations ?? []), { cible_id: cibleId, lien, intensite: INTENSITE_INITIALE }]` — **TROIS clés, `secret` ABSENT** (optionnel ⇒ **on ne sème pas**). ⚠ **Jamais `{ ...proposition }` étalé** · ⚠ **garde préalable obligatoire** sur le porteur.

## I. REJETÉ — pour le registre (BUG-082)
1. **Sortie en LISTE + borne** — *retirée par son auteur : elle rend « zéro » et « deux » représentables, pour acheter un re-clic.*
2. **Liste vide = succès** — *« personne » est le refus `aucun-candidat`, rendu avant tout `fetch`.*
3. **Prédicat « `vers` distincts »** — *sans objet à une relation par demande.*
4. **Prédicat de doublon au validateur** — *il ne connaît pas le document.*
5. **`porteUnIdentifiant(envers, …)`** — *code mort présenté comme de la couverture.*
6. **`CibleRelations { porteurId }`** — *3ᵉ synonyme, refusé par les deux auteurs qui l'avaient écrit.*
7. **Scission `demandes/**` à 3c** — *refactor non requis ; condition : 6ᵉ rôle ou 600 lignes.*
8. **`type ContexteRelations = …`** — *abstraction à un seul appelant.*
9. **`CarteTisserLiens`/`LigneLien`** — *« tisser » est le geste de la carte 2.*
10. **Étendre `LigneDetenteur` ou `LigneReplique`** — *sœur, jamais variante.*
11. **`intensite: 0` en dur dans la carte** — *KR-165, quatre précédents nomment la graine dans `brain/`.*
12. **Ne pas repointer `useEcritureRelationsPresence.ts`** — *une graine à deux domiciles diverge en silence.*
13. **Renommer `acteurId`** — *churn ; tirerait `planActions.test.tsx` dans le lot contrat.*
14. **Injecter `relations[]`** — *interchangeable, et exigerait l'appellation de la n° 10.*
15. **Exercer `secret`** — *abstraction à zéro appelant ; seule sa JUSTIFICATION est corrigée, aux deux sites.*
16. **Registre paramétré des `CLES_SORTIE_*`** — *le rôle prose n'a pas de liste.*
17. **3ᵉ lot « worker »** — *rouge seul.* · 18. **Deux lots contrat** — *propriété non exclusive.* · 19. **Couper 3c** — *la moitié couture n'aurait aucune démo.*
20. **Corriger le trou « porteur disparu » dans les cartes 3 et 5** — *préexistant ; journalisé `minor` dans le même lot.*

## J. Ce que je n'ai PAS mesuré
⚠ **Aucun `tsc`, aucun `jest`, aucun `git` exécuté** — je n'avais que la lecture et `Grep`. **Tout ce que j'appelle « mesuré » est une LECTURE DE CODE DATÉE, pas une exécution.** **La prédiction « le lot 1 passe la porte SEUL » reste une prédiction — si elle est fausse, le découpage est faux.** · Le **budget n'est pas prédit** (à mesurer, `CANDIDATS_MAX` saturé ; *si la mesure déplaît, on baisse `CANDIDATS_MAX`, jamais le budget*) · **`TAILLE_MAX_CORPS_IA` peut bouger** — à re-dériver **en octets UTF-8** sur les cinq · **le piège de 3b peut se ré-armer** si le budget retombe sur 4 000 ou 17 000 · **le gabarit n'a pas été confronté** à `ENTREE_GABARIT` ni testé comme sous-chaîne — **à vérifier avant d'écrire l'invite** · **`max_tokens = 300` est la dérivation du narratif, non recontrôlée par moi**.
