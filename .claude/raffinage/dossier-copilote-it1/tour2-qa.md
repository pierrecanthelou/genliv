# Tour 2 — QA — `dossier-copilote` it1

```
CONTRE-LECTURE

→ UX (note (d), texte 4) et Tech Lead (TL-12). UX écrit que la discriminance (#3) doit se
prouver par unicité des quatre constantes (Set), pas par un rendu bout-en-bout — sinon (d)
est un test qui ne peut pas exister avant l'it2. Tech Lead règle le problème d'EXISTENCE en
remplaçant (d) par le refus de budget, qui a un producteur réel dès l'it1. Mais ça ne règle
PAS le problème d'UX : une fois (d) remplacé, les deux DERNIERS textes partagent un gabarit
et ne diffèrent que par un verbe. `new Set([T1,T2,T3,T4]).size === 4` reste VRAI même si le
code associe le mauvais texte au mauvais motif — l'unicité de chaîne n'a AUCUN pouvoir
séparateur sur une erreur de branchement motif→texte. Réponse : il faut, EN PLUS du Set, un
test PAR MOTIF qui fabrique `{statut:'refuse', motif:'a-ecrire'}` puis `{… 'trop-long'}` et
vérifie le texte EXACT rendu pour CHACUNE.

→ Narratif, objection (1) (critère 2 vs critère 10, rejeu vs mémoire). Je confirme que ça NE
se contredit PAS, à condition que le plan écrive — ce que fait déjà (c) de sa note — que le
rejeu ne se déclenche QUE sur les prédicats de FORME, jamais sur 5xx/413/abort. Testable
avec deux fixtures disjointes : le critère de rejeu rejoue une réponse JSON malformée ; le
critère de mémoire compare deux corps issus de DEUX appels `demander()` indépendants depuis
un état propre, sans toucher au chemin de rejeu. Aucun conflit d'instrument, À CONDITION que
ce soit écrit noir sur blanc — sinon un ouvrier réutilisera le mock du premier pour le second
et testera la même chose deux fois.

→ Tech Lead (§ d, note 3, note 4) : réponses MESURÉES — M1 et M3 en annexe. Les deux étaient
NON MESURÉ dans ma note de tour 1, elles ne le sont plus.

MES OBJECTIONS

A. Canaris non fixés littéralement dans le critère écrit — DURCIE EN VETO sur la forme
   littérale. MESURÉ (M2) : la regex EXACTE proposée par le Narratif au tour 1 passe le
   canari « fin.tout » (le `\b` le bloque correctement) MAIS ÉCHOUE sur le second : elle
   matche `objet.favori` dans la phrase bénigne — faux positif MESURÉ, pas déduit. Veto sur
   l'adoption de cette forme telle quelle. Le veto se lève si le lot contrat écrit une forme
   qui passe les DEUX canaris, avec les canaris épinglés littéralement et REJOUÉS avant
   signature.
B. 8 critères au plus — RETIRÉE, satisfaite par construction (C8 en annexe).

VERDICT — recevable sous réserve :
 (1) scanner dont les deux canaris sont mesurés et rejoués, jamais déduits ;
 (2) `feuillesDeLaFixture` PROMU dans `src/brain/dossier/feuilles.ts` — MESURÉ nécessaire
     (M3), les deux fichiers « conditionnels » du lot 1 deviennent non conditionnels ;
 (3) critère de discriminance durci par une assertion PAR MOTIF en plus du Set ;
 (4) la garde KR-236 écrite dans le lot contrat, pas seulement promise dans une note.
```

---

## ANNEXE

### M1 — Test de liaison des deux plafonds — MESURÉ

Commandes : `node -e "const enc=new TextEncoder(); …"`.

- `'€'` (BMP, U+20AC) → **3 octets** pour **1** unité de code UTF-16.
- `'\u{1F600}'` (hors BMP) → **4 octets** pour **2** unités → **2 octets/unité**.
- ⇒ **borne haute confirmée à 3 octets/unité** : l'affirmation du Tech Lead tient, mesurée. `'€'` est bien le pire cas représentable par un `.repeat()`.

`MARQUEUR_A_ECRIRE` — extrait du fichier source (`amorce.ts:46`, pas retapé) : **10 unités de code**, **16 octets** UTF-8. Le chiffre cité deux fois est **confirmé exact**.

Solidité de la formule, simulée avec des valeurs réalistes :
```
BUDGET=4000, enveloppe = JSON.stringify({role,champ,contexte:''}) + invite factice (322 octets)
→ E=322, TAILLE_MAX=13312, total(€×4000 + enveloppe)=12322 → holds: true
```
**Pouvoir séparateur, vérifié en ÉCRIVANT les deux mutants** :
- plafond worker baissé d'1 Ko sans re-dérivation → `holds: false`. Rougit.
- budget client monté de 400 sans re-dérivation → `holds: false`. Rougit.

⇒ le test tient et sépare réellement. **Réserve à écrire au plan** : ce pouvoir n'est réel QUE si `enveloppe`, dans le test, est construite à partir des constantes RÉELLEMENT EXPORTÉES (`INVITES[…]` depuis `worker/index.ts`, `BUDGET_CARACTERES_CONTEXTE` depuis `brain/copilote/contexte.ts`), jamais retapée à la main — une enveloppe retapée casserait silencieusement le lien que le test garantit.

### M2 — Scanner anti-identifiant, les deux canaris — MESURÉ (rejoué, pas hérité)

Regex exacte du Narratif (tour 1) :
```js
/\b(pnj|lieu|objet|indice|quete|objectif|jalon|fin|evenement|climat|bestiaire)\.[a-z0-9-]+/g
```
- `'Reference cachee : pnj.aldur-2 doit rester secrete.'` → `['pnj.aldur-2']` — fuite détectée, OK.
- `'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'` → `['objet.favori']` — **FAUX POSITIF, mesuré aujourd'hui**. Le `\b` corrige bien « fin.tout », mais PAS « objet.favori » : « objet » est à la fois un espace de noms et un mot français.

Forme qui passe les deux canaris, **mesurée** :
```js
/\b(pnj|lieu|objet|…|bestiaire)\.(?=[a-z0-9-]*[0-9-])[a-z0-9-]+/g
```
(exige au moins un chiffre ou un tiret dans le suffixe)
- fuite `pnj.aldur-2` → matche. Bénigne (les deux occurrences) → **aucun match**.
- Vérifié contre la forme réelle d'un identifiant **produit par `randomToken()`** (`src/brain/utils/id.ts`) : UUID (toujours tireté) ou repli `${base36}-${base36}` (toujours tireté) — **les deux branches contiennent TOUJOURS un tiret**. Testé sur `pnj.3f2504e0-4f89-11d3-9a0c-0305e82c3301` et `lieu.kx1a2b-7f3q9z1c` → les deux matchent.
- Piste « refuser si le caractère suivant est majuscule/espace » : **rejetée après essai** — n'aide pas, et refuserait des fuites suivies d'un espace (le cas nominal). Piste « suffixe > N caractères » : **rejetée**, `favori` (6) et `aldur-2` (7) sont trop proches.
- Limite résiduelle **NON MESURÉE** : la casse. `'Objet.favori-2 …'` ne matche ni l'ancienne ni la nouvelle forme (alternation en minuscules) — à écrire comme **limite du témoin**, pas comme un trou comblé.

### M3 — `feuillesDeLaFixture` importé depuis `couverture.test.ts` — MESURÉ

Sondes créées puis supprimées, `git status --short` vérifié propre après.
```
npx jest src/brain/dossier/couverture.test.ts --json --silent
  → numTotalTests: 39, numPassedTests: 39   (baseline)

# sonde src/brain/__qa_probe_import__.test.ts important feuillesDeLaFixture
npx jest src/brain/__qa_probe_import__ --json --silent
  → numTotalTestSuites: 1, numTotalTests: 40, numPassedTests: 40
```
**Mesuré, pas supposé** : en ciblant UNIQUEMENT le fichier sonde, Jest ne découvre qu'**une** suite mais y exécute **40** tests — les **39** `describe`/`it` de `couverture.test.ts` s'exécutent au chargement du module importé, fusionnés dans la suite de l'importateur. Le Tech Lead avait raison de rendre la promotion conditionnelle à la mesure ; la mesure dit **oui, promotion nécessaire**. `src/brain/dossier/feuilles.ts` (N) et la réécriture de `couverture.test.ts` (R) **ne sont plus conditionnels**.

### Constat additionnel, mesuré en creusant C1/C2 (grep)

`src/features/dossier-fiches/hooks/useEcritureIdentite.ts:22` : `BROUILLON_PERSONNAGE_VIDE = { nom:'', fonction:'', apparence:'', description_joueur:'' }` — un personnage frais a ses proses **VIDES**, pas marquées. Or le pseudocode du Tech Lead (règle 1 de `assemblerContexte`) ne filtre QUE sur `includes(MARQUEUR_A_ECRIRE)`. Conséquence : si la disjonction R2 du Narratif est retenue, sa règle « au moins un non vide ET non marqué » a besoin d'un **prédicat de vacuité** que le pseudocode n'écrit pas. Sans cette extension explicite, un personnage neuf aux 5 champs vides ne déclenche AUCUN refus R2 — silencieusement vert par vacuité.

### C1 / C2 — testabilité des deux contrats en désaccord

**C1** — la variante à écho (Tech Lead) ouvre un état — « le modèle échoue un `champ` différent de la cible » — qu'AUCUN des 14 critères ne couvre. Une variante à écho non testée est une branche non spécifiée : soit on écrit un critère de plus pour la divergence, soit on adopte `{valeur}` seule, qui supprime la branche par construction. Testabilité : `{valeur}` seule est **strictement plus simple** (un état de moins).

**C2** — contre l'intuition, **aucune des deux formes ne change l'atteignabilité du refus le plus simple**. Un « dossier neuf » au sens strict n'a AUCUN personnage (`amorce.ts` ne sème qu'un `lieu`), donc le test réaliste minimal est « dossier neuf + un personnage ajouté ». Sur cette fixture, `canon.ton` porte le marqueur dans les DEUX propositions → le refus est atteignable de façon identique et déterministe, via le même chemin `'ton'`. Ce que C2 change réellement : (a) l'existence d'un second chemin testable (« identité »), qui a besoin du prédicat de vacuité manquant ; (b) un risque produit non couvert dans la variante Tech Lead — un personnage aux 5 champs vides ne déclenche rien, le modèle écrit une `fonction` sans rien savoir. **Je ne tranche pas**, mais : **l'ordre de vérification des parties requises doit être écrit noir sur blanc** quel que soit le choix — plusieurs parties peuvent être simultanément violées, et sans ordre déclaré le `chemin` retourné n'est pas déterministe, donc pas testable.

### C8 — 8 critères, avec le mutant que chacun attrape

1. **Réponse conforme ⇒ 1 appel ; deux clics rapprochés ⇒ 1 appel** (unitaire brain + composant RTL). Mutants : boucle de rejeu même sur succès (fetch=2) ; absence de garde « un appel en vol » (fetch=2 sur double clic).
2. **Rejeu exactement une fois puis terminal, deux témoins** (unitaire brain). Mutants : « 0 rejeu » (jamais `propose` même si le 2ᵉ mock est conforme) ; « rejeu illimité » (un 3ᵉ mock conforme est atteint).
3. **4 textes distincts AVEC pouvoir séparateur réel** — Set d'inégalité + assertion PAR MOTIF du texte exact (composant RTL). Mutant : le code associe le texte « à écrire » au motif `trop-long` — un `Set.size===4` seul ne le voit pas.
4. **`update`, ordre persist→event, refus `validateDossier` = nominal** (unitaire + composant). Mutant : événement émis avant persistance.
5. **Scanner anti-identifiant, 2 canaris mesurés et rejoués** (unitaire brain). Mutant : mesuré — la forme lâche laisse passer `objet.favori`.
6. **Confinement** : `feuillesDeLaFixture` promu + `DEROGATIONS_AUDIENCE` vide assertée + allow-lists (unitaire brain). Mutant : `monde.personnages[].nom` ajouté à une des deux listes ⇒ l'assertion universelle contre `DESTINATION_DES_CHAMPS` rougit.
7. **`MARQUEUR_A_ECRIRE` retiré ⇒ refus sans fetch ; 2 lancers ⇒ corps identiques** (unitaire brain). Mutants : le marqueur fuit dans le texte assemblé ; un `Date.now()`/nonce dans le corps (limite nommée : invisible si la fuite passe par un en-tête).
8. **Tuyau worker + garde KR-236** : route node, garde octets, liaison des deux plafonds (M1, mesurée séparatrice), témoin invite ⊇ gabarit AVEC cas négatif, non-régression 10 sections vides + placement, lint/tsc. Mutant : l'invite demande `{"texte":…}` sans toucher le validateur — panne permanente et silencieuse que seul ce témoin voit.

### C10 — « deux clics ⇒ 1 appel », testable sans fake timers

**Oui, proprement.** Ce n'est PAS un débounce temporisé, donc pas de `jest.useFakeTimers()`. La garde est un état synchrone. Recette : mocker `global.fetch` pour rendre une Promise dont la résolution est contrôlée à la main (`let resolve; fetch.mockImplementation(() => new Promise(r => { resolve = r }))`), cliquer deux fois avant de résoudre, asserter `fetch` appelé **exactement 1 fois**. Marche que la garde soit `disabled` (RTL/`userEvent` ne délivre pas de clic sur un `disabled`, comme un vrai navigateur) ou un ref-guard dans le hook — les deux sont vérifiables sans dépendre de l'horloge.

### Fichiers / commandes

`.claude/raffinage/dossier-copilote-it1/{cadrage,tour1-*}.md`, SKILL.md, `src/brain/dossier/amorce.ts`, `identifiers.ts`, `src/brain/utils/id.ts`, `couverture.test.ts`, `jest.config.cjs`, `useEcritureIdentite.ts` (grep). Sondes jetables : `node -e` (M1, M2), `src/brain/__qa_probe_import__.test.ts` créé puis supprimé (M3) ; `git status --short` propre après nettoyage.
