# Tour 2 — narratif-ia — `dossier-canon` it5 (tranche B1)

**VETO RETIRÉ.** Motif mesuré, pas une concession.

**STATUT** — Rejoué sans la prémisse tombée, l'argument central tombe aussi, et c'est une mesure qui le tue : `Lieu` porte **déjà trois proses `ia`** (`destinations.ts:395-397` — `description`, `ambiance`, `dangers`). Le précédent `Climat.manifestation` ne transfère pas : là, l'**entité entière** était muette ; ici seule la sous-liste l'est, et l'auteur écrit déjà la porte dans `description` (« un escalier étroit derrière la tapisserie » est une phrase de lieu). Poser `acces[].description` fabriquerait une **seconde source de vérité narrative sur le même fait**, que rien ne resynchronise, injectée dans le **même contexte de tour** — exactement le défaut de cohérence de fiction que ce poste existe pour empêcher. Nécessaire maintenant : **non démontrable**.

**OBJECTION INVERSE, acceptée et retournée** — oui : posé sans consommateur, le champ serait vide partout, et le repli (silence) rendrait toute sortie muette à la n° 10. C'est un argument **contre** le champ. La vraie étiquette d'une sortie est le `nom` de la cible, dont l'arbitrage transverse est **déjà propriété de la n° 10** (KR-195). Poser `description` aujourd'hui préempterait cette décision avec un champ qu'elle peut ne pas utiliser — et `Indice.portee` (KR-211) dit ce que coûte un champ posé sans son bloc.

**COÛT NOMMÉ PLUTÔT QUE CACHÉ** — l'ajout tardif n'est pas gratuit : `FicheLieu.tsx` appartient à `dossier-canon` (KR-200/205), donc la n° 10 ne peut pas écrire l'écran — ce sera une tranche `dossier-canon` it6. **Zéro migration** (§ 4), une tranche d'écran. Coût accepté **à condition** qu'il parte en dette à déclencheur **réel** — « la n° 10 tranche l'étiquette d'une sortie » — jamais « un besoin exprimé », qui ne se déclenche pas.

**RÉPONSE NOMMÉE — `ux-designer`, annexe « Registre de langue »** : « Ne pas ajouter de champ de prose "comment on y accède" — hors périmètre posé. » Conclusion juste, **autorité non, et motif faux**. L'audience d'un champ du dossier n'est pas un arbitrage de design, et « hors périmètre posé » n'est pas un motif : le périmètre est précisément ce que le comité tranche. Le motif est : pas de consommateur nommé, et duplication avec `lieux[].description`. J'endosse en revanche leur second point, mesuré : `acces` reste une **référence structurelle par id**, au même titre que `mene_a[]`.

**RÉPONSE NOMMÉE — `tech-lead`** : ce retrait ne s'appuie **pas** sur « forme structurée = 7e famille D1 », mesurée fausse. L'objet reste **légal** ; il est seulement **inutile**. Que le compte rendu ne fige pas un motif faux au profit d'une conclusion juste.

**EXIGENCE RESTANTE — non bloquante**
1. La ligne `'monde.lieux[].acces[]': 'moteur'` porte **les deux phrases de frontière** (annexe A) : l'identifiant est un **handle jamais injecté** ; l'**autorité de déplacement vit dans la donnée** (liste fermée), jamais en consigne de prompt.
2. Étape 4 des Build Steps : l'`open_question` de la n° 10 (annexe B) **et** la ligne de dette à déclencheur au § 2 bis du roadmap. Sans elles, la n° 10 **découvre** la question au lieu de l'**hériter** — la seule chose que le veto protégeait réellement.

**VERDICT — recevable, sans réserve bloquante.** Lot contrat : `acces?: string[]`, ligne `moteur` commentée, fixture à 3 entrées résolvantes (un aller simple + une paire réciproque : la réciprocité doit être **visible** dans la fixture, sinon rien ne démontre qu'elle coûte deux entrées). **Pas d'escalade.**

---

## ANNEXE

### A. Texte exact de la ligne d'audience — `destinations.ts`, après `'monde.lieux[].dangers'`

```ts
// LA TOPOLOGIE — `moteur`. Un identifiant est un HANDLE : le code résout, le
// modèle reçoit le CONTENU du lieu sous l'audience de CE lieu-là, jamais la clé
// (même règle que `charpente.depart.lieu_id`, `presence[].lieu_id`, `mene_a[]`).
// Injectée telle quelle, la liste des cibles donnerait au narrateur la CARTE : il
// narrerait un raccourci vers un lieu à deux sauts, ou nommerait une destination
// que le joueur n'a aucun moyen de connaître.
// C'est aussi la seule AUTORITÉ sur le déplacement : le moteur refuse toute
// destination absente de cette liste, MÊME SI LA PROSE L'A RACONTÉE. La règle vit
// ICI, en DONNÉE (liste fermée) — jamais en consigne de prompt.
// L'ÉTIQUETTE d'une sortie dans le contexte de la n° 10 n'est PAS tranchée ici :
// c'est le `nom` de la cible (KR-195, arbitrage transverse propriété de la n° 10)
// ou une prose par arête (`acces[].description`, non livrée — voir open_questions).
'monde.lieux[].acces[]': 'moteur',
```

### B. `open_questions` de `dossier-canon/specification.json` — texte à recopier

> **Quelle étiquette porte une sortie dans le contexte de la n° 10 ?** `acces[]` ne porte aujourd'hui **aucun champ injectable** : le narrateur décrit les issues depuis `lieux[].description` / `ambiance` (`ia`), et le moteur seul connaît la cible. Deux réponses possibles, **propriété de la n° 10**, à trancher **avant** d'écrire l'assembleur :
> **(a)** le `nom` de la cible devient injectable — arbitrage transverse KR-195, déjà propriété de la n° 10 ; coût zéro champ, risque = nommer une destination non visitée ;
> **(b)** une prose par arête `acces[].description` (`ia`) — « l'issue vue d'ici », jamais la description de la cible ; coût = une tranche `dossier-canon` it6 (l'écran vit dans `FicheLieu.tsx`, KR-200/205), **zéro migration** (§ 4).
> Ne pas laisser la n° 10 injecter le `nom` **sans** trancher (a) : ce serait KR-195 contournée en silence.

### C. Contrat d'injection — ce que la n° 10 hérite, borné dès aujourd'hui

- **Entrée injectée** : les accès du **lieu courant SEUL**. Jamais le graphe, jamais les arêtes **entrantes**.
- **Borne** : O(**degré du lieu courant**), jamais O(|lieux|). Seul chemin dont la longueur est multipliée par un degré — il entre au balayage de budget des chemins `ia` de la n° 10.
- **Arête réflexive** : tolérée au SSOT sans garde neuve (KR-194), **écartée à l'injection**.
- **Doublons** : aucun garde au SSOT (limite assumée, identique à `mene_a`) — **dédoublonnés à l'injection**, sinon le rang cesse d'être une désignation.

### D. Contrat de sortie hérité — rien n'en est construit ici

| | |
|---|---|
| **Rôle** | R1 interprète (n° 10), puis R3 narrateur |
| **Entrée** | liste **numérotée** des accès du lieu courant, ordre du document |
| **Sortie** | `{ action: 'deplacement', sortie_rang: number }` — un **RANG**, jamais un identifiant (KR-231) |
| **Table rang → cible** | **rendue par l'assembleur**, conservée avec le tour, jamais re-dérivée |
| **Échec** | rejeu une fois, puis **repli déterministe** : aucun déplacement, refus émis par le **code** |
| **Invariant** | aucune destination absente d'`acces[]` du lieu courant n'est acceptée, même racontée |
| **Non-duplication** | liste fermée en donnée, jamais « le joueur ne peut aller que dans un lieu adjacent » en consigne |

### E. Hors tranche, inchangé

`acces[].condition_expr`, `acces[].cache`, un delta `deplacer_vers`, l'injection des arêtes entrantes, et — désormais — `acces[].description`.
