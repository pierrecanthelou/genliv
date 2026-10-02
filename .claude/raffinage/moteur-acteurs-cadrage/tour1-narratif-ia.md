# Cadrage n°12 `moteur-acteurs` — Tour 1 — Narratif & IA

## RISQUE
Le risque est un PNJ qui en sait trop, ou qui change de nom. Il suffit d'un savoir fermé glissé dans le contexte : l'acteur le lâchera, et la complaisance fera le reste. Un acteur qui n'a ni son nom ni sa propre mémoire réinvente son identité à chaque appel. La parade est **un cadrage, jamais une consigne** : une porte se ferme **à l'assemblage**, jamais en filtrant la sortie (déjà décidé, `dossier-format` spec:395).

## OBJECTION
1. **« Blocs 3, 6, 7 » est faux dans les deux sens.**
   - Il manque le bloc 8 (`presence[].lieu_id`) : sans lui, personne n'est « là ».
   - Il manque le bloc 1 (`apparence`/`fonction`) : sans lui, R3 ne montre personne et R1 ne désigne personne.
   - Les curseurs du bloc 3 n'entrent pas : ce sont des nombres, et il n'existe aucun libellé dérivé.
   - Le nommage est à nous (KR-262).
2. **`PorteeContreMesure`** : la n°12 n'arme rien, l'armement appartient à la n°14 (roadmap:176). Fixer des valeurs sans lecteur viole KR-249/268. Il faut la réaffecter.
3. **Carnet d'indices** : il ne peut afficher ni `formulation_joueur`, ni `verite`, ni `nom` (seules deux proses sont émises verbatim). Il ne peut pas non plus stocker `{source_id, tour}`, qui sont dérivables (KR-013). Ce doit être une vue dérivée du journal.
4. **Contrat à trois champs livré d'un bloc** : cela viole KR-268. Le schéma grandit d'un champ par itération.

## PROPOSITION
- **it1** : présence ; R3 voit les présents ; R1 les désigne ; verbe `parler` (le déclenchement se fonde sur une structure) ; R4 rend `{replique}` **sans aucun savoir injecté**.
- **it2** : révélation par les portes évaluables, en fail-closed, et carnet dérivé.
- **it3** : confiance, écrite d'abord dans REGLES. `CONFIANCE_MIN/MAX` réutilisées, départ 0, Δ ∈ {−1, 0, +1}.
- **it4** : porte `jet`, avec deux appels R4. `intention_suivante` est rejeté.

## VERDICT
**Recevable sous réserve** des objections 1 à 4, et d'une mémoire d'acteur spécifiée dès it1.

---

## ANNEXE (hors quota)

### A. Réponses aux quatre questions posées

**A1. Échelle de confiance.**
- **Bornes : réutiliser `CONFIANCE_MIN/MAX` (−3..3), pas une échelle distincte.** Un seuil de porte et la valeur qu'on lui compare vivent par définition sur une seule échelle (`types.ts:130-134`). Deux paires pourraient dériver, et une porte à 3 viserait une session plafonnée à 2 sans que rien ne rougisse. C'est l'inverse de `INTENSITE_*`, qui mesure une autre grandeur et a donc ses propres constantes.
- **Ordre d'écriture (KR-130)** : nouvelle section « Confiance » dans `docs/REGLES-DU-JEU.md` (bornes, départ, amplitude, saturation), puis le test qui les épingle, puis le code.
- **Valeur de départ : `CONFIANCE_DEPART = 0`.** Constante de règle nommée, lue en un seul site pour un PNJ sans entrée (`pnj: {}` à l'ouverture, clé absente = état légal). **Ce n'est pas `CONFIANCE_INITIALE_PORTE`** (`types.ts:157`), qui est la graine que l'éditeur écrit dans une porte, jamais un repli de lecture. La ligne de `dossier-format` spec:431 (« le schéma pose `personnages[].confiance_initiale` ») est **fausse** : ce champ n'apparaît nulle part dans `src/`.
- **Amplitude d'un `delta_confiance` : un entier de {−1, 0, +1}.** Toute autre valeur **rejette la sortie** (refus atomique, KR-230), sans jamais l'écrêter. Un Δ valide qui pousserait au-delà d'une borne est absorbé par une **règle de saturation écrite** dans REGLES — le Δ demandé va au rejeu, l'effet observé se recalcule. (Je retire ma propre esquisse `dossier-fiches-it5/tour1-narratif-ia.md` § F « écrêté et journalisé », qui contredisait spec:395.)
- **Visibilité.** R4 reçoit un libellé calculé par le code, jamais le nombre, jamais un seuil de porte. R3 ne reçoit rien de la confiance.
- **Hors périmètre.** Ni le prédicat `confiance_au_moins` (écarté en `predicates.ts:20`, aucun lecteur), ni un delta de dossier `modifier_confiance` (écarté en `deltas.ts:30-33`). La confiance s'écrit en session, par le code, après R4.

**A2. `jet_demande?` et `intention_suivante` : ce n'est pas un oubli du roadmap.**
Le plan de cible se contredit lui-même : `PLAN-BASCULE-IA.dc.html:431` (sous-boucle C) liste 5 champs, `:608` (table des rôles) en liste 3. Le roadmap suit `:608`. **`jet_demande` est conservé**, mais en it4, sous forme disjointe (voir C3) — pas un champ optionnel mêlé à la réplique. **`intention_suivante` est rejeté** : aucun lecteur en n°12 (KR-268), et ferait piloter l'avancement des plans de PNJ par le modèle, alors que le plan le veut « sans texte généré » (`:441`, propriété de la n°14).

**A3. Déclenchement de R4.**
Nouveau verbe en fin de `COMMANDES` : `parler`, `refKinds: ['pnj']`, arité 1, label KR-269 (3e personne, présent, portée en prose neutre, aucun mot de mécanique). `TRANSITIONS.parler` : refus fermé si la cible n'est pas présente au lieu courant ; consomme un pas ; écrit deux entrées de journal ; ne touche jamais `monde` en it1. R4 appelé uniquement sur `parler`, une fois la commande acceptée et persistée, une fois par pas (deux en it4). On ne lit jamais le contenu d'une prose pour décider. R2 n'est jamais appelé sur `parler` ; R3 n'est jamais appelé sur un pas `parler` (la réplique EST la restitution de ce pas). Verrou KR-265 sur toute la chaîne. Aucune condition de héros avant it4.

**A4. `PorteeContreMesure`.**
La docstring (`types.ts:481-492`) attend que « la n°12 dise ce qu'elle sait armer ». Or la n°12 n'arme rien : l'armement (`declencheur_expr`, `delai`, riposte) relève de l'horloge, n°14 (roadmap:176). `contre_mesures[]` n'entre dans AUCUN contexte de la n°12. Réaffecter cette ligne du roadmap à la n°14.

### B. Découpage vu de la frontière code/IA

| it | Phrase de démo | Rôle IA | Consommateurs réels du même lot |
|---|---|---|---|
| 1 | Le joueur adresse la parole à un PNJ présent, qui lui répond dans sa propre voix. | R4 entre (10e branche, `{replique}`) ; R1 gagne une table de candidats PNJ ; R3 gagne un bloc des présents | Narratif : affichage de la réplique, mémoire de R3. Aucun savoir injecté, donc rien à révéler structurellement. |
| 2 | Un PNJ ne lâche que les savoirs dont le moteur a constaté la porte ouverte. | R4 gagne `indices_reveles` | Mécanique : `a_dit[pnj]` et `indices_connus`, retrait d'objet si `contrepartie.consomme`. Visible : carnet dérivé. |
| 3 | La confiance gagnée auprès d'un PNJ ouvre les savoirs qu'elle garde. | R4 gagne `delta_confiance` | Écrivain : `EtatPnj.confiance` (optionnel à vie, KR-251). Lecteurs : porte `confiance_min` à l'assemblage et libellé injecté. |
| 4 | Un PNJ méfiant ne cède un savoir gardé qu'au dé que le moteur lance. | R4 gagne la forme disjointe `resiste` | CarteJet (n°11) et `issueDuJet` (seul appelant de `resolveChallenge`), puis un second appel R4. |

**Pourquoi it1 sans savoir est une condition, pas une option.** Injecter des savoirs sans l'écrivain de révélation, c'est la fuite exacte : le modèle dit le savoir, l'état l'ignore, le carnet ment. R4 en it1 n'a qu'un consommateur narratif, comme R3 à son entrée avec `agir` (n°10 it2). KR-266/268 tenus au niveau du rôle comme du champ.

**Si it1 est jugée trop lourde** : scindable en 1a « le joueur voit qui est là » (R3 seul) et 1b « parler ». Mais on ne sépare jamais `parler` de R4 (KR-263).

**Portes que l'itération ne sait pas encore évaluer : FERMÉES (fail-closed).** En it2, un savoir gardé par `confiance_min` ou `jet` n'est pas injecté. En it3, un savoir gardé par `jet` n'est pas injecté. Inverser ferait fuir ces savoirs dès it2.

### C. Contrat de sortie IA — R4 · acteur (résumé)
Entrée injectée (liste écrite à la main, jamais dérivée de la table d'audience) : canon.ton/interdits, description du lieu, bloc `TOI` (nom sous condition de rôle, fonction/apparence/but/parler/jamais/cede_si), `TES LIENS` (relations du porteur, y compris secrètes), `ETABLI` (faits ancrés sur ce PNJ/lieu), `TU AS DIT` (K=4 dernières répliques de ce PNJ), `CE QUE TU SAIS` (savoirs ouverts seulement, it2+), `DISPOSITION` (libellé de confiance, it3+), saisie en dernier. N'entrent jamais : stats/curseurs, intensite/secret/camp/objectif_id, plan_actions/contre_mesures, tout `…_expr`/`…_texte`, synopsis_mj, savoirs/relations d'un autre PNJ, tout identifiant, tout nombre de session.

Schéma de sortie qui grandit d'un champ par itération (KR-268) : it1 `{replique}` ; it2 `+ indices_reveles: string[]` (rangs S<n>) ; it3 `+ delta_confiance: -1|0|1` ; it4 forme disjointe `{resiste:{enjeu_reussite, enjeu_echec}}` sur le modèle R2, second appel en forme A seule. Refus toujours atomique (KR-230), rejeu-une-fois puis dégradation silencieuse (aucune réplique posée, pas de repli sur R3, pas d'esquive écrite par le code).

Rejeu (KR-248 étendu) : la commande `parler <pnj>` + les décisions validées de R4 (indices en identifiants, Δ, `resiste`) entrent au rejeu. La réplique n'y entre jamais (prose, comme tout `recit`).

### D-J. Détails (mémoire d'acteur, ce que R1/R3 gagnent, nommage, carnet, garde-fous, mesure sur fixture, questions PM)
Voir le rapport complet de l'agent pour le détail — points structurants retenus :
- Nommage : `Personnage.nom` passe d'`auteur` à `ia` **sous condition de rôle** (R4 du porteur + relations qui pointent vers lui), jamais R1/R2/R3 (3e précédent après `secret`/`cede_si`) — entre au lot contrat d'it1.
- Carnet d'indices : vue DÉRIVÉE du journal (indice de `indices_connus` + restitution du pas qui l'a révélé), aucun état neuf, aucune prose verbatim stockée.
- Mesure sur `dossier-reference.json` : Corvin (seul PNJ présent+décrit) a zéro savoir ; Sélène présente sans prose d'identité ; aucune révélation n'est démontrable sur la fixture actuelle en l'état — elle devra être enrichie à chaque itération.
- Questions laissées au PM : conséquence d'un jet social raté (proposition : −1 confiance par règle écrite, jamais par le modèle), politique de nouvelle tentative, affichage de la source au carnet.

## Décisions prises en autonomie faute de spécification
- Bornes de confiance de session = `CONFIANCE_MIN/MAX` (mêmes que le seuil de porte) → deux paires dériveraient sinon.
- `CONFIANCE_DEPART = 0`, aucun champ auteur `confiance_initiale` → évite un champ optionnel de plus sans besoin exprimé.
- Δ ∈ {−1,0,+1}, rejeté hors bornes, saturation par règle écrite jamais par écrêtage → R4 ne voit jamais le nombre donc ne peut pas viser une saturation.
- Échec = silence + bannière existante, jamais d'esquive écrite par le code ni de repli sur R3 → éviterait que le code ou R3 inventent de la fiction hors fiche.
- `nom` passe `ia` sous condition de rôle → sinon le PNJ change de nom d'un appel à l'autre.
- Mémoire d'acteur = K=4 répliques de CE PNJ + faits ancrés sur lui, jamais la saisie du joueur → une fenêtre globale oublierait un PNJ revu bien plus tard.
- Portes non encore évaluées par l'itération = fermées (fail-closed) → sinon fuite dès it2.
- Un seul interlocuteur par pas → sinon budget de contexte sans borne.

## Fichiers de référence
`docs/ROADMAP-BASCULE-IA.md` (172, 176) ; `docs/PLAN-BASCULE-IA.dc.html` (411-413, 431, 441, 469, 563-565, 608, 612-616) ; `src/brain/dossier/types.ts` (130-157, 481-534, 546-594, 658-694, 796-819, 867-875, 1125-1155) ; `src/brain/dossier/faits.ts` (30-36) ; `src/brain/dossier/destinations.ts` (254-456) ; `src/brain/dossier/deltas.ts` (30-33) ; `src/brain/dossier/predicates.ts` (20, 70, 110-114) ; `src/brain/dossier/atteignabilite.ts` (40-43, 79-97) ; `src/brain/dossier/commandes.ts` (22-27, 81-92, 106, 305-325) ; `src/brain/dossier/session.ts` (99-158) ; `src/brain/dossier/memoire.ts` (33-46, 95-99) ; `src/brain/copilote/contexte/{narrateur,interprete}.ts` ; `src/brain/copilote/schemaSortie.ts` ; `src/brain/dossier/__fixtures__/dossier-reference.json` (51-250) ; `src/features/dossier-format/specification.json` (395, 426, 431, 436) ; `src/features/dossier-fiches/specification.json` (347) ; `.claude/raffinage/dossier-fiches-it5/tour1-narratif-ia.md` (§F, partiellement retiré) ; `code-knowledge.json` (KR-195, 229/230, 248, 262, 263, 264, 266, 268, 272).
