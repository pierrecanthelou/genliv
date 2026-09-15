# Tour 1 — `qa`

RISQUE — Le rayon de souffle « DEUX sites d'appel » est **confirmé par grep exhaustif** (`App.tsx:46`, `dossierEditorScreen.test.tsx:558`, aucun autre dans `src/`) mais **SOUS-ESTIMÉ d'un cran**. Le passage au render-prop rend nécessairement les lignes cliquables et opérables au clavier (tension n° 4, exigée) — or `panneauControles.test.tsx` porte déjà un test qui affirme **le CONTRAIRE** (« aucune ligne n'est un arrêt de tabulation » : `role != button`, `tabindex` absent, **0 `role=button`** dans la liste). Ce test rougit **structurellement** si le lot ne le réécrit pas explicitement — et il n'est ni dans les « 2 tests » du chiffrage d'it1, ni dans le cadrage.

OBJECTION *(mesurée, code lu)* — **L'affirmation « sur 10 contrôles du dossier de référence, aucune règle ne mène à son propre remède » est FAUSSE.** Lecture de `controles.ts` : `personnage-sans-presence` (4 constats sur la référence, `section: 'personnages'`, remède « Personnages → Présence ») et `personnage-sans-voix` (5 constats, `section: 'personnages'`, remède « Caractère exploitable ») pointent **BIEN** vers leur propre section — soit **9 des 10 constats réels**. `depart-desert` (1) offre deux remèdes, dont un dans sa propre section. Seul `indice-sans-source` (**0 sur la référence aujourd'hui**) a 2 de ses 3 remèdes hors section — et même lui en offre un dans la sienne (« Indices → Mène à »). **La tension n° 2 doit être reformulée sur cette mesure, pas sur l'intuition.**

PROPOSITION — Corriger le motif de la tension n° 2 **comme it3 l'a fait pour l'audience** ; ajouter le test discriminant et le test clavier **dans le même lot** que le changement de forme.

VERDICT — **raffinable sous réserve** : (a) correction du motif de la tension n° 2 par la mesure ci-dessus ; (b) ajout explicite, au plan, de la réécriture de « aucune ligne n'est un arrêt de tabulation ». **Aucun veto sur le périmètre produit.**

## 1. Critères d'acceptation proposés (8 au plus)

1. **Discriminance navigation.** *Étant donné* le panneau Contrôles affiché après une navigation **Objets → Contrôles** (ni Départ ni Contrôles n'est déjà sélectionné ni déjà affiché), *quand* l'auteur clique la ligne d'un constat `section='depart'`, *alors* la ligne « Départ » porte `aria-current="true"`, « Contrôles » ne le porte plus, et le panneau rendu n'est plus la liste mais celui de Départ. — *composant*, `dossierEditorScreen.test.tsx`
2. **Encapsulation (KR-184 / veto tech-lead).** *Étant donné* `PanneauControles` rendu isolément avec un rappel `jest.fn()`, *quand* l'auteur clique la ligne d'un contrôle `section='personnages'`, *alors* le mock est appelé **une fois** avec exactement `'personnages'`, **sans aucun `querySelector` ni accès DOM hors de l'arbre du composant**. — *composant*, `panneauControles.test.tsx`
3. **Clavier (tension n° 4).** *Étant donné* une ligne focalisée par Tab, *quand* l'auteur presse Entrée ou Espace, *alors* le même rappel est appelé qu'au clic. **REMPLACE** (ne complète pas) « aucune ligne n'est un arrêt de tabulation ». — *composant + user-event*
4. **Cas limite doublon.** *Étant donné* deux contrôles distincts de même `section`, *quand* l'auteur clique l'un ou l'autre, *alors* les deux mènent à la même destination. — *composant*
5. **Cas limite vide (non-régression).** *Étant donné* un dossier calme, *alors* aucune ligne cliquable n'existe. — *composant*, test existant **inchangé**
6. **Câblage réel.** *Étant donné* `App.tsx` injectant `panneauControles` sous forme fonction, *alors* `PanneauControles` reçoit bien le rappel — **test-grep de source**, sur le modèle du test existant « App.tsx câble PanneauCanon… »
7. **Non-régression KR-218.** « un seul badge par ligne » et « une section saine ne porte aucun mot de niveau » restent verts **sans modification**. — *composant*, tests existants
8. **Ligne de base.** Les 35 tests des 4 fichiers restent verts, **à l'exception des 2 réécrits** en (1) et (3), **jamais supprimés silencieusement**. — *porte qualité*

## 2. Rayon de souffle — mesuré, pas déduit

`grep -rn panneauControles src/` → **exactement 2 sites** passant une valeur : `App.tsx:46` (production) et `dossierEditorScreen.test.tsx:558` (dans le seul `it` « l'entree Controles apparait quand un panneau est injecte »). **Le cadrage a raison sur ce point.**

Ligne de base exécutée **avant** tout changement : `dossierEditorScreen` **26/26** · `panneauControles` **4/4** · `sectionNav` **1/1** · `createDossierFlow` **4/4** → **35/35 verts, 4 suites.**

Si la forme passe à `(api) => ReactNode` sans mise à jour : **2 tests rougissent, pas 1** — le site nommé au cadrage **et** « aucune ligne n'est un arrêt de tabulation », que le cadrage ne nomme pas. `sectionNav.test.tsx` et `createDossierFlow.test.tsx` : **0 site touché**, confirmé.

## 3. Le test qui discrimine (piège de la sélection déjà active)

**Départ imposé sur Objets** — ni Départ ni Contrôles ne sont la section courante. **Ligne cliquée** : celle du constat `section='depart'`. **Assertions** : `aria-current` bascule vers « Départ », le contenu du panneau Contrôles disparaît, celui de Départ apparaît.

> Un test qui partirait de la sélection par défaut (Canon, index 0) ou qui cliquerait la première ligne **resterait vert même si le clic ne faisait rien**, par coïncidence de position. D'où le départ imposé sur Objets.

## 4. Tension n° 2 — observable ET utile, mais pas comme écrit

Le critère est observable (test 1) et **utile pour 9 des 10 constats mesurés**. Seul `indice-sans-source` — absent du dossier de référence aujourd'hui mais réel ailleurs — est un vrai cul-de-sac pour 2 de ses 3 remèdes. **Le motif du cadrage généralise à tort un cas particulier à l'ensemble ; à corriger dans le plan, pas à bloquer.**

## 5. KR-218

**Non affecté par construction** : `ListeControles` et `SectionNav` sont deux sous-arbres DOM **disjoints**, et aucune donnée neuve n'est partagée — `parSection`/`badgeSection` ne sont pas touchés. **Non mesuré après implémentation** (le code n'existe pas) : le critère 7 exige la ré-exécution des deux tests de badge **sans modification**, comme preuve plutôt que déduction.

## 6. Rejets

**Aucun veto.** Une correction est **exigée avant franchissement** : le motif de la tension n° 2 doit être réécrit **sur la mesure**. *Un motif faux à côté du bon cède devant le premier contradicteur sérieux* (précédent it3, famille BUG-080), et un plan qui le garde livrerait **une phrase de doctrine fausse dans `resolved_decisions`**.

---

## Seconde invocation (session relancée) — ce qu'elle ajoute

**Elle a fait l'expérience contrôlée** que la première n'avait pas faite : changer temporairement la signature en render-prop, mesurer, revenir. Résultat au § 5 de `mesure-orchestrateur.md` — **`jest` 35/35 verts, `tsc` 3 erreurs sur 3 fichiers**, dont `DossierEditorScreen.tsx:125`, **sa propre consommation de la prop**, que le cadrage ne nommait pas.

> « Le chiffre juste n'est ni 2 ni un compte de tests rougissants : **jest reste vert alors que tsc — la porte réelle — rougit sur 3 fichiers dont un que le cadrage ne nomme pas.** Ce résultat interdit toute affirmation `dev-contrat` du type "ce test resterait vert" sans le mesurer aussi. »

**Écart de comptage signalé sans être tranché** : `dossierEditorScreen.test.tsx` porte **26** tests, alors que le journal d'it3 écrit « 28 → 28 ». Écart non expliqué, remonté tel quel.

**Trois demandes propres à cette invocation :**
1. Figer si `onSelectSection` est **REQUISE ou optionnelle** — le choix REQUISE multiplierait les sites de `panneauControles.test.tsx`, chiffre absent du cadrage.
2. **L'isolation des features (KR-184) interdit tout test bout-en-bout unique** : il faut **DEUX preuves complémentaires** — le contrat (le panneau appelle le rappel) et le câblage (l'écran réagit) — jamais une assertion qui suppose les deux.
3. Que `resolved_decisions` écrive explicitement que le critère de navigation **sera *superseded*, pas régressé**, le jour où it5/it6 routeraient vers le remède — pour qu'un futur QA en mode B ne lise pas cette réécriture comme une régression.

**Son test discriminant** : destination initiale = `SECTIONS[0]` (Canon, **jamais** Indices), la sonde déclenche `api.onSelectSection('indices')`, et l'on vérifie que la ligne « Indices » porte **seule** `aria-current` (égalité stricte du tableau filtré, jamais une inclusion). *Pourquoi il rougirait sans câblage* : `destination` resterait `'controles'`, aucune ligne « Indices » ne passerait jamais `aria-current`.
