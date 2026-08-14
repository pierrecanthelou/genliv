# Plan d'itération — `dossier-fiches` · itération 5

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-13
> Composition : `5 rôles` — motif : deux destinations non arbitrées (`presence[].quand`, `relations[].intensite`/`secret`) et un mécanisme de gating d'injection par rôle à spécifier — frontière code/IA directement touchée.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur peut situer un personnage dans le monde : qui il connaît, où on le trouve. » |
| **Tranche** | Blocs « Relations » et « Présence » de l'accordéon → `useEcritureRelationsPresence` → `DossierService.update()` → `brain/dossier/{types,tables,destinations,validate}.ts` → les deux fixtures |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, premier) |
| **Hors périmètre** | Savoirs (devient it6) · retrait d'un personnage (it7) · caractère exploitable (it8, ex-it6) · tout code d'assemblage lisant `secret`/`intensite`/`quand` (n°10/n°12, aucun consommateur avant le Temps 2) |
| **Reporté** | Contrat de sortie IA « R4 · acteur » consigné en pointeur (`open_questions`), pas écrit dans ce plan · valeurs UI de `Presence` sans producteur (aucune, ce lot n'en a pas) |

**Redécoupage, deux temps.** (1) Avant tour 1, confirmé par l'humain : l'ancienne it5 (« savoirs+relations+présence+retrait ») était un plan-fleuve à 4 têtes — scindée, retrait part en it6 (nouvelle). (2) Après tour 1, sur mesure du tech-lead (hook déjà à 690 lignes, +605 estimées avec les 3 familles restantes → ~1295 lignes, 1,6× le plafond bloquant KR-112) et confirmé par l'humain une seconde fois : savoirs — dont le contrat est **déjà entièrement écrit depuis `dossier-format`, coût zéro** — part à son tour dans une it6 propre, très légère. La feature passe de 6 à **8** itérations : it5 = relations+présence (ce plan), it6 = savoirs (nouvelle, non raffinée), it7 = retrait d'un personnage (nouvelle), it8 = caractère exploitable (ex-it6).

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut situer un personnage dans le monde : qui il connaît, où on le trouve.

## 2 — Hors périmètre

- Savoirs (écran neuf sur un type déjà complet depuis `dossier-format`) — devient it6, sans lot contrat.
- Le retrait d'un personnage — devient it7 ; `relations[].cible_id` (livré ici) est le prérequis qui le rendra réel au SSOT, mais le bouton lui-même n'est pas dans ce lot.
- Le caractère exploitable (curseurs) — devient it8.
- Tout code d'assemblage qui lirait `secret`, `intensite` ou `quand` pour construire un contexte de modèle (n°10 `moteur-interprete`, n°12 `moteur-acteurs`) — aucun consommateur avant le Temps 2, forme sans producteur interdite par la décision A.
- Le libellé dérivé d'une `intensite` numérique pour un narrateur (même famille que les caractéristiques/curseurs, propriété n°10).
- L'unité et le mécanisme réels de l'horloge de session qui donnerait un sens computable à `presence[].quand` — propriété n°9/n°14.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Bloc « Relations » (accordéon, id `relations`, titre inchangé)

Légende (`legendeStyle`) : *« Comment ce personnage se sent envers un autre — l'intensité reste au moteur ; c'est CE QUI LES LIE que le modèle joue. »*

État vide (aucun AUTRE personnage dans le dossier) : remplace tout le corps du bloc — `TEXTE_AUCUN_AUTRE_PERSONNAGE = "Aucun autre personnage à qui rattacher une relation — créez-en un second dans cette section."`

Geste d'ajout : **pas** de bouton pointillé — `cible_id` étant requis (pas de sentinelle « aucun »), l'affordance est un `Select` dédié dont la première option est un intitulé d'action, jamais une vraie valeur : `{ value: '', label: '+ Ajouter une relation…' }` suivi des autres personnages (`localiserEntite('pnj', …)`, auto-référence comprise — KR-194, aucun filtre). Choisir une vraie option committe la ligne immédiatement ; le `Select` revient à son placeholder pour l'ajout suivant.

Ligne d'une relation (`ligneStyle`, `<div>` bordée, précédent étape de plan d'actions) :

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| — | eyebrow non éditable | `RELATION {n}` | — | — |
| `cible_id` | `Select` (déjà posé au geste d'ajout, modifiable ensuite) | `PERSONNAGE` | — | — |
| `lien` | `Field` multiline (rows=2) | `CE QUI LES LIE` | `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur` | *« Elle lui doit la vie depuis l'incendie du beffroi, et ne l'a jamais dit à personne. »* |
| `intensite` | `Stepper`, `min={INTENSITE_MIN}` `max={INTENSITE_MAX}` `prefix="+"` | `INTENSITÉ` | légende sous le stepper : *« − hostilité, + attachement »* | — |
| `secret` | `Toggle` | `SECRÈTE` | *« seul ce personnage la connaît : elle n'entre jamais dans le contexte du narrateur, ni dans celui d'un autre personnage. »* | — |
| suppression | `IconButton` `tone="danger"` `✕` | `Retirer la relation n°{n}` | — | — |

### Bloc « Présence » (accordéon, id `presence`, titre inchangé)

Légende : *« Où l'on peut trouver ce personnage, et à quel moment. »*

État vide (`monde.lieux.length === 0`) : `TEXTE_AUCUN_LIEU_CANON = "Aucun lieu défini dans le canon — ce personnage ne pourra être situé tant qu'aucun n'existe."`

Geste d'ajout : même patron Select-comme-geste (`lieu_id` requis) — `{ value: '', label: '+ Ajouter une présence…' }` suivi des lieux.

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| — | eyebrow non éditable | `PRÉSENCE {n}` | — | — |
| `lieu_id` | `Select` (posé au geste d'ajout) | `LIEU` | — | — |
| `quand` (optionnel) | `Field` simple ligne | `QUAND` | `interne — note d'auteur, jamais lue par le modèle` | *« Au crépuscule, avant que le marché ne ferme. »* |
| suppression | `IconButton` `tone="danger"` `✕` | `Retirer la présence n°{n}` | — | — |

Commit immédiat pour chaque champ (pas de brouillon-jusqu'au-blur pour `cible_id`/`lieu_id`/`intensite`/`secret`, widgets fermés) ; `lien`/`quand` suivent le patron brouillon-par-champ, commit au blur, déjà en place pour les proses de la feature. Suppression sans confirmation (édition de contenu, pas suppression d'entité référencée — précédent it4).

### Correctif partagé — `brain/components/Stepper.tsx`

**Bug réel, trouvé en tour 1/2, hors périmètre schéma mais dans ce lot (premier usage réel de `prefix` sur une valeur signée) :** `{prefix}{value}` affiche « +-2 » pour une valeur négative. Corrigé en `{value > 0 ? prefix : ''}{value}` (le seuil est `> 0`, pas `>= 0` : à `value === 0`, `intensite` est neutre — ni hostilité ni attachement — le préfixe ne doit pas s'afficher). `StepperProps` **inchangée** ; JSDoc de `prefix` gagne une phrase : *« Signe optionnel affiché devant une valeur POSITIVE (« + » pour un bonus). C'est un SIGNE, jamais une unité : sous **et à** zéro il s'efface. »* Effet de bord assumé sur les appelants existants (`confiance_min` non signé n'utilise pas `prefix` ; un futur `ObjectEditor` à `prefix="+"` verrait son affichage à `0` passer de « +0 » à « 0 » — plus juste).

*(Écrit par l'UX + tech-lead. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage.relations?: Relation[]` | type | emits | `{ cible_id: string; lien: string; intensite: number; secret?: boolean }` |
| `Personnage.presence?: Presence[]` | type | emits | `{ lieu_id: string; quand?: string }` |
| `INTENSITE_MIN`/`INTENSITE_MAX` | registre | emits | `-3` / `3` — constantes **distinctes** de `CONFIANCE_MIN`/`CONFIANCE_MAX` bien que les valeurs coïncident aujourd'hui (précédent `CAMPS_PERSONNAGE`/`CAMPS`, `PorteeContreMesure`/`Portee`) |
| `INTENSITES` (registre neuf, `ENUMERES_FERMES`) | registre | emits | dérivé de `INTENSITE_MIN..INTENSITE_MAX`, jamais `CONFIANCES` |
| `Stepper` (`brain/components/Stepper.tsx`) | component | emits (comportement) | `StepperProps` inchangée ; `prefix` devient sign-aware (`value > 0` seuil) |
| `DossierService.update(id, recette): EcritureDossier` | service | consumes | signature inchangée |
| `dossier:updated` | événement | emits | `{ dossierId: string }`, inchangé |
| `useEcritureRelationsPresence` (hook neuf, feature-local) | hook | emits | voir § 5, lot 2 — un seul appelant, motivé par KR-112 |

Aucun contrat de sortie IA touché par ce lot — le contrat « R4 · acteur » (entrée injectée, schéma `{ replique, indices_reveles, delta_confiance }`) est consigné en `open_questions`, propriété de n°12, non écrit ici (désaccord n°8).

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `Relation`, `Presence`, `INTENSITE_MIN/MAX`, le registre `INTENSITES`, les 6 lignes de destination, et corriger le bug de signe de `Stepper.tsx` (premier appelant réel de `prefix` signé).
- **Fichiers** : `src/brain/dossier/types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `validate.test.ts` (R) · `couverture.test.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `src/brain/index.ts` (R, export `Relation`/`Presence`/`INTENSITE_MIN`/`INTENSITE_MAX` si consommés hors `brain/dossier/`) · `src/brain/components/Stepper.tsx` (R) · `src/brain/components/Stepper.test.tsx` (N)
- **Expose / consomme** : § 4 — signatures figées, lues comme données immuables par le lot 2
- **Critères couverts** : #3, #4, #7, #8

### Lot 2 — `feature`
- **Ouvrier** : `dev-lot`
- **But** : les blocs Relations et Présence (§ 3), et la dette KR-112 de `hooks/useEcriturePersonnages.ts` (690 l., au-dessus du signal de scission) — scindé par sous-domaine en 4 sous-hooks, l'ancien fichier devenant un assembleur (~110 l.). `BLOCS_VIDES` de `FichePersonnage.tsx` passe de 4 à 2 entrées, et les deux survivantes changent d'`iteration` (`savoirs` → 6, `caractere-exploitable` → 8 — sinon le placeholder annoncerait une itération déjà passée).
- **Fichiers** : `src/features/dossier-fiches/hooks/useSocleEcriturePersonnages.ts` (N) · `hooks/useEcritureIdentite.ts` (N) · `hooks/useEcriturePlan.ts` (N) · `hooks/useEcritureRelationsPresence.ts` (N) · `components/BlocRelations.tsx` (N) · `components/BlocPresence.tsx` (N) · `tests/relationsPresence.test.tsx` (N) · `hooks/useEcriturePersonnages.ts` (R, devient l'assembleur) · `components/FichePersonnage.tsx` (R) · `components/BlocPlanActions.tsx` (R, imports de types de brouillon repointés vers le socle) · `tests/fichePersonnage.test.tsx` (R) · `tests/panneauPersonnages.test.tsx` (R)
- **Expose / consomme** : consomme le lot 1 tel quel ; `commit()` et ses deux indexations KR-197 vivent **uniquement** dans `useSocleEcriturePersonnages.ts`, jamais recopiées par sous-hook — les deux tests KR-197 existants de `panneauPersonnages.test.tsx` doivent rester verts **sans modification** (0 ligne d'assertion touchée au diff)
- **Critères couverts** : #1, #2, #3, #4, #5, #6

*(2 lots, séquentiels. Le périmètre initial à 3 familles aurait exigé 4 lots à fichiers partagés — `FichePersonnage.tsx` nommé deux fois, le socle trois — sans gain de parallélisme ; retirer savoirs, à coût de contrat nul, résout l'asymétrie plutôt que de la répartir.)*

## 6 — Critères d'acceptation

1. **Étant donné** un personnage sélectionné, **quand** l'auteur choisit une cible dans le Select « + Ajouter une relation… » puis édite `lien`/`intensite`/`secret`, **alors** `DossierService.update()` persiste la relation (ajout au choix, éditions au blur/commit immédiat selon le champ) — *niveau : composant* — *lot 2*
2. **Étant donné** un personnage avec au moins une relation, **quand** l'auteur clique « Retirer la relation n°N », **alors** elle disparaît de `relations[]` sans confirmation — *niveau : composant* — *lot 2*
3. **Étant donné** `intensite`, **quand** l'auteur atteint `INTENSITE_MIN`/`INTENSITE_MAX` au Stepper, **alors** les clics suivants restent bornés (clamp), et un dossier importé avec `intensite` hors bornes est refusé au SSOT — *niveau : contrat + composant* — *lot 1 + lot 2*
4. **Étant donné** une relation dont `cible_id` égale l'identifiant du personnage porteur (auto-référence), **quand** le dossier se valide ou que l'auteur la choisit à l'écran, **alors** aucun refus ni avertissement n'apparaît (KR-194) — *niveau : contrat + composant* — *lot 1 + lot 2*
5. **Étant donné** un personnage sélectionné, **quand** l'auteur choisit un lieu dans le Select « + Ajouter une présence… » puis édite `quand`, **alors** `DossierService.update()` persiste la présence, et son retrait fonctionne sans confirmation — *niveau : composant* — *lot 2*
6. **Étant donné** un dossier importé portant déjà des relations et des présences, **quand** la fiche se monte sans aucune interaction, **alors** les deux sous-blocs affichent les valeurs du document sur deux personnages distincts, le second atteint par un clic de ligne, sur des valeurs non fabricables par les widgets par défaut (`intensite ≠ 0`, `secret: true`, `quand` non vide) — *niveau : composant* — *lot 2* (critère racine #11, BUG-064)
7. **Étant donné** `Relation.secret`, **quand** un relecteur ouvre `types.ts` et `destinations.ts`, **alors** le prédicat exact de gating (la ligne entre dans le contexte de l'acteur du porteur seul ; si `secret`, jamais dans celui du narrateur ni d'un autre personnage ; `secret: false` élargit d'un rôle, pas de tous) est présent aux deux sites, mot pour mot — *niveau : revue manuelle (tech-lead PR review), non jest — aucun assembleur n'existe encore pour tester un comportement* — *lot 1*
8. **Étant donné** le dossier de référence (6 personnages) et un élément non-objet inséré dans `relations[]` ou `presence[]`, **quand** `validateDossier` s'exécute, **alors** le dossier de référence reste accepté sans régression sur les champs hors lot, et l'élément malformé est refusé (hérité de la boucle générique sur `LISTES_A_ELEMENTS_STRUCTURES`, fermée à it4 — aucune ligne neuve attendue, à confirmer par un test qui l'exerce) — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `Stepper.test.tsx` — « un prefix signé s'efface à zéro et sous zéro » | `prefix="+"`, rend `+2`/`0`/`-2` à value=2/0/-2, jamais `+-2` ni `+0` | contrat | — | 1 |
| `Stepper.test.tsx` — « clamp respecte un min négatif » | 6 clics « Diminuer » depuis `min={-3}` restent à `-3` | contrat | — | 1 |
| `validate.test.ts` — « intensite hors bornes (-4, 4) est refusée, -3/3 acceptées » | symétrique de `DUREE_MIN`/`DUREE_MAX` d'it4 | contrat | KR-165 (bornes nommées) | 1 |
| `validate.test.ts` — « un element non-objet de relations/presence est refuse » | balayage générique `LISTES_A_ELEMENTS_STRUCTURES`, comptes remesurés (KR-159) | contrat | — | 1 |
| `couverture.test.ts` — balayage générique (6 chemins neufs instanciés dans les deux fixtures) | aucune ligne neuve requise | contrat | — (règle permanente, § 8 desaccord fixture) | 1 |
| `relationsPresence.test.tsx` — « lecture au montage sans interaction, sur deux personnages distincts, relations et présence » | valeurs non fabricables par défaut | composant | KR-199 | 2 |
| `relationsPresence.test.tsx` — « auto-référence tolérée sans refus ni avertissement » | `cible_id === personnage.id`, aucun bandeau | composant | KR-194 | 2 |
| `relationsPresence.test.tsx` — « écriture sur DEUX personnages, aucune fuite d'indexation — relations » | KR-197, sonde à deux personnages | composant | KR-197 | 2 |
| `relationsPresence.test.tsx` — « écriture sur DEUX personnages, aucune fuite d'indexation — présence » | KR-197, sonde à deux personnages, DISTINCT du test relations (le défaut se présente par site d'appel) | composant | KR-197 | 2 |
| `relationsPresence.test.tsx` — « ajout d'une relation/présence sans ligne locale à moitié écrite » | le geste d'ajout est un Select, aucune ligne vide possible | composant | — | 2 |
| `panneauPersonnages.test.tsx` — les deux tests KR-197 existants (identité, caractéristiques) restent verts, **non modifiés**, après la scission du hook | non-régression d'extraction | composant | KR-197 | 2 |

Cas limites couverts : liste vide au montage (état vide invitant) · auto-référence (KR-194) · référence orpheline (`cible_id`/`lieu_id` supprimé, exposée par `validateDossier`, jamais filtrée au rendu) · bornes de `intensite` · deux personnages distincts par sous-bloc · sélection rapide répétée sur le Select d'ajout (pas de doublon).

**Non vérifiable en l'état** — le mécanisme réel de gating de `secret` (quelle ligne entre dans quel contexte modèle) n'a aucun assembleur à exercer avant n°10/n°12 ; seule sa PRÉSENCE TEXTUELLE aux deux sites est vérifiable, et seulement par lecture (critère #7). Le contrat de sortie IA « R4 · acteur » n'est vérifiable par rien ici — il est consigné, pas codé.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tous | Périmètre de l'itération : 4 capacités (savoirs+relations+présence+retrait) | `RETENU` | Rétréci en deux temps, confirmé par l'humain les deux fois : retrait → it7 (avant tour 1) ; savoirs → it6 nouvelle, zéro lot contrat (après tour 1, sur mesure tech-lead : hook à ~1295 l. si les 3 familles restaient ensemble, 1,6× le plafond bloquant). |
| 2 | tech-lead | Emplacement du correctif `Stepper.tsx` (brain/ vs feature) | `RETENU` | Lot 1 (contrat) : touche `brain/`, premier appelant réel de `prefix` signé, aucun test existant à casser — acte de contrat, pas correctif de régression. |
| 3 | ux-designer | Comportement exact du correctif Stepper (`value > 0` vs `value >= 0` proposé par tech-lead) | `RETENU` — version UX | `>= 0` afficherait « +0 » pour une intensité neutre (faux sémantiquement) ; corrige aussi une incohérence dans la propre spec de test de tech-lead, qui attendait déjà « 0 à 0, prefix effacé ». |
| 4 | narratif-ia | Mécanisme de gating de `secret` (quelle ligne, quel contexte, porteur ou cible, `false` = public ?) | `RETENU` | Prédicat exact écrit § 3/§ 4 : ligne entière (`lien`+appellation dérivée) exclue de tout rôle sauf l'acteur du porteur ; narrateur inclus dans l'exclusion si secret ; `secret: false` élargit d'UN rôle (narrateur), jamais de tous ; porteur seul, aucune réciprocité dérivée. Écrit aux deux sites (JSDoc + commentaire `destinations.ts`), zéro mécanisme de code (décision A). |
| 5 | qa | Nombre de tests KR-197 pour relations+présence malgré le sous-hook partagé | `RETENU` — deux tests | Le défaut KR-197 s'est présenté par SITE D'APPEL, jamais par fichier (4 occurrences déjà dans la feature) — un test qui ne mute que `relations` ne prouve rien de `presence`. |
| 6 | tech-lead | `BLOCS_VIDES` : les 2 placeholders restants doivent nommer leur nouvelle itération | `RETENU` | `savoirs` (5→6), `caractere-exploitable` (6→8) — sinon le placeholder annoncerait une itération déjà passée. |
| 7 | narratif-ia | Docstring exacte de `Relation.cible_id` (référence au `nom` non-injectable, KR-195) | `RETENU` | Texte figé § 4, un seul site, pour que n°10 trouve les deux moitiés du problème (référence + appellation) au même endroit. |
| 8 | narratif-ia | Contrat de sortie IA « R4 · acteur » : l'écrire dans ce plan (§ 4 bis) ou le consigner ailleurs ? | `REPORTÉ` | Consigné en `open_questions`, pointeur vers `.claude/raffinage/dossier-fiches-it5/tour1-narratif-ia.md` § F, propriété de n°12. L'écrire ici créerait un second site pour un contrat qu'une autre feature possédera. |
| 9 | pm-produit | Proposition alternative de découpage (tour 1) : « savoirs+relations » / « présence seule » | `REJETÉ` | Moins bon que le découpage adopté : dédoublerait l'appareil de lot sur présence (2 champs) plutôt que d'isoler le passager à coût de contrat nul (savoirs). |

*(Aucun désaccord ne disparaît sans statut.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **non déclenché** : aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché par cette itération
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] `wc -l` sur les 5 fichiers du hook scindé : `useSocleEcriturePersonnages.ts` (~150), `useEcritureIdentite.ts` (~140), `useEcriturePlan.ts` (~340), `useEcritureRelationsPresence.ts` (~330), `useEcriturePersonnages.ts` assembleur (~110) — tous **< 400**
- [ ] `wc -l src/features/dossier-fiches/components/FichePersonnage.tsx` **< 400**
- [ ] Les deux tests KR-197 existants (identité, caractéristiques) verts sans modification après la scission du hook
- [ ] Aucune régression sur les tests existants de la feature (6 personnages du dossier de référence intacts)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Prédicat de gating de `secret` présent mot pour mot aux deux sites (JSDoc `types.ts` + commentaire `destinations.ts`) — vérifié en revue, pas par jest (critère #7)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it5.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | — |
| Tech Lead | recevable | Stepper en lot 1, BLOCS_VIDES corrigé — levées |
| UX | recevable sous réserve | correctif Stepper précisé (`> 0`) — levée |
| QA | recevable sous réserve | `quand` tranché, 2 tests KR-197 — levées |
| Narratif & IA | recevable sous réserve | réserves 1 et 3 dans le lot contrat — levées |
