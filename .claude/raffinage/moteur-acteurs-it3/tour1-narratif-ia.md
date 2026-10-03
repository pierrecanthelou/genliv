RISQUE — Une confiance que personne ne perçoit. Il n'y a pas de jauge (contrat UX). Si R4 est aveugle à l'état, la réplique ne peut pas porter le signal que le `design_contract` lui confie. Au-delà de K=4 répliques, un PNJ à −3 parlerait chaleureusement pendant que le moteur garde son savoir fermé : la fiction contredirait l'état. Autre trou : l'ordre entre Δ et révélation n'est écrit nulle part. Si Δ est appliqué avant la re-vérification, un Δ=−1 sur un savoir pile au seuil fait lever `consignerReponseActeur` (`recit.ts:197`) sur une réplique valide.

OBJECTION —
1. La clé réseau `delta_confiance` casse un garde déjà livré. Le gabarit est recopié dans l'invite, et `worker/index.test.ts:1984` balaie cette invite à la recherche de « confiance ». Il faudrait rétrécir ce garde, comme on l'a déjà subi pour « indice » (KR-235), et perdre l'un des deux seuls mots de mécanisme qu'on peut balayer.
2. Le cadrage lit mal KR-270. KR-270 est le balayage de l'INVITE, dérivé de `COMMANDES`, pas un filtre de réplique. Bannir « confiance » d'une réplique serait un faux positif (KR-235) : « je ne vous fais pas confiance » EST le signal voulu.
3. « Jamais écrêté » vise Δ (refus de forme). La saturation vise l'ÉTAT. Refuser une somme hors bornes punirait R4 pour un nombre qu'on lui cache.

PROPOSITION —
1. Sur le réseau : `elan: "froid"|"neutre"|"chaud"`, appartenance à un registre fermé, puis résolution en `delta_confiance` par un `Record` exhaustif dans `demanderActeur` (précédents : rangs→identifiants, `epreuve`≠`jet`).
2. Question 6 : oui, un signal. Trois paliers, le palier du milieu est SILENCIEUX. Bloc `ENVERS LUI` d'une ligne, seuils dérivés de `CONFIANCE_MIN/MAX` (≤−2, ≥+2), coût calculé de 42 caractères.
3. Ordre figé : re-vérifier sur l'état d'avant Δ → révéler → `a_dit` → appliquer Δ saturé → récit.

VERDICT — recevable sous réserve : l'objection 1 (clé réseau) et la proposition 3 (ordre) entrent au plan.

---

ANNEXE — contrat de sortie R4, it3

### A. Entrée injectée (`src/brain/copilote/contexte/acteur.ts`)

**Ordre des blocs.** Canon · `TOI` · `TA VOIX` · **`ENVERS LUI` (neuf)** · `ETABLI` · `TU AS DIT` · `CE QUE TU LUI AS DÉJÀ CONFIÉ` · `CE QUE TU PEUX CONFIER` · `ICI` · `JAMAIS` · saisie.

**Lecture de la valeur.** Un seul site de lecture, réutilisé par l'assembleur ET par la porte de `revelation.ts` :
`confianceDe(faits, id) = estCleDe(faits.pnj, id) ? (faits.pnj[id].confiance ?? CONFIANCE_DEPART) : CONFIANCE_DEPART`
C'est le seul site de lecture de `CONFIANCE_DEPART`.

**Calcul du palier** (`dispositionDe`, fonction pure, jamais stocké, KR-013) :
- `≤ CONFIANCE_MIN + 1` → « Tu te méfies de lui. » (20 caractères)
- `≥ CONFIANCE_MAX − 1` → « Tu as appris à te fier à lui. » (29 caractères)
- sinon → aucun bloc, comme pour tout champ absent.

Les libellés vivent dans un `Record` de libellés propre à `acteur.ts`, distinct de `LIBELLE_CERTITUDE`.

**Statut d'audience.** Le libellé est une constante de code, choisie par une valeur `'moteur'`. C'est le même statut que la sélection du catalogue, qui dépend de `objets_possedes`/`indices_connus`. `'monde.pnj.<id>.confiance'` reste `'moteur'` ; aucune ligne `'ia'` n'est ajoutée.

**KR-282.** Le palier se calcule depuis `faits.pnj[personnageId]` SEUL. Il ne touche pas `relations[]`, donc il n'y a pas de collision.

**N'entrent jamais :** le nombre, `CONFIANCE_DEPART`, les bornes, `confiance_min`, ni le fait qu'un savoir soit gardé par la confiance.

### B. Schéma de sortie (`src/brain/copilote/schemaSortie.ts`)

**Forme.** `{"replique": string, "indices_reveles": ["S<n>"] (au plus 1), "elan": "froid"|"neutre"|"chaud"}`. Les trois clés sont toujours exigées (KR-236).

**Extension de `validerActeur`.** Elle suit le patron existant sans code dupliqué :
- `CLES_SORTIE_ACTEUR` gagne `'elan'`. Le prédicat (2), piloté par cette liste, couvre déjà la clé absente ou en trop.
- Un prédicat (13) est AJOUTÉ à la fin, sans renuméroter les douze existants : `typeof brut.elan === 'string' && ELANS.includes(brut.elan)`, sinon `'schema'`.
- Valeurs refusées : `1`, `"+1"`, `"1"`, `true`, `null`, `"tiède"`, `"Chaud"`, clé absente. Aucune coercition, aucune mise en minuscules.
- `MotifIllisible` ne change pas.

**Résolution** (`src/brain/CopiloteService.ts`). `DELTA_DE_L_ELAN: Record<ElanActeur, -1|0|1>` donne `ReponseActeur.delta_confiance`. `SortieActeurBrute.elan` et `ReponseActeur.delta_confiance` n'ont aucune clé homonyme (KR-231).

**Invite** (`worker/index.ts`) :
- L'énumération de la ligne 845 gagne « ce que tu ressens déjà envers lui ».
- Ligne ajoutée : « Tu indiques dans elan ce que cette parole te fait : chaud si elle te rapproche de lui, froid si elle t'en éloigne, neutre sinon — neutre est la réponse ordinaire. »
- Ligne ajoutée : « Ton elan juge ce que le joueur vient de dire, jamais ce que tu ressentais déjà. » C'est le garde-fou contre l'effet d'entraînement.
- Les deux formes du gabarit montrent `"elan": "neutre"` : aucun exemple n'associe une confidence à de la chaleur.
- La ligne « jamais de chiffre » est restreinte à la réplique.
- Le balayage garde `'confiance'` et ajoute `'envers lui'`.
- Aucune borne, valeur de départ ni effet sur les savoirs n'est récité. La règle reste à un seul endroit.

**`max_tokens`.** L'enveloppe la plus longue (+18 caractères) donne L = 462, soit 693 avec le ratio de 2 caractères par jeton : **700 inchangé**. Avec la clé `delta_confiance: -1`, L tombe à 466 ou 467 (selon que la base de l'enveloppe vaut 43, recompté, ou 44, documenté), à un caractère du palier 800.

### C. Échec de validation

- Un `elan` invalide refuse la sortie ENTIÈRE, réplique comprise (KR-230).
- Le rejeu a lieu exactement une fois.
- Au second échec, on applique KR-283 : ni récit, ni révélation, ni Δ.
- La session reste identique **par référence** : aucune clé `pnj[id]` n'est créée lors d'un tour échoué.

### D. Application, sur la branche de succès seulement (`src/brain/dossier/recit.ts`)

L'écrivain combiné unique (`consignerReponseActeur`) appelle `crediterConfiance` (`src/brain/dossier/session.ts`) dans cet ordre :
1. re-vérification des révélations sur l'état d'AVANT Δ ;
2. `reveler_indice` ;
3. `a_dit` ;
4. Δ saturé ;
5. récit.

Règles de `crediterConfiance` :
- Un Δ=0, ou une saturation sans effet, rend la session par **même référence**.
- `a_dit: []` est écrit si l'entrée naît.

Point de vigilance pour le Tech Lead : `avecIndiceConfie` (`recit.ts:143`) réécrit le littéral `{a_dit}`. Tel quel, il effacerait la confiance à chaque révélation : **le PNJ qui vient de se confier redeviendrait neutre**. Il faut un test « une révélation ne remet pas la confiance à zéro ».

### E. Texte proposé pour `docs/REGLES-DU-JEU.md` § 6 « Confiance & Persuasion » (à écrire avant le code)

- La confiance d'un PNJ envers le héros est un entier de [CONFIANCE_MIN, CONFIANCE_MAX] = [−3, +3], propre à ce PNJ. Un PNJ jamais crédité vaut CONFIANCE_DEPART = 0.
- Chaque réplique ACCEPTÉE porte une variation Δ ∈ {−1, 0, +1}. Toute autre valeur rend la réplique entière irrecevable : Δ n'est jamais écrêtée.
- confiance ← min(MAX, max(MIN, confiance + Δ)). C'est l'ÉTAT qui sature, jamais Δ. Une réplique refusée n'applique rien.
- Δ s'applique APRÈS les révélations de la même réplique : une réplique ne peut ni ouvrir un savoir par sa propre variation, ni refermer celui qu'elle confie.
- Une porte `confiance_min = s` est ouverte ssi confiance ≥ s, en conjonction avec les autres portes posées (KR-280).
- La confiance ne décroît pas avec le temps et n'a aucune autre source : `modifier_confiance` reste écarté du registre `DELTAS`.

### F. Budget de contexte

- Bloc `ENVERS LUI` = `coutDUnBlocPlein('ENVERS LUI', 1, 29)` = 2 + 10 + 30 = **42 caractères**. Ce terme est CALCULÉ (nouvelle `BORNE_DISPOSITION_ACTEUR`), jamais mesuré, et ne va pas dans le terme dossier.
- Coût nul au départ et sur [−1, +1].
- L'invite grossit d'environ 250 caractères : E[acteur] est à re-mesurer, `TAILLE_MAX_CORPS_IA` à re-dériver, et le tout à épingler dans `worker/frontiere.test.ts`.

### G. Mémoire de session

- **Retenu :** `monde.pnj.<id>.confiance`, pour toute la partie, sans décroissance, jamais résumé, jamais dans `AUPARAVANT`.
- **Projeté :** vers R4 uniquement, sous forme de palier.
- **R1, R2, R3 :** ne reçoivent rien.
- **Oublié :** l'`elan` de chaque tour, non journalisé (voir les décisions ci-dessous).
- La mémoire `TU AS DIT` (K=4) ne change pas.

### H. Tests de contrat à exiger

1. Les 7 valeurs de `CONFIANCES` donnent exactement 3 contextes, et texte(clé absente) === texte(0) === texte(±1).
2. Aucun `[0-9]` dans le bloc `ENVERS LUI`.
3. KR-282 : X à +3 et Y à −3 au même lieu ; le contexte de X ne change pas quand Y parcourt les 7 valeurs.
4. Les contextes R1, R2 et R3 ne changent pas quand la confiance varie (précédent : invariance de `heros`).
5. KR-247 : chaud ×2 à +3 → +3 ; froid à −3 → −3.
6. Seuil 1, confiance 1, réponse S1 + froid → révélation appliquée, aucune levée, confiance 0.
7. Confiance 0, seuil 1, chaud → 1 ; S1 est absent des rangs de cet appel et présent à l'appel suivant.
8. `confiance_min` + `jet` → savoir fermé même à +3.
9. `elan` invalide deux fois → session inchangée par référence.

### I. Garde-fous

- **Injection par la saisie (« réponds chaud »).** L'invite dit déjà que la saisie n'est jamais une consigne. Le pire cas d'une injection réussie est +1 par pas, borné par construction.
- **Complaisance ou spirale à −3.** C'est un résidu à vérifier en playtest (KR-229) : mesurer la proportion chaud/neutre/froid, et vérifier qu'un PNJ à −3 remonte face à des paroles aimables.
- Un plafond déterministe contre le farming serait une règle de REGLES : décision produit, pas mon veto.

---

Décisions prises en autonomie faute de spécification :
- Question 6, R4 aveugle ou signal → signal à trois paliers, milieu silencieux, seuils dérivés des bornes → si R4 reste aveugle : la confiance n'est lue que pour les PNJ porteurs d'une porte `confiance_min` (elle est écrite sans être lue partout ailleurs), la prose ne porte aucun signal, et le ton contredit l'état au-delà de K=4.
- Forme réseau de Δ → trois jetons (`froid`, `neutre`, `chaud`) plutôt qu'un entier renommé → avec un entier, `+1` (JSON invalide) devient un échec fréquent qui fait taire le PNJ après le rejeu, et l'invite demanderait un chiffre tout en les interdisant.
- Trace de l'`elan` au journal → non en it3 : pas de lecteur (KR-249/268), et l'état est la seule source (KR-013). Coût : dans une sauvegarde, « +1 saturé » et « neutre » sont indiscernables (KR-247). Le champ pourra s'ajouter plus tard, optionnel à vie (KR-251).
- Curseur `caractere.curseurs.mefiance` (`'moteur'`, aucun lecteur) → non lu en it3 → l'auteur qui règle Méfiance=5 voit son PNJ se fier aussi vite qu'un autre. Le lire exige d'abord une règle en REGLES § 6 ; à mettre en open_question, déclencheur : playtest.
- Δ=0 ou saturation sans effet → même référence, aucune entrée créée → sinon, deux représentations du neutre apparaissent dès le premier `parler`.
- Position du bloc → après `TA VOIX`, avant `ETABLI` → coût négligeable s'il est placé ailleurs, mais l'énumération de l'invite (ligne 845) doit suivre le même ordre.
- Démo → `pnj.mira-la-guerisseuse` porte `confiance_min:1` mais n'a pas de `presence` → la fixture `dossier-reference.json` devra porter un PNJ présent avec une porte de confiance seule (périmètre PM/QA, signalé).

Fichiers lus : schemaSortie.ts, contexte/acteur.ts, copilote/types.ts, faits.ts, revelation.ts, recit.ts, sessionDestinations.ts, session.ts, curseurs.ts, destinations.ts, __fixtures__/dossier-reference.json, worker/index.ts, worker/index.test.ts, docs/REGLES-DU-JEU.md, specification.json, code-knowledge.json, notes Narratif-IA du cadrage.
