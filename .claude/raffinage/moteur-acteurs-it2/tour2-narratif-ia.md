# Raffinage `moteur-acteurs` it2 — Tour 2 — Narratif & IA

## RÉPONSE AUX OBJECTIONS (nommées)

### Au Tech Lead : non, mon § A-E ne viole pas KR-280. C'est un patron déjà livré, et je le nomme.

**1. Ce que dit KR-280.** Les quatre portes se testent en conjonction, et une porte non câblée reste fermée. Le texte vise l'ÉVALUATION DES PORTES, rien d'autre. Dans ma proposition : le code évalue 100% des portes avant l'appel (§A) ; le modèle ne voit aucune porte (§I) ; le même évaluateur re-constate tout avant d'écrire (§E.1). La phrase « le moteur constate, jamais le modèle » (`types.ts:577-588`) décrit EXACTEMENT mon mécanisme : `revele_comment` n'entre dans le contexte du modèle « que lorsque le moteur a constaté ouvertes les portes ». Le schéma prévoit donc qu'un savoir aux portes ouvertes est injecté au modèle.

**2. Le patron, à écrire en `resolved_decisions` : le CATALOGUE BORNÉ.** (1) le moteur calcule l'ensemble légal, avec la fonction de règle ; (2) le modèle choisit dans cet ensemble, par rang — un rang hors de la table fait refuser toute la sortie ; (3) le moteur re-vérifie avec la MÊME fonction, puis applique. Trois précédents déjà livrés : R1 interprète (rangs `P<n>` depuis `destinationsPossibles`, même fonction que `TRANSITIONS.aller`, re-vérifiée avant d'écrire) ; R2 arbitre (le modèle choisit `carac`/`tc` dans deux registres fermés — choisir le `tc` agit sur les chances de réussite, plus de pouvoir que choisir le moment de confier un savoir déjà ouvert) ; Détenteurs (motif `rang-inconnu`). R1 sert de modèle, pas R2, car chez moi le catalogue est recalculé à chaque appel.

**Phrase d'arbitrage proposée** : « KR-280 régit l'évaluation des portes ; il n'interdit pas au modèle de choisir dans un ensemble dont chaque élément a déjà passé les portes. » Si on lisait KR-280 comme le Tech Lead, il faudrait aussi vetoer `delta_confiance` (it3) et `resiste` (it4), déjà signés au cadrage.

**3. Ce que contestent les sources contraignantes.** Plan de cible l.608 : sortie R4 = `{replique, indices_reveles, delta_confiance}`. l.614 : « Deltas sous contrat — modifications PROPOSÉES … liste blanche ». AC n°4 déjà signé. La position du Tech Lead est un AMENDEMENT de l'AC n°4 et de `brain_contracts`, pas une application de KR-280.

**4. Ses deux appuis tombent.** « R4 ne désigne jamais rien » décrit le périmètre d'IT1, écrit sous KR-285, qui annonce justement « +indices_reveles en it2 » — commentaire à réécrire au lot contrat. Pas de doublon avec `EntreeJournal.deltas` : chez moi aussi la révélation vit là (§E), `indices_reveles` ne fait que transiter sur le fil, jamais persisté.

**5. Ce que coûte la version 100% structurelle telle qu'écrite.**
- (a) Un fait jamais raconté — R4 ne reçoit pas le contenu, le joueur n'entend jamais le secret alors que `indices_connus` l'enregistre comme su. Le carnet devient un identifiant d'auteur ou du vide. `formulation_joueur`/`revele_comment` deviennent des champs morts.
- (b) **Mémoire non spécifiée — mon veto.** `a_dit` jamais écrit, filtre lit `indices_connus` : `pnj_a_revele` reste faux pour toujours, un indice connu par un jalon n'est jamais confié par ce PNJ.
- (c) Distributeur automatique — avec la possession passive, porter l'objet et dire « bonjour » suffit.
- (d) Vacuité et contenu non traités (`revele_si` absent, `formulation_joueur` absente).

**6. Ce que je concède au Tech Lead.** L'évaluateur vit dans `brain/dossier/revelation.ts`, non exporté par `brain/index.ts`. **Résidu réel** : un modèle avare pourrait ne jamais citer le rang — même résidu qu'on a accepté pour `sans_epreuve` en R2, à inscrire en `open_questions` pour le playtest (KR-229).

### À QA : `porteOuverte` — confirmé, avec quatre écarts

`porteOuverte` (`atteignabilite.ts:275-292`, non exportée) est une analyse STATIQUE optimiste (ce qui PEUT arriver, pour l'atteignabilité). Le moteur a besoin de l'inverse (ce qui EST acquis, fermeture par défaut) :

| Cas | `porteOuverte` | Ce qu'il faut au moteur | Écart |
|---|---|---|---|
| `revele_si` absent | `true` | absent (« ne se révèle jamais de lui-même ») | polarité inverse |
| `confiance_min`/`jet` posés | aucune garde, peut rendre `true` | fermé (KR-280) | polarité inverse |
| `contrepartie` | lit `objetsDonnes` (dons possibles du dossier), ignore `consomme` | lit `possede_objet` sur la session ; `consomme:true` fermé | autre domaine |
| `apres_indice_id` | lit `indicesProduits` (point fixe) | lit `indice_connu` sur la session | autre domaine |

La réutiliser ouvrirait la porte par défaut, et son nom (« ouverte ») le cacherait. Témoins qui tuent la copie : savoir sans porte → absent ; `confiance_min` seul → absent.

Sur ton scénario séparateur : le Cas A (`consomme:true`) ne sépare pas ET de OU (fermé pour une autre raison) ; le Cas B vise un indice inexistant (référence pendante refusée par le validateur de schéma). Prends plutôt `consomme:false` avec l'objet possédé, et un indice préalable EXISTANT mais pas encore connu — puis l'inverse.

### Au PM : la valeur auteur, en une phrase

Non, ma proposition n'est pas la seule conforme. « Ne révèle que ce qu'il sait » fixe un plafond, toute variante où le code calcule l'ensemble éligible le respecte. Ce que seule ma version garantit en plus : ce que le moteur enregistre comme révélé est bien dit au joueur, dans la même sortie, au moment où l'échange y mène. **`consomme:true` (ta proposition 1) : je maintiens le veto, par KR-280 lui-même** — l'effet `consomme` n'est pas câblé, donc la porte reste fermée.

## MA POSITION MISE À JOUR
- **§ A-E maintenus.** Domicile `revelation.ts` adopté.
- **Repli accepté sans veto, si le comité veut zéro latitude pour le modèle** : le moteur désigne au plus un savoir révélable par `parler` (le premier dans l'ordre de la fiche) et l'injecte à R4 dans un bloc « CE QUE TU LUI CONFIES MAINTENANT ». `ReponseActeur` reste `{replique}`. Écriture en une fois (§E) : `reveler_indice`, `a_dit`, `recit` sur la même entrée. Coût : distributeur automatique, amendement de l'AC n°4.
- **La version 100% structurelle telle qu'écrite reste sous veto**, faute d'écrivain pour `a_dit` et d'injection du contenu.

## VERDICT
**Recevable sous réserve.** Ma proposition, ou le repli ci-dessus, est recevable. Veto maintenu sur deux points : la version 100% structurelle telle qu'écrite (mémoire non spécifiée), et `consomme:true` ouvert ou consommé en it2.

## Décisions prises en autonomie faute de spécification
- Nom et portée du patron → « catalogue borné », phrase d'arbitrage inscrite en `resolved_decisions` → sinon KR-280 sera rouvert en it3/it4.
- Repli si le comité refuse toute latitude au modèle → injection forcée d'un savoir + écriture de `a_dit` → la version pure enregistre des faits jamais racontés et laisse `pnj_a_revele` mort.
- Modèle qui ne confie jamais → résidu de playtest, aucune échéance forcée en it2 → une échéance serait une règle neuve, à écrire d'abord dans `REGLES-PLAY.md`.
- Base de `consomme:true` fermé → KR-280, plutôt que mon seul veto → sinon porte à moitié câblée, donc une fuite.

## Fichiers vérifiés
`src/brain/dossier/atteignabilite.ts` (249-292) ; `src/brain/dossier/types.ts` (536-594) ; `src/brain/copilote/schemaSortie.ts` (335-367, 1384-1606) ; `src/brain/copilote/contexte/interprete.ts` (66-90) ; `src/brain/dossier/commandes.ts` (245-300) ; `src/brain/dossier/predicates.ts` (101-113) ; `src/brain/dossier/faits.ts` (22-35) ; `docs/PLAN-BASCULE-IA.dc.html` (608, 614) ; `src/features/moteur-acteurs/specification.json` (7, 20-22, 31, 54, 70) ; `code-knowledge.json` (880-913).
