# Cadrage n°12 `moteur-acteurs` — Tour 1 — Tech Lead

## RISQUE
Le point dur n'est pas R4 lui-même (le gabarit CopiloteService/worker à 10e branche est une pure réplique du pattern n°11) mais la ligne roadmap sur `PorteeContreMesure`. Elle dit que n°12 « arrête les valeurs » d'un enum déjà posé (`['personnage','groupe','lieu']`, n°4, sans consommateur) — mais « armement des contre-mesures » est explicitement n°14 (roadmap l.176). Si n°12 écrit un vrai consommateur de `declencheur_expr`/`delai`/`portee` sans se limiter à une ratification, elle invente un état de session d'« armement » que n°14 devra deviner ou dédoubler — exactement l'anti-patron que la discipline KR-249/248 interdit entre features.

## OBJECTION
La phrase roadmap conflate deux actes distincts : (a) ratifier l'enum (décision à coût zéro, aucun brain_contract) et (b) l'armer (un écrivain réel). Le cadrage doit trancher EXPLICITEMENT laquelle avant d'ouvrir une itération là-dessus — sinon on répète, à l'échelle d'une feature entière, le risque qu'un champ moteur ne tient que tant que son lecteur et son écrivain sont nommés dans le même geste.

## PROPOSITION
Contrats en annexe. Ordre imposé : it1 = lot contrat (`EtatPnj.confiance`, verbe `parler`, `CibleActeur`/`ReponseActeur`, 10e branche worker) + le round-trip R4 COMPLET narratif+mécanique dans la même itération (KR-263/266, précédent n°11 it2 : jamais de bouton qui ne résout rien) ; it2 = filtrage des savoirs par point de vue + les 4 portes de `Revelation` ; it3 = carnet d'indices (réutilise `DELTAS.reveler_indice` existant, UN SEUL appelant nommé, précédent `issueDuJet`) ; it4 = `PorteeContreMesure`, scope tranché par l'objection ci-dessus. Rien ne touche `types.ts`/`destinations.ts`/`validate.ts` (Decision A hors sujet ici — tout est côté session/engine, pas schéma dossier) : seuls `faits.ts`, `session.ts`, `sessionDestinations.ts`, `commandes.ts`, `copilote/types.ts`, `CopiloteService.ts`, `worker/index.ts`.

## VERDICT
Recevable sous réserve — la réserve porte sur la clarification de la ligne `PorteeContreMesure` avant tout lot qui l'ouvre.

---

## ANNEXE — brain_contracts proposés

| # | Fichier | Type | Direction | Signature / contenu |
|---|---|---|---|---|
| 1 | `brain/dossier/faits.ts` | type | provides | `EtatPnj.confiance?: number` — optionnel à vie (KR-251), plage **réutilisée** `[CONFIANCE_MIN, CONFIANCE_MAX]` (déjà dans `types.ts`, posées n°4), PAS une nouvelle échelle. Nouvelle constante `CONFIANCE_INITIALE_PNJ` (distincte de `CONFIANCE_INITIALE_PORTE=1`, même précédent de distinction que celui déjà écrit pour cette dernière). |
| 2 | `brain/dossier/session.ts` | registry | provides | `crediterConfiance(session, pnjId, delta): EtatSession` — SEULE porte d'écriture, précédent `fixerHeros`/`crediterXp`/`consignerJet`. |
| 3 | `brain/dossier/commandes.ts` | registry | provides | `COMMANDES.parler: { label, verbe:'PARLER', refKinds:['personnage'] }` — AJOUTÉ À LA FIN du registre clos, entre dans LA MÊME itération que son consommateur narratif R4 (KR-263), jamais dans un lot contrat seul. |
| 4 | `brain/dossier/sessionDestinations.ts` | registry | provides | `'monde.pnj.<id>.confiance': 'moteur'` — jamais `'ia'`, même veto que `heros.*` (KR-232/262 étendus) : un PNJ qui lirait sa propre confiance la jouerait au premier tour. |
| 5 | `brain/copilote/types.ts` (domicile de `CibleNarrateur`/`CibleArbitre`) | type | provides | `CibleActeur { role:'acteur', personnageId, saisie, session }` / `ReponseActeur` → sortie `{replique, indices_reveles: string[], delta_confiance: number}` \| `EchecCopilote`. Contexte = savoirs DU PNJ SEUL (déjà scopés par schéma) dont `revele_si` est ouvert côté CODE avant l'appel — jamais le PNJ entier ni `caractere.curseurs`. |
| 6 | `brain/CopiloteService.ts` | service | provides | 10e surcharge `demander(dossier, cible: CibleActeur, signal?): Promise<ReponseActeur>` — zéro clé commune avec les 9 rôles existants (KR-231), deux sites (interface + implémentation). |
| 7 | `worker/index.ts` | registry | provides | `INVITES['acteur']` — 10e branche, checklist KR-233 inchangée (plafond octets, 413, 405, 404, 503, JSON strict). |
| 8 | `brain/dossier/evaluate.ts` (ou nouveau module voisin) | registry | provides | fonction nommée, SEULE appelante de `DELTAS.reveler_indice` depuis le pipeline dialogue (précédent `issueDuJet` = seul appelant de `resolveChallenge`) — distincte de `avecJalonsResolus`, pas de second mécanisme concurrent. |
| 9 | `brain/dossier/types.ts` `PorteeContreMesure` | — | consumes (SOUS RÉSERVE) | si it4 tranche pour une ratification : zéro contrat, décision loggée. Si un consommateur réel est nécessaire : UN champ de session nouveau et nommé, n°14 déclaré SEUL lecteur (précédent exact `graine_alea` posé n°9 it1, consommé n°11 it1) — jamais `delai`/l'armement proprement dit, qui reste n°14. |
| — | `brain/challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts` | — | consumes | AUCUN touché par n°12 — pas de `test:mutation` dû a priori. |

## Décisions prises en autonomie faute de spécification

- Interprétation de « arrête les valeurs de `PorteeContreMesure` » (ratification vs armement réel) → j'ai choisi de la poser comme fourche explicite à trancher en cadrage plutôt que de présumer un consommateur → si l'inverse (présumer un consommateur réel sans le nommer), n°12 écrit un état d'armement non déclaré que n°14 devra deviner ou dédoubler.
- Bornes de l'échelle de confiance de session → j'ai proposé la réutilisation de `CONFIANCE_MIN`/`CONFIANCE_MAX` (déjà posées par n°4) plutôt qu'une paire neuve → si l'inverse, deux échelles « confiance » déconnectées cohabitent, et un `revele_si.confiance_min` écrit par l'auteur dans `[-3,3]` pourrait n'être jamais atteignable par la valeur de session.
- Mécanisme du « carnet d'indices » → j'ai présumé la réutilisation de `DELTAS.reveler_indice` existant plutôt qu'un nouveau type de delta → si l'inverse, il faut justifier un second mécanisme de révélation d'indice concurrent de celui déjà consommé par la passe des jalons, ce qui romprait « une règle du jeu ne vit qu'à un seul endroit » (docstring `commandes.ts`).
- Nécessité d'un nouveau verbe `parler` plutôt que de réutiliser `agir` avec une cible implicite → j'ai tranché pour un verbe neuf (arité 1, `refKinds:['personnage']`) → si l'inverse, il faudrait redéfinir la portée documentée et figée de `agir` (arité 0, « sur place », KR-269), ce qui casserait son contrat narratif déjà verrouillé pour R3.

## Fichiers lus
`docs/ROADMAP-BASCULE-IA.md` ; `src/features/moteur-arbitre/specification.json` ; `src/brain/dossier/commandes.ts` ; `src/brain/CopiloteService.ts` (~180-360) ; `src/brain/dossier/faits.ts` ; `src/brain/dossier/types.ts` (~460-830) ; `src/brain/dossier/destinations.ts` (grep ciblé) ; `src/brain/dossier/sessionDestinations.ts` (entier) ; `src/brain/dossier/deltas.ts` (grep `reveler_indice`) ; `worker/index.ts` (grep `INVITES`, ~195-235).
