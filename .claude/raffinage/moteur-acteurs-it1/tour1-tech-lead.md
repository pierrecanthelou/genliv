# Raffinage `moteur-acteurs` it1 — Tour 1 — Tech Lead

## RISQUE
Le cadrage compte 4 fichiers de contrat, mais `validerInterprete` (`src/brain/copilote/schemaSortie.ts:965`) vérifie aujourd'hui `designe.every(r => tables.lieux.has(r))` — codé en dur sur le SEUL `refKind` existant (`'lieu'`). Sans toucher ce prédicat et `resoudreInterpretation` (`src/brain/dossier/interprete.ts`), `parler <PNJ>` ne sera JAMAIS résolu par R1 : toute tentative tombe en `rang-inconnu`, silencieusement, et la démo ne marche pas — alors qu'aucun de ces deux fichiers n'apparaît dans la liste du cadrage.

## OBJECTION
Les « fichiers probables » rangent `acteur.ts` + extensions R1/R3 + garde `parler` comme un regroupement à part, quasi « feature ». Ce sont TOUS des fichiers `brain/` — aucun n'est sous `src/features/`. Le précédent exact (`moteur-arbitre` it2, `tour1-tech-lead.md`) met TOUT `brain/`+`worker/` — y compris un assembleur neuf (`contexte/arbitre.ts`) et une extension de `narrateur.ts` — dans UN SEUL lot contrat, quel qu'en soit le nombre de fichiers. Scinder ici romprait ce précédent sans motif et ouvrirait le risque d'un 3ᵉ lot improvisé en cours d'essaim. À l'inverse, `narrateur.ts` n'a besoin d'AUCUNE édition : `LIGNE_DE_PAS_MAX` dérive déjà de `COMMANDES` quel que soit le verbe ajouté — seule la mesure documentée de `TAILLE_MAX_CORPS_IA`/`worker/index.ts` doit être rejouée, dans le lot contrat.

## PROPOSITION
2 lots, séquentiels (détail en annexe). Lot 1 (contrat) : les 4 fichiers cadrés + `schemaSortie.ts` (`validerActeur` neuf, `validerInterprete`/`porteUnRang` étendus) + `contexte/acteur.ts` (N) + `contexte/interprete.ts` (candidats PNJ, compteur de rang `P` PARTAGÉ avec les lieux pour éviter deux « P1 » à référents différents dans le même prompt) + `dossier/interprete.ts` (résolution par `refKind`, pas par table unique) + tests associés. La réplique est écrite par `consignerNarration` (déjà existant, `dossier/recit.ts`), zéro nouveau puits d'écriture. Lot 2 (feature) : `src/features/play-mode/hooks/useTourDeJeu.ts` seul (+ test), démarre une fois le contrat figé.

## VERDICT
Recevable sous réserve stricte : le lot contrat est élargi comme ci-dessus (pas de second lot `brain/`), et le « mort » du critère d'acceptation 2 est descopé d'it1 — aucun mécanisme de mort de PNJ n'existe avant la n°13 (combat), le tester serait tester un état inatteignable.

---

# ANNEXE (hors quota)

## A. Pourquoi le découpage en 4 fichiers ne suffit pas — détail

Trois surfaces que le cadrage ne nomme pas, vérifiées sur le code réel :

1. **`validerInterprete` (`schemaSortie.ts:836-965`)** — le prédicat (5) de la branche `{geste, designe}` vaut aujourd'hui `designe.every((rang) => tables.lieux.has(rang))`, sans regard au `refKind` réel de la position. Avec `parler` (refKind `'personnage'`), ce prédicat doit devenir : pour chaque position `i`, choisir `tables.lieux` ou `tables.personnages` selon `COMMANDES[commandeId].refKinds[i]`. Le scanner `porteUnRang` (même fichier) doit inclure `tables.personnages` dans son `OR` d'appartenance.
2. **`resoudreInterpretation` (`brain/dossier/interprete.ts:54-83`)** — la boucle `for (const rang of rendu.designe) { tables.lieux.get(rang) }` est, elle aussi, codée en dur sur `tables.lieux`. Même correction : résoudre contre la table choisie par `refKinds[i]`.
3. **Collision de rang `P`** — `contexte/interprete.ts` numérote les lieux `P1, P2, …` par un compteur local (`lieux.size + 1`). Si les candidats-personnages reprennent leur propre compteur (`personnages.size + 1`), le MÊME prompt peut porter deux fois « P1 » pour deux entités différentes (un lieu et un PNJ), ambiguïté que rien ne discrimine textuellement. **Proposition : un compteur PARTAGÉ** entre les deux listes dans `assemblerInterprete` — les lieux prennent les premiers rangs, les personnages la suite, jamais de doublon de valeur. `TablesInterprete.lieux` et `.personnages` restent deux `Map` distinctes (disjointes en valeurs), ce qui garde `validerInterprete`/`resoudreInterpretation` simples (pas de table fusionnée).

Ces trois points touchent des fichiers qui ont UN SEUL écrivain possible (eux-mêmes, dans le même geste que le reste du contrat) et AUCUN second consommateur hors de ce rôle — ils appartiennent au lot contrat par la même logique que `contexte/arbitre.ts` y est entré en `moteur-arbitre` it2.

## B. Le domicile de la réplique (open_question de la spec, tranchée ici)

`consignerNarration` (`brain/dossier/recit.ts:77-115`) est déjà générique : elle écrit `apport.recit` sur l'entrée qui porte `origine` au tour courant, garantit « au plus une narration par pas, la première gagne », et accepte `faits_etablis` vide. **Elle est réutilisée TELLE QUELLE** pour `parler` : `consignerNarration(session, tour, { recit: reponse.proposition.replique, faits_etablis: [] })`. Zéro nouveau champ, zéro nouvelle fonction d'écriture — l'invariant « au plus un récit par pas » (`EntreeJournal.recit`, `session.ts:110-129`) tient sans modification, parce que `TRANSITIONS.parler` écrit l'entrée `origine:'parler'` exactement comme `agir` le fait, sans jamais y poser `recit` elle-même.

## C. Découpage en lots

| Lot | Type | Fichiers (N=créé, R=remplacé) | Dépend de |
|---|---|---|---|
| **1 — contrat** | `contrat`, seul, premier | R `src/brain/dossier/commandes.ts` (+ test) — `COMMANDES.parler{label:'parle au personnage', verbe:'PARLER', refKinds:['personnage']}`, `TRANSITIONS.parler` (garde structurelle), `RefusCommande` + membre `'cible_indisponible'`, export `personnagesPresents(dossier,session)` (précédent `destinationsPossibles`) ; R `src/brain/copilote/types.ts` — `CibleActeur`, `ReponseActeur={replique:string}`, `TablesInterprete.personnages: ReadonlyMap<RangInjecte,string>` (additif) ; R `src/brain/CopiloteService.ts` — 10ᵉ surcharge + branche `demanderActeur`, garde `never` étendue ; R `src/brain/copilote/schemaSortie.ts` — `validerActeur` (neuf, calibré sur `validerSortie`/`validerIntention` : scalaire, non-vide, sans marqueur, sans identifiant du dossier), `validerInterprete`/`porteUnRang` étendus (résolution par `refKinds[i]`) ; N `src/brain/copilote/contexte/acteur.ts` — `assemblerActeur` (canon.ton optionnel, description du lieu, `fonction`/`apparence` du PNJ jamais `nom`, `caractere.parler`/`jamais`/`cede_si`, `relations[]` DU PORTEUR y compris `secret`, faits ancrés sur ce PNJ/lieu, mémoire K=4 dernières répliques DE CE PNJ, saisie en dernier — refus `cible-a-ecrire`/`trop-long` seuls atteignables, zéro savoir en it1) ; R `src/brain/copilote/contexte/interprete.ts` — liste des PNJ présents (`personnagesPresents` + filtre identité non vide), compteur de rang `P` PARTAGÉ avec les lieux ; R `src/brain/dossier/interprete.ts` — `resoudreInterpretation` résout par table choisie sur `refKinds[i]` ; R `src/brain/copilote/contexte/index.ts` (barrel, export `assemblerActeur`) ; R `src/brain/index.ts` (barrel, si consommé par lot 2) ; R `worker/index.ts` — `INVITES['acteur']` + `GABARIT_SORTIE['acteur']`, re-mesure de `TAILLE_MAX_CORPS_IA` (`LIGNE_DE_PAS_MAX` bouge avec le label `parler`, docstring à jour) ; R `worker/index.test.ts`, `worker/frontiere.test.ts` ; tests R/N : `commandes.test.ts`, `schemaSortie.test.ts`, `contexte/acteur.test.ts` (N), `contexte/interprete.test.ts`, `dossier/interprete.test.ts`. | rien |
| **2 — feature** | `feature`, après gel du lot 1 | R `src/features/play-mode/hooks/useTourDeJeu.ts` (+ test) — sur `commande.commande==='parler'` accepté : appelle `demander(dossier,{role:'acteur',personnageId:commande.cibles[0],saisie,session:nouvelleSession})` APRÈS persistance du pas (même ordre que R3), puis `consignerNarration(session,tour,{recit:reponse.proposition.replique,faits_etablis:[]})` et persiste ; sur `EchecCopilote`, ne pose rien (bannière existante, aucun texte de repli — KR-283), verrou de tour étendu comme pour R3. | Lot 1 (lit `CibleActeur`/`ReponseActeur`/surcharge comme donnée gelée) |

Aucun fichier partagé entre les deux lots. Exécution séquentielle — lot 2 ne compile pas avant que le lot 1 existe ; pas de worktree parallèle à inventer.

Interface figée par le lot 1 (point de rendez-vous) :
```ts
// CopiloteService.ts
demander(dossier: Dossier, cible: CibleActeur, signal?: AbortSignal): Promise<ReponseActeur>
interface CibleActeur { role: 'acteur'; personnageId: string; saisie: string; session: EtatSession }
// ReponseActeur = {statut:'propose', proposition: {replique:string}} | EchecCopilote

// brain/dossier/commandes.ts
export function personnagesPresents(dossier: Dossier, session: EtatSession): readonly string[]
// COMMANDES.parler: { label: 'parle au personnage', verbe: 'PARLER', refKinds: ['personnage'] }

// brain/copilote/types.ts
interface TablesInterprete {
  readonly lieux: ReadonlyMap<RangInjecte, string>
  readonly personnages: ReadonlyMap<RangInjecte, string>   // NEUF, additif
  readonly gestes: ReadonlyMap<RangInjecte, CommandeId>
}
```

## D. Décisions prises en autonomie faute de spécification

- **Résolution de `designe[]` par position (`refKinds[i]`) plutôt que par une table unique** → ajout d'un branchement par `refKind` dans `validerInterprete`/`resoudreInterpretation`, deux tables `Map` disjointes en valeurs → si c'était l'inverse (une seule table `tables.lieux` étendue aux personnages), tout `parler` risquerait de résoudre vers un lieu homonyme de rang sans qu'aucun type ne l'empêche — un bug silencieux, jamais une erreur `tsc`.
- **Compteur de rang `P` PARTAGÉ entre lieux et personnages dans `assemblerInterprete`** → rangs disjoints en valeur (P1..Pn lieux, Pn+1..Pn+m personnages) → si c'était deux compteurs indépendants, le même prompt pourrait porter deux fois « P1 » pour un lieu et un PNJ différents.
- **Réplique écrite via `consignerNarration` existante (`faits_etablis: []`), aucune fonction neuve** → zéro nouveau puits d'écriture pour `EntreeJournal.recit` → si c'était l'inverse (une fonction `consignerReplique` dédiée), deux écrivains du même champ coexisteraient.
- **`narrateur.ts` NON touché** (seule `worker/index.ts` re-mesure `TAILLE_MAX_CORPS_IA`) → si un agent l'éditait quand même « pour cohérence », ce serait un fichier en plus dans le lot contrat sans raison testable.
- **Nouveau membre `RefusCommande.cible_indisponible`** couvrant à la fois « absent du lieu courant » et « sans prose d'identité » (un seul message) → si c'était deux refus séparés comme pour `aller`, ça exposerait à l'auteur une distinction que le design_contract ne demande pas.
- **Critère d'acceptation 2, clause « mort » descopée** → la garde structurelle ne teste que présence + identité en it1 → si on l'implémentait quand même, ce serait un branchement mort (aucun `EtatPnj` ne porte de statut de vie avant n°13).

## Fichiers lus
`CLAUDE.md`, `docs/WORKFLOW.md`, `src/features/moteur-acteurs/specification.json`, `src/brain/dossier/commandes.ts`, `src/brain/CopiloteService.ts`, `src/brain/copilote/types.ts`, `src/brain/copilote/schemaSortie.ts` (intégral), `src/brain/copilote/contexte/{arbitre,interprete,narrateur}.ts`, `src/brain/dossier/interprete.ts`, `src/brain/dossier/recit.ts`, `src/brain/dossier/faits.ts`, `src/brain/dossier/types.ts` (grep `Personnage`/`Presence`), `worker/index.ts`, `.claude/raffinage/moteur-arbitre-it1/tour1-tech-lead.md`, `.claude/raffinage/moteur-arbitre-it2/tour1-tech-lead.md`.
