# NOTE D'OUVERTURE — narratif-ia — `dossier-fiches` it5, tour 1

**RISQUE** — `secret` est le **premier champ du schéma dont l'injection dépend de QUI DEMANDE**. `si_bloque` (it4) se conditionnait à un fait de *session* ; ici c'est l'identité du **rôle**, axe que `destinations.ts` déclare explicitement ne pas porter (« la granularité par rôle appartient à l'assembleur n° 10 »). Livré avec la seule phrase du cadrage, ce prédicat sera résolu à la n° 10 par une consigne de prompt (« ne parle pas des relations secrètes ») — exactement ce que le plan de cible § 2.5 nomme *moins fiable* qu'un filtrage structurel. Une garantie structurelle qui se dégrade en consigne, c'est mon veto habituel entré par la porte de service.

**OBJECTION** — « une relation secrète n'entre pas dans le contexte d'un rôle qui ne doit pas la connaître » n'est pas une spécification, c'est une tautologie. Elle ne dit ni si une relation est un fait du **PORTEUR** ou de la **PAIRE** — question qui décide tout le reste —, ni ce que devient une relation `secret: false` (non-secret ≠ public pour tous les rôles), ni que le **narrateur** en est exclu lui aussi. Seconde objection, sur le goal : « sa présence dans le monde (lieu, **moment**) » promet un horaire que rien n'évalue en it5.

**PROPOSITION** — (1) écrire le prédicat en **une phrase, à deux sites** (JSDoc `Relation.secret` + commentaire de sa ligne de table), forme exacte en annexe ; **zéro table neuve** (décision A, précédent `si_bloque`). (2) `INTENSITE_MIN/MAX = -3/+3` nommées dans `dossier/types.ts` auprès de `CONFIANCE_MIN/MAX`, constantes **distinctes** (idiome `CAMPS_PERSONNAGE`), 2 tests borne / borne+1. (3) `presence[].quand` → `auteur`, tranché.

**VERDICT** — **recevable sous réserve** (réserves 1 et 3 dans le lot contrat, pas après).

---

## ANNEXE (hors quota)

### A. `presence[].quand` — TRANCHÉ `auteur`

Même raisonnement que `but.echeance` (it4) et **a fortiori** : une échéance anticipée fait tomber une horloge en avance ; une **disponibilité** lue par le narrateur le fait **contredire la scène que le moteur vient d'assembler**. « Il n'est là que la nuit » narré alors que le moteur a placé le PNJ dans le lieu à midi — c'est le modèle qui décide de la présence, donc d'un état. Le contexte diffère de `echeance` dans le sens qui **renforce** la conclusion, pas qui l'affaiblit : `lieu_id` + l'état de session décident déjà « PNJ présents » (plan de cible § 2.5, « cadrage par la scène »), et la couleur du moment est déjà `ia` ailleurs (`monde.lieux[].ambiance`). Rien n'est perdu.

```ts
'monde.personnages[].presence[].lieu_id': 'moteur',
// `auteur`, MÊME ARBITRAGE que `but.echeance` (it4) et A FORTIORI : une échéance
// anticipée fait tomber une horloge en avance ; une DISPONIBILITÉ lue par le
// narrateur le fait CONTREDIRE la scène que le moteur vient d'assembler — « il n'est
// là que la nuit » narré alors que le moteur a placé le PNJ ici à midi, c'est le
// modèle qui décide d'une présence, donc d'un état. Le moment courant vient de la
// SESSION, jamais de la fiche ; la couleur du lieu est déjà `ia` (`lieux[].ambiance`).
// Se desserre vers `ia` sans coût le jour où la n° 14 livre un jumeau `quand_expr`
// évaluable, ou la n° 10 un libellé de disponibilité DÉRIVÉ PAR LE CODE avec sa
// propre ligne d'audience. Aucune PARAPHRASE en attendant.
'monde.personnages[].presence[].quand': 'auteur',
```

### B. `relations[]` — les quatre lignes recommandées

```ts
// Un identifiant est un HANDLE : le code le résout, le modèle reçoit le CONTENU.
// ⚠ CE QU'IL RÉSOUT AUJOURD'HUI N'EST PAS INJECTABLE — voir note D.1.
'monde.personnages[].relations[].cible_id': 'moteur',
// La NATURE du lien en français (« son frère », « son créancier ») — `ia`, même
// famille que `plan_actions[].action` : c'est ce que le rôle acteur JOUE. C'est aussi
// ce qui remplace le chiffre côté prose, et la raison pour laquelle `intensite` peut
// rester `moteur` sans appauvrir la scène.
'monde.personnages[].relations[].lien': 'ia',
// L'INTENSITÉ — `moteur`, exactement pour la raison des huit caractéristiques et des
// six curseurs (KR-193, open_question « libellés dérivés ») : un NOMBRE SIGNÉ qui code
// un fait de jeu, et dont le seul consommateur écrit en fait un SEUIL (plan de cible
// § 2.6 : deux PNJ dans un même lieu et `intensite >= 1` → le moteur transfère
// l'indice hors caméra). Un modèle qui lit `-2` connaît l'exacte profondeur d'une
// inimitié que la scène n'a pas montrée : il la joue au premier tour, avant que le
// joueur ait rien observé. AUCUNE PARAPHRASE non plus (« très hostile ») tant que la
// n° 10 n'a pas livré un libellé dérivé PAR LE CODE et sa propre ligne d'audience.
'monde.personnages[].relations[].intensite': 'moteur',
// LE DRAPEAU DE SECRET — `moteur`, et il ne se contente pas de rester hors contexte :
// il COMMANDE l'injection de SA PROPRE LIGNE. La table dit l'AUDIENCE, le MOMENT est la
// charge de la n° 10 — même dispositif que `plan_actions[].si_bloque`, et le prédicat
// est écrit ICI et au JSDoc de `Relation.secret`, nulle part ailleurs (voir § C).
'monde.personnages[].relations[].secret': 'moteur',
```

**Réponse au point 4 du cadrage** : oui, le principe des caractéristiques/curseurs s'applique **à l'identique** à `intensite` — nombre signé, `moteur`, ni brut **ni paraphrasé** avant que n° 10 ait livré un libellé dérivé par le code *et* sa ligne d'audience. La seule différence à écrire : le substitut de prose existe **déjà** ici (`lien`), là où `stats` s'appuyait sur `apparence`/`fonction`.

**Bornes** : `INTENSITE_MIN = -3` / `INTENSITE_MAX = 3` dans `dossier/types.ts`, **constantes distinctes** de `CONFIANCE_MIN/MAX` bien que les valeurs coïncident (précédents `CAMPS_PERSONNAGE`/`CAMPS`, `PorteeContreMesure`/`Portee`) — deux échelles qui coïncident aujourd'hui, une seule constante et elles dérivent ensemble au premier changement. Hors borne = **bloquant** à l'import, même motif que `CURSEUR_MIN/MAX` (une échelle ouverte rend le libellé dérivé indéfini). **Rien dans `docs/REGLES-DU-JEU.md`** tant qu'aucun code ne lit le seuil `>= 1` : le jour où la n° 12 l'écrit, la doc passe **en premier** (KR-130), pas l'inverse.

### C. Mécanisme exact du gating de `secret` — la phrase à écrire aux deux sites

> Une ligne de `relations[]` n'entre **que** dans le contexte de l'appel **acteur du personnage QUI LA PORTE**. Si `secret !== true`, elle entre **en plus** dans le contexte du **narrateur**, pour une scène où le porteur est présent. Elle n'entre **jamais** dans le contexte d'un **autre** personnage, ni dans celui de la **cible**, ni dans celui de l'arbitre.

Ce que cela règle, point par point :

1. **Quelle ligne exactement est exclue** : la ligne entière (`lien` + l'appellation dérivée de `cible_id`). `intensite` et `secret` sont `moteur` : ils ne sont d'aucun contexte, secrets ou non. Le gating ne porte donc que sur **une paire injectable**, ce qui le rend testable en un point.
2. **De quel contexte** : celui de **tout rôle sauf l'acteur du porteur**. Le narrateur est exclu au même titre qu'un autre PNJ — c'est le motif déjà écrit pour `camp` (« un narrateur qui sait qu'un personnage est antagoniste le joue hostile avant que la scène ne l'ait révélé »).
3. **Porteur ou cible ?** — **porteur seul, aucune réciprocité dérivée.** Une relation est un fait **du personnage qui la porte**, pas de la paire. Si l'auteur veut que la cible connaisse le lien, il écrit la relation symétrique sur la fiche de la cible. Dériver la réciproque ferait inventer par le code un fait que l'auteur n'a pas écrit — et rendrait le gating dépendant d'un graphe, donc intestable en un point.
4. **`secret: false` n'est pas « public »** : il élargit d'**un** rôle (narrateur, scène où le porteur est présent), pas de tous. Le défaut d'un champ absent est traité comme `false`.

Coût : **zéro mécanisme neuf**, zéro table, zéro branche de `validate.ts`. Une phrase, deux sites, exactement comme `si_bloque`.

### D. Deux notes de frontière

**D.1 — une relation n'a pas encore de sujet injectable.** `cible_id` résout vers un `Personnage` dont `nom` est destination **`auteur`** (KR-195, non rouverte par cette feature). Une ligne de relation injectée aujourd'hui donnerait donc « son créancier » **sans dire de qui** — la moitié de l'information. Ce n'est **pas** un motif pour basculer `nom` en `ia` ici (KR-195 est transverse, propriété n° 10) ; c'est un motif pour que **l'entrée « appellation re-projetée par le code »** de `open_questions` soit citée dans le JSDoc de `Relation.cible_id`, afin que n° 10 trouve les deux moitiés du problème au même endroit. **Aucun code d'it5 n'est concerné** — c'est une ligne de docstring.

**D.2 — auto-référence (KR-194)** : **strictement un problème de validation/rendu, hors de mon domaine.** Le prédicat de § C est indifférent au fait que porteur = cible : la ligne entre dans le contexte du porteur, qui est aussi la cible, ce qui donne une didascalie de conflit intérieur parfaitement jouable. Une seule clause à ne pas oublier **au moment de la n° 10** (pas ici) : l'appellation dérivée doit rendre « envers lui-même » plutôt que répéter le nom — une ligne de l'assembleur, pas une question de schéma.

### E. Volet savoirs — coût de frontière nul

Les **neuf** chemins de `savoirs[]` (`indice_id`, `certitude`, `revele_comment` en `ia` ; les cinq portes + `apres_indice_id` en `moteur`) sont **déjà** dans `destinations.ts` depuis la n° 1, avec leurs motifs. It5 n'ouvre aucune audience sur ce volet et **n'ajoute aucune ligne** : le lot contrat en porte **6** (4 relations + 2 présence), pas 15. C'est la moitié la moins chère de l'itération, et c'est ce qui rend le budget crédible.

### F. Contrat de sortie IA concerné — **R4 · acteur** (n° 12, aucun code en it5)

Consigné ici parce que it5 pose les données qui y entreront, pas parce qu'il s'écrit maintenant.

- **Entrée injectée** : fiche du PNJ (`fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, `plan_actions[].action`, `si_bloque` si le moteur a déclaré l'étape bloquée) + **libellés dérivés** des curseurs (n° 10, jamais les nombres) + `savoirs[]` **filtrés porte par porte** + `relations[]` **filtrées par § C** + le dialogue en cours. Jamais : `stats`, `intensite`, `confiance` brute, `camp`, un `…_expr`, un `…_texte` jumeau, le synopsis MJ.
- **Schéma de sortie** : `{ replique: string, indices_reveles: string[], delta_confiance: number }` — **proposition**, jamais application. Le moteur applique `delta_confiance` (borné `CONFIANCE_MIN/MAX`) ; le modèle ne l'écrit nulle part.
- **Échec de validation** : `indices_reveles` doit être **inclus dans l'ensemble des `savoirs[].indice_id` du PNJ dont les portes sont ouvertes** — un identifiant hors de cet ensemble est **rejeté**, pas filtré silencieusement (un PNJ qui révèle ce qu'il ne sait pas est un défaut d'assemblage, pas un caprice de modèle : il doit rougir). `delta_confiance` hors bornes → **écrêté et journalisé**. Sortie non parsable ou identifiant inventé → **un rejeu**, puis **repli déterministe** (réplique d'esquive émise par le moteur, `indices_reveles: []`, `delta_confiance: 0`). Aucune interprétation de texte libre par du code, à aucun moment.
