RISQUE — Le `SegmentedControl` passe d'une **bascule entre deux collections** (it2, jalons/fins) à un **filtre d'une seule collection** (`lie_a_histoire`). Si le changement d'onglet ne redéfinit pas explicitement la sélection quand la fiche ouverte sort du sous-ensemble affiché, l'auteur perd sa fiche sans signal — exactement la vigilance qu'it2 avait nommément reportée ici (spec `open_questions`, désaccord it2 §8-7). C'est le risque premier de cette itération.

OBJECTION 1 — Le cadrage (§3 « D1 déjà câblé… avertissement… jamais semé ») laisse croire à une région D1 visible sur Événements. Or `tables.ts:686-690` fixe `alerteSansExpr: false` sur `evenements[].declencheur_texte` — silence PAR CONSTRUCTION, même régime que Jalon (jamais Fin). Bâtir une région `role="status"` qui ne s'allume jamais serait un état mort ; je demande le silence, prouvé par la même prop toujours vide (précédent `FicheJalon`), pas par omission de code.

OBJECTION 2 — Le précédent DONNEUR (`FicheQuete`) suppose `avecOrpheline` sur une collection du document. `monstre_ref` cible `BESTIARY`, registre constant et immuable : aucune entrée ne peut devenir orpheline. Copier le motif DONNEUR tel quel serait une fausse manip.

PROPOSITION — (1) Au basculement de filtre, sélection = première ligne du sous-ensemble filtré ; événement créé sous « LIBRES » naît `lie_a_histoire: false` explicite (jamais `undefined`), sous « LIÉS » naît `true` — sinon il n'apparaît pas dans l'onglet où il a été créé. (2) Compteur unique dérivé du sous-ensemble filtré, jamais du total. (3) `Select` MONSTRE : options = `BESTIARY` telles quelles, sans `avecOrpheline`.

VERDICT — recevable sous réserve (silence D1 confirmé en tour 2, comportement de sélection au filtrage acté).

---

ANNEXE — Contrat de design, itération 4 (Événements)

**Composants** : `Field`, `ListRow`, `Card`, `IconButton` (×2 Monter/Descendre + ✕ retrait), `Select`, `SegmentedControl`, `IssueList`, `EditeurEffets` (réutilisé, zéro fork). Aucun composant neuf.

### `PanneauEvenements.tsx` (remplace l'état vide section « evenements », index 8)

1. Eyebrow panneau : `ÉVÉNEMENTS`.
2. `SegmentedControl` (`role="radiogroup"`, composant réel — pas `tablist`, précédent it2), pleine largeur, **FILTRE** (pas bascule de collection) : `{ value:'lies', label:'LIÉS À LA TRAME' }` / `{ value:'libres', label:'LIBRES' }`, défaut `'lies'`. Pilote `lie_a_histoire === true` vs `!== true`. Jamais un chip par ligne. Jamais le mot « canon ».
3. Compteur unique, dérivé du sous-ensemble filtré : `${n} événement(s) lié(s) à la trame` / `${n} événement(s) libre(s)` — jamais le total du dossier (contraste explicite avec it2, qui avait deux compteurs de deux collections distinctes).
4. Liste `ListRow` (`title = localiserEntite('evenement', ev, index)`, `subtitle = ev.id`) + 2 `IconButton` Monter/Descendre — le déplacement s'opère entre voisins **du même sous-ensemble filtré affiché** (saute les lignes de l'autre filtre dans le tableau `evenements[]` réel), sans quoi « Monter » sur la première ligne visible resterait sans effet perceptible.
5. Bouton bas : `+ Ajouter un événement…`. Commit immédiat (précédent it1/it3) : `{id, resolutions: [], lie_a_histoire: <valeur du filtre actif au clic>}` (jamais `undefined` — condition pour apparaître aussitôt dans le bon onglet).
6. État vide, par filtre, glyphe `❏` : `Aucun événement lié à la trame — cliquez « + Ajouter un événement… » pour commencer.` / `Aucun événement libre — cliquez « + Ajouter un événement… » pour commencer.`
7. Au changement de filtre : si la fiche sélectionnée sort du sous-ensemble, sélection → première ligne du sous-ensemble affiché ; sous-ensemble vide → aucune fiche à droite (l'état vide de la liste suffit, pas de second message dupliqué à droite).

### `FicheEvenement.tsx`, dans l'ordre (aucun champ requis au niveau de l'entité — commit immédiat comme it1/it3)

1. `Field label="NOM DE L'ÉVÉNEMENT" hint="interne" placeholder="L'embuscade du pont de pierre"`.
2. **MONSTRE** (optionnel), idiome « porte » (précédent DONNEUR `FicheQuete.tsx`, **sans** `avecOrpheline` — voir objection 2) : tant que `monstre_ref` absent, `Select` unique, première option `+ Adosser un monstre du bestiaire…` (`value=''`), options = `BESTIARY.map(m => ({ value: m.templateId, label: m.name }))`, dans l'ordre du registre. Une fois choisi : `Select` résolu (label `MONSTRE`) + `IconButton label="Retirer le monstre" tone="danger"` (`✕`) → `monstre_ref = undefined`.
3. `Field label="DÉCLENCHEUR" hint="auteur — jamais injecté au modèle" multiline rows={2} placeholder="Le joueur revient à Val-Cendre après la tempête."` (exemple verbatim du docstring `types.ts:1091`). **Aucune région D1** sous ce champ (silence par construction, `alerteSansExpr:false` — objection 1).
4. *(Conditionnel — si le tech-lead retient `nature` comme champ authored plutôt que dérivé de `monstre_ref` : `SegmentedControl` 3 segments `MONSTRE` / `SCÈNE` / `OBSTACLE`, label `NATURE`, positionné entre 2 et 3. Si dérivé : aucun contrôle, rien à écrire ici.)*
5. Section **RÉSOLUTIONS** — légende `Les issues possibles de cet événement, et ce que chacune change.` Chaque résolution committée :
   - `Field label="RÉSULTAT" hint="IA — ce que le narrateur joue quand cette issue survient" multiline rows={2} placeholder="Le loup blessé bat en retraite ; le passage reste libre."`
   - `IconButton label="Retirer cette résolution" tone="danger"` (`✕`).
   - `EditeurEffets` scopé à `resolution.consequence` : `titre="CONSÉQUENCES"`, `legende="Ce que cette résolution change dans le monde."`, `texteVide="Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer."` *(interprétation : le texte se distingue de celui de Quêtes par le contexte, pas nécessairement par instance de résolution — à confirmer tour 2 si un rôle lit « par résolution » comme unique par instance).*
   - Ligne d'ajout `+ Ajouter une résolution…` — **brouillon différé** (précédent it2 Jalon/Fin, it3 étape) : ligne structurellement identique à une ligne écrite, placeholder vide seul signal ; `resultat` vide au blur = rien écrit ; non vide au blur = commit atomique `{resultat, consequence: []}`, alors seulement l'`EditeurEffets` de cette résolution apparaît (on ne peut pas ajouter de conséquence à une résolution qui n'existe pas encore au document).
   - État vide de la section : `Aucune résolution — cliquez « + Ajouter une résolution… » pour commencer.`
6. Bandeau de refus (`role="status"`, `IssueList`, motif `FicheIndice.tsx` inchangé), dernière position.

**Clavier** : Tab suit l'ordre visuel — eyebrow → `SegmentedControl` filtre (flèches gauche/droite, `role="radiogroup"`) → liste + Monter/Descendre → `+ Ajouter un événement…` → NOM → MONSTRE → DÉCLENCHEUR → RÉSOLUTIONS (RÉSULTAT puis EFFET/CIBLE de chaque résolution) → bandeau refus (non focusable). `Entrée` dans `Field` mono-ligne (NOM) blur-committe ; `Field multiline` (DÉCLENCHEUR, RÉSULTAT) insère un saut de ligne. `Échap` sur un brouillon de résolution incomplet l'abandonne sans dialogue (rien n'a été écrit). Focus revient à l'élément déclencheur après tout retrait de ligne (résolution ou effet).
