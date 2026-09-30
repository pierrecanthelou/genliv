# Tour 2 — Tech Lead — Contre-lecture — moteur-interprete it4

## RISQUE
`narrateur.ts:414-417` confirme : `EN SA POSSESSION` lit `session.monde.objets_possedes` en entier — aucune troncature dans le code actuel. Si l'état ne dégrade jamais (veto narratif-ia) et que la liste croît sans repli, le seul filet restant est le refus `413 trop-grand` du worker (`worker/index.ts:869-871`). Ce filet doit rester un **refus explicite**, jamais un silence — sinon on retombe exactement dans le risque que narratif-ia place en tête de sa note (perte silencieuse).

## OBJECTION — réponse nommée à narratif-ia
Je retire ma proposition de troncature `.slice(-K)`. Ma garde tour 1 (KR-235, pas de scalaire partagé) protégeait contre le mauvais chiffre ; elle ne protégeait pas le vrai problème, que je n'avais pas nommé : un objet écrit dans `faits.objets_possedes` (SSOT, `session.ts`) disparaîtrait du récit sans qu'aucune règle d'auteur ne l'ait décidée — le moteur dirait « possédé », l'IA raconterait « absent ». C'est une extension légitime de KR-013 à l'**assemblage de contexte**, pas seulement au stockage. Je m'y range : veto reçu, sans réserve.

## PROPOSITION
`EN SA POSSESSION` reste non borné en code, sans formule neuve. Résiduel documenté (`known_risk` + `open_questions`), propriétaire `dossier-controles`, borne statique `pireCasNarrateur = dossier.monde.objets.length` — vérifié : `avecAjout` (`deltas.ts:94-97`) dédoublonne par `includes`, la liste ne peut PAS croître au-delà du nombre d'objets du dossier. Fait vérifiable, pas une hypothèse. Le `413` existant documente ce filet ; aucun code neuf pour ça.

## VERDICT
Je lève mon veto conditionnel sur la troncature. **Non-bloquant** sur `EN SA POSSESSION` non borné : résiduel réel mais statiquement borné, nommé, propriétaire désigné, filet déjà en place et déjà testé (413).

---

## Statut de mes objections tour 1

1. **Troncature `objets_possedes.slice(-K)`** → **RETIRÉE**. Motif : narratif-ia a raison sur le principe, et j'ai trouvé un fait de code (`ancrer()`, `narrateur.ts:381-388`) qui aurait rendu la troncature *techniquement* invisible au test de rang I5 sans la rendre correcte — le vrai défaut n'était pas dans le rang, il était dans la cohérence moteur/récit. Une garde qui passe le test mais rate l'invariant réel n'est pas une garde.

2. **Fusion KR-261 en un scalaire partagé R1/R3 (KR-235)** → **MAINTENUE en principe, désactivée cette itération**. Le plan P1→P2→P3 de narratif-ia ne touche pas R1 : `worker/index.ts:779` (le budget d'entrée libre du joueur) reste hors périmètre it4, non fermé. Pas un veto — un item à rouvrir explicitement le jour où une itération touche R1, avec la même règle : formule partagée, jamais la valeur brute.

## Annexe — lot révisé (contrat unique, brain/ seul)

| Fichier | N/R | Contenu |
|---|---|---|
| `src/brain/copilote/contexte/narrateur.ts` | R | Cascade P1→P2→P3 (narratif-ia), invariants I1-I7 avec mutants séparateurs ; `EN SA POSSESSION` et le suffixe `ETABLI`→fin **intacts octet pour octet** à tous les paliers (I5) |
| `src/brain/dossier/interprete.ts` | R | 1re garde de budget qui déclenche la cascade ; rejeu-un-coup si P3 encore trop long → `trop-long` |
| `src/brain/dossier/memoire.ts` | conditionnel | **Hors lot sauf si** l'orchestration de cascade y ajoute un export (ex. sélection de palier) — sinon `narrateur.ts` consomme `pasACondenser`/`borneDeFenetre` existants sans les modifier. À l'agent du lot de constater et documenter le choix, pas à moi de le figer |
| `worker/index.ts` | R (mineure) | Re-mesure `TAILLE_MAX_CORPS_IA` **seulement si** les seuils en caractères des paliers (7209/8023/1213/plancher 4511) en dérivent. R1 (`:779`) non touché — hors périmètre |
| Tests | N | Un test par invariant I1-I7, canari par mutant nommé ; test de non-dégradation `EN SA POSSESSION` obligatoire (assertion byte-for-byte aux 3 paliers) |

Aucun fichier `play-mode/`.

## Décisions prises en autonomie
- Le sort de l'objection fusion-formule KR-261 (R1/R3) n'était pas tranché nommément par un autre rôle → désactivée pour it4 plutôt qu'un blocage → sinon l'itération gagnerait un objectif hors du plan P1-P3 déjà validé par narratif-ia, et `worker/index.ts:779` resterait de toute façon ouvert faute d'appelant R3 à y accrocher.
- Le propriétaire et la forme du résiduel « `EN SA POSSESSION` non borné » n'étaient pas tranchés → accepté comme risque résiduel documenté (KR + open_questions, propriétaire `dossier-controles`) plutôt que de bloquer l'itération → sinon, itération retardée pour une croissance statiquement plafonnée par le dossier (preuve `deltas.ts:94-97`).
- L'appartenance de `memoire.ts` au lot n'était pas tranchée → rendue conditionnelle plutôt que d'imposer où vit l'orchestration de cascade → sinon, sur-spécification d'une découpe interne à un lot déjà unique.
