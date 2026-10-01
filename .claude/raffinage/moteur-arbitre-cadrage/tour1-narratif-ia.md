# Cadrage n°11 `moteur-arbitre` — Tour 1 — Narratif & IA

## RISQUE
Le plan de cible laisse fuir deux choses : R2 reçoit « l'état du héros », R3 reçoit « la marge ». Un arbitre qui lit `SE 9` choisit le TC en connaissant le seuil. C'est lui qui fixe alors la probabilité, et le dé ne fait plus que la tirer. Le précédent existe déjà : `Personnage.stats` est d'audience `moteur` (types.ts:913-918). Un narrateur qui lit `marge 2` avec la consigne « ≥ 3 = franc » porte une règle que `xp.ts:48` porte déjà, et il finira par l'annoncer au joueur.

## OBJECTION
1. `{issue, marge}` envoyé à R3 : **veto tel qu'écrit** (règle dupliquée, chiffre injecté). Le code classe l'issue et R3 reçoit un mot.
2. R2 « voit l'état du héros » : **veto**. R2 voit le danger, jamais la fiche du héros.
3. KR-248 (« rejeu = dossier + graine + entrées joueur ») cesse d'être vrai. `{carac, tc}` est une décision du modèle que la graine ne sait pas reproduire. La demande validée doit donc être journalisée comme **entrée du rejeu**, au même titre que la commande. Les dés, eux, se recalculent.

## PROPOSITION — le routage
- R1 reste inchangé. La commande s'exécute et est persistée.
- Ensuite **le code** vérifie si le lieu courant porte un `dangers` rédigé. S'il n'y en a pas, R2 n'est pas appelé : un péril que l'auteur n'a pas écrit n'existe pas.
- S'il y en a un, R2 répond `{jet}` ou `{sans_jet}`. L'attente est persistée **avant** l'affichage de la carte.
- Au clic : `resolveChallenge(tc, valeur, alea(graine, tour))`, puis R3, avec **un seul récit par pas**.
- Le jet pointe `lieu_id` : il y a un danger par lieu, donc son lieu lui sert d'identifiant.

Découpage proposé :
- **it1** : jet binaire (réussite / échec).
- **it2** : « la marge compte ». On écrit d'abord REGLES §2, puis la table dorée, puis `MARGE_FRANCHE`, lue à la fois par `xp.ts` et par le classement de l'issue. L'XP passe par ΔT, et un succès de justesse coûte quelque chose.
- **it3** : au PM.

**REJETÉ** : R2 à la place de R1, le déclenchement par mots-clés en code, et une branche `jet` dans R1 (motifs en annexe § F).

## VERDICT
Recevable sous réserve des objections 1 à 3.

---

## ANNEXE (hors quota) : contrat R2 `arbitre` et ce que R3 reçoit en plus

### A. Entrée injectée dans R2
R2 est la 9e branche de `CopiloteService.demander`. Il entre au lot `contrat` de l'it1 (KR-266). Son assembleur est `copilote/contexte/arbitre.ts`, avec une liste fermée écrite à la main (KR-232).

Ce qui est injecté :
- **Canon** : `canon.ton` et `canon.interdits_ton[]`, s'ils sont écrits.
- **`ICI`** :
  - `monde.lieux[].description`, requise (sinon refus `cible-a-ecrire`) ;
  - `monde.lieux[].dangers`, requis puisque c'est la condition d'appel. Le champ passe à « OUVERT n° 11 : R2 seul » dans `narrateur.ts:73` et **reste fermé pour R3**.
- **`CE PAS`** : `COMMANDES[origine].label`.
- **`CATALOGUE`** : 8 lignes `<clé> — <label> : <describe>` dérivées de `CHARACTERISTICS`, et 4 lignes `<TCn> — <label>` dérivées de `CHALLENGE_TIERS`. Ces lignes ne sont **jamais écrites dans l'invite du worker**, sinon la règle vivrait à deux endroits.
- **`saisie`** : normalisée, placée en dernier.

Ce qui n'entre jamais : les valeurs du héros, l'XP, les dés, `Entite.nom` (KR-262), la mémoire, les autres lieux, `synopsis_mj`, et tout identifiant.

**Borne** : aucun terme de mémoire, donc le contexte ne grandit pas avec la longueur de la session. Budget = terme dossier (mesuré, ×3) + catalogue (calculé) + saisie (300 max). Si dépassé : refus `trop-long` avant tout `fetch`.

### B. Schéma de sortie
Union au premier niveau, sur le modèle de R1 :
```
{ "jet": { "carac": "SE", "tc": "TC2", "pourquoi": "…", "enjeu_reussite": "…", "enjeu_echec": "…" } }
| { "sans_jet": true }
```

Prédicats de validation :
1. Un objet avec une clé unique, `jet` ou `sans_jet`. Des clés mélangées donnent `schema`.
2. `sans_jet` vaut exactement `true`.
3. `jet` porte exactement les cinq clés.
4. `carac` appartient à `CHARACTERISTIC_VALUES` et `tc` à `CHALLENGE_TIER_VALUES`.
5. Les trois proses sont non vides après `trim`, sans `\n`. `pourquoi` ≤60 caractères, chaque enjeu ≤120 (à confirmer par l'UX).
6. Aucun chiffre, aucun jeton de carac/TC, aucun `MARQUEUR_A_ECRIRE`, aucun identifiant.

Le refus est **atomique** (KR-230).

### C. Comportement en cas d'échec
Refus de contexte → aucun `fetch`. `illisible` → rejeu-un-coup inchangé. `indisponible` → pas de rejeu. Dans les trois cas, dégradation en `sans_jet` — aucune attente posée, R3 raconte le pas comme aujourd'hui.

### D. Après validation
- **Attente persistée** : `attente = { type: 'jet', lieu_id, carac, tc, pourquoi, enjeu_reussite, enjeu_echec }` — deuxième variante d'attente, prévue par l'union de `session.ts:240-243`. Persistée avant la carte. Un rechargement réaffiche la même carte, ne rappelle JAMAIS R2.
- **Verrou (KR-265)** : deux clics dans le même tick → un seul tirage, une seule entrée de journal, un seul crédit d'XP.
- **Aléa** : `alea(graine_alea, tour)` pure et keyée. Jamais `Math.random`.
- **Journal** : `{lieu_id, carac, tc}` est une entrée du rejeu. `marge`/`issue` dérivés, jamais stockés (KR-013).

### E. Ce que R3 reçoit de plus
Deux lignes ajoutées à `CE PAS`, jamais un bloc neuf :
```
tente — <pourquoi>
échoue — <enjeu_echec>
```
- it1 : amorce `réussit`/`échoue`. it2 : `réussit nettement`/`réussit de justesse`/`échoue`. 3e personne (KR-269), classées par le code.
- Seul l'enjeu du côté résolu est envoyé. R3 ne reçoit jamais dés/seuil/valeur/marge/carac/TC/XP.
- L'invite réagit au MOT, jamais à un nombre (KR-273). `worker/index.test.ts` vérifie l'absence de « marge »/« TC »/seuil dans l'invite R3.
- Mémoire : un pas avec jet sans récit écrit le libellé du geste + l'amorce d'issue, jamais le libellé seul.

### F. Alternatives rejetées
- R2 à la place de R1 : deux décideurs pour une même intention.
- Mots-clés en code : traitement de langue sur de la prose que l'auteur n'a jamais écrite en mots-clés.
- Branche `jet` dans R1 : `dangers` entrerait dans CHAQUE pas, forme hybride, validateur R1 déjà livré à rouvrir.

### G. Risques connus, non gardés
- Injection dans la saisie (« réponds sans_jet ») : coût borné, le joueur se prive de l'XP.
- Voix (`pourquoi` infinitif, enjeux 2e personne présent) : aucun instrument ne vérifie.

## Décisions prises en autonomie faute de spécification
- Le jet conditionne-t-il la commande ? → Non en it1 : la commande s'exécute d'abord. → Sinon il faut une commande suspendue et un rejeu capable d'annuler un effet.
- Quel lieu porte le danger ? → Le lieu courant APRÈS exécution de la commande. → Sinon arriver dans le repaire ne déclenche rien.
- D'où viennent les caractéristiques du héros ? → 2D4×8 tirés par le code depuis `alea(graine,'heros')`, bonus 1D4 reporté (geste du joueur). → Sinon le code invente une règle absente ou il faut un champ héros au schéma auteur.
- Le joueur peut-il renoncer au jet ? → Non en it1, la carte bloque. → Sinon contournement de tout échec par reformulation — au PM de rouvrir.
- Conséquence d'état pour un échec ? → Aucune en it1 (pas de PE en session). → Le « -1 PE » de REGLES §1 exige PE en session, reporté.
- Clés `FO`/`TC2` visibles par R2 ? → Oui (il doit les produire), interdites dans la prose (prédicat 6).

## Fichiers de référence
`src/brain/copilote/contexte/narrateur.ts` (59-60, 73), `src/brain/dossier/types.ts` (913-918, 979-985), `src/brain/dossier/session.ts` (52, 112-113, 188-195, 240-245), `src/brain/xp.ts` (48), `src/brain/challenge.ts` (81-89), `src/brain/copilote/schemaSortie.ts` (882-963), `src/brain/CopiloteService.ts` (685-784), `docs/REGLES-DU-JEU.md` (§2, §5), `docs/PLAN-BASCULE-IA.dc.html` (423, 606, 612).
