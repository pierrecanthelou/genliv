# Tour 1 — UX Designer — `dossier-copilote` it1

RISQUE — Les deux Card « pas encore livrées » (Tisser les indices, Éclater le synopsis) et le bouton « Lancer » désactivé faute de cible sur la Card active partagent le même langage visuel (grisé) pour deux raisons totalement différentes — un auteur ne peut pas distinguer « pas encore construit » de « il vous manque un geste ». Sur un panneau qui promet « jamais d'écriture sans un geste explicite », cette ambiguïté mine la confiance dès l'ouverture.

OBJECTION — Le contrat exige « label et hint IDENTIQUES … importés et jamais reformulés » — mais `HINT_FONCTION`, `HINT_APPARENCE`, `HINT_DESCRIPTION_JOUEUR` et les libellés « FONCTION »/« APPARENCE »/« DESCRIPTION JOUEUR » sont des `const` PRIVÉES de `dossier-fiches/components/BlocIdentite.tsx`, une feature isolée par KR-184, non exportées même en interne (`index.ts` n'expose que `PanneauPersonnages`). Aucun chemin d'import légal n'existe aujourd'hui. Les recopier serait exactement la faute que j'ai moi-même actée sur `MARQUEUR_A_ECRIRE` (KR-223).

PROPOSITION — (1) Créer `brain/dossier/libellesChampsProse.ts`, exportant `LIBELLES_CHAMPS_PROSE: Record<'fonction'|'apparence'|'description_joueur', {label, hint}>` — précédent `amorce.ts` (non ré-exporté par `brain/index.ts`) ; `BlocIdentite.tsx` bascule sur cet import (une ligne par champ), `dossier-copilote` fait de même. Lot `contrat`. (2) Pour le Select de ciblage, réutiliser `localiserEntite('pnj', p, index)`, DÉJÀ public via `brain/index.ts` — zéro nouveau code, zéro fichier `dossier-fiches` touché. (3) Distinguer les deux « désactivé » par le TEXTE : badge muted nommé sur les Card à venir + `title` sur « Lancer » nommant la cible manquante — précédent `EditorTopBar.previewDisabledReason`.

VERDICT — recevable sous réserve : la réserve (1) est un lot `contrat` non optionnel, à faire approuver nommément par le Tech Lead au tour 2 (il touche un fichier de `dossier-fiches`, feature « done »).

---

# ANNEXE — contrat de design exploitable

## 0. Vérification des jetons (point b) — tout existe, rien à rejeter

Vérifié dans `design_handoff_gamebook_editor/tokens/colors.css` + `spacing.css` (et leur copie in-app `src/styles/tokens/`) :

- `--surface-inset` → alias de `--paper-3` OK
- `--text-muted` → alias de `--ink-2` OK
- `--border-field` → alias de `--line-field` OK
- `--r-md` → `6px` OK
- Tons `Badge` (`src/brain/components/Badge.tsx`) : `neutral | muted | accent | good | bad` — `accent` et `muted` disponibles pour Accepté/Rejeté, `good`/`bad` bien réservés OK
- Tons `IconButton` (`src/brain/components/IconButton.tsx`) : `default | danger | accent` — `accent` (fond plein `var(--accent)`, texte `var(--text-on-accent)`) pour `+`, `danger` (`color: var(--bad)`) pour le retrait OK

Bouton primaire plein-accent : précédent `EditorTopBar` (« + Nœud ») — `color: var(--text-on-accent)`, `background: var(--accent)`, `border: 1px solid var(--accent)`, `border-radius: var(--r-md)`, `font-family: var(--font-mono)`. **Discipline accent** : un « Lancer » désactivé ne doit JAMAIS rester accent-teinté → à l'état désactivé : `background: var(--surface-sunken)`, `color: var(--text-disabled)`, `border: 1px solid var(--border-field)`, `cursor: not-allowed`.

## 1. Les trois Card par défaut du panneau

**Card 1 — « Compléter une fiche » (active à l'it1)**

- `CardHead` : `eyebrow="ASSISTANT"`, `title="Compléter une fiche"`
- Corps (Hanken, `--text-body`) : « Propose un texte pour un champ vide ou resté à écrire — fonction, apparence, description lue par le joueur. »
- `Select` de ciblage : `label="PERSONNAGE"`. Options rendues par `localiserEntite('pnj', personnage, index)` (`brain/dossier/identifiers.ts`, déjà exporté par `brain/index.ts`). **Ne jamais refabriquer** ce texte dans `dossier-copilote` (précédent `designationDe`, encapsulation).
- **État vide du Select** (aucun personnage) : une seule `option` désactivée « Aucun personnage dans ce dossier » ; `Lancer` désactivé, `title="Créez un personnage dans Personnages pour utiliser cet assistant."`
- Bouton « Lancer » (sentence case). Désactivé tant qu'aucune cible n'est choisie, `title="Choisissez un personnage pour activer Lancer."`

**Card 2 — « Tisser les indices » (pas encore livrée, it2)**

- `CardHead` : `eyebrow="ASSISTANT"`, `title="Tisser les indices"`
- `Badge tone="muted"` : « Bientôt — itération 2 »
- Corps, au FUTUR : « Proposera qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources. »
- Aucun `Select`, aucun bouton « Lancer » désactivé dedans — un faux « Lancer » grisé serait indiscernable d'un bug (c'est le RISQUE).

**Card 3 — « Éclater le synopsis » (pas encore livrée, it4)**

- `CardHead` : `eyebrow="ASSISTANT"`, `title="Éclater le synopsis"`
- `Badge tone="muted"` : « Bientôt — itération 4 »
- Corps, au futur : « Proposera une distribution de personnages à partir du synopsis, de l'accroche et du ton. »

## 2. Entrée de navigation (surface)

`ListRow` sœur de « Contrôles » dans `DossierEditorScreen.tsx` : `title="Copilote"`, `nav aria-label="Copilote"`. Constante LOCALE à `bascule-editeur` : `DESTINATION_COPILOTE = 'copilote' as const`, troisième branche de `DestinationNav`, jamais remontée dans `brain/` (BUG-082).

## 3. État de chargement (role="status")

- `role="status"` — précédents réels : `SyncIndicator.tsx`, `ImportDossierButton.tsx`. Ce qui est neuf est la COMBINAISON chargement + Annuler + Échap-rend-le-focus.
- Texte exact : « Le copilote réfléchit… » (ellipse unique, précédent « Synchronisation… »).
- Bouton « Annuler » — ton neutre, PAS accent : `color: var(--text-body)`, `border: 1px solid var(--border-card)`, `background: var(--surface-card)`.
- Clavier : au clic sur « Lancer », le focus va sur « Annuler ». Échap = même action que « Annuler » ET rend le focus à « Lancer ». À l'issue (succès ou échec), le focus revient aussi à « Lancer ».

## 4. Les quatre textes (chemins d'échec) — jamais confondus

(a) **Worker injoignable** : « Le copilote est indisponible… Réessayez dans un instant. »

(b) **Sortie illisible après le rejeu unique** : « Le copilote n'a pas produit de proposition exploitable. »

(c) **Contexte insuffisant** — gabarit paramétré par le LIBELLÉ D'ÉCRAN du champ manquant, jamais sa clé technique : « Il manque « {LIBELLÉ_CHAMP} » pour proposer ce texte — complétez d'abord ce champ dans la fiche. » **C'est ce même texte qui sert de refus `MARQUEUR_A_ECRIRE`** : ce n'est pas un cinquième texte, c'est le déclencheur le plus fréquent de (c). Rendu de façon SYNCHRONE dans la zone du panneau, jamais dans la région `role="status"` puisqu'aucun appel réseau n'est parti.

(d) **Vide-mais-réussi** (pas un échec) : « Aucune proposition — tous les indices ont déjà au moins deux détenteurs ou sources. » — **Note pour la QA** : ce texte n'est atteignable par AUCUN chemin réel à l'it1. Le critère de discriminance (#3) doit donc se prouver par **unicité des quatre constantes**, pas par un rendu bout-en-bout des quatre chemins — sinon (d) est un test qui ne peut pas exister avant l'it2.

## 5. Après décision

Ligne compacte + `Badge tone="accent"` « Accepté », ou `Badge tone="muted"` « Rejeté ». **Jamais** `good`/`bad` (réservés réussite/échec de jet — veto si un ouvrier les réutilise par réflexe « vert/gris »).

## 6. Les trois états vides du panneau (point d)

1. **Première ouverture** : les trois Card du § 1 — ce n'est PAS un vide, les trois Card en sont le contenu.
2. **Aucun personnage dans le dossier** : `Select` à une seule option désactivée + `Lancer` désactivé avec raison nommée.
3. **Aucune proposition** après un « Lancer » réussi mais sans rien à proposer : texte (d) — inerte à l'it1, première exécution réelle à l'it2.

## 7. La contradiction (point c) — tranchée

Recopier `HINT_FONCTION` etc. dans `dossier-copilote` est un veto UX (divergence possible — même risque que KR-223). Solution : lot `contrat` qui crée `brain/dossier/libellesChampsProse.ts` (précédent exact `brain/dossier/amorce.ts` : non ré-exporté par `brain/index.ts`, importé par chemin direct) et fait basculer `BlocIdentite.tsx` sur cet import — un remplacement d'une ligne par champ. Si le Tech Lead refuse de rouvrir un fichier « done », **repli à discuter au tour 2** : les trois paires restent dupliquées avec un test de non-régression qui compare les deux littéraux caractère à caractère (moins bon : dette explicite plutôt que silencieuse).

## 8. Rejets motivés (à recopier au registre des désaccords si non repris)

- **REJETÉ** — glyphe coche pour l'état Accepté : le contrat interdit tout glyphe neuf, `+` porte déjà ce sens.
- **REJETÉ** — toast / `role="status"` global de confirmation après acceptation (précédent `ImportDossierButton`) : le contrat prescrit une ligne compacte + Badge SUR la `LigneProposition` ; un second canal dupliquerait l'information et son texte divergerait au premier refactor.
- **REJETÉ** — Badge `accent` sur les Card « Bientôt » : l'accent marque sélection/action primaire/option active, jamais un statut de roadmap — `muted` uniquement.
- **REJETÉ** — un `Lancer` désactivé « grisé identique » sur les trois Card : voir RISQUE — les Card 2/3 n'ont pas de `Lancer` du tout à l'it1.
- **DIFFÉRÉ, pas rejeté** — lien cliquable « Aller à Personnages » dans l'état vide du Select (via `onSelectSection`) : ergonomiquement supérieur, mais hors du texte minimal exigé par le cadrage.

## Fichiers lus (traçabilité)

cadrage.md, specification.json, DESIGN-SYSTEM.md, tokens/{colors,spacing}.css, components/surfaces/{CardHead,ListRow}.jsx, src/brain/components/{Badge,IconButton,Select,Card,Field}.tsx, dossier-controles/components/PanneauControles.tsx, dossier-fiches/components/{FichePersonnage,BlocIdentite}.tsx, dossier-fiches/index.ts, src/brain/dossier/{amorce,identifiers}.ts, src/brain/index.ts, bascule-editeur/components/DossierEditorScreen.tsx, src/brain/components/EditorTopBar.tsx, cloud-sync/components/SyncIndicator.tsx, dossier-format/components/ImportDossierButton.tsx.
