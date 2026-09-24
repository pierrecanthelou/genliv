# Tour 1 — narratif-ia — moteur-dossier it2

Lu : `CLAUDE.md`, skill `raffinage-iteration`, `docs/REGLES-PLAY.md`, `specification.json` (n° 9), `.claude/raffinage/moteur-dossier-cadrage.plan.md`, `session.ts`, `sessionDestinations.ts`, `destinations.ts:385-410`, `types.ts` (`Lieu.acces`, l. 972-1017), `predicates.ts`, `deltas.ts`, `tables.ts`, `EcranPartie.tsx`.

```
RISQUE      — La première ligne de journal du projet naît ici. `journal[].texte` est le champ
              que `sessionDestinations.ts` annonce EN COMMENTAIRE comme basculant `'ia'` en
              n° 10 : ce qu'it2 y écrit est du contexte de modèle par anticipation. Deux canaux
              de blanchiment s'ouvrent au même endroit — la saisie clavier (refus « Commande
              inconnue : « {saisie} » ») et les proses d'auteur (`lieux[].nom` est `'auteur'`,
              garde stricte KR-232). La table d'audience est indexée par CHEMIN : elle ne voit
              pas la provenance des caractères, donc aucune garde ne rougit.

OBJECTION 1 — Le critère D-8 écrit « un journal de N actions … rejoué ». Pris au mot, le rejeu
              LIT `session.journal` — ce que KR-248 interdit, et que la borne de persistance de
              D-38 casserait au tour N. Écrire « séquence de commandes », pas « journal ».
OBJECTION 2 — it2 doit remplir `journal[].tour` : il tranche donc de fait ce que vaut UN pas
              d'horloge, que `REGLES-PLAY.md` § J1 réserve nommément à la n° 9 et dont la n° 14
              calibrera `plan_actions[].duree`. Tranché en silence dans le code, c'est une règle
              de jeu née hors de sa source (KR-130).

PROPOSITION — 1. `rejouer(dossier, graine, commandes: readonly Commande[]): EtatSession`, PURE ;
                 le journal est une SORTIE comparée champ à champ, jamais une entrée.
              2. Invariant greppable : `commandes.ts` ne lit ni `.nom` ni `.description` /
                 `.ambiance` / `.dangers`, et ne concatène aucune variable issue de la saisie ;
                 `ALLER <ordure>` laisse `journal` ET `horloge.tour` inchangés (2 tests).
              3. `journal[].origine?` — registre clos DÉRIVÉ du registre de commandes ; écrit par
                 `commandes.ts`, lu par `JournalRow` ; ligne d'audience `'moteur'`.
              4. `docs/REGLES-PLAY.md` § J1 reçoit sa réponse AVANT le code : 1 pas d'horloge =
                 1 commande acceptée.

REJETÉ      — rendre `lieux[].description` / `ambiance` / `dangers` à l'arrivée dans un lieu
              (famille de la décision n° 28) ; journaliser la saisie brute ou le message de
              refus ; rejouer en relisant `session.journal` ; basculer `journal[].texte` en
              `'ia'` EN BLOC en n° 10.

VERDICT     — recevable sous réserve (objections 1 et 2 levées par les propositions 1 et 4).
```

**Découpe** : NON, l'itération n'est pas à couper. Phrase de démo sans « et », une capacité. Réserve : le port de stockage traîne l'`open_question` (a) « document synchronisé ou état d'appareil », qui est une question de mémoire de session — elle doit être tranchée, pas héritée (annexe F).

---

# ANNEXE (hors quota)

## A. LE TEXTE D'UNE ENTRÉE DE JOURNAL DE DÉPLACEMENT — tranché

**Qui écrit ? Le CODE. Dans quel registre ? Développeur-débogueur. Et non, ce n'est PAS la troisième source de prose rejetée en n° 28** — à une condition mécanique, pas déclarative.

**Le test de discrimination que je livre au comité** (à recopier dans le plan) :

> *La ligne contient-elle un seul mot que l'AUTEUR a tapé dans son dossier, ou un seul caractère que le JOUEUR a tapé au clavier ?*
> Oui → c'est de la prose détournée, refus. Non → c'est un relevé d'état.

La décision n° 28 refusait une **fiction**, en **registre joueur**, destinée à **habiller** l'écran. Un relevé d'état n'a ni verbe de narration, ni adjectif, ni mot d'auteur : il est **non-prose par construction**, et la construction est greppable.

**Forme exacte.** `tour` et `role` sont rendus par `JournalRow` **depuis la donnée**, jamais inclus dans `texte` (sinon KR-013 : la même valeur à deux endroits). Deux entrées par commande acceptée, même `tour` :

| `role` | `texte` |
|---|---|
| `joueur` | `> ALLER lieu.caverne-basse` |
| `moteur` | `lieu_courant : lieu.val-cendre → lieu.caverne-basse` |

Auto-référence : `lieu_courant : lieu.val-cendre → lieu.val-cendre` — **aucune parenthèse explicative** ; le « sans effet » sera **structuré** en it3, pas rédigé en it2.

**Vocabulaire admis dans `texte`, liste fermée** : (i) les verbes du registre clos, en MAJUSCULES ; (ii) les noms de champs d'`EtatMonde` en bas-de-casse (`lieu_courant`, `lieux_visites`) ; (iii) des identifiants stables `espace.slug` **provenant du dossier** ; (iv) les séparateurs `>`, `:`, `→`. **Rien d'autre.** Avec IDENTIFIANTS, jamais avec les `nom` : `monde.lieux[].nom` est `'auteur'`, et KR-232 est à zéro dérogation — une ligne qui le porterait entrerait dans le contexte de la n° 10 par le chemin `journal[].texte` sans qu'aucune ligne d'audience ne bouge.

**Ce que la n° 10 devra en faire : RIEN — et ma forme survit au branchement, à une condition qu'il faut écrire maintenant.**

Le commentaire actuel de `sessionDestinations.ts` (« la n° 10 la bascule à `'ia'` DANS le lot qui livre son assembleur ») est **à amender par it2, en COMMENTAIRE et jamais en valeur** (KR-195/196), pour deux raisons mesurées :

1. Les lignes d'it2 sont composées de **HANDLES**. `destinations.ts:398-406` dit : « *un identifiant est un HANDLE : le code résout, le modèle reçoit le CONTENU du lieu, jamais la clé* ». Injecter `journal[].texte` injecterait des clés — contradiction frontale avec le fichier voisin.
2. **Une table indexée par CHEMIN ne peut pas discriminer par VALEUR de `role`.** Mélanger dans le même chemin les constats du moteur et la prose du modèle rend la garde d'audience inapplicable **pour toujours**. Le seul dessin où elle reste mécanique : la n° 10 donne à sa prose **son propre chemin** (p. ex. `journal[].prose?`, optionnel à vie KR-251, une ligne d'audience distincte), et `journal[].texte` reste `'moteur'` à vie.

Donc : ma forme survit, **et elle pré-empêche une erreur irréversible de la n° 10**. L'assertion INNOVATION d'it1 (`Object.values(table).every(d => d !== 'ia')`) reste verte et **it2 n'y touche pas**.

## B. Lignes d'audience à ajouter à `DESTINATION_DES_CHAMPS_DE_SESSION`

**Zéro ligne `'ia'`.** Une seule ligne neuve, et seulement si la proposition 3 est retenue :

```ts
// Le nom de la CAUSE, pris dans un registre clos — jamais de la prose (KR-247/248).
// `'moteur'` : c'est une clé de registre, pas de la fiction. La n° 10 n'en a pas
// besoin — elle raconte ce que le moteur lui DEMANDE de raconter, pas ce qu'il a fait.
'journal[].origine': 'moteur',
```
+ la même clé dans l'union `CheminDeFeuilleDeSession`. Aucun autre champ : `monde.lieu_courant` et `monde.lieux_visites[]` ont déjà leur ligne, et it2 n'ajoute aucune racine (les 8 restent 8).

## C. Règle d'admission (KR-249) appliquée à tout champ neuf d'it2

| Champ | ÉCRIT par | LU par | Verdict |
|---|---|---|---|
| `journal[].origine?` | `brain/dossier/commandes.ts` | `JournalRow.tsx` (badge mono) | **ADMIS** — optionnel à vie (KR-251) |
| `commandes[]` (les entrées joueur, pour le rejeu) | personne | personne | **REFUSÉ** — le rejeu est une propriété **de test intra-process**, pas une donnée de session |
| `lieu_precedent` | — | aucun prédicat | **REFUSÉ** — dérivable (KR-013), et rien ne le lit |
| `destinations` / `acces_courants` en session | — | — | **REFUSÉ** — dérivé du dossier à chaque rendu (KR-013) |

**Pré-emption pour it3** : si `origine` entre au niveau de l'ENTRÉE, il **sort** de la forme de KR-247 (`{ delta, cibles, origine, effet }` → `{ delta, cibles, effet }`). Une entrée a **une** cause ; la répéter sur ses N deltas est KR-013. À confirmer par it3 — le coût d'un désaccord est nul, `origine` étant optionnel à vie.

## D. Le modèle de déplacement

**L'autorité n'est pas à inventer, elle est écrite** (`destinations.ts:404-406`) : « *le moteur refuse toute destination absente de cette liste, MÊME SI LA PROSE L'A RACONTÉE. La règle vit ICI, en DONNÉE — jamais en consigne de prompt.* » **it2 est le premier exécutant de cette phrase.**

Résolution, dans cet ordre : `cible ∈ (lieu_courant.acces ?? [])` **ET** `cible ∈ ids(monde.lieux)`.

| Cas | Décision |
|---|---|
| **Impasse** (`acces` absent ou `[]`) | État **CALME** (`types.ts:1014`). Refus **console** ; zéro entrée de journal, zéro anomalie, `horloge.tour` inchangé. **Jamais une erreur** |
| **Référence pendante** | Inatteignable par l'interface (`validateDossier` la classe bloquante → `jouable` faux → garde 3). La branche existe quand même, **totale, sans `as`, sans lever** : refus console qui **nomme** la pendante (KR-021). Ne pas lever — KR-238 vise l'évaluateur d'`ExprNode` ; lever sur un chemin utilisateur = écran blanc. Branche non morte : `src/player/` extrait n'a pas `controlerDossier` |
| **Doublon** | Sans effet — la résolution est une **appartenance**, pas un parcours. **Aucun dédoublonnage en it2** : il appartient à l'injection, n° 10 (`types.ts:1011-1012`). Si la console liste les destinations, elle dédoublonne **à l'affichage**, et n'affiche que des IDENTIFIANTS |
| **Auto-référence** | **LÉGALE** (`types.ts:1005-1009`), donc la commande est **acceptée**. `lieu_courant` et `lieux_visites` inchangés, `horloge.tour` +1, deux entrées. C'est **l'état séparateur gratuit de KR-247** — demandé ≠ appliqué, mesurable champ à champ |

**`lieux_visites` : un déplacement accepté y ajoute la cible SI ABSENTE, dans le MÊME geste que `lieu_courant`.** Sans cela, it3 verrait un héros dans un lieu jamais visité (ce que D-13 a refusé à l'ouverture) et `lieu_visite` mentirait au premier jalon. Les deux champs **ne se dérivent pas l'un de l'autre** : l'ordre est perdu dans le second, la position dans le premier.

**Et un déplacement n'est PAS un delta** : `deplacer_vers` est **écarté nommément** de `DELTAS` (`deltas.ts:29-31`). Conséquence à écrire dans le plan : en it3, `journal[].deltas` sera **vide** sur une entrée de déplacement. Si `origine` n'entre pas (proposition 3), la **première ligne de journal de l'histoire du projet reste sans cause auditable, à vie**.

## E. Les REJETÉS (tous repris dans la note — BUG-082)

1. **Rendre `lieux[].description` / `ambiance` / `dangers` à l'arrivée.** Famille de la décision n° 28. Ces trois champs sont `'ia'` : **injectés, jamais récités** (`destinations.ts:387-397`). Les afficher verbatim créerait une troisième prose émise mot pour mot, et en it2 il n'existe **aucun modèle** pour les reformuler. C'est la tentation la plus probable de l'ouvrier (« l'écran est vide après un déplacement »). L'écran reste le journal.
2. **Journaliser la saisie brute** (echo de `{saisie}`) **ou le message de refus.** Canal d'entrée en texte libre vers un champ que la n° 10 vise. Le refus vit dans la console, transitoire ; le journal enregistre ce que **le DOSSIER a causé**.
3. **Rejouer en relisant `session.journal`.** Durcissement de l'arbitrage n° 20 du cadrage, qui ne visait que `journal[].deltas` — la même erreur passe par `role: 'joueur'`.
4. **Basculer `journal[].texte` en `'ia'` en bloc en n° 10** (voir § A, point 2). it2 amende le commentaire, jamais la valeur.
5. **Un champ `lieu_precedent` / `destinations` en session** (§ C).

## F. Mémoire de session, bornes, et l'`open_question` (a)

- **La session est un ÉTAT D'APPAREIL, pas un document synchronisé.** Les trois autres familles d'état par appareil passent déjà par le magasin **BRUT**. Une session poussée au nuage à chaque montage fait clignoter `sync:status` pour rien **et** rend `dossier_maj` incohérent entre deux appareils. Le port tranche cela **avant** d'envelopper `useSessionPersistee`.
- **Borne de persistance (D-38)** : se mesure sur la **ligne réelle** composée en § A, s'exprime en « nombre de tours avant N kio », et la revue écrit explicitement qu'elle **ne dit rien** de la borne d'injection : la n° 10 n'injectera pas `texte`, l'unité n'est pas la même.
- **Troncature** : si le journal est un jour tronqué, la promesse de rejeu survit **uniquement** parce que le rejeu ne lit pas le journal. Deuxième raison, indépendante de KR-248, de refuser le rejeu par relecture.
- `memoire` reste typée `null` en it2.
