# Raffinage moteur-arbitre it1 — Tour 2 — QA

## Réponse nommée à l'UX (objection sur testabilité)

**RISQUE TESTABILITÉ** — L'UX signale que son esquisse de cadrage violait la règle CLAUDE.md : `--good`/`--bad` réservées aux jets, pas aux ressources continues. Elle se corrige elle-même : « BandeauHeros en it1 affiche PV/PE/XP en text-strong/text-body, AUCUNE couleur sémantique (réservé it2) ».

**OBJECTION** — Cette correction est bonne pour les tests (aucun piège visuel) mais risque de ne pas persister si la spec gèle l'esquisse originale. L'agent découvrirait le conflit EN COURS DE CODE.

**PROPOSITION** — Ajouter explicitement à `design_contract` d'it1 : « BandeauHeros affiche PV/PE/XP en --text-strong/--text-body, jamais --good/--bad (réservé it2 sur CarteJet) ».

**VERDICT** — Recevable. L'objection de l'UX renforce mon exigence : documenter la correction élimine le risque de découverte tardive.

---

## Statut de mes 3 objections du tour 1

### 1. Critères d'acceptation mélangés par itération
**VERDICT : RETIRÉE** — Le PM confirme (tour 2) que le découpage tient : créer + regarder vivre en se déplaçant. Les AC d'it1 = création, bandeau, A4, balayage moteurSansIA. Les critères 4–7 (R2/R3/rejeu) vont en it2. Satisfait.

### 2. KR-013 non tranché (pvMax/peMax stockés vs dérivés)
**VERDICT : RETIRÉE — Satisfaction partielle, arbitrage reçu** — Tech-lead tranche : stockés, UNE SEULE écriture par maxPV, jamais recalculés à la lecture. Ce n'est pas l'anti-patron KR-013. Narratif-ia note que caracs n'ont pas de lecteur (observation, pas veto).

**Condition** : À la revue du lot contrat, vérifier que BandeauHeros lit heros.pvMax/heros.peMax tel quel, jamais ne les recalcule. Arbitrage reçu.

### 3. Aléa keyé — tests discriminants
**VERDICT : MAINTENUE ET SATISFAITE** — Narratif-ia propose cinq tests :
- (B.1) Même (graine, domaine, indice) → même valeur
- (B.2) Ordre entre clés ne change rien (tue compteur global)
- (B.3) Borne 0 ≤ x < 1
- (C) spyOn(Math.random) = 0 appel
- (D) R1/R3 invariants avec/sans heros

Plus : rollCreationPool doit recevoir rng dérivé, jamais Math.random.

**Conséquence** : Tous les tests existent maintenant (et plus). À nommer dans le plan d'it1. Suffisant.

---

## Contradiction ouverte : Condition d'A4

Tech-lead : `lieuCible.id === depuis` (inconditionnelle).
Narratif-ia : `lieuCible.id !== depuis` (changement réel).

**Testabilité** — Aucune ambiguïté de critère, deux implémentations différentes. Cas séparateurs nommés (narratif-ia).

**Requête** — Cette contradiction doit être **arbitrée par l'orchestrateur avant raffinage**. Qui valide la condition ? Tech-lead ou narratif-ia ? Sans arbitrage, l'agent découvrira l'incohérence EN COURS DE CODE sur commandes.ts:aller.

---

## Fichiers consultés
- src/features/moteur-arbitre/specification.json
- .claude/raffinage/moteur-arbitre-it1/tour1-{qa,pm-produit,tech-lead,ux-designer,narratif-ia}.md
- docs/REGLES-PLAY.md (§ A4)
