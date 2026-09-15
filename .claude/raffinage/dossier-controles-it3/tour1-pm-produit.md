# Tour 1 — `pm-produit`

RISQUE      — Deux des cinq règles (« lieu de départ désert », « goulot d'étranglement ») n'ont, dans ce cadrage, qu'un NOM : je ne peux pas certifier leur valeur auteur sans connaître le champ lu et le motif du niveau. Risque secondaire : 5 règles × KR-197/202 (déclenche / ne-déclenche-pas) peut pousser le compte de tests bien au-delà de ce qu'une seule règle (amorce, it1) a coûté, sans qu'un second lot ait été proposé pour l'absorber.

OBJECTION   — Le `goal` nomme cinq libellés + niveaux sans dire, pour quatre d'entre eux, QUEL CHAMP est lu ni POURQUOI ce niveau plutôt qu'un autre (ex. la frontière exacte entre « lieu de départ désert » bloquant et « personnage sans présence » alerte, toutes deux fondées sur l'absence de `presence`). Sans cette ligne par règle, je ne peux pas distinguer une vraie coupure de valeur d'un habillage.

PROPOSITION — Avant essaim : UNE LIGNE PAR RÈGLE (champ lu → niveau → motif), sur le modèle de `PROSES_AMORCE`.
  · Tension n° 2 : je défends « indice orphelin » **BLOQUANT** malgré l'audience `ia` de `savoirs[].indice_id` — la clause « pas de bloquant sur un champ `ia` » protège la QUALITÉ DE PROSE (assez écrit pour le modèle), pas l'ATTEIGNABILITÉ STRUCTURELLE (un chemin existe ou non) : deux classes de défaut, pas la même clause.
  · Tension n° 3 : je maintiens le report une 3ᵉ fois, à coût nul pour it3 (aucune surface neuve, une seule feature touchée), CONTRE UN ENGAGEMENT DATÉ — s'il n'atterrit sur aucune itération qui rouvre déjà `bascule-editeur`, il devient sa propre micro-itération après it5.

VERDICT     — **recevable sous réserve** (la ligne par règle manquante).

## ANNEXE

### Hors périmètre défendu (acquis au cadrage, je m'y tiens)
- **Pont vers les avertissements de `validateDossier`** (it4 neuve) — matériau et motif de découplage encore à trancher, ne pas l'anticiper en passant dans it3.
- **Atteignabilité + « canon sans objectif »** (it5) — dépend d'`atteignabilite.ts`, absent aujourd'hui ; l'intégrer casserait l'ordre.
- **`Indice.portee` / « Intrigue en second plan »** — rejeté au cadrage (aucun champ d'effet sur `PlanAction`) ; décision close, non rouvrable.
- **« Difficulté non calibrée »** — reportée à n° 16 (le héros n'existe qu'au runtime, pas dans le dossier) ; décision close.
- **Focus dans le champ fautif d'une fiche** — traverse 4 features, aucun lot étanche ; reste une itération à part si le besoin se confirme.
- **Rendu de `jouable` en verdict global** — premier rendu légitime à n° 9 (`previewDisabledReason`) ; un bandeau maintenant s'allumerait sur 100 % des dossiers neufs.
- **Toute assertion de teinte au rendu** (`toHaveStyle`) — instrument cassé, tranché it2 ; le `tone` se prouve au contrat.

### REJETS nommés (prononcés ce tour — à recopier au registre des désaccords, § 8)
- **REJETÉ — intégrer le clic de ligne → sélection de section dans it3.** Motif : it3 n'a structurellement besoin de rouvrir AUCUN fichier de `bascule-editeur` (aucune surface neuve) ; l'y ajouter romprait ce confinement pour un gain de navigation, pas pour la valeur de démo de cette itération.
- **REJETÉ — faire tomber « indice orphelin » de bloquant à alerte au nom de l'audience `ia` de `savoirs[].indice_id`.** Motif : la clause d'audience protège la complétude d'une prose destinée au modèle, pas l'existence d'un chemin structurel vers un indice — un indice qu'aucun PNJ ne détient rend l'aventure objectivement injouable, quelle que soit l'audience du champ qui porte la référence.

### Fichiers lus
`CLAUDE.md` · `src/features/dossier-controles/specification.json` · `.claude/raffinage/dossier-controles-it3/cadrage.md` · `src/brain/dossier/controles.ts` · `src/brain/dossier/destinations.ts` (recherche ciblée sur les 4 chemins du cadrage).
