# Cadrage n°12 `moteur-acteurs` — Tour 2 — Narratif & IA

## RÉPONSE AUX OBJECTIONS — nommées

### 1. Tech Lead : « rien ne touche `types.ts`/`destinations.ts`/`validate.ts` », contre mon § F (nommage) → je retire ma proposition

Le Tech Lead a raison, et pas seulement sur la procédure. Ma proposition contredisait quatre textes déjà écrits, que je n'avais pas relus :
- **KR-195** : « la basculer pour les seuls personnages casserait la symétrie sans décision transverse ». La question vaut pour 8 collections.
- `destinations.ts:296-299`, `types.ts:624-626` (`Relation.cible_id`) et `types.ts:1031-1034` (`Objet`) : la réponse est « une PROJECTION de l'assembleur, jamais une bascule de `nom` vers `ia`, jamais une clé de plus ». Ma « condition de rôle » était exactement cette bascule.

**Nature du changement, tranchée par les précédents : c'est un changement de contrat de schéma, donc un lot `contrat` (Décision A).** Ce n'est pas une ligne qu'une feature consommatrice pourrait ajouter. Les deux seules audiences conditionnées au rôle (`Relation.secret`, `Caractere.cede_si`) ont leur prédicat écrit « ICI et au JSDoc de `types.ts`, nulle part ailleurs » et ont été livrées par des itérations de schéma (`dossier-fiches` it5/it8). Côté moteur, n°9 a classé les trois fichiers comme INTERDITS, et en n°11 le Tech Lead jugeait leur réouverture « veto tech-lead en soi ». Les features moteur écrivent dans `sessionDestinations.ts`, qui n'est PAS sur la liste de la Décision A.

**Le risque reste ouvert, même si ma proposition tombe.** `moteur-interprete/specification.json:255` fait de la portée complète de KR-262 la propriété de n°12, bloquante dès qu'un premier PNJ parle. Réponse dès it1, sans toucher au schéma :
- **Projection par le code.** Le PNJ est désigné par sa `fonction` et son `apparence`, toutes deux `ia`, dans R1, R3 et le bloc `TES LIENS` de R4 — même geste que R1 pour les lieux (KR-262). Le narrateur ne connaît plus « l'homme » mais « le forgeron du Foyer du Guet ».
- **Garde de structure.** Un PNJ présent mais sans aucune prose d'identité ne reçoit aucun rang dans R1 (KR-267 transposé) — ni `parler`-able, ni joué par R4. La fermeture se fait côté auteur (`dossier-controles`), jamais côté moteur.
- **Résidu accepté et nommé.** Un PNJ à qui l'on demande son nom peut en inventer un, qui tient tant qu'il reste dans la fenêtre `TU AS DIT` (K=4), et peut dériver au-delà. Bénin au sens strict : aucun identifiant, aucune condition, aucun état ne s'appuie dessus — une incohérence de fiction, pas une fuite. Devient une dette transverse à déclencheur (lot `contrat` seul, pour les 8 collections), déclenchée par une contradiction de nom mesurée en partie réelle. Jamais pour les seuls personnages.
- Pour QA : l'extension de KR-282 (« changement d'audience de `Personnage.nom` ») n'a plus d'objet en n°12.
- Pour UX : aucun message système ne doit être composé depuis `Personnage.nom`. En saisie libre, un PNJ absent n'est pas candidat de R1, tombe dans `sans_commande` (KR-264, déjà livrée). « N'est plus de ce monde » ne correspond à aucun état en n°12 — la mort d'un PNJ relève de n°13.

### 2. KR-268 : fait établi ou proposition ? Réponse au PM, à QA, et au Tech Lead

**KR-268 est établi**, mais il dit moins que ce que je lui ai fait dire. Source : `code-knowledge.json:820-822`, `moteur-interprete`, généralise KR-266. Son contenu réel : *un champ de sortie n'entre au schéma que si un lecteur réel existe dans la même itération*. « Le schéma grandit d'un champ par itération » n'y figure pas — c'était MA proposition de découpage, présentée à tort comme le KR. Je corrige : c'est une PROPOSITION.

Appliqué honnêtement :
- **PM — KR-268 ne condamne pas ton it1.** `indices_reveles` a son écrivain (`DELTAS.reveler_indice`/`a_dit`), `delta_confiance` a le sien (`EtatPnj.confiance`, lu par `confiance_min` dans le même lot). Je retire donc mon objection « contrat à trois champs d'un bloc » — ce qui nous sépare relève du périmètre, pas d'un veto. Mes conditions si ton it1 est retenue : (1) section Confiance écrite dans REGLES avant le code (KR-279 de QA) ; (2) Δ ∈ {−1,0,+1}, rejeté hors de ces valeurs, jamais écrêté ; (3) R4 ne voit ni le nombre ni le seuil ; (4) fail-closed sur les trois autres portes ; (5) la fixture est enrichie. **Mesuré** : dans `dossier-reference.json`, le seul savoir gardé par `confiance_min` est celui de Mira (l.186-188), aussi gardé par `apres_indice_id`, et Mira n'a pas de `presence` — avec le fail-closed, ton it1 ne révèle donc rien sur la fixture actuelle.
- **QA — ton critère 1 tombe sous KR-268 dans ton propre découpage.** Tu as adopté le fail-closed (merci). Ton it1 n'évalue donc aucune porte et n'injecte aucun savoir. Résultat : `indices_reveles` toujours vide, `delta_confiance` sans lecteur — le cas exact de KR-268 (rangs injectés pour rien). Le critère doit s'écrire **par itération** (« le schéma de l'itération N »), et vivre dans `schemaSortie.ts` (`validerActeur` voisin de `validerNarrateur`/`validerArbitre`), pas dans `worker/index.test.ts`.
- **Tech Lead — même incohérence.** Ton it1 livre `{replique, indices_reveles, delta_confiance}`, mais tes portes n'arrivent qu'en it2 : soit le champ est mort (KR-268), soit des savoirs sont injectés sans évaluation et fuient. Choisir : `indices_reveles` en it2 (mon découpage), ou au moins un évaluateur de porte en it1 (le découpage du PM).

**Il reste donc deux it1 cohérentes, pas quatre** : la mienne (`{replique}`, zéro savoir) et celle du PM (`confiance_min` câblée). Ma préférence, hors veto : la mienne — elle observe la voix, la présence et la mémoire de R4 seules. Celle du PM ajoute dans la même première observation une règle neuve, un champ de session neuf et une sortie numérique.

**Deux points QA que je maintiens, dans mon domaine :**
- **KR-283 (« repli déterministe, jamais de silence ») : veto sur la réplique de repli.** Une réplique écrite par le code est de la fiction hors dossier dans la bouche d'un PNJ — pire, stockée, elle repart dans `TU AS DIT` comme si le PNJ l'avait dite. Précédent écrit : « un récit indisponible n'en pose AUCUN — `undefined` est un état LÉGAL, jamais un trou à combler par un texte neutre » (`session.ts:105-108`). Comportement voulu : rejeu, puis refus atomique (aucun Δ, aucun indice, KR-230), aucune réplique posée, bandeau d'interface existant. « Jamais de silence » est tenu, mais par l'interface, pas par la fiction.
- **Ton objection 3 (« R4 ne reçoit jamais les relations secrètes ») est fausse pour le porteur.** R4 du porteur reçoit ses relations, y compris les secrètes (`destinations.ts:328-332`). Ton critère 5 lui est juste (« hors de son porteur »). Mais c'est un test d'**assembleur** (contexte acteur, par valeur, deux PNJ), pas une ligne de `sessionDestinations` : `relations[]` est une feuille du dossier, pas de la session.

### 3. UX — `CarnetIndices.tsx`

Ton Tour 2 a déjà intégré l'essentiel. Je retire l'enrichissement d'`indices_connus` en objets proposé par le PM : KR-013, plus une session persistée depuis n°9 it1 sans chemin de migration (KR-251). Deux points restants :

- **(a) La clé de jointure.** « La première entrée dont `indices_reveles` contient cet id » suppose un nouveau champ de journal (doublon de `EntreeJournal.deltas`, KR-013). La jointure existe déjà : l'entrée dont `deltas` contient `{delta:'reveler_indice', cibles:[id], effet:'applique'}` (`evaluate.ts:46-51`) — `effet:'applique'` désigne exactement la première révélation, couvre aussi les révélations par jalon déjà journalisées. Condition renvoyée au Tech Lead : toute révélation par R4 passe par ce delta journalisé, jamais par une écriture nue dans `indices_connus`.
- **(b) Le libellé `monde.indices[].nom` : veto.** Le qualifier de « chrome d'interface » ne change pas son audience (`types.ts:1031-1032`, rendu transverse par KR-195, runtime extractable). **Mesuré sur la fixture** : `indice.lettre-de-la-vigie` s'appelle « Une lettre signée de la Vigie » alors que sa `verite` dit que la signature n'est pas la sienne — le carnet présenterait au joueur, par le code lui-même, comme un fait ce que le dossier déclare faux. Remplacement sans contrat neuf : libellé **dérivé du journal**, `TOUR 7 · PARLER` (tour + verbe de `COMMANDES[origine]`, registre clos, mono majuscules). Si `recit` absent (état légal) : « Noté au tour 7 — récit indisponible », jamais de fiction de remplacement. L'alternative « libellé généré par l'IA » est rejetée aussi : contrat de sortie de plus pour du chrome.
- **(c) Corollaire : où vit la réplique.** Proposition : `EntreeJournal.recit` de l'entrée `parler` — l'invariant « au plus un récit par pas » tient puisque R3 n'est jamais appelé sur un pas `parler`. Le Tech Lead tranche ce domicile.

## MA POSITION MISE À JOUR

**Retiré :** toute bascule de `Personnage.nom` ; « un champ par itération » présenté comme KR-268 (c'est une proposition) ; « contrat à trois champs d'un bloc » comme objection au PM.
**Durci :** aucune fiction écrite par le code quand R4 échoue ; aucun champ d'audience `auteur` à l'écran joueur (carnet).
**Maintenu :** fail-closed (désormais consensuel) ; bornes de confiance = `CONFIANCE_MIN/MAX`, départ 0 ; Δ ∈ {−1,0,+1}, jamais écrêté ; `intention_suivante` rejeté ; `PorteeContreMesure` réaffecté à n°14 ; mémoire d'acteur K=4 répliques par PNJ.
**Ajouté :** la spec de n°12 enregistre la fermeture **partielle** de `moteur-interprete` spec:255 (projection par `fonction`/`apparence`, dette transverse à déclencheur sur le nom propre, 8 collections). `TU AS DIT` exige de connaître le PNJ visé par chaque pas `parler` par une donnée structurée (la commande et sa cible), jamais en analysant le `texte` de l'entrée joueur — domicile à trancher par le Tech Lead.

**Contrat R4 (delta vs Tour 1)** : le bloc `TOI` ne contient aucun nom ; la cible de chaque ligne de `TES LIENS` est projetée par sa `fonction`/`apparence` ; tout le reste inchangé.

## VERDICT
Recevable sous réserve. **Veto levé** sur le découpage du PM en tant que tel (question de périmètre, pas de frontière). **Veto maintenu, resserré à trois points** : (1) une réplique de repli écrite par le code (KR-283 tel qu'il est rédigé) ; (2) `monde.indices[].nom` affiché au joueur ; (3) toute it1 qui porte `indices_reveles` sans évaluer aucune porte (découpages Tech Lead/QA en l'état). **Objection non bloquante** : le champ de journal `indices_reveles` doublerait `deltas` — domaine du Tech Lead.

## Décisions prises en autonomie faute de spécification
- Nom propre inventé par un PNJ au-delà de K=4 → accepté comme résidu, dette transverse à déclencheur mesuré → sinon un lot `contrat` sur 8 collections ouvre une feature moteur pour un défaut jamais observé.
- Libellé du carnet → tour + verbe dérivés du journal → sinon le carnet montre au joueur le cadrage de l'auteur, parfois faux.
- Clé de jointure du carnet → `deltas` filtrés sur `reveler_indice` + `effet:'applique'` → sinon deux sources de vérité que rien ne resynchronise.
- Domicile de la réplique → `EntreeJournal.recit` de l'entrée `parler` → sinon le carnet et la mémoire de R3 lisent deux sources.
- Échec de R4 → bandeau d'interface, aucune fiction → sinon le code parle à la place du PNJ.
- PNJ présent sans prose d'identité → non candidat de R1 → sinon R4 incarne un PNJ sans rien à incarner.

## Fichiers vérifiés pour ce tour
`code-knowledge.json` (KR-195, 262/266/268) ; `src/brain/dossier/destinations.ts` (124-177, 254-302, 323-382, 424-456) ; `src/brain/dossier/types.ts` (600-633, 1020-1034) ; `src/brain/dossier/session.ts` (60-159) ; `src/brain/dossier/evaluate.ts` (46-64) ; `src/brain/dossier/faits.ts` (25-74) ; `src/brain/dossier/commandes.ts` (226-245) ; `src/brain/copilote/schemaSortie.ts` ; `src/brain/dossier/__fixtures__/dossier-reference.json` (160-236, 286-305) ; `src/features/moteur-interprete/specification.json` (220, 255) ; `.claude/raffinage/moteur-dossier-it1.revue.md` ; `.claude/raffinage/moteur-dossier-it2.plan.md` ; `.claude/raffinage/moteur-dossier-it3.plan.md` ; `.claude/raffinage/moteur-arbitre-cadrage/tour1-tech-lead.md` ; `.claude/raffinage/moteur-acteurs-cadrage/tour2-{ux-designer,qa}.md`.
