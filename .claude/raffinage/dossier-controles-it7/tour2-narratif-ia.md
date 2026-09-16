# Tour 2 — narratif-ia — dossier-controles it7

**C4 — réponse nommée au tech-lead.** Ton motif « nommer une cible mettrait un terme interne dans la prose » est **faux sur cette chaîne-là**, et c'est mesurable : `dossier-format/specification.json:15`, `resolved_decisions.expr_jamais_saisie`, écrit que l'auteur composera par « **Select alimenté par `PREDICATES[].label`** ». Ce libellé **est** le mot de l'auteur, pas un mot du schéma (`predicates.ts:25` : « Libellé français […] Jamais une syntaxe »), et aucun des sept ne heurte `TERMES_INTERDITS`. Ton précédent `MESSAGE_INDICE_SANS_RACINE` **ne transporte pas** : là-bas le fait manquant **est** l'entité du OÙ ; ici le OÙ nomme l'objectif et le fait manquant est une **autre** entité, sur un **autre** écran. Et la remédiation n'est pas « édite l'expression » — aucun widget ne l'écrit, l'UX l'a mesuré et `expr_jamais_saisie` en fait une décision — c'est « fais produire ce fait » dans Quêtes / Événements / Jalons / Personnages. ***Fais produire un fait* sans dire lequel n'est pas actionnable.** **MAINTENU**, coût assumé : L1 rend la première feuille en défaut, pas un booléen.

**C3 — réponse au QA.** J'ai cherché la lecture narrative ; **elle n'existe pas au schéma** : ni inventaire de départ (`types.ts:1401`), ni objet posé dans un lieu (`types.ts:922`, décision A du 2026-08-04), et KR-159 mesure **quatre** portes sur un id d'objet dont **une seule écrit en positif**. La seule lecture restante — le narrateur accorde l'objet en le racontant — est ma ligne de veto. **Vrai positif.** Ligne `possede_objet` **inchangée** ; on corrige la fixture, pas la règle.

**Mes deux objections** : maintenues. **Mes douze `REJETÉ`** : maintenus **en bloc** ; seul le n° 9 est précisé — il tient « ≤ 1 constat par objectif » et **ne s'étend pas** à « qui n'énumère aucun fait ». Cinq `REJETÉ` neufs.

**VERDICT — recevable sous réserve.** Aucun veto.

---

# ANNEXE A — ce que C4 coûte, exactement

`conditionAccomplissable` devient, **strictement en surensemble** (le booléen est `=== undefined`) :

    export interface FeuilleSansChemin { predicat: PredicatId; cibles: readonly string[] }
    /** `undefined` = accomplissable. Sinon la PREMIÈRE feuille en défaut, profondeur d'abord, ordre du document. */
    export function premiereFeuilleSansChemin(dossier: Dossier, condition: ExprNode): FeuilleSansChemin | undefined

- **Une seule traversée** : le refus de `collectRefs` tient tel quel, la sémantique `et`=∀ / `ou`=∃ / `non`=vrai-sans-descente est inchangée.
- **Aucune prose dans `atteignabilite.ts`** — le module compte, il ne raconte pas. Le texte reste à `controles.ts`.
- **« Première » doit être déterministe** et écrit comme tel : profondeur d'abord, ordre du document. Une session est rejouable, un rapport de linter aussi.
- L'objection « seconde résolution d'identifiant » : le précédent est **déjà livré dans `controles.ts`** — `depart-desert` garde 2 (`controles.ts:689-703`) fait exactement `findIndex` puis `localiserEntite`. **Résoudre pour NOMMER est raconter, pas compter.**
- **Rectification de fait** sur la signature du tech-lead : `controles.ts` **importe déjà** `producteursParIndice` (`controles.ts:2`). Ajouter `PREDICATES` n'ouvre pas un couplage neuf.
- Sous `ou(A,B)` tous deux improductibles, nommer A **suffit** comme remède ; sous `et(A,B)`, non. D'où la clause déjà posée : **le message n'affirme jamais que le remède suffit**.

**Correction au patron de l'UX** : sa `remediation` renvoie à « Objectifs → Condition de réussite ». Cet écran **n'écrit pas** `reussi_si_expr` : la phrase nommerait une surface qui n'existe pas. La remédiation doit désigner les écrans **producteurs**, et elle est **isomorphe aux producteurs comptés** (doctrine déjà écrite à `controles.ts:258-260`) — donc **trois** entrées, pas sept :

| prédicat mordant | producteur compté | remède nommé |
|---|---|---|
| `possede_objet` | `donner_objet` aux 4 sites de `CHEMINS_DE_DELTAS` | « faites donner cet objet par une récompense de quête, une conséquence d'événement ou l'effet d'un jalon » |
| `indice_connu` | les 3 familles de `producteursParIndice` | la phrase d'`indice-sans-source` existe déjà — **réutilisée**, jamais réécrite |
| `pnj_a_revele` | un `savoirs[]` du porteur | « donnez à ce personnage un savoir portant cet indice (Personnages) » |

Les quatre lignes muettes n'ont pas d'entrée : elles ne produisent aucun constat à it7.

# ANNEXE B — C3, le relevé complet

Le défaut de `dossier-reference.json` est **plus large** que ce que le QA a mesuré, et la fixture porte elle-même la preuve de l'intention d'auteur :

1. `canon.objectifs[1].reussi_si_expr` = `possede_objet(objet.sceau-de-cendre)` — **aucun `donner_objet`** ne le cible. `objectif-sans-chemin` **mord**, à raison.
2. `charpente.fins[0].condition_expr` = `ET(possede_objet(sceau-de-cendre), jalon_atteint(jalon.second-guet))` — **même feuille morte**, donc fin inatteignable. Hors périmètre (REJETÉ n° 8 maintenu), mais la même correction la répare.
3. `charpente.fins[0].texte`, émis **verbatim** au joueur : « **Tu poses le sceau de cendre sur la table de la vigie** ». L'auteur a clairement voulu que le héros le porte. **Donc on ajoute le producteur ; on ne change pas le prédicat.**
4. `canon.objectifs[1].echoue_si_expr` = `NON(possede_objet(sceau))` — **vrai au tour zéro** : l'objectif est échoué dès l'ouverture. Défaut **réel**, **cause différente**, hors it7 → `REJETÉ` n° 13 + candidat d'itération.

**Site candidat, une seule ligne, narrativement juste** — `monde.evenements[0].resolutions[0].consequence` (résolution « Le squelette s'effondre **en cendres** devant la tour ») : `{ "delta": "donner_objet", "cibles": ["objet.sceau-de-cendre"] }`. Le tableau existe déjà : seule sa longueur change, donc **rayon minimal**, et **zéro impact sur la saturation d'it6**.

Après cet ajout, la fixture redevient muette : `objectif.reveler-la-vigie` = `ET(lieu_visite, jalon_atteint)` — `lieu_visite` constante vraie (KR-224), et `jalon.premiere-vigie` porte **réellement** un `declencheur_expr` (`dossier-reference.json:372`), donc productible **pas seulement par prudence**.

**À mesurer, jamais à déduire** : le silence des deux fixtures après l'ajout, et le compte de deltas dans toute suite qui lirait `resolutions[0].consequence`.

Nuance de rédaction : les quatre lignes muettes s'écrivent « **non évaluée à it7** », jamais « toujours vraie ». Un commentaire plus large que le fait est exactement KR-199.

# ANNEXE C — H3, rédaction finale

À insérer à la suite de H2. L'en-tête du bloc passe à « 2026-09-16, itérations 6 **et 7** de la n° 6 ».

     * H3 — LE SEUL PRODUCTEUR DE `monde.pnj.<id>.a_dit[]` EST UN `savoirs[]` DU
     * PERSONNAGE PORTEUR. C'est ce qui rend `pnj_a_revele(p, i)` décidable sur un
     * document : la PAIRE (p, i) est productible si et seulement si `p` porte un
     * savoir dont l'`indice_id` vaut `i`. Aucun effet de règle n'y supplée —
     * `reveler_indice` écrit la liste des indices CONNUS, jamais le carnet d'un
     * personnage, et il ne le pourrait pas : son arité est 1, il n'a aucun
     * opérande `pnj` par lequel nommer QUI a parlé. Rien d'autre ne l'établit que
     * le commentaire de `predicates.ts` qui nomme le champ ; aucun moteur n'existe
     * encore pour trancher, et la n° 11 pourrait décider que le moteur inscrit
     * aussi `a_dit[]` lorsqu'un indice est révélé À TRAVERS un personnage par un
     * autre chemin — une résolution d'événement jouée en scène, par exemple.
     * C'EST LA SEULE HYPOTHÈSE DE CE FICHIER DONT L'ERREUR IRAIT DANS LE SENS
     * INTERDIT. H1 et H2 ne peuvent que SUR-COMPTER les producteurs, donc
     * sous-graduer le constat ; celle-ci, si la n° 11 la contredit, ferait
     * déclarer sans chemin une condition que le moteur accomplirait — un FAUX
     * POSITIF sous une règle BLOQUANTE. Elle se corrige en UN endroit, la ligne
     * `pnj_a_revele` de la table d'établissement, et nulle part ailleurs.
     * COROLLAIRE DE RÉDACTION, sans lequel l'hypothèse ne dit rien : la paire
     * s'évalue JOINTEMENT. Deux feuilles indépendantes — « ce personnage existe »
     * et « cet indice a un producteur » — seraient vraies ensemble sans qu'aucun
     * savoir ne les relie, et le prédicat serait déclaré productible à tort.

# ANNEXE D — une règle écrite à DEUX endroits, et elle a DÉJÀ divergé

Trouvé en écrivant H3, et c'est mon terrain de veto :

- `predicates.ts:66` — `pnj_a_revele` : « Y répond : `monde.pnj.<id>.a_dit[]`. »
- `deltas.ts:66` — `reveler_indice` : « Écrit la liste des indices connus — lue par `indice_connu` **et `pnj_a_revele`**. »

**Les deux ne peuvent pas être vraies.** `predicates.ts` a raison, et l'argument est mécanique : `reveler_indice.refKinds = ['indice']`, arité 1 — le delta n'a **aucun opérande `pnj`**, il ne peut donc pas écrire un carnet par personnage de façon définie. Le commentaire de `deltas.ts` est la copie fautive.

**Sous réserve retenue** : corriger ce commentaire **dans le même lot qu'H3**, sinon it7 livre une hypothèse datée que le fichier voisin contredit en toutes lettres. Conséquence : **L1 gagne `src/brain/dossier/deltas.ts`** (une ligne de commentaire). À **mesurer** avant de l'écrire : qu'aucune garde de source ancrée sur `deltas.ts` ne dépende de ce texte.

# ANNEXE E — `REJETÉ` NEUFS

13. **REJETÉ — étendre it7 à « une condition d'ÉCHEC satisfaite dès le tour zéro »**, alors même que le cas est RÉEL dans le dépôt. Cause différente, sens d'erreur inverse : elle se REPORTE, elle ne s'importe pas. À ne pas confondre avec le n° 8.
14. **REJETÉ — assouplir la ligne `possede_objet`** au motif qu'un objet pourrait être porté au départ ou ramassé dans un décor. Aucune des deux formes n'existe au schéma.
15. **REJETÉ — corriger le défaut de la fixture en changeant le prédicat de l'objectif.** La prose émise verbatim établit l'intention inverse : on ajoute le producteur manquant.
16. **REJETÉ — une `remediation` qui renvoie à « Objectifs → Condition de réussite ».** Cet écran n'écrit pas `reussi_si_expr` : la phrase nommerait une surface qui n'existe pas.
17. **REJETÉ — laisser le commentaire de `deltas.ts:66` en l'état** pendant qu'H3 affirme le contraire dans le fichier voisin. La correction coûte une ligne, la dérive coûtera une itération.

## Contrat de sortie IA — inchangé depuis le tour 1

Aucune entrée injectée, aucun schéma de sortie consommé, aucune mémoire de session. Comportements d'échec internes et normés : feuille dont la cible ne résout pas → **zéro constat** ; `remediation` sur un constat fabriqué → **chaîne vide**.
