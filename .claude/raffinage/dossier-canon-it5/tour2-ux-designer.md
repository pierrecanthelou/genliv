# Tour 2 — ux-designer — `dossier-canon` it5 (tranche B1)

> **NOTE DE L'ORCHESTRATEUR — artefact de tour parallèle.** Rendue en même temps que celle de `narratif-ia`, qui a **retiré son veto et sa demande de `acces[].description`**. L'UX accepte donc un veto qui n'existe plus, et son contrat `ISSUE` décrit un champ que personne ne demande plus. **Ce qui survit est signalé ci-dessous** — et le fait mesuré du § 1 est important indépendamment de l'issue.

## 1. Réponse au veto — ⚠ FAIT MESURÉ QUI SURVIT

**`BlocRelations.tsx` (`dossier-fiches` it5) porte DÉJÀ exactement cette anatomie** — `Select` cible + `Field` prose multilignes (commit au blur) + `IconButton` retrait, par ligne — pour `monde.personnages[].relations[].lien`, un champ `ia` « jamais lu tel quel par le joueur ». Une prose par arête n'est donc **pas un formulaire inventé sous pression** : le patron existe en production et un auteur le remplit déjà ailleurs.

> **Portée réelle de ce fait, à l'arbitrage** : il établit que **l'anatomie** est tenable, pas que **le champ** est justifié. L'argument de `narratif-ia` au tour 2 portait sur la **duplication** — `Lieu` a déjà trois proses `ia` décrivant le même fait —, or `Personnage` n'a **aucune** autre prose `ia` décrivant une relation. Le précédent ne transfère donc pas sur le point qui a fait retirer le veto.

**Risque nommé (survit si le champ est un jour livré)** : une ligne d'accès avec cible renseignée et ISSUE vide **a l'air complète à l'écran** (aucun vide visible) alors qu'elle est **invisible au narrateur** par le repli silencieux. Défaut de légende, pas de composant — se corrige par le texte, jamais par une couleur ou un badge (ce serait un usage décoratif de la hiérarchie).

**Contrat de texte du champ** *(caduc tant que `description` n'est pas livrée — conservé pour l'itération qui la portera)* :

```
LABEL_ISSUE       = 'ISSUE'
HINT_ISSUE        = 'IA — injecté au modèle tant que le joueur se trouve ici'
PLACEHOLDER_ISSUE = "Un escalier étroit se devine derrière la tapisserie, plongeant vers l'obscurité."
```

`label="ISSUE"` et non « DESCRIPTION » (déjà pris par le champ du lieu). `multiline rows={2}`, commit au blur, patron `BrouillonClimat.manifestation` / `BrouillonRelation.lien`. État vide : **rien de spécial**, placeholder standard, aucune teinte sémantique. Registre : immersion, présent, sans adresse au joueur ; hint « injecté au modèle », jamais « lue par le joueur » (elle n'est pas émise verbatim).

**Retire** sa ligne de tour 1 « ne pas ajouter de champ de prose… hors périmètre posé ».

## 2. ⚠ SURVIT — « ACCESSIBLE DEPUIS » (réponse à la proposition 2 du `tech-lead`)

Entre proprement dans l'anatomie **sans nouveau composant** : un `<p>` eyebrow + un `<p>` légende + une liste de `<p>` en lecture seule. **Pas** `ListRow`, qui porte `onSelect`/`selected` — ce serait un détournement de primitive pour un affichage statique. Position : après « ACCÈS DEPUIS CE LIEU », avant le pied de fiche.

```
EYEBROW_ACCESSIBLE_DEPUIS     = 'ACCESSIBLE DEPUIS'
LEGENDE_ACCESSIBLE_DEPUIS     = 'Les lieux qui mènent ici — calculé à la lecture, non modifiable depuis cette fiche.'
TEXTE_AUCUN_ACCESSIBLE_DEPUIS = "Aucun lieu ne mène ici pour l'instant — ajoutez un accès vers ce lieu depuis la fiche d'origine."
```

État vide : jamais un vide nu, le texte pointe vers l'action réparatrice. Pas de couleur d'alerte : information, pas refus. Chaque ligne = `localiserEntite('lieu', lieuSource, index)`, ordre du document, zéro tri. Coût design **nul** (mêmes composants, mêmes tokens, lecture seule). Si le comité la reporte, **ce contrat reste valide tel quel** pour l'itération qui la portera. Aucune prop supplémentaire : `FicheLieuProps.lieux` suffit.

## 3. Réserve de tour 1

**Maintenue, préventive**, étendue aux textes ci-dessus. Pas durcie en veto.

## 4. Annexe corrigée — parties modifiées

**Anatomie d'une ligne d'accès** *(version à deux contrôles — caduque sans `description` ; sans elle on revient à la ligne plate du tour 1)* — bloc à trois niveaux, précédent `BlocRelations.tsx` :

```
[en-tête]  eyebrowStyle : `ACCÈS ${index+1}`  ·····  IconButton ✕ (tone="danger")
[ligne 2]  Select label="LIEU CIBLE"
[ligne 3]  Field  label="ISSUE" hint={HINT_ISSUE} multiline rows={2}
```

`enTeteLigneStyle` (flex, `space-between`) remplace le `ligneAccesStyle` du tour 1, **abandonné**. **Zéro token nouveau** — les huit déjà vérifiés suffisent.

**LEGENDE_ACCES corrigée** *(la seconde phrase ne vaut que si `ISSUE` existe)* :

> « Les lieux que l'on peut rejoindre depuis celui-ci — un passage dans l'autre sens ne se déduit pas : ajoutez-le depuis l'autre lieu. Pour chacun, ISSUE est ce que l'on aperçoit d'ici : sans elle, le narrateur ignore ce passage. »

**`known_risk` demandé** *(conditionné au champ)* : « Un accès dont ISSUE reste vide est indiscernable à l'écran d'un accès complet alors qu'il est omis à l'injection IA (repli silencieux) — mitigé par la légende, pas par un signal d'écran. »

**Hors de son lane, non tranché** : la forme SSOT. Le contrat d'écran est agnostique — il ne dépend que de la paire (cible résolue, prose associée) par ligne.
