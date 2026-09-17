# Tour 2 — UX designer (contre-lecture)

**Deux corrections à moi-même** avant de répondre, vérifiées sur le dépôt réel : (1) il n'existe **pas** de composant `CardHead` — seulement `Card` (wrapper nu) ; l'en-tête est composée localement, motif déjà utilisé trois fois dans `dossier-fiches`. (2) Les hints de registre que je proposais d'inventer **existent déjà** pour presque tous les champs cités par `narratif-ia`.

## C1 — **Je retire ma position d'ordre**, je maintiens la conséquence de rendu
Mon argument tour 1 était un argument de **RENDU**, pas de risque d'infrastructure. Les trois autres argumentent sur un axe hors de mon domaine de veto. **Je retire ma proposition d'ordre** et je n'arbitre pas entre les trois versions concurrentes — ce n'est pas mon rôle.
Ce qui reste à moi : **peu importe laquelle gagne, ce n'est jamais « Éclater le synopsis » qui pose la destination** — les trois autres mettent une anatomie `LigneProposition` en premier, pas la grille de `Card`. Donc la grille `Card` est une **anatomie différente**, pas une anatomie supplémentaire improvisée tard — **et précisément parce qu'elle arrive en dernier, je l'écris maintenant, dans ce cadrage, pour qu'elle ne soit pas inventée ad hoc.**

## C-anatomie — les six curseurs : **troisième variante `GROUPE`**
Confirmé : « accepté champ par champ » ne peut pas s'appliquer aux curseurs.
Précédent trouvé dans le code : `curseurs.ts` porte **dans son propre commentaire une instruction écrite POUR cette feature** (« Aucun site de rendu en itération 8 — le contrat de design ne rend que `label` et `affinite`… `describe` ne franchit JAMAIS le document »), et `BlocCaractere.tsx:145` donne le format déjà utilisé : `` `${CURSEURS[c].label.toUpperCase()} (${CURSEURS[c].affinite})` `` — « MÉFIANCE (IN) ».
**Anatomie `GROUPE`** : bandeau « CURSEURS DE CARACTÈRE », légende « Les six curseurs de caractère — un bloc indivisible, accepté ou refusé en une fois. », six lignes statiques `MÉFIANCE (IN) — 7` (lecture seule, **pas de `Stepper`**), Badge `neutral` « NOUVEAU », et **une seule paire** d'`IconButton` : « Accepter les six curseurs » / « Rejeter les six curseurs ».

**Point de blocage remonté au tour 3, hors de mon domaine mais qui conditionne l'anatomie** : le `ChampPropose { entiteId, champ, valeur: string }` du Tech Lead porte une **valeur scalaire par champ**. Il faut confirmer qu'une seule entrée `champ: 'curseurs'` peut porter les six nombres **comme une unité**, pas six `ChampPropose` filtrés après coup — **sinon mon geste « accepter en bloc » n'a rien à accepter en bloc.**

## C-registre — **pas de troisième axe visuel** : le hint EST déjà le marqueur, et il existe déjà
Vérifié sur trois fichiers réels, les hints sont **déjà écrits** et nomment déjà le registre :
- `plan_actions[].action` → `HINT_ETAPE_ACTION = "interne — jamais lu par le joueur — ce que le personnage joue à cette étape"`
- `but.pourquoi` → `HINT_BUT_POURQUOI = "interne — motivation, si elle mérite d'être dite"`
- `revele_comment` → `HINT_REVELE_COMMENT = "La manière dont il le révèle — jamais la condition : …"`
- `parler` → `HINT_REPLIQUE = "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur"` — **la formule que `narratif-ia` cherchait à nommer existe déjà mot pour mot.**

**Non, pas de troisième marqueur.** Ma règle du tour 1 (label + hint identiques au champ d'origine) suffit et coûte zéro pixel — à condition de **durcir la discipline** : `LigneProposition` **importe** ces constantes, jamais une reformulation. Vocabulaire établi à continuer : « interne — … » pour les notes d'auteur, « prose de jeu d'acteur », « lue par le joueur ».

## C-faisabilité — confirmé, double usage du même marqueur
`MARQUEUR_A_ECRIRE` sert **côté écran** (choisir REMPLISSAGE vs REMPLACEMENT) **et côté service** (retirer le champ du contexte) — même constante importée aux deux endroits, jamais recopiée (KR-223). Ma variante REMPLISSAGE couvre bien les deux déclencheurs (« cible vide **ou** portant le marqueur »). Rien à changer.

## C8 — **je RETIRE l'extension `Field.readOnly`**, je propose un bloc statique local
Vérifié : `Field.tsx` est un contrôle **contrôlé et interactif**, sans notion de lecture seule. Lui ajouter une prop pour un seul appelant est bien l'anti-patron nommé. **Bloc statique LOCAL à `dossier-copilote`**, rejouant l'anatomie de `Field` avec les vrais tokens (lus dans `colors.css`/`spacing.css`, pas devinés) : eyebrow « AVANT » (`--font-mono`, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`) + bloc `--border-field` / `--r-md` / `--surface-inset` / `--text-muted`.
Différence délibérée avec `Field` : fond `--surface-inset` (pas `--surface-sunken`) et texte `--text-muted` — même hiérarchie que le reste du DS pour « ceci n'est pas actif ». **Zéro fichier `brain/` touché, zéro lot contrat pour ça.**
*(Note d'arbitrage : le Tech Lead, lui, demandait de laisser le champ dans l'ordre de tabulation ; l'UX pose `tabIndex={-1}` sur un `<div>` statique — à trancher au tour 3.)*

## C-échec — **trois textes pour neuf motifs**
| Motifs techniques | Texte affiché |
|---|---|
| `indisponible` | « Le copilote est indisponible — impossible de joindre le worker. Réessayez dans un instant. » |
| `json-illisible`, `schema-invalide`, `identifiant-dans-la-sortie`, `rang-inconnu`, `hors-bornes`, `texte-vide`, `trop-long` | « Le copilote n'a pas produit de proposition exploitable. Réessayez. » |
| `contexte-insuffisant` | gabarit : « Le copilote a besoin de {libellé français du champ} pour proposer un texte — écrivez-le d'abord. » |

Le nom de champ vient de la **même source que le libellé du champ dans sa fiche d'origine** — jamais la clé technique (`synopsis_mj`). Ceci répond aussi à **AC4/KR-197-199** : trois textes distincts pour trois causes, **plus un quatrième** déjà écrit tour 1 pour « rien à proposer parce que tout va bien », qui n'est **pas** un échec — quatre textes, jamais confondus.

## C-régénérer — **« ↻ Relancer » existe sur le chemin nominal**
À côté de « + Tout accepter » / « ✕ Tout rejeter », dès qu'une proposition réussie est affichée. Texte et infobulle : **« ↻ Relancer — un nouvel essai, sans mémoire du précédent. »** Comportement écrit pour ne rien promettre de faux : les lignes déjà acceptées **restent écrites** (elles sont passées par `DossierService.update`), seules les lignes en attente sont remplacées. **Pas de `Modal`** : une proposition en attente est de l'état d'écran non persisté — la quitter par navigation la perd déjà sans confirmation.
Distinct de « Réessayer » du chemin d'échec (même glyphe, verbe différent : un rattrapage technique n'est pas un nouvel essai volontaire).

## Mes trois réserves du tour 1
1. **`Field.readOnly`** → **RETIRÉE**, remplacée par le bloc statique local.
2. **`Badge` jamais `good`/`bad`** → **MAINTENUE** — deux couleurs sémantiques réservées à réussite/échec de jet.
3. **Import de `MARQUEUR_A_ECRIRE`** → **DURCIE EN VETO**. Une chaîne magique `'⟨à écrire⟩'` réécrite localement est **une valeur en dur au même titre qu'un hex recopié** — deux définitions du même marqueur divergeront un jour sans bruit.

## REJETÉS (mis à jour)
1. **`Modal` pour le panneau de diff** — largeur fixe, ombres réservées ; une revue de 9 entités est un contenu long.
2. **`TargetPicker`** — modèle `BookNode` condamné ; `Select` est le précédent.
3. **Glyphe `✓` neuf** — absent du jeu canonique ; `+` porte déjà ce sens.
4. **Streaming** — sortie structurée = objet complet validé.
5. **NOUVEAU — `Field.readOnly` comme extension `brain/`** — un seul appelant réel ; bloc statique local à la place.
6. **NOUVEAU — trois curseurs acceptés séparément, ou six `LigneProposition`** — contredit « les six ou aucun » ; variante `GROUPE`.
7. **NOUVEAU — un troisième axe visuel de registre** — le hint du champ d'origine porte déjà l'information dans le vocabulaire existant.
8. **NOUVEAU — neuf textes d'échec, un par motif** — trois familles suffisent ; exposer la taxonomie n'aide pas l'auteur à agir.
9. **NOUVEAU — `Modal` de confirmation sur « Relancer »** — état d'écran non persisté, déjà perdu sans confirmation.
10. **Éditer le « APRÈS » avant d'accepter** — PAS rejeté, DIFFÉRÉ (inchangé).

## Textes d'écran définitifs
**Panneau par défaut**, trois `Card` : « Éclater le synopsis » / « Compléter une fiche » (+ `Select` « Choisir un personnage… », « Lancer » désactivé sans cible ; vide → « Aucun personnage à compléter — créez-en un dans Personnages. ») / « Tisser les indices ».
**Chargement** : `role="status"`, « ⏱ Le copilote réfléchit… » + « Annuler ». Échap annule, focus au « Lancer ».
**Échec** : table C-échec + « ↻ Réessayer ».
**Vide-mais-réussi** : Tisser → « Aucune proposition — tous les indices ont déjà au moins deux détenteurs ou sources. » ; Compléter → « Aucune proposition — cette fiche est déjà complète. »
**REMPLISSAGE** : `Field` (label/hint d'origine) + Badge `neutral` « NOUVEAU » + `+`/`✕`.
**REMPLACEMENT** : bloc statique « AVANT » + `Field` « APRÈS » éditable + Badge `neutral` « REMPLACE ».
**GROUPE** : bandeau + légende + six lignes `LABEL (AFFINITÉ) — valeur` + une seule paire d'actions.
**Grille « Éclater »** (9 `Card`) : nom + fonction + but, Badge « NOUVEAU », actions au niveau de la carte — **l'unité est l'entité, pas le champ**.
**Contrôles de lot** : « + Tout accepter » / « ✕ Tout rejeter » / « ↻ Relancer ».
**Après décision** : ligne compacte + Badge `accent` « Accepté » ou `muted` « Rejeté ».
