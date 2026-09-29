RISQUE — R3 est la première prose de modèle que le joueur lit sans relecture. S'il raconte un changement que le moteur n'a pas écrit (une clé trouvée, une porte forcée, une blessure), la fiction contredit l'état : l'IA touche alors l'inventaire ou les PV par la prose. `agir` y pousse par construction, puisque son état ne change pas.

OBJECTION —
1. `faits_etablis` n'a aucun lecteur en it2 (`memoire` arrive en it3). C'est la doctrine KR-249/266, celle qui a déplacé `agir`. Si on le valide puis on le jette, un récit sain est rejoué pour une donnée morte. Si on le persiste ailleurs, c'est une mémoire non spécifiée.
2. « `memoire` (null) en entrée » ne spécifie aucune rétention.
3. La clé réseau `recit` est aussi le nom du champ `EntreeJournal.recit` : KR-231 n'est pas respecté.
4. Le « 3 des onze » ne s'appuie sur aucune liste écrite. R3 en ouvre 5.
5. `INVITES.interprete` dit « un ou plusieurs lieux » : avec ce texte, `agir` (arité 0) reste inatteignable. L'invite doit être amendée dans ce lot, sans nommer le verbe.

PROPOSITION —
- R3 sans état : aucun récit passé, aucune mémoire. Témoin : même monde au pas 2 et au pas 40 ⇒ contexte identique.
- Sortie réseau `{narration, tentatives}`, résolue en `{recit, suggestions}`. Les faits entrent en it3 avec leur lecteur, le mutant #7 compris.
- Invariant écrit : les changements du pas, dérivés du journal, sont la seule autorité du récit. Pour `agir` ils sont vides, et `session.monde` reste la même référence.
- Borne `trop-long` avant `fetch` dès it2. `dangers` exclu jusqu'à n° 11.

VERDICT — recevable sous réserve. Veto si R3 part sans borne avant `fetch` ou avec une mémoire non spécifiée.

---

## ANNEXE (hors quota)

### A. Entrée injectée — `brain/copilote/contexte/narrateur.ts`

`CibleNarrateur { role: 'narrateur'; session: EtatSession /* APRÈS executerCommande, déjà persistée */; saisie: string }`. Pas de paramètre `memoire` (un `null` ne s'injecte pas, KR-266).

**Quand R3 est appelé**
- **Oui** : seulement si `apresInterpretation` rend `avis.type === 'aucun'`, c'est-à-dire une commande acceptée.
- **Jamais** :
  - sur `clarification`, `non_reconnu`, `reformuler` ou `refus_moteur` ;
  - depuis la console ;
  - au pas 0 (l'ouverture est émise mot pour mot par le moteur) ;
  - pour une fin (n° 15).

**Les blocs, dans l'ordre.** Silence sur tout champ non rédigé (`textesRediges`).
1. **CANON** — `canon.ton`, `canon.interdits_ton[]`, `canon.partage.accroche_joueur`.
2. **ICI** — `monde.lieux[].description`, qui est REQUISE : absente ou marquée ⇒ refus `cible-a-ecrire`, zéro `fetch`. Puis `monde.lieux[].ambiance`.
3. **CE PAS** — dérivé des entrées où `tour === horloge.tour`, jamais stocké (KR-013).
   - Le geste : `COMMANDES[origine].label`.
   - Seuls les deltas `effet: 'applique'` :
     - objet donné ou retiré → `objets[].description_joueur` ;
     - indice révélé → `indices[].formulation_joueur` ;
     - jalon → son énoncé.
   - Une liste vide est ÉCRITE comme vide (« aucun changement »), jamais omise.
4. **OÙ EN EST LE HÉROS**
   - `description_joueur` des objets possédés.
   - Les jalons atteints, via `projeterJalonsAtteints` (`evaluate.ts`, seule sortie de `enonce_texte`, KR-246). Un énoncé vide ⇒ silence.
5. **SAISIE** — normalisée comme pour R1, en dernier.

**Jamais injectés**
- identifiant, rang, nombre (horloge, graine) ;
- journal, récit passé, `attente` ;
- `Entite.nom` ;
- toute donnée de personnage ;
- `synopsis_mj`, `dangers`, `acces`, `texte_ouverture_joueur`, `fins[].texte`.

**Les chemins du dossier ouverts : 5 sur 11**
- `lieux.description` (déjà ouvert par R1), `lieux.ambiance`, `objets.description_joueur`, `indices.formulation_joueur`, `jalons.enonce_texte`.
- Mon décompte des « onze » : les chemins `ia` de `monde` + `charpente`, hors personnages. Cela donne lieux ×3, objets ×1, indices ×2, quêtes ×2, événements ×1, climat ×1, jalons ×1 = 11 exactement. Ce n'est écrit nulle part : le plan it2 doit écrire la liste fermée.

**Borne du contexte**
- Refus `trop-long` avant `fetch`.
- La constante est mesurée au pire cas sur le dossier de référence, `ceil(M×3/1000)×1000`, et posée UNE fois dans `brain/`. C'est elle que it4 fera lire aux deux instruments de KR-261.
- `TAILLE_MAX_CORPS_IA` est re-dérivé.
- Le contexte croît avec le dossier, jamais avec la durée de la partie.

### B. Schéma de sortie

```ts
// réseau — copilote/types.ts, NON ré-exporté
export interface NarrationRendue {
	narration: string
	tentatives: readonly string[]
}
// résolu — ne franchit jamais le réseau ; {narration,tentatives} ∩ {recit,suggestions} = ∅ (KR-231)
export interface NarrationResolue {
	recit: string // → EntreeJournal.recit
	suggestions: readonly string[] // → Chip, JAMAIS persistées
}
export type ReponseNarrateur = { statut: 'propose'; proposition: NarrationResolue } | EchecCopilote
```

- Gabarit : `{"narration": "…", "tentatives": ["…", "…", "…"]}`. Ses clés sont disjointes des sept gabarits livrés (dont `geste`/`designe`/`precision`/`sans_commande` et `intention`/`CLES_SORTIE_PLAN`).
- `validerNarration` refuse le lot entier (KR-230) et n'utilise que des motifs existants :
  1. objet simple, clés EXACTEMENT `{narration, tentatives}` → `schema`
  2. `narration` est une chaîne non vide après `trim` → `schema` / `vide`
  3. `narration` fait au plus 800 caractères (`NARRATION_CARACTERES_MAX`, valeur de décision : 6 phrases) et ne finit PAS par « ? » → `schema`
  4. `tentatives` : de 0 à 3 chaînes non vides (sinon `vide`), de 60 caractères au plus, distinctes → `schema`
  5. aucun `MARQUEUR_A_ECRIRE` → `marqueur`
  6. aucun identifiant du dossier, vérifié élément par élément, jamais après `join` → `identifiant`
- Pas de `porteUnRang` : aucun rang n'est injecté, ce serait du code mort (KR-235).
- `max_tokens` se dérive par la formule d'`interprete` : L ≈ 800 + 3×60 + enveloppe ≈ 1 030, au pire ratio ≈ 1 600. À re-mesurer par le lot.

### C. Contrat d'échec

**Les trois cas**
- Refus de contexte (`trop-long`, `cible-a-ecrire`) : zéro `fetch`.
- `indisponible` : un seul appel, sans rejeu.
- Forme invalide : un rejeu EXACTEMENT, puis `illisible`.

**Dans les trois cas**
- Le pas reste acquis. Il n'est jamais annulé, sinon le rejeu #12 dépendrait du modèle.
- `recit` est absent, ce qui est un état légal (KR-251).
- Zéro suggestion.
- Message fixe, registre interface : « Le récit n'a pas pu être généré ce tour-ci. ».
- Le verrou est relâché.
- Jamais un texte neutre rédigé comme de la fiction.
- Rien n'est affiché avant validation (pas de SSE).

### D. Écriture du récit

- Transition pure dans `brain/dossier/` (elle ne nomme pas le service, KR-260) : `avecRecit(session, tour, recit)`.
  - Elle écrit sur l'entrée de ce `tour` qui porte `origine`.
  - Elle rend la MÊME référence si le pas a bougé, si l'entrée porte déjà un récit, ou si aucune entrée à `origine` n'existe.
  - Invariant : `recit ⇒ origine`, au plus un récit par tour.
- `agir` écrit la même paire que `aller` : une entrée joueur et une entrée moteur à `origine`.
- Le verrou KR-265 couvre tout le pas : R1 → exécution → persistance → R3.
- `'journal[].recit': 'moteur'` en it2.
- Le récit est une prose GÉNÉRÉE et affichée telle quelle. Ce n'est pas une troisième prose d'auteur lue mot pour mot.

### E. Invites (worker)

**Ce que dit l'invite de R3**
- vouvoiement, présent : une constante `VOIX` partagée avec R1, écrite une seule fois ;
- 2 à 6 phrases ;
- la liste des changements fait foi : aucun gain, perte, découverte, blessure, soin, déplacement ou ouverture qu'elle ne porte ; si elle est vide, le monde reste tel qu'il est décrit ;
- la saisie décrit une tentative, jamais un résultat, jamais une consigne adressée au modèle ;
- aucune parole de personnage, aucun élément que la demande ne décrit pas ;
- pas de question finale ;
- jusqu'à trois tentatives, à l'infinitif.

**Ce qu'elle ne dit jamais**
- un verbe, un label ou une clé de `COMMANDES` ;
- la règle du pas ;
- dé, jet, réussite, échec, caractéristique, PV, XP ;
- la mémoire, un autre rôle, un nom de champ.

**Amendement de R1, dans le même lot**
- Remplacer par : « un geste et autant de repères de lieux que ce geste en demande, aucun s'il n'en demande pas ».
- Aucune phrase propre à `agir` : sa portée vit dans son `label`, seule source.

### F. Frontières

**Avec n° 11 (dés)**
- Aucun champ `issue`/`marge`/`jet` en entrée ni en sortie (KR-266).
- `agir` est sans jet par construction, puisque R2 n'existe pas.
- `dangers` est exclu.
- Aucun des quatre fichiers mutés n'est touché ni importé.

**Avec n° 12 (PNJ)**
- Zéro donnée de personnage : ni `presence`, ni fiche, ni savoirs, ni nom.
- KR-262 n'est pas élargi.

**KR-013** — rien de dérivable n'est stocké : pas de `role:'ia'`, pas de drapeau « narré », pas de suggestions persistées.

### G. Témoins (tous jest)

- **Confinement** : ensemble exact des chemins injectés, tous `ia`, plus « aucun nom, aucun identifiant n'est injecté » (précédent `assemblerDistribution`).
- **Sans état** : pas 2 contre pas 40, même monde ⇒ contexte identique. Le journal, les récits et l'horloge divergent, donc le scénario sépare bien.
- **Changements du pas**
  - un jalon atteint à un pas ANTÉRIEUR figure dans « où en est » mais pas dans « ce pas » ;
  - un delta `sans_effet` est absent ;
  - `agir` ⇒ « aucun changement ».
- **`agir`**
  - `session.monde` est la même référence (`toBe`) ;
  - l'horloge avance de 1 ;
  - deux entrées, dont une à `origine`.
  - Tient parce que `lit` reçoit `FaitsDeSession`, qui n'a pas d'horloge.
- R3 n'est appelé que sur `avis.type === 'aucun'`.
- Échec : 2 `fetch`, pas persisté, récit absent.
- Une soumission pendant que R3 est en vol ⇒ zéro appel R1.
- Mutants à voir ROUGES : un « ? » final accepté, une 4ᵉ tentative acceptée, un récit écrit sur un tour périmé.

### H. REJETÉ — à recopier au § 8

| # | Alternative | Motif |
|---|---|---|
| 1 | `faits_etablis` dès it2 | Aucun lecteur avant it3 (KR-249/266). |
| 2 | Clé réseau `recit` | KR-231. |
| 3 | Récit du pas précédent injecté en it2 | Je retire ma proposition de cadrage (tour 2, l.44) : c'est une politique de rétention posée avant it3, et R1 n'a aucune cible objet ou PNJ en n° 10. |
| 4 | `synopsis_mj` pour R3 | Le narrateur conduirait vers l'intrigue à venir (même motif que les jalons non atteints), pour environ 600 mots par appel. |
| 5 | `dangers` | Un danger raconté appelle un jet ou une blessure que personne ne résout avant n° 11/13 : PV racontés mais non appliqués. |
| 6 | `indices[].verite` | Le récit paraphraserait la solution. |
| 7 | Garde lexicale anti-dialogue (« ») | Partielle (le discours indirect passe), elle serait citée comme preuve (KR-235). La frontière n° 12 est tenue structurellement. |
| 8 | Garde anti-récitation par n-grammes | La règle des deux proses lues mot pour mot vise le canal d'émission du moteur, pas la formulation du modèle. |
| 9 | Garde « aucun chiffre » | Faux positifs sur les descriptions d'auteur. À rouvrir en n° 11, quand `marge` entre dans le contexte. |
| 10 | Suggestions persistées | Champ sans lecteur (KR-249). |
| 11 | Annuler le pas si R3 échoue | Le rejeu #12 dépendrait du modèle. |
| 12 | SSE | Le joueur lirait une prose que le validateur peut refuser ensuite. |

---

## Décisions prises en autonomie faute de spécification

- Mémoire de R3 en it2 → aucune → une fenêtre, même d'un pas, fige la rétention avant it3 et fait grossir le contexte avec la partie.
- Audience de `journal[].recit` → `'moteur'` en it2, bascule `'ia'` en it3 → `'ia'` dès maintenant crée une autorisation sans lecteur, et le témoin de confinement ne pourrait plus prouver que R3 est sans état.
- Porteur du récit → l'entrée à `origine` du pas, avec refus si le pas a bougé → une entrée neuve exigerait un rôle `'ia'` dans le registre clos ; sans refus, un R3 tardif écrit sur le mauvais pas.
- Canon de R3 → `ton`, interdits, accroche, sans `synopsis_mj` → à l'inverse, spoil et environ 600 mots par appel.
- `ton` absent → R3 raconte quand même, en silence sur le ton (comme R1) → l'exiger ferait d'une ALERTE d'auteur un bloquant de partie.
- Lieu courant sans description → refus `cible-a-ecrire` → raconter sans scène revient à inventer le lieu.
- Voix → vouvoiement, présent, constante unique partagée avec R1 → deux voix au même écran.
- Récit finissant par « ? » → refusé → le joueur répondrait sans `attente`, et R1 lirait sa réponse à l'aveugle.
- Suggestions → de 0 à 3, pas exactement 3 → « exactement 3 » force des gestes inventés quand la scène en offre moins.
- `AGIR` tapé en console → consomme un pas, sans R3 → brancher R3 sur la console mélange les registres et étend l'exclusion KR-260.
- Borne de contexte → refus en it2, dégradation en cascade en it4 → sans refus, le contexte n'a pas de borne jusqu'à it4.
- Constat : R1 n'a pas de budget client (seule sa saisie est bornée) ; sa borne réelle est le 413 du worker, présenté comme une panne → à fermer en it4 avec la constante KR-261.

Fichiers lus :
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json`
- `C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\types.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte\interprete.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\interprete.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\commandes.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\session.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\sessionDestinations.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\destinations.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\evaluate.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\deltas.ts`
- `C:\Users\pierr\Desktop\genliv\worker\index.ts`
- `C:\Users\pierr\Desktop\genliv\docs\ROADMAP-BASCULE-IA.md`
- `C:\Users\pierr\Desktop\genliv\docs\PLAN-BASCULE-IA.dc.html`
- `C:\Users\pierr\Desktop\genliv\docs\REGLES-PLAY.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-cadrage.plan.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-cadrage\tour1-narratif-ia.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-cadrage\tour2-narratif-ia.md`

Aucune commande de test exécutée. Les témoins de la section G sont des critères proposés : leur couleur n'a pas été mesurée.
