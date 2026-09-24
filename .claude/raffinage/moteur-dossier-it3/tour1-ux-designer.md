# Tour 1 — ux-designer — moteur-dossier it3

RISQUE — Le seul risque UX réel n'est pas un écart au design system, c'est la **LISIBILITÉ**. Un jalon atteint doit se rendre comme une ligne de journal dev-débogueur, dans le même vocabulaire fermé que `lieu_courant : x → y` — jamais `enonce_texte` (audience `'ia'`, verbatim interdit : troisième prose que le contrat proscrit). Rendu ainsi, la phrase de démo réussit **formellement** mais reste cryptique pour un auteur non technicien qui parcourt vite l'écran.

OBJECTION — Le seul nom de champ d'`EtatMonde` disponible est `jalons_atteints` (pluriel, liste). L'utiliser tel quel pour narrer UN fait qui vient de devenir vrai **lit mal** : `jalons_atteints : jalon.premiere-nuit` ressemble à une réaffectation de champ, pas à un événement qu'on vient d'atteindre.

PROPOSITION — Étendre la liste fermée de la règle de reconstruction (aujourd'hui « noms de champs d'`EtatMonde` ») pour ADMETTRE aussi les identifiants du registre `PREDICATES` (déjà clos, déjà bas-de-casse) : le jalon se lit `jalon_atteint : jalon.premiere-nuit`. L'effet réutilise le champ d'`EtatMonde` qu'il écrit, **sans flèche** (rien à montrer comme « avant ») : `indices_connus : indice.sceau-brise`. Deux lignes `'moteur'` distinctes, même `tour`, mêmes composants — **zéro** nouveau composant, **zéro** nouveau jeton, **zéro** nouveau rôle, `JournalRow.tsx` **inchangé**. Repli sûr si le comité refuse l'extension : garder `jalons_atteints`.

VERDICT — **recevable sous réserve** : faire trancher par narratif/tech-lead l'extension de vocabulaire (`PredicatId` admis ou non) ; et **écrire explicitement dans le plan que `src/features/play-mode/**` n'a AUCUN fichier à ouvrir** pour la partie visible de ce lot.

---

# ANNEXE — Contrat de design

## 1. Ce que l'auteur VOIT

**Un jalon atteint est une ligne de journal `role: 'moteur'`, jamais un objet visuel séparé.** Aucun nouveau composant, aucun panneau « jalons », aucun compteur.

Chaîne visible, ordre causal (fixture `dossier-minimal.json`) :

| # | `role` | `texte` (reconstruit) | `origine` | Badge |
|---|---|---|---|---|
| 1 | `joueur` | `> ALLER lieu.val-cendre` | *(absent)* | `↪ JOUEUR` |
| 2 | `moteur` | `lieu_courant : lieu.le-fanal → lieu.val-cendre` | `'aller'` | `↻ MOTEUR` |
| 3 | `moteur` **(NEUF)** | `jalon_atteint : jalon.premiere-nuit` *(repli : `jalons_atteints : …`)* | *(absent — pas une `CommandeId`)* | `↻ MOTEUR` |
| 4 | `moteur` **(NEUF)** | `indices_connus : indice.sceau-brise` | *(absent)* | `↻ MOTEUR` |

Les quatre portent le **même `tour`** (§ J1 : une conséquence enchaînée n'ajoute jamais de pas). La clé React reste `index` (BUG-121) — elle absorbe sans modification les entrées `moteur` multiples du même pas, **ce que ce lot est le premier à exercer réellement**.

## 2. Réponses aux quatre questions du cadrage

1. **Ligne de journal, ou autre chose ?** Ligne de journal. Rien d'autre n'existe pour un « constat du monde » (KR-248), et en inventer un serait un composant maison évitable.
2. **`enonce_texte` franchit-il la ligne verbatim ?** **Non, jamais rendu, nulle part.** Le `texte` de la ligne 3 est **reconstruit** ; zéro caractère d'`enonce_texte` ou de `declencheur_texte` n'y entre — même test de discrimination qu'it2.
3. **Badge : `'moteur'` ou un 3ᵉ rôle ?** `'moteur'`. **Je ne demande AUCUN changement de contrat `brain/`** sur `RoleJournal`, et je le dis noir sur blanc plutôt que de le présumer en silence.
4. **Les effets (`Jalon.effet: Delta[]`) : visibles, où ?** **Visibles**, via une **ligne de journal supplémentaire** (ligne 4) réutilisant l'unique patron en place. `journal[].deltas` reste une **donnée non rendue** en it3 — même statut que `lieux_visites` en it2. Aucun consommateur humain n'a été nommé au cadrage ; lui donner un rendu serait KR-109.

## 3. Fichiers touchés — **aucun changement de composant**

- `JournalRow.tsx` : **inchangé** — la condition `origine !== undefined` gère déjà les lignes 3 et 4, dont l'`origine` est absente.
- `EcranPartie.tsx` : **inchangé** — `session.journal.map(...)` est déjà générique sur N entrées.
- `ConsoleCommandes.tsx`, `OutcomeBlock.tsx` : hors sujet.
- **Le travail visible est ENTIÈREMENT dans `brain/dossier/`** (composition du `texte`, ajout des entrées). Je le signale au plan pour qu'aucun lot n'ouvre `src/features/play-mode/**` par réflexe.

## 4. Textes visibles, mot pour mot

| Élément | Gabarit exact | Registre | Qui compose |
|---|---|---|---|
| Ligne « jalon atteint » | `jalon_atteint : {jalon_id}` — **repli** : `jalons_atteints : {jalon_id}` | dév.-débogueur | le moteur (`brain/dossier/`), jamais un littéral de composant |
| Ligne « effet » | `{champ_etat_monde} : {identifiant}` — ex. `indices_connus : indice.sceau-brise` | dév.-débogueur | idem |
| Badge | `↻ MOTEUR` (inchangé) | — | code existant |
| `[{origine}]` | **absent** sur les deux lignes neuves | — | conditionnel existant |

**Aucun texte neuf dans `src/features/play-mode/**`.** `TEXTE_JOURNAL_VIDE` inchangé ; l'état vide reste vivant tant qu'aucune commande n'a été acceptée.

## 5. Jetons — aucun jeton neuf

Les deux lignes neuves passent par le **même** `<JournalRow>` et héritent des mêmes styles — pas un seul `CSSProperties` nouveau. Jetons vérifiés existants : `--font-mono`, `--fs-meta`, `--fs-body`, `--text-faint`, `--text-muted`, `--text-body`, `--space-3`, `--bw-hair`, `--border-subtle`.

## 6. Discipline de l'accent

`--accent` : **aucun usage nouveau**, aucune tentation de « mettre en avant » le jalon en bleu — décoration, faute exacte que mon veto couvre. `--good`/`--bad` : **aucun usage**, un jalon atteint n'est pas un résultat de jet. `Badge tone="neutral"` reste le seul ton de `role: 'moteur'`.

## 7. États

- **Défaut** : lignes 3 et 4 dès que le moteur les a écrites, dans l'ordre causal, après la ligne 2 du même pas.
- **Vide** : aucun jalon atteignable ou aucune condition vraie → **aucune ligne 3/4**. Pas un état vide à part : c'est l'absence normale d'un fait qui ne s'est pas produit.
- **Erreur** : hors périmètre — la levée de `evaluerExpr` (KR-238) est une erreur de PROGRAMME, pas une UI d'erreur.
- **Idempotence** (`effet: 'sans_effet'`) : **aucune ligne visible distincte** — voir § 10.

## 8. Clavier

**Aucun changement.** Aucun élément focusable neuf ; les lignes restent des `<li>` non focusables (précédent it2).

## 9. REJETÉ (repris dans la note — BUG-082)

1. **Afficher `enonce_texte` verbatim**, même en journal dev-débogueur : troisième prose émise mot pour mot, interdite quel que soit le registre visé.
2. **Un troisième membre de `RoleJournal`** : changement de contrat `brain/` non sollicité.
3. **Une couleur d'accent ou sémantique** pour signaler le jalon : usage décoratif de `--accent`, ou détournement de `--good` hors jet.
4. **Un panneau ou compteur « jalons atteints »** séparé du journal : composant maison évitable, extension prématurée du squelette.
5. **Rendre `journal[].deltas` structurellement dans `JournalRow`** : gabarit sans consommateur humain nommé — KR-109 en germe.
6. **Une ligne visible dédiée pour un delta `'sans_effet'`** : ouvrirait un troisième mot d'état sans matérialité pour l'auteur.
7. **Un `ListRow`** pour ces lignes : `onSelect` requis romprait le contrat, même motif qu'it2.

## 10. Décisions prises en autonomie

- **Format d'un fait « devenu vrai » sans état « avant »** → `<champ> : <identifiant>`, deux-points seul, **pas de flèche** → l'inverse (`∅ → id`) ajouterait une mise en mots de booléen qu'aucune clause n'autorise.
- **`jalon_atteint` (extension) vs `jalons_atteints` (licite)** → je **propose** l'extension, plus lisible, et range le second en **repli sûr** → l'imposer sans validation ferait déborder le lot `contrat` d'une clause de vocabulaire non actée.
- **Deux lignes distinctes vs une ligne fusionnée jalon+effet** → **deux lignes** (un champ = une ligne, patron existant) → fusionner casserait le seul patron en place pour un gain d'espace négligeable.
- **`journal[].deltas` non rendu** → l'inverse coûterait un second gabarit pour une donnée sans lecteur humain nommé.
- **Delta `'sans_effet'` silencieux** → l'inverse ouvrirait un troisième état narré dans un vocabulaire censé rester fermé à quatre catégories.

## 11. Instrument recommandé

Aucune règle ESLint nouvelle n'est nécessaire — zéro composant, zéro jeton, zéro littéral CSS n'entrent dans `play-mode`. Le risque est **sémantique**, donc hors portée d'ESLint. Je recommande à la place que le lot `contrat` porte un **test de sérialisation** assertant qu'**aucun** `texte` de journal ne contient de sous-chaîne tirée d'`enonce_texte` ou de `declencheur_texte` de la fixture — précédent direct de « le texte est RECONSTRUIT, jamais un écho » (it2, `commandes.test.ts`), simplement étendu aux deux lignes neuves.
