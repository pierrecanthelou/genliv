# Tour 2 — `ux-designer` (contre-lecture)

## 1. Contre-lecture — réponse nommée au `narratif-ia` (son § 3-§ 4)

Le narratif pose une règle de registre qui est de **ma** responsabilité (textes visibles) : constat à l'indicatif présent impersonnel, sujet = le document ; remédiation à l'impératif 2ᵉ personne du pluriel ; le message dit le fait + la conséquence runtime, jamais « votre aventure est injouable ». **Je l'adopte sans réserve.** Mes cinq textes la respectaient déjà en structure, mais son jeu est meilleur sur deux points que je retiens :

- **Règle 1 (orphelin)** : ma version ne comptait que **deux** familles de production (personnage, effet) ; sous la définition retenue (six chemins, `mene_a` compté), c'est un **fait incomplet**. J'adopte son constat à trois familles.
- **Règle 5 (sans voix)** : son « le modèle inventera sa façon de parler, et elle changera d'un tour à l'autre » nomme une **dérive runtime constatable**, plus précise que mon « ton générique ». J'adopte son constat.

En échange, j'ajoute à ses remédiations ce qui lui manquait : les **ancres de navigation vers les blocs réels**, vérifiées verbatim dans le code cette session. *Sans ces ancres, une remédiation dit QUOI faire mais pas OÙ — la moitié du contrat de langue que je dois livrer.*

## 2. Statut de mes objections et rejets du tour 1

- **RISQUE** (« goulot le plus fréquent, `dossier-reference.json` porte deux indices à détenteur unique ») — **RETIRÉ, mesuré FAUX.** Sous la définition retenue, `dossier-reference.json` porte **ZÉRO** goulot : ses quatre indices ont exactement deux producteurs. Je n'avais mesuré qu'avec le script étroit, pas avec la définition vers laquelle le comité a convergé.
  → **Reformulé et MAINTENU sur les bons porteurs** : le volume réel est **1 bloquant + 4 alertes + 5 infos = 10 lignes**, sans aucun goulot. Le risque de noyer un bloquant tient, porté par « sans présence » et « sans voix », pas par « goulot ».
- **OBJECTION** (aucune mesure du volume avant livraison) — **MAINTENUE, durcie** : je ne demande plus un relevé sans borne mais un **test pinné** dans `controles.test.ts` (10 contrôles / 1 bloquant / 4 alertes / 5 infos). *Une mesure recopiée à la main dans une revue rote au premier changement ; un test pinné casse et force une décision consciente.* Réserve : le couple 1/4 suppose que B-3 tranche en bloquant ; le total (10) et le compte info (5) sont invariants.
- **REJET 1** (grouper/trier les lignes) — **MAINTENU.** Rien ne contredit l'acquis « aucune vue ne trie ».
- **REJET 2** (plafonner les lignes / pagination) — **MAINTENU.** 10 lignes ne justifient pas d'y revenir, et masquer un bloquant derrière un plafond reste le contresens de fond.
- **REJET 3** (différenciation visuelle au-delà de `pastilles.ts`) — **MAINTENU.** Non contesté.

## 3. B-4 — je RETIRE `lieux`, j'adopte `depart`

Vérifié ce tour, `sections.ts` l. 89/97 : `depart` a `cle: 'charpente.depart'` — **exactement la racine du path fautif** — tandis que `lieux` a `cle: 'monde.lieux'`, une autre sous-arborescence (le catalogue, pas le pointeur de départ). Mon choix de tour 1 reposait sur une **lecture intuitive** (« c'est un lieu qui manque de monde ») sans vérifier la table des sections. Ce n'est pas un motif de mon terrain qui tienne contre un fait d'architecture mesuré trois fois.

**Mon `OÙ` reste inchangé** : `localiserEntite('lieu', lieuDepart, index)` → « Lieu « Foyer du guet » ». C'est un texte d'affichage, indépendant de la clé de section.

## 4. B-8 — je RETIRE « trancher maintenant », je MAINTIENS « pas de report silencieux »

Le chiffrage du tech-lead (deuxième feature dans la seule itération de n° 7 qui n'en touche aucune, lot unique → deux lots) heurte le signal de coupe de la skill. **Mon objection portait sur la navigabilité, pas sur la tranche verticale ; le tech-lead a raison sur son terrain.** Je rejoins R-8 : itération nommée ou `open_questions` avec propriétaire écrit — **un troisième report muet est le seul résultat que je continue de refuser.**

## ANNEXE — jeu FINAL des cinq messages (remplace celui du tour 1)

**1 — `indice-sans-source` · BLOQUANT** · section `indices` · path `monde.indices[].id`
- QUOI : « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. »
- QUOI FAIRE : « Confiez-le à un personnage (Personnages → Savoirs), révélez-le par un effet « révèle l'indice », ou faites-y mener un autre indice (Indices → Mène à). »

**2 — `indice-sans-source` · ALERTE (goulot)** · même section/path
- QUOI : « Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible. »
- QUOI FAIRE : « Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement depuis un autre indice (Indices → Mène à). »

**3 — `depart-desert` · BLOQUANT** (sous garde `personnages.length > 0`) · section `depart` · path `charpente.depart.lieu_id`
- QUOI : « Aucun personnage n'est présent au lieu de départ, le seul tour que l'auteur ne peut plus rattraper en jeu : la partie s'ouvre sans interlocuteur. »
- QUOI FAIRE : « Donnez une présence dans ce lieu à au moins un personnage (Personnages → Présence), ou changez le lieu de départ (Départ). »
- *Si B-3 tranche en ALERTE, retirer la clause « le seul tour… » : elle ne se justifie qu'au niveau bloquant.*

**4 — `personnage-sans-presence` · ALERTE** · section `personnages` · path `monde.personnages[].presence[].lieu_id`
- QUOI : « Ce personnage n'a de présence dans aucun lieu : le joueur ne pourra jamais le rencontrer. »
- QUOI FAIRE : « Ajoutez au moins une présence à ce personnage — un lieu, et si besoin un moment (Personnages → Présence). »

**5 — `personnage-sans-voix` · INFO** · section `personnages` · path `monde.personnages[].caractere.parler[]`
- QUOI : « Ce personnage n'a aucune réplique type : le modèle inventera sa façon de parler, et elle changera d'un tour à l'autre. »
- QUOI FAIRE : « Écrivez une ou deux répliques telles qu'il les dirait (Caractère exploitable → Manière de parler). »

**Ancres vérifiées par l'orchestrateur** : `MÈNE À` (`FicheIndice.tsx` l. 157) · `MANIÈRE DE PARLER` (`BlocCaractere.tsx` l. 158) · `PRÉSENCE` (`BlocPresence.tsx` l. 51) · `Savoirs`, titre de bloc (`FichePersonnage.tsx` l. 277) · `révèle l'indice` (`deltas.ts` l. 67).

Aucun terme interne (Delta, `refKinds`, `Savoir.indice_id`, `SourceIndice`) n'atteint la prose. Aucun message ne dit « votre aventure est injouable ».
