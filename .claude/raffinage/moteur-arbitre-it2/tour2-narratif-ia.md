# Raffinage `moteur-arbitre` it2 — Tour 2 — Narratif & IA

**RISQUE** — Le lot 1 du tech-lead résout le dé à deux endroits : le hook appelle `resolveChallenge`, puis `narrateur.ts` re-dérive l'issue depuis `EntreeJournal.jet`. L'`indice` n'est écrit nulle part. La carte peut donc afficher RÉUSSITE pendant que R3 raconte un échec.

**OBJECTION**
1. **Au tech-lead, sur le renommage : je le retire.** Ce n'est pas mon veto, et le texte du cadrage était le mien. Une condition : le type résolu porte `Characteristic`/`ChallengeTier`, jamais `string`. Ainsi, la sortie brute du modèle ne compile pas vers `consignerJet`. L'homonymie entre clé réseau et champ stocké contredit le précédent `copilote/types.ts:559`. C'est à toi de trancher.
2. **Au tech-lead, sur `CibleArbitre` : la saisie est nécessaire, et le `CATALOGUE` doit être dans le contexte.** Le « UNIQUEMENT » du critère 4 vise la fiche du héros. Ma note de cadrage (tour 1 § A, jamais retirée) contenait les deux.
   - `agir` ne porte rien (`refKinds: []`). Dans la tour effondrée, « je dégage les gravats » et « j'examine les rouages » recevraient le même jet, tourné vers le squelette des `dangers`. Le déclenchement par `dangers`, rejeté au cadrage (#137), reviendrait par le modèle.
   - Sans catalogue, la liste FO…CA serait écrite à la main dans l'invite, puisque `worker/index.ts` n'importe rien : **veto**.
3. **À la QA : le rejeu unique reste.** Le validateur refuse `"Force"` ou un chiffre, et un second tirage peut corriger. `{sans_jet:true}` s'ajoute aux critères.
4. **À l'UX : `pourquoi` a un lecteur.** Le plan, l.423, affiche « Sens · Dur · repérer le fil tendu ». Je retire l'objection si la carte l'affiche.

**PROPOSITION** — `issueDuJet(session)`, dans `brain/dossier/arbitre.ts`, est le seul appelant de `resolveChallenge`. La carte, R3 et l'XP d'it3 le lisent. `CibleNarrateur` reçoit les deux enjeux, et l'assembleur garde celui qui est advenu.

**VERDICT** — Recevable sous réserve. Un seul veto : le catalogue.

---

## ANNEXE (hors quota)

### 0. Statut de mes positions du tour 1

| Position du tour 1 | Statut | Motif |
|---|---|---|
| Renommage `epreuve`/`aptitude`/`difficulte`/`si_reussi`/`si_rate` | **Retiré** | Il est hors de mon domaine de veto. Le texte du cadrage était le mien (cadrage tour 1 § B, confirmé « inchangé » au tour 2 § B). Le risque réel, une sortie brute qui passe pour une forme résolue, est couvert par le typage fermé du § A. |
| Rangs `C<n>`/`D<n>` au lieu des clés moteur | **Retiré** | Le danger de KR-231, une table qui dérive entre l'appel et l'acceptation, n'existe pas pour un registre figé. L'appartenance à `CHARACTERISTIC_VALUES`/`CHALLENGE_TIER_VALUES` suffit. C'est cohérent avec le cadrage (« Clés FO/TC2 visibles par R2 : oui »). |
| `pourquoi` sans lecteur (objection 2) | **Retirée sous condition** | Le lecteur est la carte (plan de cible l.423). Si l'UX ne l'affiche pas, le champ est retiré du schéma. Le troisième état (validé mais non affiché) est REJETÉ, voir § 8. |
| `obstacle` (60 car.) | **Retiré** | Absorbé par `pourquoi`. |
| Saisie dans R2 (objection 1) | **Maintenue** | Exemple en note. R1 (`CibleInterprete`) et R3 (`CibleNarrateur`, `types.ts:521-523`) portent déjà `saisie` : aucune exposition nouvelle. |
| Catalogue dans le contexte (objection 1) | **Durcie en veto** | `worker/index.ts` : zéro `import`. Toute liste dans `INVITES.arbitre` serait donc écrite à la main. |
| `lieu_id` au rejeu (objection 3) | **Maintenue, hors veto** (KR-013/249, domaine tech-lead) | Désaccord croisé du cadrage, jamais arbitré. Le tech-lead l'a gardé (`cadrage/tour2-tech-lead.md:33`) pendant que je le retirais dans le même tour (`cadrage/tour2-narratif-ia.md:34`). Aucune `resolved_decisions` ne le tranche. C'est la même classe de situation que #138. Personne ne le lit, et il est dérivable par rejeu des commandes. |
| Prédicat anti-tutoiement (objection 4) | **Retiré** | Je rejoins le REJETÉ du tech-lead, avec deux motifs : la cohérence avec les rôles frères (le sien), et les faux positifs du `\b` ASCII (le mien). Cela ferme l'`open_question` n°152, comme le PM le demande. |
| La carte sous REGLES §2 (objection 5) | **Maintenue, précisée** | Voir § C. |
| Veto « l'assembleur R2 lit `heros` » | **Levé** | Les deux cibles proposées sont sans `session`. |
| Veto « issue classée hors de `brain/` » | **Requalifié en objection** | Une duplication entre deux sites de code relève du tech-lead. Ma demande devient la PROPOSITION. |
| Enjeux à l'infinitif | **Maintenu**, contre l'UX tour 1 (« FICTION, deuxième personne ») | (a) Le plan l.423 écrit la demande à l'infinitif. (b) L'enjeu advenu entre dans `CE PAS`, écrit à la 3e personne (KR-269). Un « vous » y casserait le bloc. (c) Une seule voix narrative à l'écran : R3. Il n'y a pas de prédicat (aucun parseur) : l'invite seule s'en charge. |
| Amorce binaire en it2 | **Confirmée** | Avec le PM. Les 4 valeurs relèvent d'it3. |

### A. Contrat R2 : ce qui change depuis le tour 1

**Entrée injectée**
- `CibleArbitre = { role: 'arbitre'; saisie: string; lieuId: string }`. Elle n'a **pas** de `session`, et je reprends le `lieuId` du tech-lead.
- Ce que l'assembleur injecte, par une liste fermée :
  - `canon.ton` et `interdits_ton`, s'ils sont écrits ;
  - `ICI` : la description (requise) et `dangers` (optionnel, sans ligne s'il est absent) ;
  - `CATALOGUE`, dérivé des registres : 8 lignes `FO — Force : Puissance physique.` et 4 lignes `TC2 — Dur`. Jamais `notation`, jamais `baseXp`, parce que la difficulté se choisit par la fiction et non par la probabilité ;
  - la saisie, normalisée et placée en dernier. La borne `SAISIE_CARACTERES_MAX` (300, `contexte/interprete.ts:29`) est réutilisée, sans seconde constante.
- **Borne** : constante par pas, puisqu'il n'y a aucun terme de mémoire.

**Sortie, au texte du cadrage** : `{jet:{carac,tc,pourquoi,enjeu_reussite,enjeu_echec}} | {sans_jet:true}`.
- Ce que coûte le maintien du nom : la clé enseigne au modèle (`types.ts:585`). Or `pourquoi` pousse vers une justification. L'invite doit donc le définir avec l'exemple du plan : « ce que le héros tente, à l'infinitif, en quelques mots ».

**Prédicats** (refus atomique, KR-230) :
1. La sortie est un objet simple (`schema`).
2. Elle a exactement une clé, `jet` ou `sans_jet` (`schema`).
3. `sans_jet === true` (`schema`).
4. `jet` porte exactement ses cinq clés (`schema`).
5. `carac ∈ CHARACTERISTIC_VALUES` et `tc ∈ CHALLENGE_TIER_VALUES` (`schema`).
6. Chaque prose est non vide après `trim` (`vide`), sans `\n`, sans « ? » final, et sous sa borne : `pourquoi` ≤ 60, enjeux ≤ `ENJEU_CARACTERES_MAX` (80 proposé, à caler avec l'UX).
7. `enjeu_reussite ≠ enjeu_echec` après `trim`.
8. Aucun `MARQUEUR_A_ECRIRE` (`marqueur`).
9. Aucun identifiant, aucun chiffre `[0-9]` (`identifiant`). Le chiffre couvre `TC1`…`TC4`. Les clés FO…CA ne sont pas balayées dans la prose : un balayage de capitales à deux lettres ramène les faux positifs du `\b` ASCII. Je le déduis de la spécification, sans l'avoir exécuté.

**Typage** — la condition qui remplace le renommage :
- La forme réseau a `carac: string; tc: string`.
- La forme résolue `PropositionJet` a `carac: Characteristic; tc: ChallengeTier`, rétrécie par le validateur.
- `EntreeJournal.jet` a `{ carac: Characteristic; tc: ChallengeTier }`.
- Ainsi `heros.caracs[carac]` compile sans transtypage (`HeroState.caracs: Record<Characteristic, number>`), et une sortie brute ne compile pas.

**Témoin du veto** : `INVITES.arbitre` ne contient, en mot entier, aucune clé de `CHARACTERISTIC_VALUES` ni de `CHALLENGE_TIER_VALUES`. La liste est dérivée dans `worker/index.test.ts`, qui importe déjà `src/brain` (précédent KR-270).

**Échec** : inchangé par rapport au tour 1 § D.
- Un refus de contexte ou `indisponible` passe en `sans_jet` sans rejeu.
- `illisible` est rejoué une fois, puis passe en `sans_jet`.
- On n'affiche pas de carte, on n'écrit pas d'entrée, on ne lit pas la clé d'aléa, et on n'invente aucun jet.
- **Objection à l'état 4 de l'UX** : R2 indisponible n'a pas de bannière propre. Le pas continue vers R3. Si R3 échoue aussi, sa bannière existante est la seule. Sinon, une bannière « indisponible » coifferait un pas raconté normalement.

### B. Une seule résolution (au tech-lead et à la QA)
- **Signature** : `issueDuJet(session: EtatSession): ChallengeResult | undefined`, dans `brain/dossier/arbitre.ts`.
  - Elle lit l'entrée `moteur` du tour `horloge.tour` qui porte `jet`. Sans cette entrée, elle rend `undefined`.
  - Elle calcule `resolveChallenge(jet.tc, heros.caracs[jet.carac], creerRng(graine_alea, 'jet', horloge.tour))`.
- **Le hook** : `lancerLeDe()` fait `consignerJet`, puis persiste, puis appelle R3.
  - Après le lancer, la carte lit `issueDuJet(session)` en ligne. Ce n'est pas un `useState` (KR-013).
  - L'état éphémère du hook ne porte que la proposition, avant le clic.
- **Témoin d'unicité** : aucune occurrence de `resolveChallenge` sous `src/features/**`. C'est un test par lecture de fichiers, sur le précédent `moteurSansIA.test.ts`.
- **Scénario séparateur** (skill § assertion de résultat) :
  - Il faut une graine où `creerRng(g,'jet',t)` et `creerRng(g,'jet',t-1)` donnent deux issues opposées pour la même caractéristique. Le témoin compare alors l'issue de la carte à l'amorce reçue par R3.
  - Sans cette graine, deux sites à indices différents peuvent coïncider, et le test reste vert.
  - Je ne l'ai pas mesuré : la QA écrit la sonde.

### C. La carte sous REGLES §2 (réponse à l'UX)
- **Avant le lancer** :
  - l'eyebrow `SENS · DUR`, tiré de `CHARACTERISTICS[carac].label` et `CHALLENGE_TIERS[tc].difficulty` ;
  - `pourquoi` en verbatim, sur une ligne ;
  - `SI RÉUSSITE` / `SI ÉCHEC`, avec les enjeux en verbatim ;
  - le bouton « Lancer le dé → ».
- **Après le lancer** :
  - réussite : `2D5 · 7 ≤ 9` ; échec : `2D5 · 11 > 9`. Les sources sont `notation`, `issue.roll` et `heros.caracs[carac]`, avec le comparateur tiré de `issue.success` ;
  - le Badge est dérivé de `success`.
- **Jamais** : « Seuil TC2 », `TC2` en clair, ou « 9 + 14 vs 14 ». Sous §2, le seuil est la valeur de la caractéristique.
- **Pas de dés un par un** : `ChallengeResult` n'expose que `roll`. Les afficher demanderait de modifier `challenge.ts` (propriété d'it3) ou de relancer les dés dans le composant, ce qui ferait un second tirage.
- **Ce que `pourquoi` doit dire** : ce que le héros tente, jamais ce qu'il trouverait. « repérer le fil tendu », l'exemple même du plan, dévoile le piège ; « scruter le seuil » ne le dévoile pas. C'est le rôle de l'invite seule, sans validation possible (risque H du tour 1).
- **Montrer `≤ 9` avant le lancer** : c'est au PM de trancher. La phrase du goal (« sans connaître par avance le seuil ») contredit §2 pour le joueur, comme je l'ai signalé au tour 1 § I.

### D. Ce que R3 reçoit, en écart avec le lot 1 du tech-lead
- **`CE PAS`** : `agit sur place`, puis `<réussit|échoue> — <enjeu advenu>`, puis `aucun changement`.
- **Les enjeux** :
  - le hook passe les deux enjeux par `CibleNarrateur` (nom du champ laissé au tech-lead, jamais `jet`) ;
  - l'assembleur choisit le côté avec `issueDuJet` ;
  - l'autre côté ne part jamais, et aucun enjeu n'est stocké.
- **Ce que R3 ne reçoit jamais** : `pourquoi` (il a la saisie), les chiffres, la caractéristique, la TC.
- **Sans l'enjeu**, la carte annoncerait « SI ÉCHEC : alerter ce qui veille » et R3 raconterait une autre conséquence sur le même écran.

### E. Corrections aux tables de la QA
- **Critère 5** :
  - `CorpsDemande` vaut `{ role: 'arbitre', contexte: string }`. Le contexte est un texte, pas un objet ;
  - le témoin strict porte sur `Object.keys(corps)`, `SENTINELLE-HEROS` absent, la saisie en dernière position et aucune ligne de mémoire.
- **Critère 6** : le domaine est `'jet'`, pas `'arbitre'`, et l'indice est `horloge.tour`.

### REJETÉS à recopier au § 8
- **Renommage complet des clés réseau de R2** : retiré par son auteur. Le cadrage fixe le texte, et le typage fermé couvre le risque.
- **Rangs C/D pour `carac`/`tc`** : un registre figé ne dérive pas entre l'appel et l'acceptation.
- **`pourquoi` validé mais non affiché** : un `pourquoi` de 61 caractères ferait tomber un jet valide en `sans_jet`, pour un champ que personne ne lit.
- **Contexte R2 sans saisie** : le jet deviendrait une propriété du lieu, et `dangers` en déciderait (#137).
- **Contexte R2 sans `CATALOGUE`** : la liste serait écrite à la main dans l'invite, donc la règle serait dupliquée (veto).
- **Retrait du rejeu unique (QA)** : les refus du validateur sont précisément ce qu'un second tirage corrige.
- **`resolveChallenge` dans le hook** : deux sites et deux indices pour un même tirage.
- **R3 sans l'enjeu advenu** : la carte et le récit diraient deux conséquences.
- **Dés affichés un par un** : `ChallengeResult` ne les expose pas, et `challenge.ts` appartient à it3.
- **Prédicat anti-tutoiement** : les rôles frères n'en ont pas, et le `\b` ASCII produit des faux positifs.

### À statuer au tour 3
- `lieu_id` au rejeu (tech-lead contre narratif-ia, croisé au cadrage, jamais arbitré).
- La voix des enjeux : infinitif (moi) ou deuxième personne (UX tour 1).
- La bannière propre à R2 indisponible (UX, état 4) ou la dégradation muette.
- Les noms des clés réseau : garder le cadrage ou déplacer un côté de l'homonymie. Le tech-lead seul en décide.

## Décisions prises en autonomie faute de spécification
- **Renommage contre texte du cadrage** → je le retire, sous typage fermé → s'il était imposé, l'essaim réécrirait `brain_contracts` et le critère 4. S'il était refusé sans typage, une sortie brute irait jusqu'à `consignerJet` sans que rien ne rougisse.
- **Valeurs de `carac`/`tc`** → clés moteur → avec des rangs, les noms devraient changer. Sinon, un `'C3'` stocké donne `caracs['C3'] === undefined`, et chaque jet échoue en silence.
- **Lecteur de `pourquoi`** → la carte, d'après le plan l.423 → sinon un champ sans lecteur qui peut faire tomber un jet valide.
- **Indice du tirage** → `horloge.tour`, lu par une seule fonction après `consignerJet` → avec deux sites, la carte et le récit divergent sur certaines graines.
- **Côté de l'enjeu transmis à R3** → l'assembleur le choisit, le hook passe les deux → si le hook choisissait, une feature classerait l'issue.
- **R2 indisponible** → pas de bannière propre → sinon une bannière d'échec au-dessus d'un pas raconté.
- **FO…CA dans la prose de R2** → pas de balayage, le chiffre couvre les TC → un balayage de capitales ramènerait les faux positifs du `\b` ASCII.

## Fichiers relus
- **Skill et notes** : `.claude/skills/raffinage-iteration/SKILL.md` ; les cinq `tour1-*.md` de `.claude/raffinage/moteur-arbitre-it2/` ; `.claude/raffinage/moteur-arbitre-cadrage/tour{1,2}-narratif-ia.md` ; `tour2-tech-lead.md` (grep).
- **Spécification** : `src/features/moteur-arbitre/specification.json` (lignes 1-100 et 128-157).
- **Règles** : `src/brain/challenge.ts` ; `src/brain/characteristics.ts` (grep).
- **Copilote** : `src/brain/copilote/types.ts` (495-614) ; `src/brain/CopiloteService.ts` (366-423) ; `src/brain/copilote/contexte/interprete.ts:29`.
- **Dossier et session** : `src/brain/dossier/commandes.ts` (grep `agir`) ; `src/brain/dossier/session.ts` (61-101) ; `src/player/types.ts` (24-33).
- **Worker** : `worker/index.ts` et `worker/index.test.ts` (grep des imports).
- **Connaissance et références** : `code-knowledge.json` (KR-231/262/269/273) ; `docs/PLAN-BASCULE-IA.dc.html` (l.423, 468) ; `src/brain/dossier/__fixtures__/dossier-reference.json` (255-267).
