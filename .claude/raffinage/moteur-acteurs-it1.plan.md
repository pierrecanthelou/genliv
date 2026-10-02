# Plan d'itération — `moteur-acteurs` · itération 1

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-02
> Composition : `5 rôles` — motif : l'itération touche le moteur (nouveau rôle IA R4, nouveau verbe de commande, assembleurs de prompt), convocation de `narratif-ia` obligatoire.
> Exécution : `essaim` (2 lots, dont un lot contrat volumineux)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit son PNJ répondre dans sa propre voix quand le joueur lui parle au Foyer du Guet — sans qu'aucun savoir, confiance ou jet n'entrent en jeu. » |
| **Tranche** | `PlayerInputBar` (saisie « parler à Harek ») → R1 (interprète, résout un rang `I<n>` dans une table de candidats PNJ projetés par `fonction`/`apparence`) → `TRANSITIONS.parler` (garde structurelle, persistance du pas) → R4 (acteur, 10ᵉ branche `CopiloteService`, contexte scopé au seul PNJ interpellé) → `consignerNarration` (écrit la réplique dans `EntreeJournal.recit`) → canal RÉCIT existant (affichage). |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | Tout savoir, toute porte de révélation (même fermée), confiance, jet, carnet d'indices, bloc `PRESENTS` (narration enrichie pour `aller`/`agir`), mort de PNJ, budget client R1 avant envoi, relations (même du porteur), homonymes stricts entre PNJ. |
| **Reporté** | Bloc `PRESENTS` (5ᵉ ligne hors séquence 2/3/4, déclencheur : besoin mesuré) · budget client R1 `trop-long` (déclencheur : mesure du pire cas dépasse une fraction significative de `TAILLE_MAX_CORPS_IA`) · garde d'homonymie stricte côté `dossier-controles` (déclencheur : cas réel mesuré). |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit son PNJ répondre dans sa propre voix quand le joueur lui parle — sans qu'aucun savoir, confiance ou jet n'entrent en jeu. Le lot contrat (verbe `parler`, 10ᵉ branche `CopiloteService`, assembleur `acteur.ts`, résolution de cible par rang plutôt que par nom) est seul et en premier. Aucun changement de schéma dossier : `Personnage.nom` reste d'audience `auteur`, jamais injecté à aucun rôle IA — R1/R3/R4 désignent un PNJ par `fonction`/`apparence` (déjà `ia`), exactement comme R1 désigne déjà un lieu par sa `description`. `ReponseActeur = {replique: string}` strictement : aucun autre champ n'a de lecteur en it1.

## 2 — Hors périmètre

- Tout savoir (`Savoir`, les 4 portes de `Revelation`) — même fermées, le mécanisme n'existe pas encore (it2).
- Confiance (`EtatPnj.confiance`, `crediterConfiance`) — entre en it3 avec sa section `docs/REGLES-DU-JEU.md`.
- Jet de persuasion/intimidation (`issueDuJet` réutilisé) — it4.
- Carnet d'indices — it2.
- **Bloc `PRESENTS`** (apparence des PNJ présents injectée au contexte de R3, pour `aller`/`agir`) : romprait l'invariant écrit des « onze chemins `ia` fermés » de `narrateur.ts` (KR-261), re-mesurerait `BUDGET_CARACTERES_DOSSIER`, et démontrerait une seconde capacité indépendante du `goal` d'it1 (R3 n'est jamais appelé sur un pas `parler`). Reporté en ligne hors séquence.
- Mort de PNJ — aucun `EtatPnj.mort` n'existe avant la n°13 (combat) ; tester cet état serait tester du code mort.
- Budget client R1 avec refus `trop-long` avant envoi — seule une mesure du pire cas (pin dans `frontiere.test.ts`) est due en it1 ; un garde-fou actif est reporté.
- Garde d'homonymie stricte (deux PNJ aux `fonction`/`apparence` IDENTIQUES) — résolu par la branche `{precision}` existante (le modèle peut demander « lequel ? ») ; un détecteur de code serait hors scope et appartient à `dossier-controles`.
- Toute relation (`relations[]`, même du porteur) et `cede_si` — n'entrent dans le contexte R4 qu'à partir de l'itération où un consommateur réel existe.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Composants** : `OutcomeBlock` (existant, zéro variante), `Field`+bouton submit de `PlayerInputBar` (existants, inchangés), bannière interface existante (`role="status"`, préfixe `⊘ `).

**Textes exacts**
- `entete` de la réplique PNJ : `Personnage.nom` tel qu'écrit par l'auteur, rendu en mono MAJUSCULES par le style `libelleEntete` d'`OutcomeBlock.tsx` — **vérifier que `text-transform: uppercase` est bien porté par un token existant** ; sinon l'ajouter via un token déjà nommé dans `tokens/*.css`, jamais une valeur en dur. `entete="RÉCIT"` reste réservé à R3.
- `TEXTE_CIBLE_INDISPONIBLE = (cible) => `${cible} n'est pas ici.`` — texte unique, couvre absence du lieu ET absence de prose d'identité, aligné sur le refus `cible_indisponible` (même mot des deux côtés, pour que le lint § suivant reste cohérent).
- `replique` du PNJ : fiction, 2e personne, présent, immersive, zéro chiffre `[0-9]`, zéro mot de mécanique.
- Message système : registre interface, neutre, jamais une réplique IA.

**États** : défaut (champ vide, placeholder inchangé) · verrouillé (`isLocked`, bouton `…`, champ `disabled`) · réponse PNJ reçue (`OutcomeBlock entete={nomPnj}` contenant `replique`, même emplacement que le bloc RÉCIT, mutuellement exclusif car `parler` n'appelle jamais R3) · PNJ indisponible (bannière `⊘ {cible} n'est pas ici.`) · sortie R4 invalide après rejeu (AUCUN `OutcomeBlock`, AUCUNE bannière fictionnelle — seule la bannière `TEXTE_INDISPONIBLE` existante, déjà testée, peut s'afficher).

**Clavier** : Entrée soumet (form existant), focus reste sur le champ, pas de modale en it1 donc pas d'Échap à spécifier.

**Discipline de l'accent** : aucun usage nouveau — ni le nom en entete, ni les bannières, ne prennent `--accent`.

**Zéro valeur en dur** : tous les styles proviennent de tokens déjà nommés (`--font-mono`, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--fs-meta`, `--text-muted`).

**ESLint proposée** : interdire l'import de `src/player/components/{HeroStatusBar,CharacterCreationScreen}` depuis `src/features/moteur-acteurs/**` (précédent n°11) ; interdire toute chaîne littérale « n'est pas ici » codée ailleurs que dans `TEXTE_CIBLE_INDISPONIBLE` (précédent `GABARIT_NON_RECONNU`) ; interdire tout accès à `Indice.formulation_joueur`/`Indice.verite` depuis `src/features/moteur-acteurs/components/**` (anticipation it2, à valider par le tech-lead en raffinage it2).

*(Écrit par l'UX.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/dossier/commandes.ts` | registre | émet | `COMMANDES.parler: {label:"s'adresse à quelqu'un sur place", verbe:'PARLER', refKinds:['pnj']}` ; `TRANSITIONS.parler` (refuse `cible_inconnue` si l'id ne résout pas, puis `cible_indisponible` si absent du lieu ou sans identité ; sinon consomme un pas, écrit l'entrée journal via `consignerNarration` réutilisée) ; `export function personnagesPresents(dossier, session): readonly string[]` |
| `RefusCommande` | type | émet | gagne le membre `'cible_indisponible'` (neuf) ; `'cible_inconnue'` (existant) réutilisé |
| `brain/dossier/session.ts` + `sessionDestinations.ts` | type+registre | émet | `EntreeJournal.interlocuteur?: string`, audience `'moteur'`, optionnel à vie (précédent `origine`) |
| `brain/copilote/types.ts` | type | émet | `CibleActeur{role:'acteur', personnageId:string, saisie:string, session:EtatSession}` ; `ReponseActeur = {replique:string}` ; `TablesInterprete.personnages: ReadonlyMap<RangInjecte,string>` (additif, rangs `I<n>`, compteur propre séparé des lieux) |
| `brain/CopiloteService.ts` | service | émet | 10ᵉ surcharge `demander(dossier, cible: CibleActeur, signal?): Promise<ReponseActeur \| EchecCopilote>` |
| `brain/copilote/schemaSortie.ts` | registre | émet | `validerActeur(brut, dossier)` (8 prédicats, § 4 bis) ; `REPLIQUE_CARACTERES_MAX = 400` (exporté) ; `validerInterprete` (5)+(12) et `porteUnRang` étendus (`\b[PGI]\d+\b`, résolution position par position sur `COMMANDES[id].refKinds[i]`, prédicat 12 : `lieux.size>=2 \|\| personnages.size>=2`) |
| `brain/copilote/contexte/acteur.ts` (nouveau) | registre | émet | `assemblerActeur(dossier, session, personnageId, saisie): ContexteActeur \| RefusContexte` — voir § 4 bis |
| `brain/copilote/contexte/interprete.ts` | registre | émet | table de candidats PNJ en rang `I<n>` (compteur propre), projetés par `fonction` puis `apparence` |
| `brain/copilote/contexte/narrateur.ts` | registre | émet | édition MINIMALE : `LIGNE_DE_PAS_MAX = Math.max(NARRATION_CARACTERES_MAX, REPLIQUE_CARACTERES_MAX, ...labels)` + docstring corrigée — AUCUN bloc `PRESENTS`, `CHAMPS_INJECTES_NARRATEUR` et `BUDGET_CARACTERES_DOSSIER` inchangés |
| `brain/dossier/interprete.ts` | registre | émet | `resoudreInterpretation` résout chaque rang par la table choisie sur `refKinds[i]` |
| `worker/index.ts` | registre | émet | `INVITES['acteur']`, `GABARIT_SORTIE['acteur']` (checklist KR-233) ; mesure de `BUDGET_CARACTERES_ACTEUR` (DOSSIER×3 + MÉMOIRE exacte 2911 + SAISIE exacte 309) ; mesure du pire cas de `TAILLE_MAX_CORPS_IA` pour R1 incluant les candidats PNJ, pinnée dans `frontiere.test.ts` |
| `brain/challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts` | — | consomme | AUCUN touché — pas de `test:mutation` dû |

## 4 bis — Contrat de sortie IA

### R1 (interprète) — résolution de `parler`
- Nouveau verbe `parler` en fin du registre `COMMANDES`, `refKinds:['pnj']`.
- Candidats PNJ présents (`personnagesPresents`), filtrés sur identité non vide (`fonction` ou `apparence`), numérotés `I1, I2, …` (table et compteur séparés des lieux `P1, P2, …`).
- Invite : une ligne de légende (« I1, I2, … : quelqu'un sur place »), sans nommer aucun verbe (KR-270) ; lignes existantes passent de « lieux » à « lieux ou personnes ».
- `validerInterprete` (5) : `designe[i]` doit appartenir à la table de `COMMANDES[id].refKinds[i]`, sinon `rang-inconnu`. `porteUnRang` : `\b[PGI]\d+\b`. (12) : `lieux.size>=2 || personnages.size>=2` (admet la clarification `{precision}` dès qu'une des deux familles a plusieurs candidats).
- Aucun PNJ identifiable (zéro candidat) → `parler` ne reçoit pas de rang G → `sans_commande`, R4 jamais appelé.
- R2 jamais appelé sur `parler` (`doitArbitrer` répond seulement à `agir`). R3 jamais appelé sur `parler`.

### R4 (acteur) — contrat d'entrée
| Bloc | Source | Requis |
|---|---|---|
| `canon.ton`, `canon.interdits_ton[]` | dossier `ia` | non |
| `TOI` | `identiteDe(personnage)` = `fonction` puis `apparence` | **oui**, sinon refus `cible-a-ecrire` |
| `TA VOIX` | `caractere.parler[]`, au plus `PARLER_REPLIQUES` rédigées | non |
| `ETABLI` | faits ancrés sur le lieu courant SEULEMENT, au plus `FAITS_INJECTES_MAX` | non |
| `TU AS DIT` | `recit` des 4 dernières entrées `{origine:'parler', interlocuteur: ce PNJ, tour<t, recit défini}`, chronologique | non |
| `ICI` | `description` + `ambiance` du lieu courant | non (silence si absent) |
| `JAMAIS` | `caractere.jamais` | non |
| `saisie` | normalisée, en dernier, ≤300 caractères | — |

**N'entre JAMAIS en it1** : `nom`/tout identifiant, `stats`/curseurs/`camp`/`portee`/`objectif_id`, `description_joueur`/`but.*`, `plan_actions[]`/`contre_mesures[]`, `savoirs[]`, **toutes** les `relations[]` (y compris du porteur) et `cede_si`, les autres PNJ, l'inventaire, `heros.*`, `indices_connus`, le résumé `AUPARAVANT`, les récits de R3, `journal[].texte`, les saisies passées, `synopsis_mj`.

**Refus avant tout `fetch`** : `cible-a-ecrire` (identité vide) ; `trop-long` (saisie >300 car. ou budget dépassé — jamais de troncature, pas de cascade en it1).

### Schéma de sortie — `ReponseActeur`
```
{"replique": "…"}
```
`CLES_SORTIE_ACTEUR = ['replique']`. `REPLIQUE_CARACTERES_MAX = 400`.

`validerActeur(brut, dossier)` → `{ok:true, sortie}` | `{ok:false, motif:'schema'|'vide'|'marqueur'|'identifiant'}`, prédicats dans l'ordre : objet simple → clés exactement `CLES_SORTIE_ACTEUR` → valeur chaîne → non vide après trim → ≤400 caractères (refus, jamais de coupe) → pas de `MARQUEUR_A_ECRIRE` → pas d'identifiant (`porteUnIdentifiant`) → pas de chiffre.

### Échec de validation
Rejeu EXACTEMENT UNE FOIS (KR-230, même contexte assemblé une seule fois). Second échec / erreur réseau / JSON illisible / refus de contexte : `consignerNarration` NON appelée (`recit` reste `undefined`, état légal), pas consommé, bannière existante (`EchecCopilote`). **AUCUN texte de repli écrit par le code** (KR-283).

### Rejeu (KR-248)
`parler` + `interlocuteur` entrent au rejeu. La réplique n'y entre jamais.

### Ce que l'IA ne fait PAS
Dés, stats, inventaire, XP — jamais touchés. R4 ne choisit ni carac ni TC (aucun jet en it1). R4 ne connaît jamais la fiche du héros.

*(Écrit conjointement par le Tech Lead et Narratif & IA.)*

## 5 — Lots

### Lot 1 — `contrat-acteur-squelette` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser le 10ᵉ rôle IA « acteur » de bout en bout — registre de commande, assembleurs de contexte R1/R4, validateur, route worker — strictement scopé à une réplique sans savoir.
- **Fichiers** :
  - `src/features/moteur-acteurs/specification.json` (R) — corrige `refKinds:['personnage']`→`['pnj']` dans `design_contract`
  - `src/brain/dossier/commandes.ts` (R) + `commandes.test.ts` (R)
  - `src/brain/dossier/session.ts` (R) + `sessionDestinations.ts` (R) + tests associés (R)
  - `src/brain/copilote/types.ts` (R)
  - `src/brain/CopiloteService.ts` (R)
  - `src/brain/copilote/schemaSortie.ts` (R) + `schemaSortie.test.ts` (R)
  - `src/brain/copilote/contexte/acteur.ts` (N) + `acteur.test.ts` (N)
  - `src/brain/copilote/contexte/interprete.ts` (R) + `interprete.test.ts` (R)
  - `src/brain/copilote/contexte/narrateur.ts` (R, édition minimale) + `narrateur.test.ts` (R, pin budget inchangé)
  - `src/brain/copilote/contexte/index.ts` (R, barrel)
  - `src/brain/dossier/interprete.ts` (R) + `interprete.test.ts` (R)
  - `worker/index.ts` (R) + `worker/index.test.ts` (R) + `worker/frontiere.test.ts` (R)
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — donne à Harek une `presence` au `lieu.foyer-du-guet` et une `apparence` rédigée (ce lieu porte déjà une description « une forge », donc atteignable en saisie libre — prérequis de la démo)
- **Expose / consomme** : signatures figées au § 4
- **Critères couverts** : #1 à #8

### Lot 2 — `cablage-tour-de-jeu` `feature`
- **Ouvrier** : `dev-lot`
- **But** : câbler le rôle acteur dans la boucle de jeu — sur une commande `parler` acceptée, appeler R4 après persistance du pas, consigner la réplique, gérer le verrou de tour et l'échec.
- **Fichiers** :
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R)
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R)
- **Expose / consomme** : consomme `CibleActeur`/`ReponseActeur`/surcharge `demander` du lot 1 (gelés)
- **Critères couverts** : #1, #5, #6

*(1 à 4 lots. Au-delà, l'itération est trop grosse.)*

## 6 — Critères d'acceptation

1. **Étant donné** un PNJ présent au lieu courant avec une prose d'identité (`fonction` ou `apparence`), **quand** le joueur tape « parler à {lui} », **alors** R4 est appelé avec un contexte strictement scopé à ce PNJ (jamais `heros.*`, jamais un identifiant brut, aucun savoir) et rend `{replique}` seul, affichée par le canal RÉCIT existant (`entete` = nom du PNJ). — *niveau : contrat + composant* — *lot 1 + 2*
2. **Étant donné** un PNJ absent du lieu courant OU sans aucune prose d'identité, **quand** « parler {cible} » est tapé, **alors** `TRANSITIONS.parler` refuse (`cible_inconnue` ou `cible_indisponible`) AVANT tout appel à `CopiloteService` ; la bannière affiche « {cible} n'est pas ici. ». — *niveau : contrat + composant* — *lot 1*
3. **Étant donné** plusieurs PNJ présents aux `fonction`/`apparence` DISTINCTES, **quand** R1 assemble son contexte, **alors** chaque PNJ identifiable reçoit un rang `I<n>` unique (table séparée des lieux), jamais résolu par `nom` (jamais injecté) ; un rang `I<n>` tenté sur la table des lieux (ou l'inverse) échoue en `rang-inconnu`. — *niveau : contrat* — *lot 1*
4. **Étant donné** le contexte assemblé pour R4 en it1, **quand** il est inspecté, **alors** il ne contient AUCUNE clé `relations` ni `cede_si`, quel que soit le PNJ (même porteur) — ces champs n'ont pas de mécanisme consommateur avant une itération ultérieure. — *niveau : contrat* — *lot 1*
5. **Étant donné** une sortie R4 non conforme au schéma, **quand** elle est reçue, **alors** elle est REJOUÉE EXACTEMENT UNE FOIS puis, en cas de nouvel échec, AUCUNE réplique n'est posée (`recit` reste `undefined`), aucun texte de repli n'est écrit par le code, et la bannière d'interface existante s'affiche. — *niveau : contrat + bout-en-bout* — *lot 1 + 2*
6. **Étant donné** un appel R4 en cours, **quand** le joueur soumet une seconde commande avant la résolution, **alors** elle est refusée (verrou de tour, KR-265) jusqu'à résolution (succès ou dégradation). — *niveau : composant* — *lot 2*
7. **Étant donné** une séquence de pas `parler` alternant deux PNJ A et B, **quand** R4 est appelé pour A, **alors** son contexte `TU AS DIT` ne contient QUE les répliques passées de A (au plus 4, via `EntreeJournal.interlocuteur`), jamais celles de B. — *niveau : contrat* — *lot 1*
8. **Étant donné** le périmètre balayé par `moteurSansIA.test.ts` (KR-260), **quand** cette itération est livrée, **alors** aucun nouveau fichier n'entre dans l'exclusion nommée hors de ceux qui appellent réellement `CopiloteService` pour le rôle `acteur`. — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `contexte/acteur.test.ts` — isolation du contexte | contexte R4 ne contient aucune clé `heros`, `relations`, `cede_si`, `savoirs`, aucun identifiant brut | contrat | KR-262, KR-282 | 1 |
| `schemaSortie.test.ts` — `validerActeur` | les 8 prédicats, un par un, contre-épreuve sur chaque violation | contrat | KR-230, KR-285 | 1 |
| `commandes.test.ts` — `TRANSITIONS.parler` garde | refus `cible_inconnue`/`cible_indisponible` avant toute construction de `CibleActeur` | contrat | KR-262 étendu | 1 |
| `schemaSortie.test.ts` — `validerInterprete` par position | `{parler,['P1']}` et `{aller,['I1']}` → tous deux `rang-inconnu` | contrat | — | 1 |
| `contexte/interprete.test.ts` — candidats PNJ distincts | deux PNJ aux identités distinctes reçoivent des rangs `I` différents ; un PNJ sans identité ne reçoit aucun rang | contrat | KR-262, KR-284 | 1 |
| `contexte/acteur.test.ts` — mémoire isolée | séquence A×3/B×2/A×3 avec échec R4 sur A : le 7e appel (A) ne voit que les répliques de A | contrat | KR-282, KR-284 | 1 |
| `contexte/narrateur.test.ts` — budget inchangé | `BUDGET_CARACTERES_NARRATEUR` reste à la valeur pinée avant it1 ; `LIGNE_DE_PAS_MAX >= REPLIQUE_CARACTERES_MAX` | contrat | — | 1 |
| `worker/frontiere.test.ts` — invite R4 | aucun verbe du registre ni en-tête de bloc cité, borne 400 annoncée, gabarit à clé `replique`, chiffres interdits | contrat | KR-270 | 1 |
| `worker/index.test.ts` — rejeu/dégradation | 2e appel refusé → max 2 appels réseau, aucune réplique posée | contrat | KR-230, KR-283 | 1 |
| `useTourDeJeu.test.ts` — verrou de tour | 2e commande pendant l'attente R4 refusée, levée après résolution | composant | KR-265 | 2 |
| `useTourDeJeu.test.ts` — échec silencieux | `EchecCopilote` → bannière existante, zéro texte de repli | composant | KR-283 | 2 |
| `lintIsolation.test.ts` — périmètre `moteurSansIA` | seul le fichier appelant `CopiloteService('acteur', …)` entre dans l'exclusion nommée | contrat | KR-260 | 1 |

Cas limites couverts : PNJ sans prose d'identité (vide) · PNJ absent · deux PNJ aux identités identiques (NON gardé en it1, résidu playtest, consigné § 8) · sortie R4 vide/trop longue/avec chiffre/avec identifiant · double soumission pendant l'attente R4 · aucune révélation possible (vérifié par l'absence structurelle de tout champ `indices_reveles` dans le schéma d'it1).

**Non vérifiable en l'état** — à recopier dans la revue : cohérence de voix du PNJ sur une session longue (KR-229, playtest) ; contradiction de nom au-delà de la fenêtre mémoire K=4 (résidu KR-284, playtest) ; le modèle demande effectivement « lequel ? » face à deux PNJ aux identités proches mais non identiques (résidu playtest).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Tech Lead → Narratif-IA | `refKinds:['personnage']` vs `['pnj']` | `RETENU` | `['pnj']` — vérifié dans `identifiers.ts:42`, Tech Lead concède. |
| 2 | PM / Tech Lead ↔ Narratif-IA | Bloc `PRESENTS` dans `narrateur.ts` | `REPORTÉ` | Hors périmètre d'it1 (R3 jamais appelé sur `parler`, romprait l'invariant des « onze chemins » KR-261, 2ᵉ capacité non demandée par le goal). Devient une ligne candidate hors séquence 2/3/4, déclencheur : besoin mesuré. |
| 3 | Narratif-IA | Correction défensive `LIGNE_DE_PAS_MAX` (inclure `REPLIQUE_CARACTERES_MAX`) | `RETENU` | Entre au lot 1, zéro effet numérique (400<800), corrige un théorème devenu faux ; option (a) retenue sur (b). |
| 4 | Tech Lead ↔ Narratif-IA | Rang partagé `P` vs préfixe séparé `I` | `RETENU` | Préfixe `I` séparé (Narratif-IA) — Tech Lead concède avec argument technique (moins de code, meilleure lisibilité, extensibilité au 3e `refKind` futur). |
| 5 | QA | Garde moteur sur « deux PNJ du même nom » | `REJETÉ` | Comparer des `nom` serait une décision sur nom libre (veto). Remplacé par un critère sur la distinction par rang (§6 #3) ; l'homonymie stricte (identités identiques) est un défaut d'auteur, reporté. |
| 6 | QA | Critère « mort » de PNJ (§ critère 2 initial) | `REJETÉ` | Aucun `EtatPnj.mort` n'existe avant n°13 ; testerait un état inatteignable. |
| 7 | QA ↔ Narratif-IA | Audience `relations[]`/`cede_si` — critère différentiel porteur/tiers vs exclusion totale | `RETENU` | Exclusion TOTALE en it1 (Narratif-IA) — aucun mécanisme consommateur n'existe encore ; le critère différentiel n'a de sens qu'à partir de l'itération qui lit réellement les relations. |
| 8 | Narratif-IA | `EntreeJournal.interlocuteur?` manquant du lot initial du Tech Lead | `RETENU` | Ajouté au lot 1 (`session.ts`/`sessionDestinations.ts`) — condition bloquante vérifiée : sans lui, « K=4 répliques de CE PNJ » n'est pas implémentable. |
| 9 | Tech Lead | `cible_indisponible` (un seul refus) vs `cible_inconnue`+`cible_indisponible` (deux refus distincts) | `RETENU` | Les deux : `cible_inconnue` réutilisé (précédent `aller`, zéro nouveau membre) pour un id qui ne résout pas, `cible_indisponible` (un seul membre neuf) pour absent/sans-identité — même texte d'interface pour les deux derniers cas. |
| 10 | QA (critère 9, formulé en parallèle du veto PM) | Bloc `PRESENTS` comme critère d'acceptation d'it1 | `REJETÉ` | Conséquence directe du désaccord #2 — retiré de la liste des critères (§6 ne compte que 8, sans ce point). |
| 11 | Narratif-IA | Budget client R1 (`trop-long` avant envoi) vs mesure seule | `REPORTÉ` | Minimum requis en it1 : mesure du pire cas pinnée dans `frontiere.test.ts` + docstring du worker (entre au lot 1). Le garde-fou actif est reporté, déclencheur nommé : la mesure dépasse une fraction significative de `TAILLE_MAX_CORPS_IA`, ou un dossier réel heurte le plafond. |
| 12 | Narratif-IA | La fixture ne permet pas la démo telle qu'annoncée (Corvin/marché sans description) | `RETENU` | Fixture corrigée au lot 1 : Harek gagne une `presence` au Foyer du Guet (déjà décrit) + une `apparence` — démo réalisable sans deviner. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(aucune proposition `INNOVATION` dans ce raffinage — supprimé)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — non dû (aucun des 4 fichiers de règles touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-acteurs-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `PRESENTS` retiré d'it1, prérequis de fixture nommé |
| Tech Lead | recevable sous réserve stricte | oui — lot 1 révisé (table § 4/5), `refKinds` corrigé, préfixe `I` adopté |
| UX | recevable | oui — texte système unique restauré, usage de `nom` à l'écran confirmé sans conflit |
| QA | recevable sous réserve | oui — fail-closed confirmé, critère pluriel révisé, critère « mort » retiré |
| Narratif & IA | recevable sous réserve | oui — `PRESENTS` reporté par elle-même, `interlocuteur` entré au lot, budget R1 mesuré |
