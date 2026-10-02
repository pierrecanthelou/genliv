# Raffinage `moteur-acteurs` it2 — Tour 2 — PM Produit

## RÉPONSE AUX OBJECTIONS — nommées

**1. Tech Lead vs Narratif-IA (révélation structurelle vs choisie par R4)**

Je ne tranche pas ça en philosophie d'architecture — je le tranche en relisant ce qui est déjà écrit et approuvé dans `src/features/moteur-acteurs/specification.json`, AVANT ce tour de raffinage :
- `plan.acceptance_criteria[3]` : « …le savoir s'ouvre et son identifiant entre dans `ReponseActeur.indices_reveles` comme un RANG (jamais un identifiant brut) — test à 4 branches (2×2) dont seule (vrai,vrai) révèle. »
- `plan.brain_contracts[1]` : « `ReponseActeur` = {replique} — grandit à {+indices_reveles} en it2… »
- `implementation.resolved_decisions` : « RETENU (cadrage, tour 2, Narratif-IA corrige sa propre sur-généralisation du tour 1) — … elle autorise it2 à porter à la fois l'évaluateur de deux portes ET le champ `indices_reveles` dans le même lot… »

La proposition du Tech Lead (« `ReponseActeur` ne gagne RIEN ») ne discute pas une zone grise : elle rouvre une décision actée au cadrage, nommément sur ce champ et sur KR-268/285. Mon point 7 s'applique à la lettre — ce n'est pas un désaccord d'architecture sur lequel je m'abstiens, c'est la réouverture d'un contrat déjà signé par le comité.

Côté valeur-auteur : la proposition du Tech Lead rend `revele_comment` (le champ où l'auteur dit la MANIÈRE dont un savoir sort) définitivement mort — dans son Lot A, la révélation est une ligne mécanique de journal, jamais lue par aucune réplique, jamais consultée par le modèle. La proposition de Narratif-IA l'injecte précisément au moment où R4 a le savoir ouvert devant lui — c'est le seul des deux designs qui donne un sens d'exécution à ce champ.

Précision budgétaire pour le Tech Lead : garder `indices_reveles` sur `ReponseActeur` ne crée pas de 3e lot — c'est le même Lot A (contrat) qu'il propose déjà, avec une liste de fichiers plus longue, zéro des trois fichiers interdits (`types.ts`/`destinations.ts`/`validate.ts`) concerné. Le plafond de 4 lots tient.

**2. Mon objection de tour 1 sur `consomme:true`**

RETIRÉE. Narratif-IA a raison sur le fond (lier une perte d'inventaire au choix narratif du modèle, même borné, reste une mutation d'état décidée indirectement par une sortie libre) — son domaine, je m'y range. Et indépendamment de son veto, je retire pour une raison qui m'appartient : la démo d'it2 n'a besoin de rien de plus que la possession simple (`possede_objet`) pour montrer « un PNJ qui ne révèle que ce qu'il sait ». Appliquer la consommation est du polish non requis par le goal écrit — exactement ce que mon point 6 (squelette d'abord) m'interdit de défendre. Rien n'est perdu pour l'auteur : le champ `consomme` reste écrit au schéma, juste non appliqué en it2 ; je rejoins Narratif-IA pour que ça aille explicitement en `open_questions`.

## MA POSITION MISE À JOUR

Je soutiens le design de Narratif-IA pour la révélation (R4 choisit, borné par un évaluateur code fail-closed, re-vérifié avant application) : seule lecture conforme à l'AC déjà écrit et au goal du roadmap (« un PNJ qui ne révèle que ce qu'il sait », pas « un mécanisme qui parle à sa place »). Je retire ma proposition tour 1 sur `consomme:true` en it2. Je demande que l'entrée `open_questions` nomme explicitement le verbe `donner <objet> <pnj>` (consentement structuré, futur) comme seul chemin de retour pour `consomme:true` — déjà proposé par Narratif-IA (§K), je l'endosse.

## VERDICT
Recevable sous réserve : (a) `ReponseActeur.indices_reveles` reste au schéma d'it2 conformément à AC#4/brain_contracts/resolved_decision déjà actés — sinon durcie en veto pour réouverture de décision ; (b) `consomme:true` sort explicitement du périmètre it2 et part en `open_questions` nommé (verbe `donner`, consentement structuré) plutôt que d'être silencieusement absent.

---

## Décisions prises en autonomie faute de spécification (tour 2)
- Portée lot de `indices_reveles` (3e lot séparé vs extension du Lot A contrat) → extension du Lot A existant → sinon inflation artificielle du compte de lots contre le plafond de 4, pour un changement qui touche déjà les mêmes fichiers contractuels.
- Traçage de `consomme:true` (silencieusement absent vs `open_questions` nommé) → nommé explicitement, verbe `donner` candidat → sinon la porte à moitié câblée risque d'être redécouverte comme un bug plus tard plutôt que comme une dette connue et assumée.
