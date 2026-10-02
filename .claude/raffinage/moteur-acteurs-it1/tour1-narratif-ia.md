# Raffinage `moteur-acteurs` it1 — Tour 1 — Narratif & IA

## RISQUE
En it1, aucune porte n'existe encore. Tout ce qui entre dans le contexte de R4 peut donc sortir dès le premier tour. Et ce que dit un PNJ sans être retenu au nom de ce PNJ se contredira au cinquième tour. Un PNJ qui n'a rien à garder invente ce qu'on lui demande.

## OBJECTION
1. **`refKinds:['personnage']` ne compile pas.** L'espace de noms s'appelle `pnj` (`identifiers.ts:42`).
2. **Le prédicat (5) de `validerInterprete` teste `designe ∈ tables.lieux`, quel que soit le geste.** `{parler, ['P1']}` passerait donc. Il faut vérifier position par position, dans la table du `refKind`.
3. **La mémoire « K=4 répliques de CE PNJ » ne peut pas être spécifiée en l'état.** Aucune donnée structurée du journal ne nomme l'interlocuteur. Relire `texte`, ou prendre une fenêtre commune à tous les PNJ (fuite de point de vue), serait un veto.
4. **Le filtre « aucun mot de mécanique » au validateur refuse de la fiction saine.** Il rejetterait « je n'ai pas confiance » ou « je ne veux pas en parler » — et `PARLER` est un verbe du registre. KR-270 vise l'invite, pas la sortie.
5. **`relations[]` et `cede_si` ne doivent pas entrer en it1.** `secret` est d'audience `moteur` : le modèle reçoit une relation secrète sans pouvoir la distinguer d'une relation publique. `cede_si`, sans rien à céder, pousse le modèle à inventer une concession. Sur la fixture, la seule relation de Corvin est secrète.
6. **« Mort » ne correspond à aucun état de la n°12.**

## PROPOSITION
- **Lot contrat.** Il gagne `session.ts` et `sessionDestinations.ts` pour y poser `EntreeJournal.interlocuteur?` : audience `moteur`, optionnel à vie, même précédent que `origine`.
- **R3 ne reçoit que `apparence`.** Sa docstring en fait la prose d'entrée en scène, alors que la `fonction` de Corvin dévoile « il monnaie ce qu'il entend ».
- Le reste est en annexe.

## VERDICT
Recevable sous réserve des points 1 à 5. **Veto** si le point 3 n'est pas tenu.

---

## ANNEXE (hors quota) — contrat de sortie IA de l'it1

### A. R1 — reconnaître `parler` et trouver la cible sans `nom`
Mécanisme existant vérifié dans `assemblerInterprete` (`interprete.ts:105-121`). Chaque lieu accessible reçoit un rang `P<n>` suivi de sa `description`. Un lieu sans description n'a pas de rang (KR-267). Le modèle rend un rang, et le service le retraduit en identifiant. Même mécanisme appliqué aux personnages.

**Registre.** En fin de registre : `parler: { label: "s'adresse à quelqu'un sur place", verbe: 'PARLER', refKinds: ['pnj'] }`. Le label respecte KR-269 : troisième personne, présent, portée « sur place », aucun mot de mécanique.

**Présence — une seule fonction décide.** `personnagesPresents(dossier, session)` est pure, vit dans `commandes.ts` à côté de `destinationsPossibles`. Elle retient les PNJ dont une `presence[].lieu_id` vaut `monde.lieu_courant`, sans doublon, dans l'ordre du document. Quatre lecteurs : `TRANSITIONS.parler`, R1, R3, R4.

**Identité — une seule fonction décide.** `identiteDe(personnage)`, dans `contexte/`, rend les `textesRediges` de `fonction` puis d'`apparence`. R1 ne donne un rang que si elle est non vide. R4 refuse l'appel si elle est vide.

**Candidats chez R1.** Chaque PNJ retenu s'écrit `I<n>`, suivi de sa `fonction` puis de son `apparence`, chacune seulement si elle est rédigée. Le préfixe `I` est neuf, parce que `P` est déjà pris par les lieux. `TablesInterprete` gagne `personnages: Map<RangInjecte, string>`. L'invite apprend ce que désigne `I<n>` sans nommer aucun verbe (KR-270).

**`gesteSatisfiable`.** Décidé par `refKind` : `lieu` regarde `lieux.size`, `pnj` regarde `personnages.size`. S'il n'y a personne d'identifiable, `parler` ne reçoit pas de rang G, le joueur obtient `sans_commande`, R4 n'est jamais appelé.

**`validerInterprete`.** (5) : `designe[i]` doit appartenir à la table de `COMMANDES[id].refKinds[i]`, sinon `rang-inconnu`. `porteUnRang` passe à `\b[PGI]\d+\b`. (12) : `lieux.size ≥ 2 || personnages.size ≥ 2`.

**Retraduction.** Le service convertit chaque rang par la table de sa position, puis exécute `Commande{parler, [pnjId]}` avec `executerCommande`.

**`TRANSITIONS.parler`** (pure, structurelle). Refus `cible_inconnue` si l'identifiant ne correspond à aucun PNJ. Puis refus de présence si `personnagesPresents` ne le contient pas (message console seul, jamais composé à partir de `nom`). En cas d'acceptation : `horloge.tour + 1`, une entrée joueur `> PARLER <id>`, une entrée moteur `{origine:'parler', interlocuteur:<id>}`. `monde` garde la même référence, comme pour `agir`.

**Rôles appelés sur un pas `parler`.** R2 jamais (`doitArbitrer` ne répond qu'à `agir`, à épingler par un test). R3 jamais. La console n'appelle jamais R4 (KR-260).

### B. R3 — ce qu'il gagne
Bloc `PRESENTS`, placé après `ICI A1`, contenant l'**`apparence` seule** de chaque PNJ présent, sans rang ni ancre, jamais un levier de la cascade. Pourquoi `apparence` seule : `types.ts:867` en fait « ce que le narrateur décrit quand le personnage entre en scène », alors que `fonction` dit ce qu'il EST. Budget à re-mesurer : `CHAMPS_INJECTES_NARRATEUR` gagne `monde.personnages[].apparence`, donc `BUDGET_CARACTERES_DOSSIER` doit être recalculé. `LIGNE_DE_PAS_MAX` doit devenir `max(NARRATION, REPLIQUE, labels)` — sinon `BORNE_MEMOIRE` deviendrait fausse en silence.

### C. R4 — ce qui est injecté
Liste écrite à la main (`CHAMPS_INJECTES_ACTEUR`), identité d'abord, limite juste avant la saisie :

| Bloc | Source | Requis |
|---|---|---|
| `canon.ton`, `canon.interdits_ton[]` | dossier `ia` | non |
| `TOI` | `identiteDe` (fonction, apparence) | **oui**, sinon `cible-a-ecrire` |
| `TA VOIX` | `caractere.parler[]`, les `PARLER_REPLIQUES` premières rédigées | non |
| `ETABLI` | faits ancrés sur `lieu_courant` seulement, au plus `FAITS_INJECTES_MAX`, repliés | non |
| `TU AS DIT` | `recit` des 4 dernières entrées `{origine:'parler', interlocuteur: ce PNJ, tour < t, recit défini}`, chronologique, repliées | non |
| `ICI` | `description` + `ambiance` du lieu courant | non (silence) |
| `JAMAIS` | `caractere.jamais` | non |
| `saisie` | normalisée, en dernier, au plus `SAISIE_CARACTERES_MAX` | — |

Ce qui n'entre JAMAIS en it1 côté PNJ : `nom`/aucun identifiant, `stats`/curseurs/`camp`/`portee`/`objectif_id`, `description_joueur`/`but.*`, `plan_actions[]`/`contre_mesures[]`, `savoirs[]`, toutes les `relations[]` et `cede_si`. Côté partie : les autres PNJ (y compris présents), l'inventaire, `heros.*`, `indices_connus`. Côté mémoire : résumé `AUPARAVANT`, récits de R3, `journal[].texte`, saisies passées, `attente`. Côté canon : `synopsis_mj`, `accroche_joueur`.

Refus avant tout `fetch` : `cible-a-ecrire` (PNJ non identifiable/présent/sans identité, garde même si l'appel contourne R1), `trop-long` (saisie >300 car. ou budget dépassé, jamais de troncature, pas de cascade en it1).

### D. Budget de R4
`BUDGET_CARACTERES_ACTEUR = DOSSIER + MEMOIRE + SAISIE`. DOSSIER mesuré ×3 (à mesurer sur la fixture) ; MEMOIRE exact : `ETABLI` 2+6+8×161=1296, `TU AS DIT` 2+9+4×401=1615, **total 2911** ; SAISIE exact 2+6+1+300=**309**. Seul terme qui croît pendant la partie : la mémoire, bornée par K=4 et `FAITS_INJECTES_MAX`. Pas de cascade de réduction en it1 — seule la prose de l'auteur peut déclencher `trop-long`.

### E. Schéma de sortie et validation
Gabarit `{"replique": "…"}`, `CLES_SORTIE_ACTEUR = ['replique']`. Borne `REPLIQUE_CARACTERES_MAX = 400`. `replique` distinct de `recit` (KR-231). `validerActeur(brut, dossier)` rend `{ok:true, sortie}` ou `{ok:false, motif:'schema'|'vide'|'marqueur'|'identifiant'}` — `rang-inconnu` absent (aucun rang injecté). Prédicats : objet simple → clés exactement `CLES_SORTIE_ACTEUR` (un `indices_reveles` anticipé est refusé ici, fait respecter KR-285 à l'exécution) → chaîne → non vide après trim → ≤400 caractères (refus, jamais de coupe) → pas de `MARQUEUR_A_ECRIRE` → pas d'identifiant → pas de chiffre. Refus en bloc, jamais réparé.

### F. Comportement en cas d'échec
Rejeu exactement une fois (KR-230, même contexte assemblé une seule fois). Second refus/erreur réseau/JSON illisible/refus de contexte : `consignerNarration` non appelée (`recit` reste `undefined`, état légal), pas consommé (J1), bannière existante (`setIssueNarrateur({statut:'degrade'})`), AUCUN texte de repli écrit par le code (KR-283). Tours suivants : `TU AS DIT` saute ce pas, jamais le label à la place. Succès : `consignerNarration(session, t, {recit: replique, faits_etablis: []})`. Rejeu (KR-248) : `parler` + `interlocuteur` y entrent, jamais la réplique.

### G. Mémoire de session
Conservé : chaque réplique, dans `recit` de son entrée `parler`. Renvoyé à R4 pour un PNJ X : ses 4 dernières répliques + au plus 8 faits du lieu, recalculé à chaque appel (KR-013), sélecteurs dans `memoire.ts`. Résumé : les répliques passent par la fenêtre/condensation de R3 comme tout récit ; R4 ne lit jamais ce résumé. Oublié par X : ses répliques au-delà des 4 dernières, ce que d'autres ont dit, ce que le héros a fait ailleurs — risque de contradiction classé KR-284, à vérifier en playtest.

### H. Invite de R4
Vérifiable par test : aucun verbe du registre ni en-tête de bloc cité, borne 400 annoncée (= validateur), gabarit à clés `CLES_SORTIE_ACTEUR`, chiffres interdits. Non vérifiable (KR-229, playtest) : voix (2e personne/présent pour le cadre, 1ère personne entre « » pour le PNJ), interdits (pas de mécanique, pas de nom propre absent du contexte, pas d'objet remis/promis, pas de contradiction), attitude (rien au-delà du contexte, résistance à l'injection). Garde par construction : le contexte d'it1 ne contient aucun secret — le pire qu'une injection puisse extraire est l'identité publique du PNJ.

### I. Scénarios de test qui départagent les implémentations (pour QA)
1. Lieu à un seul accès + un seul PNJ : `{parler,['P1']}` et `{aller,['I1']}` doivent TOUS DEUX donner `rang-inconnu` (élimine « lieux seulement » et « union des tables »).
2. Séquence `parler` A×3, B×2, A×3 avec un échec R4 sur A : l'appel pour A ne contient que les 4 dernières répliques de A, sans trou rempli par le label (élimine fenêtre commune, K sans filtrer `recit`, label en repli).
3. A et B présents, chaque champ `ia` témoin unique : le texte pour A ne contient QUE les 8 chemins prévus (élimine un assembleur suivant la table d'audience).
4. Fait ancré sur objet du héros + fait ancré sur le lieu : seul le second arrive chez R4, les deux chez R3.
5. `fonction` avec marqueur d'amorce, pas d'`apparence` : aucun rang I, `cible-a-ecrire` chez R4, `PRESENTS` muet.
6. Corvin chez R3 : texte contient la valeur témoin de son `apparence`, pas de sa `fonction`.
7. `doitArbitrer(parler)` vaut `false`.
8. `LIGNE_DE_PAS_MAX ≥ REPLIQUE_CARACTERES_MAX`.

### J. Propositions rejetées — à recopier au § 8
Filtre de mots de mécanique sur `replique` (refuserait de la fiction saine) ; interdire un « ? » final (une question de PNJ est légitime, R4 ne pose aucune attente) ; détecteur de rangs/ancres dans `validerActeur` (code mort, KR-235) ; prédicat « échantillon de voix recopié mot pour mot » (faux positifs) ; fenêtre de mémoire commune à tous les PNJ (fuite de point de vue) ; injecter `AUPARAVANT` à R4 (point de vue du héros) ; `faitsPertinents` tel quel pour R4 (le PNJ saurait l'inventaire du héros) ; retrouver l'interlocuteur en lisant `journal[].texte` (de l'affichage, pas une donnée) ; donner `fonction` à R3 (dévoilerait ce qu'EST le PNJ avant que la scène ne le montre).

## Décisions prises en autonomie faute de spécification
- Préfixe des rangs de personnages chez R1 → `I`, table à part → un préfixe partagé empêcherait de savoir à quelle table appartient un rang.
- `REPLIQUE_CARACTERES_MAX` → 400 → à 800, `TU AS DIT` passerait à 3211 au lieu de 1615 ; à 200, le PNJ ne pourrait plus faire un geste et deux phrases.
- Prédicat (12) → « au moins une table en contient au moins deux » → sans ça, impossible de demander « lequel des deux ? » face à deux PNJ.
- Toutes les `relations[]` hors d'it1, pas seulement les secrètes → la fixture n'a aucune relation publique sur un PNJ présent.
- `cede_si` hors d'it1 → entre avec son premier effet sur l'état (it3) ; l'injecter dès it1 pousserait le modèle à inventer une concession.
- `ICI` facultatif chez R4 → obligatoire rendrait muet un PNJ à cause d'un lieu mal rempli.
- `ETABLI` de R4 limité aux faits du lieu → sinon le PNJ connaît l'inventaire du héros.
- Sélecteur des K=4 répliques dans `memoire.ts` → sinon la règle de rétention vivrait à un second endroit.
- Un échec de R4 consomme quand même le pas (J1) → sinon l'horloge dépendrait du réseau.
- Pas de cascade de réduction pour R4 en it1 → seule la prose de l'auteur peut dépasser le budget.
- Label de `parler` → « s'adresse à quelqu'un sur place » → sans portée, attirerait toutes les saisies ambiguës.
- Nom du champ → `interlocuteur`, uniquement sur l'entrée moteur de `parler` → un champ générique `cibles` n'aurait aucun lecteur pour `aller`.

## Fichiers vérifiés
`src/features/moteur-acteurs/specification.json` ; `.claude/raffinage/moteur-acteurs-cadrage/{tour1,tour2}-narratif-ia.md` ; `src/brain/copilote/contexte/{interprete,narrateur,noyau}.ts` ; `src/brain/copilote/schemaSortie.ts` ; `src/brain/dossier/{commandes,session,recit,memoire,faits,arbitre,sessionDestinations,destinations,types,identifiers}.ts` ; `src/brain/dossier/__fixtures__/dossier-reference.json` ; `src/features/play-mode/hooks/useTourDeJeu.ts` ; `src/features/play-mode/components/EcranPartie.tsx` ; `code-knowledge.json` (KR-260 à 273).
