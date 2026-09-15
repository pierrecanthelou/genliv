# Tour 2 — `pm-produit` (contre-lecture)

## 1. Contre-lecture — réponse nommée au `narratif-ia` (B-3)

Le narratif pose sur mon terrain que « bloquant » reposerait sur une **prémisse non écrite**, alors que la feature a choisi KR-224 (monde ouvert) pour amputer « personnage sans présence ».

**Je tranche : bloquant, avec la prémisse écrite.** Le narratif a raison de demander la prémisse, mais son inquiétude ne tient plus une fois qu'elle est écrite :

> KR-224 dit que le monde s'explore par des chemins multiples **une fois la partie lancée** — il ne dit rien du **tour zéro**, qui n'a par construction qu'un seul chemin, puisqu'aucune partie n'atteint un deuxième tour sans être passée par le premier.

« Personnage sans présence » reste **alerte** parce qu'un PNJ isolé est **contournable** par un autre chemin du monde ouvert ; le lieu de départ ne l'est pas, puisqu'**aucun autre chemin n'existe encore à cet instant**. Ce n'est pas la même absence : **l'une est locale à un nœud du graphe, l'autre en est la racine.**

Ceci répond aussi à **ma propre objection de tour 1**, qui pointait exactement cette frontière comme non résolue — elle l'est, et dans le sens que je défendais.

Je note sans objection nouvelle que le message du narratif (§ 4) porte **le fait sans la prémisse** — correct, conforme à sa propre règle de voix.

## 2. Statut de mes objections et rejets du tour 1

- **OBJECTION** (« une ligne par règle : champ lu → niveau → motif ») — **RETIRÉE (satisfaite).** Les cinq lignes existent : tech-lead § 2 (path/section/niveaux, 4 entrées) + UX § 1 (OÙ/QUOI/QUOI FAIRE) + narratif § 4 (table) et § 1 (clause d'audience réécrite). Mon doute — distinguer une vraie coupure de valeur d'un habillage — est levé aux deux endroits où je l'avais : (a) orphelin/goulot, un compteur à deux seuils, suit le précédent `amorce-non-redigee` ; (b) départ-désert bloquant vs sans-présence alerte est justifié par une **prémisse distincte**, pas par un choix éditorial.
- **REJET 1** (intégrer le clic de ligne dans it3) — **MAINTENU**, renforcé par la mesure indépendante du tech-lead (R-8). **Converti en engagement daté** (annexe B-8) : ce n'est plus un report muet.
- **REJET 2** (abaisser « indice orphelin » à alerte) — **MAINTENU sur la conclusion, AFFINÉ sur le motif.** J'adopte la formulation du narratif (« nature du geste », pas « audience du champ ») comme critère opérant : plus robuste que ma distinction prose/structure, elle couvre nommément les **trois** gestes structurels (`indice_id`, `reveler_indice`, `mene_a`) que je ne visais qu'en un seul.

**Aucun de mes deux verdicts ne devient veto** : les deux tiennent en objection tranchée, pas en blocage.

## ANNEXE

### B-3 — Prémisse à écrire dans `resolved_decisions`

> « Le lieu de départ n'est pas un nœud comme les autres du monde ouvert (KR-224) : c'est le seul point **sans itinéraire de contournement**, puisqu'aucune partie n'atteint un deuxième tour sans être passée par lui. KR-224 amortit l'absence d'un PNJ *isolé* parce qu'un autre chemin peut y mener plus tard ; il ne dit rien du tour zéro, qui n'a par construction qu'un seul chemin. D'où : `depart-desert` reste **bloquant**, `personnage-sans-presence` reste **alerte** — même absence de `presence[]`, **portée différente dans le graphe**. »

Le texte joueur (« le premier tour n'aura aucun interlocuteur ») n'a pas à changer.

### B-8 — Engagement daté (remplace le report muet)

**Itération n° 4 de `dossier-controles`** : « L'auteur clique une ligne du panneau de contrôles et atterrit sur la section fautive. » Fichiers : `SectionNav.tsx` + `DossierEditorScreen.tsx`, ~7 lignes + 2 tests (chiffrage tech-lead). **Propriétaire : le PM, au cadrage qui suit la clôture d'it3** — déclencheur **événementiel, pas calendaire** : le commit qui ferme it3 ouvre le cadrage d'it4.

**Conséquence** : le pont vers les avertissements de `validateDossier`, que j'avais placé en it4, **se décale en it5** — rien ne l'attachait à ce numéro, et aucune dépendance technique ne l'ordonne avant le clic de ligne. Répond à la fois à l'UX (position tranchée, pas un troisième report silencieux) et au tech-lead (R-8 : « lui donner une itération propre »).

### B-5 — Rejet de la borne `portee === 'premier'`

83 % → 75 % **déplace** le bruit, ne l'éteint pas, au prix d'une condition de règle + un KR. Et surtout : borner *seulement* « sans voix » alors que « sans présence » reste non bornée (4/6, soit 67 %) introduirait une **asymétrie que rien dans le message ne justifie à l'auteur** — pourquoi ce personnage secondaire déclenche « sans présence » mais pas « sans voix » ? Le narratif applique lui-même à « sans présence » le bon principe (« la fixture est incomplète, la règle a raison ») ; **je demande la même lecture, sans exception, pour « sans voix »**. Reste `info`, non borné.

### B-6, B-9 — pas d'objection PM

B-6 : que l'index reste privé ou naisse en fichier public ne change ni le lot, ni l'ordre des features, ni la phrase de démo. Je m'aligne sur le tech-lead par principe de squelette minimal, sans autorité à trancher au-delà de cette neutralité.
B-9 : le relevé de volume n'ajoute aucune surface ni aucun critère — **à livrer avec la revue, hors lot**.

### Hors périmètre — inchangé

La liste du tour 1 tient telle quelle ; aucun désaccord de tour 2 ne la rouvre.
