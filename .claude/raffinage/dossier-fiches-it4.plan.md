# Plan d'itération — `dossier-fiches` · itération 4

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-13
> Composition : `5 rôles` — motif : l'itération ajoute deux champs `ia` (`but.libelle`/`pourquoi`), une 6e famille de conditions D1 (`contre_mesures[]`) et deux destinations non arbitrées (`but.echeance`, `plan_actions[].duree`/`si_bloque`) — frontière code/IA directement touchée.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur peut équiper un personnage d'un plan d'action complet — un but, des étapes datées avec leur porte de sortie, des contre-mesures s'il est antagoniste. » |
| **Tranche** | Bloc 4 de l'accordéon (« Objectif & plan d'actions ») → `useEcriturePersonnages` → `DossierService.update()` → `brain/dossier/{types,tables,destinations,validate}.ts` → les deux fixtures |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | Le retrait d'un personnage (reste it5) · le libellé dérivé d'une échéance/durée pour un narrateur (n°10) · l'unité exacte de l'horloge de session (n°9) · le correctif `ObjectifsCanon` (statut absent affiché inconditionnellement — reporté, feature `dossier-canon`) · les valeurs UI de `delai`/`portee` de `contre_mesures` (destination `moteur`, jamais rendues à l'auteur) |
| **Reporté** | `ObjectifsCanon.tsx` (bandeau non effaçable sur carte fantôme) → micro-commit dédié hors PATCH d'it4, `bug_history.json` (dossier-canon) · valeurs exactes de l'énuméré `PorteeContreMesure` → confirmées par dev-contrat contre `docs/REGLES-PLAY.md` |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut équiper un personnage d'un plan d'action complet — un but, des étapes datées avec leur porte de sortie, des contre-mesures s'il est antagoniste.

## 2 — Hors périmètre

- Le retrait d'un personnage (reporté à it5 — `relations[].cible_id` y rend le refus de retrait réel au SSOT).
- Le libellé dérivé d'une échéance, d'une durée ou d'une caractéristique pour un rôle acteur (propriété de n°10 `moteur-interprete` — décision A, forme sans producteur interdite ici).
- L'unité exacte de l'horloge de session que compte `duree` (propriété de n°9 `moteur-dossier`) — it4 pose l'entier et sa borne, jamais l'unité.
- La correction du bandeau `ObjectifsCanon` (`statut:'absent'` affiché inconditionnellement sur une carte fantôme) — bug réel, mais pas causé par it4 et absent de sa démo ; reporté en micro-commit séparé.
- Le rendu à l'auteur de `contre_mesures[].delai`/`portee` — destination `moteur`, jamais des champs édités par l'auteur dans ce lot.
- Toute clé nouvelle dans la sortie du modèle (n°12) — le contrat de sortie IA reste `{ recit, indices_reveles }`.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Bloc 4 — accordéon, titre **« Objectif & plan d'actions »** (inchangé, épinglé par `panneauPersonnages.test.tsx`)

**A. Sous-section « OBJECTIF PERSONNEL »** (`but`) — jamais « OBJECTIF » nu (collision avec « OBJECTIF RATTACHÉ » du bloc 1).

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| `but.libelle` (requis dans le bloc) | `Field` multiline (rows=2) | `CE QU'IL VEUT` | `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur` | *« Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne. »* |
| `but.pourquoi` (optionnel) | `Field` multiline (rows=2) | `POURQUOI` | `interne — motivation, si elle mérite d'être dite` | *« Il porte la faute d'avoir laissé le sceau se briser, cinquante ans plus tôt. »* |
| `but.echeance` (optionnel) | `Field` simple ligne | `ÉCHÉANCE` | `interne — note d'auteur, jamais lue par le modèle` | *« Avant la pleine lune prochaine. »* |

Commit au blur, brouillon par champ (idiome du bloc Identité, it2).

**B. Sous-section « PLAN D'ACTIONS »** (`plan_actions[]`) — légende : *« Suite d'étapes vers l'objectif — chacune avec son intention, son déclencheur et une porte de sortie si le joueur bloque le personnage. »*

État vide (0 étape) : aucune ligne, seul le bouton pointillé visible (état vide standard, pas une absence).

Par étape, ligne `<div>` bordée (`border: 1px solid var(--border-divider)`, `background: var(--surface-sunken)`, `border-radius: var(--r-md)`, `padding: var(--space-4)`) — **jamais `ListRow`** (sa racine `<button>` ne peut pas porter de champs interactifs) :

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| — | eyebrow non éditable | `ÉTAPE {n}` | — | — |
| `action` (requis, refusé vide au SSOT) | `Field` multiline (rows=2) | `INTENTION` | `interne — jamais lu par le joueur — ce que le personnage joue à cette étape` | *« Retourne au sanctuaire à la nuit tombée pour consulter les archives. »* |
| `declencheur_texte` | `Field` multiline (rows=2) | `DÉCLENCHEUR` | `interne — ce qui fait passer le personnage à cette étape` | *« Le joueur mentionne le sceau brisé devant lui. »* |
| `duree` | `Stepper`, min `DUREE_MIN` (1), pas de max nommé | `DURÉE` | `interne — nombre de pas d'horloge de session avant l'échéance de l'étape ; le mot est nommé par la feature n°9` | — |
| `si_bloque` | `Field` multiline (rows=2) | `SI LE JOUEUR BLOQUE` | `interne — ce que joue le personnage si le moteur constate l'étape bloquée (durée écoulée sans déclencheur suivant)` | *« Il change d'approche : au lieu du sanctuaire, il tente sa chance auprès du forgeron. »* |
| suppression | `IconButton` `tone="danger"` `✕` | `Retirer l'étape n°{n}` | — | — |

Bouton d'ajout : `boutonPointilleStyle` (réutilisé), texte **« + Ajouter une étape… »**. Ajout = ligne locale (brouillon), `action` vide n'entre jamais au document (refus SSOT existant sur `CHAMPS_REQUIS`) ; commit au premier blur non vide. Focus déplacé vers `INTENTION` après clic (idiome ref-par-identité d'it3, pas un booléen). Suppression sans confirmation (édition de contenu, pas d'entité référencée).

**C. Sous-section « CONTRE-MESURES »** (`contre_mesures[]`) — **section interne, gated `camp === 'antagoniste'`**, jamais un 9e bloc (KR-196).

Légende : *« Réservé aux antagonistes — actions armées en réaction à ce que le joueur déclenche. »* Séparateur identique à la ligne PV du bloc 3.

- **Absence** (protagoniste ou camp non choisi) : **aucune trace dans le DOM** — ni eyebrow, ni légende, ni bouton.
- **Présence** (antagoniste) : section visible, bouton **« + Ajouter une contre-mesure… »**, même ligne bordée que le plan d'actions :

| Champ | Widget | Label | Hint |
|---|---|---|---|
| — | eyebrow non éditable | `CONTRE-MESURE {n}` | — |
| `action` | `Field` multiline (rows=2) | `INTENTION` | `interne — jamais lu par le joueur` |
| `declencheur_texte` | `Field` multiline (rows=2) | `DÉCLENCHEUR` | `interne — la condition qui arme cette contre-mesure` |
| suppression | `IconButton` `tone="danger"` `✕` | `Retirer la contre-mesure n°{n}` | — |

`delai`/`portee` : destination `moteur`, **non rendus** à l'auteur dans ce lot (hors périmètre).

**D. Avertissement D1 (KR-189)** — **hors accordéon**, second `role="status"` sibling de `<Accordion>`, après le bandeau de refus existant. Eyebrow **« ENREGISTRÉ, AVEC AVERTISSEMENT »** (réutilisée verbatim). `<IssueList issues={avertissementsD1} />`, dérivé `useMemo` sur `validateDossier(dossier).warnings` filtré au personnage sélectionné. Rendu conditionnel : uniquement si non vide.

Tous les libellés sont mono, majuscules espacées ; tous les placeholders restent dans l'univers Val-Cendre déjà établi ; aucun jargon technique (`_expr`, `ExprNode`) exposé à l'auteur.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage.but?: But` | type | emits (schéma) | `{ libelle: string; pourquoi?: string; echeance?: string }` — clé `but`, jamais `objectif` (KR-198) |
| `PlanAction += duree?/si_bloque?` | type | emits | `duree?: number` (entier ≥ `DUREE_MIN`), `si_bloque?: string` |
| `Personnage.contre_mesures?: ContreMesure[]` | type | emits | `{ action: string; declencheur_texte?: string; declencheur_expr?: ExprNode; delai?: number; portee?: PorteeContreMesure }` |
| `PorteeContreMesure` | registre | emits | type distinct de `Portee` (évite la collision de nom avec `Personnage.portee`) ; clé de schéma `contre_mesures[].portee` inchangée (KR-196, non redébattue) |
| `FAMILLES_DE_CONDITIONS` (7e entrée) | registre | emits | `{ expr: 'monde.personnages[].contre_mesures[].declencheur_expr', texte: '…declencheur_texte', location: 'Personnages', alerteSansExpr: true }` |
| `LISTES_OPTIONNELLES_STRUCTUREES` (registre neuf) | registre | emits | fermeture du trou résiduel BUG-050 — `LISTES_A_ELEMENTS_STRUCTURES = [...LISTES_REQUISES, ...LISTES_OPTIONNELLES_STRUCTUREES]` |
| `DUREE_MIN`, `CHAMPS_ENTIERS` (registre neuf) | registre | emits | `DUREE_MIN = 1` ; `CHAMPS_ENTIERS` couvre `plan_actions[].duree` et `contre_mesures[].delai` (pas `etape` — hors mandat de cette itération) |
| `DossierService.update(id, recette): EcritureDossier` | service | consumes | signature inchangée |
| `dossier:updated` | événement | emits | `{ dossierId: string }`, inchangé |
| `useEcriturePersonnages` (hook neuf, feature-local) | hook | emits | voir § 5, lot 2 — un seul appelant (`PanneauPersonnages.tsx`), motivé par KR-112, pas par la réutilisation |

## 4 bis — Contrat de sortie IA

L'itération ne touche aucune ligne de code du moteur (n°12 n'existe pas encore) mais son schéma **promet** ce contrat — figé ici pour que n°12 le trouve tenu à la lettre :

| | |
|---|---|
| Contexte injecté | `fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, l'`action` de l'étape **courante seule** (jamais le plan entier — spoil), `si_bloque` **seulement si** le moteur a déclaré l'étape bloquée, `contre_mesures[].action` **seulement si** la contre-mesure est armée |
| Jamais injecté | `but.echeance`, `camp`, `etape`, `duree`, `delai`, `portee`, `declencheur_expr`, `declencheur_texte`, `objectif_id`, les 8 `stats` |
| Schéma de sortie | `{ recit: string, indices_reveles: string[] }` — **inchangé par it4** |
| Échec de validation | rejeu (même graine, même contexte) ; second échec → repli sur réplique neutre du registre moteur, tour marqué *dégradé* |
| Ce que l'IA **ne** fait **pas** | ne compte pas les pas d'horloge, ne décide pas qu'une étape est bloquée, ne lit aucune échéance chiffrée — le moteur constate, l'IA joue |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `But`, l'extension de `PlanAction`, `ContreMesure[]`, la 7e famille de conditions, fermer le trou résiduel BUG-050 sur les listes optionnelles, matérialiser les 5 destinations `contre_mesures[]` déjà arbitrées (KR-196) + les 5 nouvelles (`but.*`, `plan_actions[].duree/si_bloque`).
- **Fichiers** : `src/brain/dossier/types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `validate.ts` (R) · `validate.test.ts` (R) · `couverture.test.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `src/brain/index.ts` (R, export `But`/`ContreMesure`/`PorteeContreMesure`) · `docs/REGLES-PLAY.md` (R, renvoi d'une ligne vers la docstring de `duree`) · `bug_history.json` (R, nouveau `BUG-0XX` fermant le résiduel BUG-050)
- **Expose / consomme** : § 4 — signatures figées, lues comme données immuables par le lot 2
- **Critères couverts** : #1, #2, #5, #6, #7, #8

### Lot 2 — `feature`
- **Ouvrier** : `dev-lot`
- **But** : le bloc 4 de l'accordéon (§ 3), l'extraction `hooks/useEcriturePersonnages.ts` (soulage `PanneauPersonnages.tsx`, dette KR-112 datée par it3) et l'extraction de `BlocCaracteristiques.tsx` depuis `FichePersonnage.tsx` (même dette, l'autre moitié) pour que le bloc 4 neuf ne fasse pas franchir 400 lignes à la fiche.
- **Fichiers** : `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` (N) · `components/BlocPlanActions.tsx` (N) · `components/BlocCaracteristiques.tsx` (N) · `components/PanneauPersonnages.tsx` (R) · `components/FichePersonnage.tsx` (R) · `components/styles.ts` (R) · `tests/panneauPersonnages.test.tsx` (R) · `tests/fichePersonnage.test.tsx` (R)
- **Expose / consomme** : consomme le lot 1 tel quel ; les deux indexations KR-197 (affichage/invalidation) et `resout: false` migrent vers le hook **sans modification** des deux tests nommés d'it2 (BUG-065/066) — s'ils changent, l'extraction est fausse
- **Critères couverts** : #1, #2, #3, #4, #5, #6, #7

*(2 lots, séquentiels — le découpage à 3/4 lots envisagé au tour 1 échoue sur la propriété de fichiers : `BrouillonPersonnage`/`ChampTexte`/`FichePersonnageProps` vivent dans `PanneauPersonnages.tsx`, chaque champ neuf ajoute à la fois un handler et une prop.)*

## 6 — Critères d'acceptation

1. **Étant donné** un personnage sélectionné sans `but`, **quand** l'auteur saisit `but.libelle` puis quitte le champ, **alors** `DossierService.update()` persiste l'objet `but` et la fiche affiche la valeur sans re-render fantôme — *niveau : composant* — *lot 2*
2. **Étant donné** un personnage avec un plan d'actions vide, **quand** l'auteur clique « + Ajouter une étape… », saisit une intention puis quitte le champ, **alors** l'étape n'est persistée qu'au blur non vide (`action: ''` reste locale, refusée au SSOT) — *niveau : composant* — *lot 2*
3. **Étant donné** un personnage avec au moins une étape, **quand** l'auteur clique « Retirer l'étape n°N », **alors** l'étape disparaît de `plan_actions[]` sans confirmation — *niveau : composant* — *lot 2*
4. **Étant donné** un personnage dont le camp passe de protagoniste à antagoniste, **quand** la fiche se re-rend, **alors** la section Contre-mesures apparaît, et disparaît totalement du DOM pour un protagoniste — lecture dérivée, jamais un `useEffect` — *niveau : composant* — *lot 2*
5. **Étant donné** un personnage antagoniste, **quand** l'auteur ajoute et édite une contre-mesure (intention, déclencheur), **alors** `DossierService.update()` persiste `contre_mesures[]` — *niveau : composant* — *lot 2*
6. **Étant donné** `contre_mesures[].declencheur_texte` sans jumeau `_expr`, **quand** la fiche se rend, **alors** un avertissement D1 est visible (dérivé, KR-189) ; **étant donné** `plan_actions[].declencheur_texte` sans jumeau, **alors** aucun avertissement n'apparaît (famille délibérément calme, arbitrage d'it1) — *niveau : contrat + composant* — *lot 1 + lot 2*
7. **Étant donné** `plan_actions[].si_bloque` renseigné sans `duree`, **quand** le dossier se valide, **alors** un avertissement D1 non bloquant apparaît, prouvé sur deux personnages distincts — *niveau : contrat + composant* — *lot 1 + lot 2*
8. **Étant donné** le dossier de référence (6 personnages) et une liste `contre_mesures` malformée (élément non-objet), **quand** `validateDossier` s'exécute, **alors** le dossier de référence reste accepté sans régression sur les champs hors lot, et la liste malformée est refusée — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validate.test.ts` — « contre_mesures avec un élément non-objet est refusé » | fermeture résiduelle BUG-050 | contrat | BUG-050 (nouveau BUG-0XX) | 1 |
| `validate.test.ts` — extension de « jalon, evenement et etape de plan restent calmes sans …_expr » | ajoute `contre_mesures` comme CAS QUI AVERTIT (contraste discriminant) | contrat | KR-199 | 1 |
| `validate.test.ts` — « duree/delai en dessous de DUREE_MIN sont refusés » | borne nommée, entier | contrat | — | 1 |
| `validate.test.ts` — « si_bloque sans duree produit un avertissement isolé, non bloquant » | contrôle dédié hors `FAMILLES_DE_CONDITIONS` | contrat | KR-189 | 1 |
| `couverture.test.ts` — balayage générique (10 chemins neufs instanciés dans les deux fixtures) | aucune ligne neuve, compte remesuré 3→4 sur les listes structurées et les familles alertantes | contrat | KR-159, KR-211 | 1 |
| `fichePersonnage.test.tsx` — « le bloc Objectif & plan d'actions affiche but/étapes au montage, sans interaction, sur deux personnages distincts » | lecture au montage (11e critère feature) | composant | KR-199 | 2 |
| `fichePersonnage.test.tsx` — « la section Contre-mesures apparaît pour un antagoniste et est absente du DOM pour un protagoniste » | sonde de discriminance sur l'absence totale | composant | KR-196 | 2 |
| `fichePersonnage.test.tsx` — « ajouter une étape refuse une action vide au SSOT, puis persiste au blur non vide » | draft-until-blur | composant | — | 2 |
| `fichePersonnage.test.tsx` — « avertissement D1 visible pour contre_mesures sans expr, absent pour plan_actions sans expr » | sonde de discriminance | composant | KR-189, KR-199 | 2 |
| `panneauPersonnages.test.tsx` — les deux tests KR-197 (BUG-065/066) restent verts, non modifiés, après l'extraction du hook | non-régression d'extraction | composant | KR-197 | 2 |

Cas limites couverts : bloc jamais réglé (vide) · `contre_mesures` absent/vide sur antagoniste vs absente sur protagoniste · camp changé après coup (dérivé) · `declencheur_texte` sans `_expr` (les deux familles, contrastées) · deux personnages distincts, second atteint par clic de ligne · référence orpheline (`contre_mesures` malformée) · annulation implicite (suppression sans confirmation, précédent établi).

**Non vérifiable en l'état** — aucun instrument ne prouve qu'une donnée `auteur`/`moteur` n'est *jamais* injectée à un modèle : aucun assembleur n'existe avant n°10/n°12, `destinations.ts` déclare l'intention, il ne démontre pas le confinement. Les valeurs exactes de `PorteeContreMesure` ne sont pas non plus vérifiées côté produit — le champ n'est rendu nulle part dans ce lot.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead / PM | Lot 3 optionnel : correctif `ObjectifsCanon.tsx` (bandeau non effaçable sur carte fantôme) | `REPORTÉ` | Bug réel et bien localisé (open_question dont it4 est le porteur naturel), mais PAS causé par it4 — hors phrase de démo. Veto PM dans son domaine (périmètre). Micro-commit dédié hors PATCH d'it4, journalisé `bug_history.json` (dossier-canon). |
| 2 | tech-lead + qa | Critère d'acceptation #7 (global, `plan.acceptance_criteria`) inatteignable tel qu'écrit — `plan_actions` reste calme par arbitrage d'it1 | `RETENU` | Scindé en 7a (`contre_mesures` avertit, 7e ligne `alerteSansExpr: true`) / 7b (`plan_actions` reste calme, test discriminant existant étendu, pas de nouveau fichier). Correction de rédaction, pas de fonctionnalité — le texte racine de la spec sera corrigé à l'étape 7. |
| 3 | tech-lead | Trou résiduel BUG-050 : `LISTES_A_ELEMENTS_STRUCTURES` ne couvrait pas les listes optionnelles | `RETENU` | `LISTES_OPTIONNELLES_STRUCTUREES` ajoutée, nouveau `BUG-0XX`, test nommé, comptes remesurés (lot 1). |
| 4 | tech-lead | `contre_mesures[].portee` recycle le nom d'un registre fermé déjà porté par `Personnage.portee` | `RETENU` | Type distinct `PorteeContreMesure` ; clé de schéma `contre_mesures[].portee` inchangée (KR-196 non redébattue — c'est un désaccord de TYPE, pas de destination). |
| 5 | orchestrateur | Valeurs exactes de l'énuméré `PorteeContreMesure` : aucun rôle ne les a traitées (angle mort du comité) | `REPORTÉ` | Champ `moteur`, jamais rendu à l'auteur dans ce lot, sans consommateur avant le Temps 2 — dev-contrat propose une première valeur grounded (ex. `'personnage' \| 'groupe' \| 'lieu'`) contre `docs/REGLES-PLAY.md`, révisable sans coût avant tout consommateur réel. |
| 6 | tech-lead (t1: `auteur`) ↔ narratif-ia (t1: `ia`) — **positions échangées au tour 2 sans se voir** | Destination de `but.echeance` | `RETENU` — `auteur` | tech-lead (t2) argumentait `ia` par cohérence interne à `but{}` (sœurs `libelle`/`pourquoi` sont `ia`) ; narratif-ia (t2) revenait à `auteur` par son invariant propre : une échéance en prose reste une donnée d'horloge, et le précédent direct du dépôt (`monde.evenements[].declencheur_texte`, `charpente.jalons[].declencheur_texte` → `auteur`, motif « le narrateur ne doit pas provoquer/improviser ce que le moteur n'a pas constaté ») est plus proche que la cohérence de voisinage. Arbitrage : `auteur` — se desserre vers `ia` sans coût le jour où n°10 livre un libellé d'écoulement dérivé. |
| 7 | narratif-ia | Destination et type de `plan_actions[].duree` / `contre_mesures[].delai` | `RETENU` | `moteur`, entier, `DUREE_MIN = 1` — confirmé et chiffré par tech-lead (`CHAMPS_ENTIERS`, ~8 lignes `validate.ts`, 2 tests). |
| 8 | narratif-ia | `si_bloque` : `ia`, injecté seulement si l'étape est déclarée bloquée par le moteur | `RETENU` | Forme : contrôle isolé dans `validate.ts` (~6 lignes), jamais une ligne de `FAMILLES_DE_CONDITIONS` (pas de jumeau `_expr`, précédent `cede_si`). |
| 9 | narratif-ia | ~8 lignes dans `docs/REGLES-PLAY.md` écrites en premier (précédent it3, doc → table dorée → code) | `REJETÉ` (par son propre auteur au tour 2) | Sur-application : `duree` n'est pas sous mutation, aucune table dorée à alimenter. Remplacé par 3 lignes de docstring au site + un renvoi d'une ligne dans `REGLES-PLAY.md`, dans le même lot (pas de commit séparé, pas de gate KR-130). |
| 10 | tech-lead | `CHAMPS_ENTIERS` incluait `etape` en plus de `duree`/`delai` | `REJETÉ` | Scope creep sur un champ déjà existant et déjà valide depuis dossier-format — hors mandat de cette itération. KR-190 borne le pire cas, il ne prescrit pas la liste. |
| 11 | narratif-ia (annexe) ↔ ux-designer (t2) | Libellé du Stepper `duree` : « DURÉE (EN TOURS) » vs « DURÉE » nu | `RETENU` — version UX | `docs/REGLES-DU-JEU.md` réserve « tour » au round de combat — collision de vocabulaire évitée. Le libellé exact est le terrain de l'UX (écrit sans se voir avec narratif-ia — pas un vrai désaccord d'audience, juste une non-lecture croisée). |
| 12 | ux-designer | `ListRow` ne peut pas porter une ligne d'étape/contre-mesure (racine `<button>`) | `RETENU` | `div` bordée stylée dans `styles.ts`, aucun composant neuf. Confirmé par tech-lead sans impact sur le découpage en lots. |
| 13 | tech-lead | Ajout d'étape : brouillon jusqu'au blur, `action: ''` refusée au SSOT | `RETENU` | Non contesté ; devient le premier refus réellement atteignable de la feature (bandeau `statut:'refuse'` testé sans mock). |

*(Aucun désaccord ne disparaît sans statut.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **non déclenché** : aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché par cette itération
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] `wc -l src/features/dossier-fiches/components/FichePersonnage.tsx` **< 400** (442 aujourd'hui — dette KR-112 datée par it3)
- [ ] `wc -l src/features/dossier-fiches/components/PanneauPersonnages.tsx` **< 400** (466 aujourd'hui — même dette)
- [ ] Les deux tests KR-197 (BUG-065/066) verts sans modification après l'extraction du hook
- [ ] Aucune régression sur les tests existants de la feature (6 personnages du dossier de référence intacts)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Correction du critère racine #7 dans `plan.acceptance_criteria` de `specification.json` (étape 7 du raffinage)
- [ ] Nouveau `BUG-0XX` (fermeture résiduelle BUG-050) journalisé dans `bug_history.json`
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | goal reformulé, lot 3 écarté — levées |
| Tech Lead | recevable sous réserve | critère #7 réécrit, trou BUG-050 fermé — levées |
| UX | recevable sous réserve | `ListRow`→`div`, libellé `but.libelle` distinct — levées |
| QA | recevable sous réserve | critère #7 scindé, trou BUG-050 testé — levées |
| Narratif & IA | recevable sous réserve | les 4 propositions statuées, `but.echeance` arbitré `auteur` — levées |
