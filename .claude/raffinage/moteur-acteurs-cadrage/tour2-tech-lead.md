# Cadrage n°12 `moteur-acteurs` — Tour 2 — Tech Lead

## RÉPONSE AUX OBJECTIONS — nommées

### CONFLIT B (Narratif-IA, § F « Nommage ») — je rétracte ma propre affirmation de Tour 1

J'avais écrit : « Rien ne touche `types.ts`/`destinations.ts`/`validate.ts`... tout est côté session/engine ». **C'est faux**, et la faute est repérable : en Tour 1 je n'ai lu `destinations.ts` qu'au grep ciblé, pas en entier. Trois éléments la contredisent, cumulatifs :

1. **Lecture littérale de la Décision A** (roadmap l.45) : « `types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature`. » Les trois fichiers sont nommés en **disjonction**, pas en conjonction — toucher `destinations.ts` SEUL suffit à déclencher le lot `contrat`. Mon « Decision A hors sujet ici » présumait qu'elle ne visait qu'un changement de FORME (`types.ts`/`validate.ts`) ; le texte ne dit pas ça.
2. **Le patron existe déjà deux fois dans `destinations.ts` lui-même**, exactement sur la forme que Narratif-IA propose : `Relation.secret` (l.323-333) et `Caractere.cede_si` (l.365-382) sont `'ia'` dans la table, avec le prédicat de rôle écrit au même site. Narratif-IA ne réclame pas un 4e type de dérogation — elle réutilise un mécanisme déjà posé deux fois (n°4, n°6).
3. **KR-195 et KR-262 tranchent la compétence elle-même, pire pour ma position qu'une simple incertitude.** KR-195 (`dossier-fiches`) : la destination de `Entite.nom` n'est pas rouverte, question TRANSVERSE, propriété de l'assembleur n°10. KR-262 (`moteur-interprete`) : R3 et les 8 collections restent OUVERTS, **propriétaire n°12**. Le code-knowledge nomme n°12 comme le point où cette dérogation doit se trancher — l'inverse d'un hors-sujet. Le refus déjà écrit dans `destinations.ts` (l.297, l.419) est le mur que Narratif-IA demande de franchir — pas une extension additive routinière, l'inversion d'un refus tenu sur deux features livrées (n°10, n°11).

**Tranché : lot contrat — pas « simple ligne d'audience ».** Mais **scope limité à `monde.personnages[].nom` seul**, pas aux 7 autres collections que KR-262 laisse nommément ouvertes : aucune des 7 autres n'a de rôle-acteur équivalent à R4, et R1/R3 les désignent déjà par description. Généraliser aux 8 sans second consommateur nommé violerait KR-249/268.

**Conséquence concrète — zéro lot supplémentaire, le lot `contrat` d'it1 grossit de deux fichiers :**
`destinations.ts` (ligne `monde.personnages[].nom`, `'auteur'`→`'ia'`, commentaire du prédicat au site : entre dans le contexte R4 du porteur + de tout personnage dont une `relations[].cible_id` pointe vers lui, jamais R1/R2/R3) et `types.ts` (JSDoc de `Personnage.nom` redéclaré sans changement de forme — `Entite.nom` reste `'auteur'` pour les 7 autres). **`validate.ts` n'est pas touché** — vérifié : aucune référence à `Destination` ni à `nom` dans ce fichier ; pas de nouveau champ, KR-160 (migration `schema:1`) ne s'applique pas.

### CONFLIT A — le découpage de Narratif-IA l'emporte ; KR-268 n'est pas son invention

Vérifié dans `code-knowledge.json` : KR-268 (feature `moteur-interprete`) généralise KR-266 (même feature : « un lot contrat PAR ITÉRATION, jamais un seul pour toute la feature ») au niveau du champ. **Précédent direct de la feature immédiatement antérieure, déjà appliqué en production — pas une invention de Narratif-IA pour n°12.**

- **PM (it1 = confiance_min câblée)** fige `ReponseActeur` à trois champs dès it1, et tire dans la foulée `EtatPnj.confiance` + `crediterConfiance` + la section REGLES-DU-JEU.md (bloquante selon QA) dans le plus petit lot de la feature — ordre inverse de ce qu'un squelette doit faire.
- **Narratif-IA (it1 = `{replique}` seul, zéro savoir)** fige une union à un seul champ. `EtatPnj.confiance`/`crediterConfiance` partent en it3, appariés à leur seule raison d'être. **Je révise mon propre Tour 1** : j'avais bundlé `EtatPnj.confiance` dans le lot contrat d'it1 ; je le retire et le reporte au lot contrat d'it3, posé avec son écrivain ET son lecteur (`confiance_min`) dans le même geste.
- **QA — pas un vrai désaccord, une formulation ambiguë.** « it1 : savoirs sans évaluation de porte » se lit soit « zéro révélation » (= Narratif-IA), soit « fail-open » (contradiction). Ses critères formels (conjonction stricte des portes, garde de structure avant tout appel R4) et son propre risque d'ouverture sont fail-closed sans ambiguïté. Je lis donc sa phrase comme une ellipse de « zéro savoir transite » — aucun désaccord de fond, une reformulation à demander en raffinage.
- **it2 groupe contrepartie + apres_indice_id + carnet, zéro nouveau contrat `brain/` autre que le schéma de sortie** : les deux portes lisent des données déjà existantes (inventaire de session, roadmap § 4 ; `FaitsDeSession.indices_connus`, déjà typé). Seul `ReponseActeur` gagne `indices_reveles: string[]`. Le carnet (vue dérivée, UI `play-mode`) a zéro contrat et peut s'attacher ici plutôt qu'attendre it4 — j'entérine ce que l'UX a déjà posé.

**Ordre retenu** : it1 `parler`+`{replique}` → it2 portes contrepartie/apres_indice_id + carnet → it3 confiance → it4 jet.

## MES BRAIN_CONTRACTS MIS À JOUR

| It | Fichier | Type | Direction | Signature / contenu | Statut |
|---|---|---|---|---|---|
| 1 | `brain/dossier/commandes.ts` | registry | provides | `COMMANDES.parler:{label, verbe:'PARLER', refKinds:['personnage']}` + `TRANSITIONS.parler` (refus si PNJ absent du lieu courant, consomme un pas) | inchangé |
| 1 | `brain/dossier/destinations.ts` | registry | provides | `'monde.personnages[].nom': 'ia'` (était `'auteur'`) — rôle-gated : contexte R4 du porteur + de tout personnage dont une `relations[].cible_id` pointe vers lui ; jamais R1/R2/R3 ; précédent `Relation.secret`/`Caractere.cede_si` | **NOUVEAU** (CONFLIT B) |
| 1 | `brain/dossier/types.ts` | type | provides (JSDoc only) | `Personnage.nom` redéclaré, même forme héritée d'`Entite`, JSDoc portant le prédicat + renvoi à `destinations.ts` ; zéro impact `validate.ts`/KR-160 | **NOUVEAU** (CONFLIT B) |
| 1 | `brain/copilote/types.ts` | type | provides | `CibleActeur{role:'acteur', personnageId, saisie, session}` / `ReponseActeur = {replique: string}` | **RÉVISÉ** (Tour1 avait 3 champs) |
| 1 | `brain/CopiloteService.ts` | service | provides | 10e surcharge `demander(dossier, cible: CibleActeur, signal?): Promise<ReponseActeur>` | inchangé |
| 1 | `worker/index.ts` | registry | provides | `INVITES['acteur']`, 10e branche, checklist KR-233 | inchangé |
| 2 | `brain/copilote/types.ts` | type | provides | `ReponseActeur += indices_reveles: string[]` | **NOUVEAU**, lot contrat propre à it2 (KR-266/268) |
| 2 | `brain/dossier/evaluate.ts` (ou voisin) | registry | provides | évaluateur conjonctif des 4 portes (contrepartie+apres_indice_id honorées ; confiance_min/jet FERMÉES par construction), seul appelant de `DELTAS.reveler_indice` | déplacé d'it4-ébauche à it2 |
| 2 | *(hors brain)* `play-mode`/`CarnetIndices.tsx` | UI | consumes | vue dérivée de `indices_connus`, zéro écrivain neuf | note, pas un brain_contract |
| 3 | `brain/dossier/faits.ts` | type | provides | `EtatPnj.confiance?: number`, bornes `CONFIANCE_MIN/MAX` réutilisées, `CONFIANCE_DEPART=0` | **déplacé** d'it1 à it3 |
| 3 | `brain/dossier/session.ts` | registry | provides | `crediterConfiance(session, pnjId, delta): EtatSession` | **déplacé** à it3 |
| 3 | `brain/dossier/sessionDestinations.ts` | registry | provides | `'monde.pnj.<id>.confiance': 'moteur'` | **déplacé** à it3 |
| 3 | `brain/copilote/types.ts` | type | provides | `ReponseActeur += delta_confiance: -1\|0\|1` | **déplacé** à it3 |
| 3 | `docs/REGLES-DU-JEU.md` | doc | provides | section « Confiance & Persuasion » (bornes, Δ, saturation) écrite AVANT le code (KR-130) — condition bloquante QA/KR-279 | nouveau, hors brain mais bloquant pour it3 |
| 4 | `brain/copilote/types.ts` | type | provides | `ReponseActeur` forme disjointe `+= {resiste:{enjeu_reussite, enjeu_echec}}` | **déplacé** à it4 |
| 4 | — | — | consumes | réutilise `issueDuJet` (n°11) ; zéro second appel `resolveChallenge` (KR-281) | inchangé |
| — | `brain/dossier/types.ts` `PorteeContreMesure` | — | — | **confirmé hors scope**, propriété n°14 | consensus acquis (PM/Narratif-IA/moi) |

## VERDICT — recevable sous réserve

Pas un veto : le mécanisme de la dérogation `nom` (table + JSDoc au site) est un précédent déjà admis deux fois, pas une nouveauté dangereuse. Réserves (remplacent celle de Tour 1) :
1. Le comité ratifie explicitement le scope « personnages seulement » de la dérogation `nom` (pas les 7 autres collections), à écrire dans `specification.json` comme fermeture **partielle** de KR-262/195 — la part non fermée reste une dette déclarée, pas une clôture silencieuse.
2. it1 = `ReponseActeur` à un seul champ (`{replique}`), confirmé par PM ; QA reformule sa phrase ambiguë sur « savoirs sans évaluation de porte » pour lever toute lecture fail-open.
3. `EtatPnj.confiance`/`crediterConfiance` repoussés au lot contrat d'it3 (mon propre revirement), pas it1.

## Décisions prises en autonomie faute de spécification
- Scope de la dérogation `nom` (personnages seuls vs les 8 collections que KR-262 laisse ouvertes) → personnages seuls → sinon n°12 romprait KR-249/268 en figeant 7 lignes de table sans consommateur nommé.
- Mécanisme de la dérogation (réutiliser le patron table+JSDoc de `secret`/`cede_si` vs un 4e type `Destination`) → réutilisation → sinon romprait la garantie à trois valeurs (`'ia'|'moteur'|'auteur'`) sur laquelle s'appuie tout lecteur de la table.
- Position de `EtatPnj.confiance` (mon Tour1 la mettait en it1) → déplacée en it3 → sinon la rédaction de « Confiance & Persuasion » deviendrait un préalable au plus petit lot de la feature, pour une dépendance que la démo d'it1 n'exige pas.
- Lecture de la phrase ambiguë de QA → lue comme « zéro savoir transite », compatible avec Narratif-IA → si c'est l'inverse (fail-open réel), veto immédiat de ma part, pas une réserve.

## Fichiers lus (Tour 2, en plus du Tour 1)
`src/brain/dossier/destinations.ts` (entier, 633 lignes) ; `src/brain/dossier/validate.ts` (grep `Destination`/`destinations` — aucune occurrence) ; `src/brain/dossier/types.ts` (grep `Personnage`/`Entite`) ; `code-knowledge.json` (KR-195, KR-249, KR-262, KR-266, KR-268 entiers) ; `docs/ROADMAP-BASCULE-IA.md` (Décision A, § 4) ; `src/brain/copilote/contexte/narrateur.ts` (grep `nom`/`KR-195`/`PROJECTION`) ; `src/brain/copilote/contexte/relations.ts` (grep `nom`/`secret`/`cede_si`).
