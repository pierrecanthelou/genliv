# Tour 2 — `narratif-ia` · `dossier-copilote` it3b

**RÉPONSE AU `tech-lead` — le conflit de clés : je prends son jeu.** Son REJETÉ n° 6 est fondé et je m'y range : `actions` sur le fil porte le nom du champ que l'acceptation écrit — **le piège que mon propre REJETÉ n° 9 dénonçait ailleurs**. Mieux : `dossier/types.ts:362` glose déjà `action` par « L'intention du personnage à cette étape » — **`intention` est le mot du dépôt**, pas ma préférence. Son REJETÉ n° 5 **est** mon objection n° 1 : `acteurId` adopté, sous JSDoc disant qu'il ne nomme **aucune entité du dossier** et que la bascule 3c en union étiquetée est une dette datée.

**Je ne prends pas son `actions` pluriel côté re-résolu** : il n'y a plus trois étapes. **Fil `{"intention": "…"}` · re-résolu `{ acteurId, action }`.** KR-231 : intersection vide, et aucune `Cible*`/`Proposition*` existante n'a cette forme.

**RÉPONSE À l'`ux-designer` — elle a raison contre moi.** Trois étapes **contredisaient mon propre amendement** : le préfixe injecté n'est vrai que pour la première ; les 2ᵉ et 3ᵉ sont écrites contre une prémisse que l'auteur peut refuser, et rien à l'écran ne dit qu'elles en dépendent. UNE par lancer ⇒ **sortie SCALAIRE** : une liste de un rend « deux » **représentable** et ne l'interdit que par une constante.

**`si_bloque`** : mon motif tient et **se durcit**. Montré sans être écrit, c'est une proposition que l'auteur ne peut pas accepter et **que le premier mainteneur câblera**. Il sort du contrat **et de l'écran**.

**MES OBJECTIONS** — n° 1 **MAINTENUE, soldée** par `acteurId`. n° 2 **MAINTENUE, parade amendée** : promotion dans `brain/` **REPORTÉE**, remplacée par une **assertion de résultat**. **Aucun veto.**

---

# ANNEXE (hors quota)

## B. L'amendement à la doctrine 3a — formulation consolidée, à porter au registre

> **L'injection du champ cible dépend de son ORDRE, pas de son audience.**
>
> 3a a posé : le champ cible ne s'injecte pas. L'amendement le **restreint**, il ne l'annule pas :
>
> **Un champ cible INTERCHANGEABLE ne s'injecte pas ; un champ cible ORDONNÉ s'injecte.**
>
> `caractere.parler[]` est un ensemble d'échantillons **sans ordre** : l'élément N ne présuppose rien. `plan_actions[]` est une **SÉQUENCE** : l'étape N n'a de sens qu'après 1…N−1. Le préfixe n'est pas la réponse — **c'est la prémisse de la question**.
>
> **Asymétrie du regret** (formulation du `tech-lead`, retenue telle quelle) : injecter risque un **doublon** — visible à l'écran, rejeté d'un clic ; ne pas injecter risque une **incohérence de suite** — invisible à l'écran, invisible au validateur (KR-229), et jouée telle quelle par le rôle acteur au Temps 2. **On prend le risque qu'un instrument constate.**
>
> **TROIS contreparties, indissociables :** (1) l'auteur voit le préfixe **GELÉ** à côté de la proposition ; (2) un prédicat de forme refuse la **recopie verbatim** ; (3) **une seule étape par lancer**.
>
> **La 3ᵉ contrepartie est ce que le tour 2 ajoute** : ma note de tour 1 faisait coexister l'injection du préfixe **et** trois propositions — **les deux étaient incompatibles**, et c'est l'`ux-designer` qui l'a vu.
>
> **Condition de généralisation, décidable** : tout futur champ cible de liste se range par un test unique — « l'élément N présuppose-t-il l'élément N−1 ? ». Oui ⇒ injection **plus les contreparties**. Non ⇒ précédent 3a inchangé.

## C. L'invite définitive, MOT POUR MOT

Gabarit **incrusté par référence** `${GABARIT_SORTIE['personnage-plan']}`, jamais en littéral.

```
Tu assistes l'AUTEUR d'un livre-jeu qui écrit le plan d'actions d'un personnage.
À partir du contexte fourni, tu proposes la PROCHAINE ÉTAPE de ce plan : ce que CE personnage-là entreprend ensuite pour obtenir ce qu'il veut.

Tu réponds par un objet JSON et rien d'autre, de la forme {"intention": "…"} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Cette étape est une INTENTION que le personnage poursuit : elle servira plus tard de consigne à qui le fait agir, elle ne sera jamais lue telle quelle à un joueur, et ce n'est jamais une phrase qu'il prononce.
Elle prolonge les étapes déjà listées, elle n'en répète aucune, et elle vient après la dernière.
Tu en proposes UNE, et toujours une : même quand le contexte est maigre, une fonction et un but suffisent à dire ce qu'un personnage entreprend ensuite.
Elle tient en une phrase et ne porte qu'UNE action.
Tu n'écris jamais de durée ni de délai — ni « au bout de trois jours », ni « le lendemain », ni « après une semaine » : le temps est compté ailleurs.
Tu n'écris jamais à quelle condition l'étape commence, ni ce que le personnage fait si elle échoue, ni aucun numéro d'étape.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**Quatre décisions à ne pas « corriger »** : (1) **le piège de recopie propre à ce rôle** — l'invite répliques produirait des **répliques**, l'invite prose des **descriptions** ; la ligne propre est « une INTENTION … jamais une phrase qu'il prononce », **qu'aucun validateur ne peut constater** (KR-229). (2) « Tu en proposes UNE, et toujours une » est la moitié symétrique du prédicat (4) et **ne cite aucune constante** (il n'y en a plus). (3) « elle n'en répète aucune » est la moitié persuasive du prédicat (5). (4) **La ligne de la durée est la ligne de l'itération** — elle interdit le motif en langue naturelle avec trois exemples, et s'arrête à « le temps est compté ailleurs ».

**Ce que l'invite N'A PAS le droit de réciter** : `DUREE_MIN` · toute unité de temps de session · l'existence de `duree`, `si_bloque`, `declencheur_*` et leurs noms · le langage D1 · le nom du champ `action` ou de tout autre champ · la table d'audience · caractéristiques, seuils, tiers · le message d'un contrôle · **le mot « tour »**, réservé au round de combat.

## D. Les chemins de contexte — NEUF, inchangés

```
canon.ton · canon.interdits_ton[] · canon.partage.accroche_joueur
monde.personnages[].fonction · .description_joueur · .but.libelle · .but.pourquoi
monde.personnages[].caractere.jamais
monde.personnages[].plan_actions[].action      ← le PRÉFIXE ORDONNÉ, dans l'ordre du document, NON tronqué
```
**Retraits** : `synopsis_mj` (**point de vue**, pas ton — ne pas recopier la phrase de 3a) · `apparence` · `caractere.parler[]` · `cede_si`, `curseurs.*`. **Reportés** : `savoirs[]` (n° 12) · `presence[]`, `relations[]` (3c).

⚠ **CONTRAINTE MESURÉE QUE PERSONNE N'AVAIT SIGNALÉE, et qui vise la QUATRIÈME entrée nommément.** `worker/frontiere.test.ts:608-621` exige `rolesAuMaximum(BUDGETS, ROLES)).toEqual([ROLE_LE_PLUS_LARGE])` — **le maximum doit être atteint par exactement un rôle** —, et le commentaire des l. 610-616 dit en toutes lettres que c'est « la QUATRIÈME entrée qui aurait payé ». `personnage-prose` vaut **6000**. **Si la mesure de `personnage-plan` arrondit à 6000, ce test rougit en nommant les ex æquo.** *(Lecture de source, non exécuté.)*
**Conduite à tenir, écrite d'avance** : un ex æquo est un **résultat légitime**, pas un défaut de budget. **On ne déplace JAMAIS le budget de ±1000 pour casser l'égalité** — ce serait un chiffre non mesuré dans la config. On rapporte l'égalité au comité, et c'est **l'invariant du test** qui est rediscuté, pas la mesure.

**`TAILLE_MAX_CORPS_IA` se re-dérive sur les QUATRE rôles** : « inchangé » ne se suppose pas.

## E. La forme de sortie, et son comportement d'échec

**Gabarit, ligne exacte, dupliquée à l'identique des deux côtés** :
```
	'personnage-plan': '{"intention": "…"}',
```
**Vérifié point par point contre `/^\t'([a-z-]+)': '(.+)',$/gm`** : une tabulation ✓ · guillemets simples ✓ · rôle ⊂ `[a-z-]+`, **aucun accent, aucun chiffre** ✓ · virgule finale ✓ · **aucune apostrophe dans la valeur** ✓. Et `{"intention": "…"}` **n'est sous-chaîne d'aucun** des trois autres ni réciproquement.

```ts
export interface IntentionRendue { intention: string }                 // réseau — NON ré-exportée
export interface PropositionPlan { acteurId: string; action: string }  // re-résolu — ré-exportée
export interface CiblePlan { acteurId: string }
export const CLES_SORTIE_PLAN = ['intention'] as const
```
**KR-231 vérifié** : `{intention}` ∩ `{acteurId, action}` = ∅. `PropositionPlan` n'est structurellement identique à aucune des trois autres ; `CiblePlan` non plus.
**Deux mots pour la même chaîne, et c'est le précédent `valeur`→`texte`** : `intention` **enseigne au modèle** ce qu'on attend ; `action` **nomme la destination**. À écrire en JSDoc, sinon quelqu'un « harmonisera ».
**AUCUNE constante de borne** : la sortie scalaire rend « deux » **non représentable** — **la meilleure garde est celle qui n'existe pas**.

**LES SEPT PRÉDICATS, dans l'ordre** :
```
(1) objet simple (ni tableau, ni null) ............................. 'schema'
(2) clés = EXACTEMENT CLES_SORTIE_PLAN (une clé EN TROP = REFUS) ... 'schema'
(3) la clé porte une CHAÎNE ........................................ 'schema'
(4) non vide après trim() .......................................... 'vide'
(5) NON ÉGALE (après trim()) à une `action` déjà écrite sur CE
    personnage ..................................................... 'schema'
(6) aucun MARQUEUR_A_ECRIRE (constante IMPORTÉE, KR-223) ........... 'marqueur'
(7) aucun identifiant du dossier ................................... 'identifiant'
```

**Signature — le prédicat (5) ne prend PAS d'identifiant** :
```ts
export function validerIntention(brut: unknown, dossier: Dossier, dejaEcrites: readonly string[]):
	({ ok: true } & IntentionRendue) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
```
`dejaEcrites` plutôt qu'un `acteurId` : un validateur qui **résout une cible** peut recevoir une cible qui ne résout pas, donc il lui faudrait un **mode d'échec neuf** — alors que `demanderPlan` tient déjà le personnage, et que la cible non résolue est refusée **avant le `fetch`**. Liste vide (plan neuf) ⇒ (5) vraie par vacuité, **aucun cas particulier**.

**RÉPONSE À LA `qa` — séparabilité du prédicat (5)** :
- **Séparable : OUI.** Cas négatif, une seule paire : personnage portant `plan_actions: [{ etape: 1, action: 'Suivre le héros à distance pour voir où il va.' }]` (**valeur réelle**, `__fixtures__/dossier-reference.json:200`) ; entrée `{"intention":"  Suivre le héros à distance pour voir où il va.  "}` ⇒ attendu `{ ok: false, motif: 'schema' }`. L'entrée est un objet simple, clé exacte, chaîne non vide, sans marqueur ni identifiant : **(5) est le seul prédicat qui peut la refuser**. Les blancs encadrants forcent la comparaison à passer par `trim()`. Témoin positif de la même paire : `'Suivre le héros à distance, de nuit.'` ⇒ `{ ok: true }`.
- **Ce qu'il n'attrape PAS, et c'est assumé** : la **paraphrase** · la **contradiction** avec une étape existante · la **redite du but** (`but.libelle` hors comparaison — l'y mettre produirait des refus faux) · la recopie d'un `parler[]` ou d'un autre personnage · une différence de **casse** seule.

**Rattachement** : ce rôle rend **de la prose que rien ne fournit** ⇒ **RÉDACTION** ⇒ le vide est une non-réponse, `'vide'` (prédicat 4). Le cas « rien à prolonger » est traité **avant l'appel**.

**REFUS DE CONTEXTE, ordre figé, tous AVANT le moindre `fetch`** : `a-ecrire` (`canon.ton`) → `cible-a-ecrire` (le personnage ne résout plus **ou** `but.libelle` absent/vide/marqué — **prédicat NOMMÉ sur UN chemin**, `CHEMIN_BUT_CIBLE`, mécanisme de `CHEMIN_VERITE_CIBLE`, **non** la disjonction à sept de 3a ; motif : **on n'invente pas un PLAN à partir de rien**) → `trop-long` (**refus, jamais de coupe**, KR-230).

## F. `max_tokens` — DÉRIVÉ par la règle DU DÉPÔT

**La règle est écrite dans le code, je l'ai lue** : `jetons = L / r × 3`, arrondi à la centaine supérieure, **`r = 2` (pire) et on le dit**. **Mon chiffre de tour 1 (400) était dérivé sous une liste de trois : il tombe.**

**Mesure** : `dossier-reference.json:172` = **67** car. (relu caractère à caractère) ; `fichePersonnage.test.tsx:176` = **68** (repris du tour 1, **non re-compté**) ⇒ **P = 68**.
**Dérivation** : enveloppe `{"intention": ""}` = **17** car. `L = 85`. `r=3 ⇒ 100` ; **`r=2` (PIRE) ⇒ 127,5 ⇒ 200**.
⇒ **`max_tokens: 200`.** ⚠ Le résultat **dépend du ratio** (100 contre 200) : on prend le pire **et on le dit**. ⚠ **Ce 200 n'est PAS recopié de `personnage-prose`** — la coïncidence doit être **écrite dans le commentaire**.
**Mode d'échec nommé** : une intention très longue tronque le JSON ⇒ (1) ou (2) ⇒ `'schema'` ⇒ rejeu ⇒ terminal. **C'est le bon échec.**
**Contrôle de non-régression exigible dans le lot** : appliquer la formule aux entrées de 3a doit **reproduire 400** ; sinon, rapporter l'écart **avant** d'écrire la constante.

## G. L'écriture à l'acceptation — et pourquoi je REPORTE la promotion

```ts
? { ...p, plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }] }
```
**Deux clés, rien d'autre** (KR-221). `etape` **dérivé du `p` de la recette**, donc de la liste vive **au moment de l'écriture**.

**PROMOTION DANS `brain/` — REPORTÉE.** Deux raisons, dont **une qui n'est pas celle du tech-lead** : (1) sa frontière de lots est une raison de calendrier ; (2) **la raison de fond, et elle est la mienne** : `handleRetirerEtape` **filtre sans renuméroter**, donc `length + 1` peut **collisionner** après une suppression. **Promouvoir la formule maintenant, c'est installer un défaut préexistant dans `brain/` et le faire RATIFIER par la promotion. On ne promeut pas une règle avant qu'elle soit juste.**

**CE QUI REMPLACE LA PROMOTION, et qui vaut mieux qu'elle** : une **assertion de RÉSULTAT**, pas de formule — *une formule recopiée ne se vérifie pas, un résultat si*. « Après N acceptations successives sur un personnage dont le plan portait k étapes non amputées, les `etape` valent `1…k+N`, strictement croissants, sans doublon. » Elle vise l'invariant narratif — **un plan doit être ordonnable** — et **se repointera telle quelle** sur l'éditeur manuel le jour où il sera réparé.
**Condition de promotion, datable** : la renumérotation à la suppression réparée.
**À porter à `bug_history.json`**, `minor`, `dossier-fiches` : le défaut **préexiste**, 3b ne le crée pas, mais elle lui **ouvre un second chemin d'atteinte** — c'est cela qu'il faut écrire.

## H. Conséquences pour l'`ux-designer` — trois textes, et un numéro qui disparaît

1. **`si_bloque` quitte l'écran** ⇒ `EYEBROW_SI_BLOQUE`, `TEXTE_SI_BLOQUE_NON_PROPOSE` supprimés, `LigneEtape` sans objet. **Le risque « une chaîne, deux domiciles » qu'elle signalait disparaît entièrement.**
2. **`CARD5_CORPS` à réécrire** — sa seconde moitié est **fausse**. Proposition : `"Propose la prochaine étape du plan d'actions de ce personnage — ce qu'il entreprend ensuite pour obtenir ce qu'il veut."`
3. **La mention de mémoire est FAUSSE, elle l'avait prévu.** La mémoire de session est mon terrain, voici la phrase exacte : `"Le copilote lit les étapes déjà écrites, jamais celles que vous avez refusées : chaque lancer repart de la liste enregistrée."` — vraie, et elle dit **ce qui est retenu et ce qui est oublié**.
4. **`TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN` — sa PREMIÈRE formulation est la bonne.** ⚠ Caveat hérité de 3a : `cible-a-ecrire` couvre **aussi** « le personnage ne résout plus », que ce texte ne décrit pas.
5. ⚠ **L'étiquette de la proposition ne porte AUCUN numéro.** `eyebrowEtapeProposee(n)` → une constante **sans nombre**, `PROCHAINE ÉTAPE`. **Motif structurel** : le numéro affiché serait calculé sur la liste **gelée**, celui qui est écrit l'est sur la liste **vive** ; s'ils divergent, **l'écran a menti d'un entier**. Le modèle ne rend jamais un entier, **et l'écran n'en pré-annonce pas un que le code n'a pas encore décidé.** `eyebrowEtape(n)` reste : ces numéros-là sont **lus dans le document**, donc vrais.

## I. Les REJETÉ consolidés (extraits — liste complète au registre du plan)

1. Le modèle rend `etape` · 2. le modèle propose `duree` · 3. le code pose `duree` · 4. `si_bloque` proposable · **5. `si_bloque` AFFICHÉ en lecture seule sans jamais être écrit** — *une proposition que l'auteur ne peut pas accepter est un mensonge d'écran, et le premier mainteneur en câblera l'acceptation « puisqu'elle est là »* · 6. `declencheur_texte` · 7. `declencheur_expr` · 8. `synopsis_mj` · 9. `CiblePlan { personnageId }` · **10. `{"actions": …}` comme clé de fil** *(concession)* · 11. `{"etapes": …}` · 12. `PropositionPlan { personnageId, ajouts }` · **13. proposer PLUSIEURS étapes par lancer** *(objection UX adoptée)* · **14. une sortie de LISTE bornée à un** — *une liste de un rend « deux » représentable et ne l'interdit que par une constante ; la forme scalaire le rend non représentable* · 15. un plafond de document · **16. un numéro d'étape affiché sur la PROPOSITION** · 17. élargir (5) à `but.libelle` ou à une similarité · **18. `CiblePlan { personnageId, plan: true }`** — *convention mixte, pire que l'un ou l'autre choix pur* · **19. REPORTÉ — la promotion de `etape`** · **20. REPORTÉ — `savoirs[]`** · **21. REPORTÉ — `si_bloque` sur une étape existante portant déjà une `duree`**.

## J. Ce que je N'AI PAS mesuré

- **Aucun test exécuté, aucune compilation.** Dispatch, prédicats, garde KR-236, test du maximum unique : **lecture de source**.
- **Je n'ai pas mesuré le budget** de `personnage-plan` — je ne sais donc **pas** s'il y aura ex æquo ; je dis seulement ce qu'il faudra faire s'il y en a.
- Les longueurs du § F sont comptées **à la main** (67 relu ce tour-ci ; 68 **non re-compté**) : **à re-compter programmatiquement dans le lot** avant d'écrire `200`.
- L'avertissement `si_bloque` sans `duree` : **lu**, **non rejoué**.
- La mesure 3 → 6 est celle de la `qa` ; **corroborée par relecture**, pas par exécution.
