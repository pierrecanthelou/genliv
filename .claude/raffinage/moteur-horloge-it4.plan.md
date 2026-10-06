# Plan d'itération — `moteur-horloge` · itération `4`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-06
> Composition : `5 rôles` — motif : l'itération touche le moteur (tickClimat, session, evaluate) et le mode jeu (BandeauHeros)
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur lit au bandeau PAS #n en permanence, CLIMAT · {nom} quand un climat s'active, puis le retour au calme après sa durée. » |
| **Tranche** | `Evenement.climat_id?` → `evaluate.ts` (sélecteur) → `climat.ts` (tick) → `horloge.ts` (appel) → `session.horloge.climat_actif` → `BandeauHeros` (affichage PAS + CLIMAT) |
| **Lots** | 2 lots · dont `contrat` : oui (L1) |
| **Hors périmètre** | R3 manifestation (bloc CLIMAT du narrateur) · L3 champ de lien `climat_id` dans FicheEvenement · éditeur de `effets_regles` · enrichissement R4 des lignes de journal |
| **Reporté** | R3 manifestation → it5 ou roadmap (ligne obligatoire) · KR atteindre_jalon saute effet[] (KR candidat) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur lit au bandeau PAS #n en permanence, CLIMAT · {nom} quand un climat s'active, puis le retour au calme après sa durée. »

## 2 — Hors périmètre

- **R3 manifestation** (bloc CLIMAT du narrateur, position après ICI A1 avant CE PAS) — reporté, ligne roadmap obligatoire (PM veto O5).
- **L3** champ de lien `climat_id` dans `FicheEvenement` et `PanneauEvenements` — touche `dossier-registres`, hors it4. `climat_id` sans éditeur, comme `effets_regles` ; démo par fixture JSON.
- **Éditeur de `effets_regles`** — ligne roadmap obligatoire (PM O3).
- **Enrichissement R4** des lignes de journal d'horloge (icônes, styling).
- **Empilement de climats** — un seul actif à la fois (KR-251 : `climat_actif` liste serait irréversible).
- **Activation au tour 0** — seulement dans le tick d'une commande acceptée.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### PAS #n
- **Position** : dernier bloc après XP, séparateur identique aux précédents.
- **Ordre affiché** : nom | PV | PE | XP | PAS #n | CLIMAT · {nom}.
- **Forme** : `PAS <span style={valeur}>#{pas}</span>`.
- **Prop** : `pas: number`, obligatoire. Lecture directe de `session.horloge.tour`, sans recalcul.
- **Tokens** : `--text-body` (étiquette), `--text-strong` (valeur).

### CLIMAT · {nom}
- **Position** : dernier bloc, avec séparateur. Rendu **seulement si** `climatNom !== undefined`.
- **Prop** : `climatNom?: string`. Résolution en ligne par `EcranPartie`.
- **Forme** : `CLIMAT <span>·</span> <span style={valeur}>{climatNom}</span>`.
- **Sans climat actif** : bloc absent. **Nom vide** : `CLIMAT · Sans nom`. **Id introuvable** : bloc absent.
- **Registre** : interface (mono, MAJUSCULES). Le `nom` est interne ; la prose joueur est `manifestation`, jamais montrée au bandeau.

### Dette corrigée
- Séparateur : `width: 'var(--bw-hair)'` (était `'1px'`), `alignSelf: 'stretch'` (remplace `height: '1.5em'`).
- Nom héros : `fontWeight: 'var(--fw-semibold)'` (était `'bold'`). Commentaire mensonger « semibold via CSS custom property » supprimé.
- Docstring corrigée : « registre interface » (pas « registre joueur »).

### Tokens utilisés
`--font-mono`, `--fs-meta`, `--fw-semibold`, `--text-strong`, `--text-body`, `--border-subtle`, `--surface-card`, `--bw-hair`, `--space-2`, `--space-3`, `--space-7`.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Evenement.climat_id?` | type | emits | `interface Evenement { climat_id?: string }` |
| `EtatSession.horloge` | type | emits | `{ readonly tour: number; readonly climat_actif?: { readonly id: string; readonly depuis: number } }` |
| `ActivationDeClimat` | interface | emits | `{ readonly evenement_id: string; readonly climat_id: string }` |
| `evenementDeClimat` | service | emits | `(dossier: Dossier, session: { readonly monde: FaitsDeSession }): ActivationDeClimat \| undefined` |
| `tickClimat` | service | emits | `(dossier: Dossier, session: EtatSession): EtatSession` |
| `REFERENCES_SIMPLES` | registre | emits | `+= { path:'monde.evenements[].climat_id', espace:'climat', location:'Événements' }` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **Aucun changement en it4.** Les deltas de la ligne d'activation entrent dans CE PAS via `narrateur.ts:655` (sans fichier touché) — précédent jalons. Voulu : un delta est un fait du monde, il se lit dans le pas qui l'a causé. |
| Schéma de sortie | Inchangé |
| Échec de validation | Inchangé |
| Ce que l'IA **ne** fait **pas** | L'IA ne demande jamais l'activation d'un climat. Le code éteint. Pas de prose d'extinction injectée. `nom` est UI-seul (bandeau), jamais dans un assembleur de contexte. |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-climat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : extraire `sessionCombat.ts`, déclarer `climat_actif` dans `horloge`, ajouter `climat_id?` à `Evenement`, écrire `tickClimat`, câbler dans `tickHorloge`, protéger le spread de l'horloge dans `commandes.ts`, écrire § J3 dans `REGLES-PLAY.md`
- **Fichiers** :
  - **Prod R** : `src/brain/dossier/types.ts` (R) · `src/brain/dossier/tables.ts` (R) · `src/brain/dossier/destinations.ts` (R) · `src/brain/dossier/sessionDestinations.ts` (R) · `src/brain/dossier/session.ts` (R) · `src/brain/dossier/commandes.ts` (R) · `src/brain/dossier/horloge.ts` (R) · `src/brain/dossier/evaluate.ts` (R) · `src/brain/index.ts` (R) · `src/brain/dossier/atteignabilite.ts` (R, docstring seule)
  - **Prod N** : `src/brain/dossier/sessionCombat.ts` (N) · `src/brain/dossier/climat.ts` (N)
  - **Tests R** : `validate.test.ts` (R) · `couverture.test.ts` (R) · `sessionCouverture.test.ts` (R) · `commandes.test.ts` (R) · `horloge.test.ts` (R) · `blocage.test.ts` (R) · `evaluate.test.ts` (R) · `session.test.ts` (R, imports)
  - **Tests N** : `climat.test.ts` (N)
  - **Fixtures R** : `dossier-reference.json` (R) · `dossier-minimal.json` (R) · `session-saturee.ts` (R)
  - **Docs R** : `docs/REGLES-PLAY.md` (R, § J3 ajouté AVANT le code)
- **Expose** : `ActivationDeClimat`, `evenementDeClimat`, `tickClimat` — internes à `brain/dossier/`, aucun nouvel export de `brain/index.ts`
- **Critères couverts** : #1, #2, #3, #4, #5
- **Ordre interne** :
  1. § J3 de `REGLES-PLAY.md` (AVANT tout code)
  2. Extraction pure `sessionCombat.ts` (jest vert, aucun champ neuf)
  3. Contrat (types, tables, destinations, fixtures, tests de couverture)
  4. Moteur (`climat.ts`, sélecteur `evenementDeClimat`, appel dans `tickHorloge`, spread de l'horloge dans `commandes.ts`)

### Lot 2 — `bandeau-pas-climat`
- **Ouvrier** : `dev-lot`
- **But** : afficher PAS #n et CLIMAT · {nom} dans le bandeau, corriger la dette visuelle
- **Fichiers** : `src/features/play-mode/components/BandeauHeros.tsx` (R) · `src/features/play-mode/components/BandeauHeros.test.tsx` (R) · `src/features/play-mode/components/EcranPartie.tsx` (R) · `src/features/play-mode/components/EcranPartie.test.tsx` (R)
- **Consomme** : `EtatSession.horloge.tour`, `EtatSession.horloge.climat_actif?.id`, `Dossier.monde.climats[].nom`
- **Critères couverts** : #6, #7, #8
- **TDD** (QA veto) : les assertions du bandeau sont écrites AVANT le code du composant. Tests red → code green → refactor.

*(2 lots. Au-delà, l'itération est trop grosse : elle se coupe en deux, elle ne se regroupe pas.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier avec un Climat `c1` (durée 3, `effets_regles: [donner_objet]`) et un Événement portant `climat_id: 'c1'` dont le `declencheur_expr` est vrai, **quand** le moteur accepte une commande qui consomme cet événement, **alors** `session.horloge.climat_actif` vaut `{id: 'c1', depuis: <tour>}`, l'événement est dans `evenements_consommes`, le journal contient `climat_actif : c1` avec les deltas appliqués, et l'objet est dans l'inventaire — *niveau : unitaire* — *lot L1*

2. **Étant donné** un climat actif `{id: 'c1', depuis: 2}` de durée 3, **quand** le moteur traite le pas au tour 5 (`tour − depuis >= duree`), **alors** `climat_actif` est **absent** de `session.horloge` (clé supprimée, pas `undefined`) et le journal contient `climat_eteint : c1` sans deltas — *niveau : unitaire* — *lot L1*

3. **Étant donné** un climat actif, **quand** `commandes.ts` exécute `aller`, `fouiller` ou `parler`, **alors** `session.horloge.climat_actif` est conservé identique (spread `...session.horloge`) — *niveau : unitaire* — *lot L1*

4. **Étant donné** un climat actif et un second événement de climat non consommé dont le `declencheur_expr` est vrai, **quand** le moteur traite le pas, **alors** le second événement n'est PAS consommé (un seul climat actif à la fois) — *niveau : unitaire* — *lot L1*

5. **Étant donné** un climat actif `{id: 'c1', depuis: 2}` de durée 3, **quand** le moteur traite le pas au tour 4 (`tour − depuis < duree`), **alors** `climat_actif` est inchangé et aucune ligne `climat_eteint` n'apparaît — *niveau : unitaire* — *lot L1*

6. **Étant donné** `pas={3}`, **quand** le bandeau est rendu, **alors** il affiche `PAS #3` — *niveau : composant* — *lot L2*

7. **Étant donné** `climatNom="Tempête de sable"`, **quand** le bandeau est rendu, **alors** il affiche `CLIMAT · Tempête de sable` — *niveau : composant* — *lot L2*

8. **Étant donné** `climatNom={undefined}`, **quand** le bandeau est rendu, **alors** aucun bloc CLIMAT n'est affiché — *niveau : composant* — *lot L2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `climat.test.ts` : activation consomme l'événement et pose climat_actif | `horloge.climat_actif` = `{id, depuis: tour}`, `evenements_consommes` contient l'id | jest | KR-301 | L1 |
| `climat.test.ts` : effets delta appliqués à l'activation | objet dans inventaire après `donner_objet` | jest | KR-208 | L1 |
| `climat.test.ts` : extinction à durée (`tour − depuis >= duree`) | `climat_actif` absent, journal `climat_eteint` | jest | — | L1 |
| `climat.test.ts` : pas d'extinction avant durée (`tour − depuis < duree`) | `climat_actif` inchangé | jest | — | L1 |
| `climat.test.ts` : extinction à `duree + 1` (session forgée) | `climat_actif` absent (`>=` couvre ce cas) | jest | — | L1 |
| `climat.test.ts` : second événement attend pendant un climat actif | second événement non consommé | jest | — | L1 |
| `climat.test.ts` : climat sans durée = permanent | `climat_actif` persiste indéfiniment | jest | — | L1 |
| `climat.test.ts` : climat_actif.id introuvable dans dossier = extinction | `climat_actif` absent, journal `climat_eteint` | jest | — | L1 |
| `climat.test.ts` : `donner_objet` sur objet déjà possédé = sans_effet | même référence retournée par `avecAjout` | jest | — | L1 |
| `commandes.test.ts` : `aller` conserve `climat_actif` (spread) | `horloge.climat_actif` identique après `aller` | jest | — | L1 |
| `blocage.test.ts` : lecteurs de `.duree` incluent `climat.ts` | sonde de lecteurs mise à jour | jest | — | L1 |
| `evaluate.test.ts` : événement avec `monstre_ref` ET `climat_id` ignoré par `evenementDeClimat` | rencontre prime | jest | — | L1 |
| `BandeauHeros.test.tsx` : `pas={3}` → affiche `PAS #3` | texte présent | jest/RTL | — | L2 |
| `BandeauHeros.test.tsx` : `climatNom="Tempête de sable"` → affiche `CLIMAT · Tempête de sable` | texte présent | jest/RTL | — | L2 |
| `BandeauHeros.test.tsx` : `climatNom={undefined}` → bloc CLIMAT absent | texte absent | jest/RTL | — | L2 |
| `BandeauHeros.test.tsx` : séparateur `--bw-hair` et `alignSelf: 'stretch'` | style corrigé | jest/RTL | — | L2 |

Cas limites couverts : climat sans durée (permanent) · climat introuvable (extinction) · objet déjà possédé (idempotent) · session forgée (`duree + 1`) · double événement climat (attente) · événement hybride `monstre_ref` + `climat_id` (ignoré).

**Non vérifiable en l'état** : la résolution `climatNom` dans `EcranPartie` depuis le dossier gelé — un test d'intégration le couvrirait, mais `EcranPartie.test.tsx` est un test composant sans dossier réel. À recopier dans la revue.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | TL | Veto Route B (5e delta `activer_climat`) | `RETENU` | Unanime — `DELTAS.ecrit` écrit `FaitsDeSession`, pas `horloge` ; les `refKinds` du registre ne nomment pas `climat` |
| 2 | TL+NIA+PM | Extinction `>=` (efface l'état) | `RETENU` | 3 vs 1 — `>=` ne répète jamais (l'état est effacé) ; `===` laisse un climat éternel sur session forgée. Sémantique différente du blocage (constat seul → `===`) |
| 3 | QA | Extinction `===` (cohérence blocage) | `REJETÉ` | Blocage constate sans effacer → `===` pour ne pas répéter. Extinction efface → `>=` sans risque de répétition. Deux mécanismes, deux gardes. Précédent J2 règle 1 vs J3 |
| 4 | QA | VETO TDD bandeau (O4 tour 2) | `RETENU` | Domaine QA (définition de fini). Tests écrits avant le composant dans L2 |
| 5 | PM | VETO roadmap manifestation (O5 tour 2) | `RETENU` | Domaine PM (périmètre). Ligne roadmap obligatoire pour R3 |
| 6 | PM | Ligne roadmap éditeur `climat_id` + `effets_regles` (O3) | `RETENU` | Ligne roadmap obligatoire |
| 7 | PM | Pré-lot extraction séparé | `REJETÉ` | TL : déplacement pur = premier commit de L1, pas un lot supplémentaire |
| 8 | UX | Journal `climat_active` (anglicisme) | `REJETÉ` | UX a retiré au tour 2. Convention TL : `climat_actif` / `climat_eteint` (champ : id, comme `lieu_courant`) |
| 9 | NIA | Bloc CLIMAT séparé de PENDANT CE TEMPS | `REPORTÉ` | R3 hors it4. Position reportée : après ICI A1, avant CE PAS |
| 10 | NIA | Extinction `===` (tour 1) | `REJETÉ` | NIA a retiré au tour 2 en faveur de `>=` |
| 11 | NIA | `tour_activation` comme nom de champ | `REJETÉ` | NIA a retiré au tour 2 en faveur de `depuis` (précédent `etape_plan.depuis`) |
| 12 | TL | `blocage.test.ts:403` rougit — L1 possède `blocage.test.ts` | `RETENU` | `climat.ts` lit `Climat.duree`, la sonde de lecteurs doit être mise à jour |
| 13 | TL | KR : `atteindre_jalon` dans `effets_regles` saute `effet[]` | `REPORTÉ` | Préexistant pour les 4 emplacements de deltas. KR candidat à écrire hors it4 |
| 14 | TL | Événement `monstre_ref` + `climat_id` → ignore climat | `RETENU` | Rencontre prime. Configuration ambiguë ignorée sans alerte |
| 15 | TL | Climat sans `duree` → permanent | `RETENU` | L'inverse (refus ou extinction immédiate) briserait un climat « calme » |
| 16 | TL | `climat_actif.id` introuvable → extinction | `RETENU` | L'inverse (conserver) créerait un état mort à vie |
| 17 | TL | `tickClimat` après jalons = latence d'un pas | `RETENU` | Docstring `horloge.ts:17-18` corrigée (devient faux). Conséquence documentée |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(aucune)*

## 10 — Définition de fini

- [ ] § J3 de `docs/REGLES-PLAY.md` écrit AVANT tout code
- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Ligne roadmap écrite pour R3 manifestation et éditeur `climat_id`/`effets_regles` (PM veto O5 + O3)
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-horloge-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | O1 retirée (Route C), O2 retirée (idempotence), O4 retirée ({id, depuis}), O5 veto retenu (roadmap) |
| Tech Lead | recevable | Route B maintenue et retenue, Route C maintenue, risque (a) spread retenu |
| UX | recevable sous réserve | O1-O4 intégrées au contrat de design L2 |
| QA | recevable | O1-O3 retirées, O4 veto retenu (TDD bandeau) |
| Narratif & IA | recevable | === retirée (>=), tour_activation retirée (depuis), R3 reporté |
