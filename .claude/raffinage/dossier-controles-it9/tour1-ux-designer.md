# Tour 1 — `ux-designer` · `dossier-controles` it9

**RISQUE** — Un savoir cite DÉJÀ cet indice au registre (`indice_id` posé, porte fermée) : traiter sa disparition comme si personne n'avait rien confié produit un **ÉNONCÉ FAUX** — exactement la faute corrigée à it6 (BUG-088, le motif qui a fait naître `MESSAGE_INDICE_SANS_RACINE`). Risque miroir côté remédiation : réutiliser « confiez cet indice à un personnage » est **CIRCULAIRE**, un personnage le porte déjà — même classe que BUG-090.

**OBJECTION** — Sur « le message doit-il changer » : **OUI** — c'est une TROISIÈME formulation causale, pas une réutilisation ni un compte muet derrière un texte existant. Les trois bloquants de `indice-sans-source` partagent l'enveloppe « compte = 0 » mais pas le FAIT (rien / enchaînement non raciné / savoir gaté) — KR-164 l'exige nommément, un code par CAUSE jamais par emplacement.

**PROPOSITION** — Troisième couple message + remédiation sous la même entrée de registre. La remédiation nomme « Personnages → Savoirs » et le geste réel déjà présent — l'`IconButton` « Retirer la porte de contrepartie / d'indice préalable » de `BlocSavoirs.tsx` —, **vérifié en code**. « Porte », « contrepartie », « savoir » SONT les mots de l'auteur (`LEGENDE_PORTES`, `TEXTE_EXIGER_CONTREPARTIE`, eyebrow `SAVOIR`). Aucun texte neuf pour `objectif-sans-chemin`.

**VERDICT** — Recevable sous réserve : que ce troisième message ne soit **ni fusionné** dans un texte existant par économie de code, **ni résolu** par la remédiation bloquante générique — les deux seraient un défaut de la classe BUG-088 / BUG-090.

---

## ANNEXE — Contrat de design

### 1. Portée UX

**AUCUN** nouveau composant, **AUCUN** nouveau token, **AUCUNE** nouvelle pastille ni niveau — uniquement un TROISIÈME couple message + remédiation sous l'entrée EXISTANTE `indice-sans-source` (section `indices`, niveau `bloquant` uniquement). Le niveau `alerte` (« un seul chemin ») est déjà family-agnostic : une porte qui fait passer le compte de 2 à 1 reste couverte telle quelle.

### 2. Textes MOT POUR MOT

**Message (bloquant, nouveau)** :

> « Cet indice n'est confié qu'à des savoirs dont une porte ne s'ouvrira jamais : le joueur ne pourra jamais l'obtenir. »

Registre : indicatif présent impersonnel, sujet = le document, aligné sur les deux messages voisins de la même règle. Ne nomme ni `apres_indice_id` ni `contrepartie`, ni aucun terme interne — seulement « porte », déjà le mot de l'auteur.

**Remédiation associée (nouvelle, DISTINCTE de la remédiation bloquante existante)** :

> « Ouvrez un chemin pour ce savoir : retirez sa porte, ou changez sa cible pour un indice ou un objet que le joueur peut réellement obtenir (Personnages → Savoirs). »

Vérifié en code : `BlocSavoirs.tsx` est l'écran « Personnages → Savoirs » ; chaque porte ouverte y porte un `IconButton` libellé via `LIBELLES_RETRAIT_PORTE` et un `Select` de cible réassignable. **Le geste nommé existe RÉELLEMENT** — satisfait nommément la doctrine BUG-090.

### 3. Ce qui NE change PAS

- `objectif-sans-chemin` : son message reste vrai sans modification — il ne dit jamais POURQUOI le fait est improductible, seulement QUE rien ne le produit. Zéro texte neuf.
- Le seuil `alerte` de `indice-sans-source` : inchangé, déjà family-agnostic.
- Aucune pastille, aucun `NiveauControle` neuf, aucune teinte neuve : **la distinction causale vit ENTIÈREMENT dans le texte, jamais dans une couleur** (KR-217). `--bad` / `--bad-line` / `--bad-bg-2` existants suffisent.

### 4. Anatomie

La ligne suit l'anatomie à trois lignes d'`IssueList` : OÙ = `localiserEntite('indice', …)`, QUOI = le message, QUOI FAIRE = la remédiation. Aucun état vide nouveau — la ligne n'apparaît QUE si le constat est émis. Aucun changement clavier.

### 5. REJETÉ (à recopier au § 8 du plan)

- **REJETÉ** — réutiliser le message bloquant existant (« Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice ») pour le cas « porte fermée ». Motif : **FAUX au sens strict** — un savoir cite bien cet indice dans le document ; classe BUG-088.
- **REJETÉ** — réutiliser `MESSAGE_INDICE_SANS_RACINE`. Motif : également FAUX — ce texte nomme des enchaînements `mene_a`, pas des savoirs sous porte.
- **REJETÉ** — résoudre la remédiation depuis la remédiation bloquante EXISTANTE (« confiez cet indice … à un personnage »). Motif : **CIRCULAIRE** — un personnage porte déjà ce savoir ; classe BUG-090.
- **REJETÉ** — ne rien écrire de neuf et laisser le compte redescendre silencieusement derrière un message existant. Motif : identique au premier, sous un autre nom.
- **REJETÉ** — une pastille ou un niveau supplémentaire pour distinguer visuellement ce cas. Motif : KR-217 ferme la porte à une quatrième couleur ; c'est un problème de texte.
- **REJETÉ** — un message et une remédiation SPÉCIFIQUES à chaque type de porte. Motif : les deux portes vivent sur le MÊME écran et appellent le MÊME geste — deux textes isomorphes dupliqueraient sans bénéfice.

### 6. Hors mon domaine, signalé pour le tech-lead

Fermer une porte `apres_indice_id` dépend de l'atteignabilité de l'indice CIBLE, laquelle peut elle-même dépendre d'autres portes fermées — potentiellement un **point fixe décroissant**, pas une passe unique. Je n'arbitre pas l'algorithme ; je pose la condition sous laquelle mon texte reste vrai : **le message ne doit être émis que quand la fermeture est CERTAINE**, jamais sur un calcul optimiste à une seule passe.

---

## Notes de l'orchestrateur — vérifications

| Affirmation | Mesure |
|---|---|
| `BlocSavoirs.tsx` porte `LIBELLES_RETRAIT_PORTE` pour les quatre portes | **VRAIE** — l. 56-60, dont « Retirer la porte de contrepartie » et « Retirer la porte d'indice préalable ». |
| L'écran **écrit** `contrepartie` et `apres_indice_id` | **VRAIE** — l. 378-394 : `Select` de cible réassignable sur `savoir.contrepartie?.objet_id`, et `clePorte(index, 'apres_indice_id')`. |
| « porte », « contrepartie », « savoir » sont les mots de l'auteur | **VRAIE** — `LEGENDE_PORTES` (l. 69), `TEXTE_EXIGER_CONTREPARTIE = '+ Exiger une contrepartie…'` (l. 79). |

**C'est l'inverse exact de la situation d'it8** : là-bas, aucune surface n'écrivait `reussi_si_expr` et la variante en est morte. Ici la surface existe et porte le geste. **C'est ce qui rend cette itération livrable.**

**Piège relevé par l'orchestrateur, à écrire au plan** : `BlocSavoirs.tsx` teste `savoir.contrepartie !== null` et `savoir.apres_indice_id !== null` (l. 201-202) — la porte y vaut **`null`**, tandis que `Revelation` la déclare optionnelle (`undefined`). La garde d'it8 lisait `=== undefined`. Un ouvrier qui ne teste qu'une des deux formes manquera un cas. **À trancher par le tech-lead : quelle est la forme réelle dans le `Dossier` persisté ?**
