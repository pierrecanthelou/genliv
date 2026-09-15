# Mesure de l'orchestrateur — itération 4

## 1 — Ligne de base, mesurée (run réel, `npx jest`)

`panneauControles.test.tsx` + `dossierEditorScreen.test.tsx` + `sectionNav.test.tsx` + `createDossierFlow.test.tsx`
→ **4 suites, 35 tests, tous VERTS** au 2026-09-15, sur `dab6553` (`0.6.36`).

C'est le run que le tech-lead demandait à l'orchestrateur, n'ayant **toujours pas de Bash** (troisième invocation consécutive sans exécuteur).

## 2 — Les trois affirmations du tech-lead, vérifiées par lecture directe

**(a) `panneauControles.test.tsx` épingle L'INVERSE EXACT d'it4 — CONFIRMÉ.**
Test `'aucune ligne n est un arret de tabulation'` :

```ts
lignes.forEach((ligne) => {
    expect(ligne).not.toHaveAttribute('role', 'button')
    expect(ligne).not.toHaveAttribute('tabindex')
})
expect(within(liste).queryAllByRole('button')).toHaveLength(0)
```

→ **it4 ne complète pas cette suite : il renverse un invariant posé délibérément.** Conséquence de procédure : ces assertions se **renversent nommément**, jamais ne se suppriment — sinon on perd la seule garde de forme de la ligne, sans trace.

**(b) Le comptage de `<p>` — CONFIRMÉ, sur DEUX sites.** `lignes[0].querySelectorAll('p')` → `toHaveLength(3)` plus `textContent !== ''` sur chaque étage, aux deux endroits (ligne d'amorce et ligne orpheline). Ils meurent si `<p>` devient `<span>`, ce qu'impose le modèle de contenu de `<button>` (contenu *phrasing* ; `<p>` est *flow*).

**(c) `dossierEditorScreen.test.tsx` l. 558 — CONFIRMÉ.** `panneauControles={<SondePanneauControles />}` : un `JSX.Element` n'est plus assignable à `(api) => ReactNode`. **Erreur `tsc`, pas un test rouge** — donc invisible à `jest` seul.

## 3 — Convergence indépendante sur la phrase de démo

Le PM et le tech-lead, **sans se voir**, demandent tous deux que la phrase de démo cesse de dire « section **fautive** » :

- PM : « …mène l'auteur à **la section qui porte l'absence signalée** — jamais à la section du remède. »
- Tech-lead : « …la section **où le constat a été produit** », jamais « la section du remède ».

Motif commun : « fautive » se lit aussi bien « là où est l'erreur à corriger » (le remède) que « là où l'absence est constatée » (le contrat réel de `Controle.section`, KR-219). **C'est l'ambiguïté qui, à it3, a laissé une phrase de démo encoder une définition que le comité venait de rejeter** — rattrapée de justesse par le narratif.

## 4 — ⚠ LA TENSION N° 2 DU CADRAGE REPOSAIT SUR UNE AFFIRMATION FAUSSE DE L'ORCHESTRATEUR

J'avais écrit au cadrage, § 9, en la présentant comme mesurée :

> « **Sur 10 contrôles du dossier de référence, aucune règle ne mène à son propre remède.** »

**C'est FAUX.** Trouvé par le tech-lead (seconde invocation), vérifié par moi en croisant la `section` déclarée de chaque règle avec les sections que nomme sa remédiation :

| Règle | `section` | remède sur place ? | sections du remède |
|---|---|---|---|
| amorce — texte d'ouverture | `depart` | **OUI** | `depart` |
| amorce — synopsis / accroche / ton | `canon` | **OUI** | `canon` |
| `indice-sans-source` (2 niveaux) | `indices` | **partiel** | personnages, événements, **indices** |
| `depart-desert` | `depart` | **partiel** | personnages, **départ** |
| `personnage-sans-presence` | `personnages` | **OUI** | `personnages` |
| `personnage-sans-voix` | `personnages` | **OUI** | `personnages` *(« Caractère exploitable » est un bloc de la fiche Personnage)* |

Croisé au `volume_mesure` d'it3 sur `dossier-reference.json` (1 `depart-desert` + 4 `sans-presence` + 5 `sans-voix` + **0** `indice-sans-source`) :

> **9 contrôles sur 10 mènent exactement à leur remède. Les 10 en offrent un sur place. Zéro cul-de-sac pur.**
> Et sur un dossier NEUF, **4 sur 4** (les proses d'amorce sont éditées dans la section où le contrôle pointe).

**D'où venait l'erreur** : j'ai généralisé à toutes les règles un critère d'acceptation d'it3 qui ne portait que sur **`indice-sans-source`** (« rien sur la section qui porterait le remède, celle-ci étant nommée dans la phrase française »). C'est vrai de cette règle-là — et elle est précisément celle qui **ne se déclenche jamais** sur le dossier de référence.

**Portée du défaut** : la tension n° 2 a été envoyée telle quelle aux **quatre** rôles et a orienté leurs réponses. Le PM a construit sa phrase de démo autour d'elle, l'UX a été interrogée sur une « navigation trompeuse », la QA sur « un critère observable qui prouve un comportement inutile ». **Leurs conclusions restent recevables** — router sur `Controle.section` était la bonne réponse — mais **le motif change** : ce n'est plus « la valeur tient malgré le cul-de-sac », c'est « **il n'y a pas de cul-de-sac** ».

**Classe de défaut** : identique à BUG-084 / BUG-085 / BUG-086 — une affirmation présentée comme mesurée qui ne l'était pas, et cette fois dans le document que tous les rôles lisent en premier. **Deuxième occurrence de ma part en deux itérations** (à it3, le compte des goulots).

## 5 — L'EXPÉRIENCE CONTRÔLÉE DE LA QA : jest reste vert, `tsc` rougit

La seconde invocation de la QA a **changé temporairement** la signature de `panneauControles` en render-prop dans `DossierEditorScreen.tsx`, mesuré, puis reverté. Résultat, et il renverse la question posée au cadrage :

| Instrument | Verdict sur le type mésapparié |
|---|---|
| `npx jest` sur les 4 suites | **35/35 VERTS** — `ts-jest` ne bloque PAS sur un mésappariement de type entre fichiers |
| `npx tsc --noEmit` | **3 erreurs, 3 fichiers** : `src/App.tsx:46` · `DossierEditorScreen.tsx:125` *(sa PROPRE consommation de la prop — absente du cadrage)* · `dossierEditorScreen.test.tsx:558` |

**« Combien de tests rougissent » était la mauvaise question.** Le rayon de souffle réel se mesure à `tsc`, pas à `jest` — et il inclut un site que le cadrage ne nommait pas : le fichier qui **consomme** la prop, pas seulement ceux qui la passent.

Conséquence pour le plan : aucune affirmation « ce test resterait vert » ne vaut sans avoir aussi passé `tsc`.

> ⚠ **Effet de bord de cette mesure** : l'expérience a laissé l'arbre de travail dans un état incohérent (type changé l. 39, rendu inchangé l. 126) que l'orchestrateur a trouvé et restauré depuis `HEAD`. La QA déclare avoir reverté ; le revert n'était pas effectif au moment du constat. **Une mesure destructive sur l'arbre partagé doit être vérifiée après coup**, pas seulement annoncée.

## 6 — `docs/REGLES-DU-JEU.md` corrompu une SECONDE fois, non attribué

Même signature qu'à it3 : perte du bloc d'en-tête « Source de vérité » (13 lignes). **Nouveauté cette fois** : une ligne d'en-tête de tableau où la colonne « Arme » avait été remplacée par `xxxxxxxxxx` suivi du **schéma JSON de `features_history.json`** collé en plein milieu.

**Rapporté indépendamment par la QA** (« même signature que l'incident tracé dans la revue it3 […] aucun agent n'a déclaré y avoir touché »), et constaté par l'orchestrateur. **Deux occurrences, deux sessions, zéro auteur déclaré.**

Le même diff portait **quatre lignes de règles de fuite des monstres** qui, elles, étaient du contenu réel : confirmées par l'humain et **réinscrites proprement** (commit `5d1f674`, `.md` seul), sous une sous-section dédiée de la partie Monstres, sans la ligne corrompue et sans toucher au bloc d'en-tête.

## 7 — Deux vérifications pour l'arbitrage de B-3 et du trailing

**(a) La paire de cohérence citée par le tech-lead existe, avec une nuance.** `ListRow.subtitleLine` (l. 126-132) porte bien `var(--font-mono)` + `var(--text-faint)` — l'argument de cohérence tient. **Mais sa taille est `--fs-meta`, pas `--fs-eyebrow`** que l'UX propose. Les deux sont des jetons existants ; `--fs-eyebrow` est celle de `whereStyle`, **dans le composant même où le trailing va vivre**. Cohérence locale contre cohérence avec `ListRow` : à l'UX de trancher, les deux sont défendables.

**(b) Le précédent de dérivation est exact, et il donne aussi la forme du repli.** `PanneauSection.tsx` l. 38-39 :

```ts
const descripteur = SECTIONS.find((section) => section.id === sectionId)
const titre = descripteur !== undefined ? descripteur.titre : sectionId
```

→ Le trailing devrait reprendre **ce repli-là**, pas un `?.titre ?? ''` : si un `SectionId` n'était pas trouvé, la ligne affiche l'identifiant plutôt que rien. Forme déjà en production, à recopier au plan.

## 8 — ⚠ TROISIÈME affirmation non mesurée de ce raffinage, et c'est l'orchestrateur qui l'a propagée

Le § D du dossier de tour 2 écrivait : « **Deux comptages `querySelectorAll('p') → 3` meurent** avec le passage en `<span>` ». Repris du tech-lead (« `<p>` (flow) invalide dans `<button>` (phrasing) → `<span>` »), **jamais mesuré**.

**La QA l'a mesuré. Je l'ai remesuré moi-même** (sonde jetable écrite, exécutée, supprimée ; arbre vérifié propre) :

```
<ul><li><button type="button"><span>BLOQUANT</span>
  <div><p>ou</p><p>quoi</p><p>quoi faire</p></div>
</button></li></ul>
```

| Assertion verbatim du test réel | Résultat |
|---|---|
| `expect(ligne).not.toHaveAttribute('role','button')` | **PASSE** |
| `expect(ligne).not.toHaveAttribute('tabindex')` | **PASSE** |
| `ligne.querySelectorAll('p')` → `toHaveLength(3)` | **PASSE** — aucun reparenting |
| `expect(console.error)` | **jamais appelé** — aucun `validateDOMNesting` pour ce couple |
| `queryAllByRole('button')).toHaveLength(0)` | **BASCULE** (0 → 1) |

**Cause** : React construit le DOM par `createElement`/`appendChild`, **pas en parsant une chaîne HTML** — les règles d'auto-fermeture du parseur, qui reparenteraient un `<p>` mal placé, ne s'appliquent qu'à un parsing de texte. Aucune règle ESLint du dépôt ne couvre ce cas.

**Conséquences, et elles sont lourdes pour le plan :**
1. **UNE seule assertion se renverse**, pas quatre. Le plan doit la nommer **elle**, pas « le test » en bloc.
2. **Aucune ancre de remplacement n'est due** — l'instrument existant garde ce qu'il gardait. *(Et l'ancre `button > span:last-child > span` était doublement fausse : le tech-lead l'a retirée lui-même en constatant qu'elle désignerait le trailing.)*
3. **Le chiffrage de ~36 lignes retombe** : l'essentiel des ~23 lignes de constantes de style servait la conversion.

**Ce qui reste vrai malgré la mesure, et c'est une décision, pas une nécessité** : `<p>` dans `<button>` reste **invalide au sens de la spec HTML** (modèle de contenu *phrasing*), et `ListRow.tsx` — le précédent du dépôt pour une ligne enveloppée d'un bouton — a **déjà tranché** en faveur de `<span style={{display:'block'}}>`. Convertir reste donc défendable **par validité et par précédent**, jamais par « sinon les tests cassent ». **Le tech-lead l'a présenté comme forcé ; ce ne l'est pas.**

## 9 — L'origine probable de la « corruption » de `REGLES-DU-JEU.md`

Un fichier **non suivi** est apparu pendant la session : `docs/REGLES-DU-JEU-PAPIER.md` (13 803 o, 19:42). Son contenu est `REGLES-DU-JEU.md` **privé de son bloc d'en-tête « Source de vérité »** — c'est-à-dire exactement la moitié qui manquait à l'original.

→ Cela ressemble à une **scission éditoriale en cours** (une version « papier » pour les joueurs, l'en-tête s'adressant explicitement au « double public : les joueurs et l'IA de développement »), **interrompue en son milieu** : la copie a été créée, l'original a perdu l'en-tête, et une ligne de tableau a été abîmée au passage.

**Ce n'est donc probablement PAS un dégât d'agent**, contrairement à ce que la revue d'it3 et ma première lecture ont conclu. **Le fichier non suivi n'a pas été touché** — ni lu au-delà de ses trois premières lignes, ni déplacé, ni supprimé. Il appartient à l'humain.
