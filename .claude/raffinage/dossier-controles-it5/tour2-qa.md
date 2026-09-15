## RISQUE / OBJECTION / PROPOSITION / VERDICT — QA, tour 2

**RISQUE** — Le tour 2 fait porter trois de mes huit critères (7, 6, 3) par des mesures neuves (M1, M4, M6) qui n'ont pas encore été rejouées sous forme de test réel — narratif lui-même écrit sa sonde du §4/§6 comme devant « échouer si l'on branche `issue.message` verbatim… à exécuter avant d'écrire la phrase, pas après (précédent BUG-084) », sans confirmer l'avoir fait. Je ne compte donc PAS cette sonde comme vérifiée ; je l'exige comme critère écrit, à exécuter par l'ouvrier en négatif avant adoption — pas comme un fait déjà acquis. C'est la même discipline que je m'applique à moi-même ci-dessous.

**OBJECTION nommée** — Sur **R8** (tech-lead, rejet « réutiliser `dossierIssueRemediation` ») : R8 est juste sur le fond mais M4 a montré qu'aucun instrument ne le tient — `controles.test.ts:676` n'épingle `startsWith('Rédigez')` que sur l'entrée `amorce-non-redigee`, aucune garde ne protège les quatre autres règles déjà livrées ni les dix sites neufs contre un « ↪ » ou un vocabulaire de canal. Mon critère 7 (ci-dessous) ferme ce trou : il scanne **l'ensemble** des constats produits — les témoins déjà existants des cinq règles livrées **et** les dix témoins neufs du bridge — pas seulement les nouveaux. C'est la forme d'instrument que R8 appelait sans la nommer.

**PROPOSITION** — Les 8 critères finaux ci-dessous, avec fichier et niveau de test nommés pour chacun.

**VERDICT** : mon veto du tour 1 (C3) est **LEVÉ**, sous les conditions écrites plus bas — le reste de mes rejets est statué un par un.

---

## Réponses nommées aux points demandés

### C3 — mon VETO

**Levé, explicitement.** Les deux conditions que j'avais posées existent maintenant par écrit :
1. Table fermée `site → NiveauControle`, 10 lignes : narratif §1 la livre (7 alerte / 3 info / 0 bloquant), avec un discriminant unique appliqué sans exception aux dix sites, et le mécanisme de totalité passe non pas par un `Record` clé-fermée-par-union (impossible, clés `string`) mais par un **balayage** (tech-lead §5.1, KR-199) — c'est un instrument équivalent à ma demande initiale, je ne m'accroche pas à la forme littérale « `Record` total par compilation » du tour 1, seulement à la propriété qu'elle garantissait : un onzième site ajouté ailleurs sans entrée correspondante doit rougir à la porte de commit. Cette propriété est tenue.
2. Choix architectural tranché : tech-lead §2 — `controles.ts` importe `validateDossier`, la double source est **rejetée en R1** avec un motif de rupture de contrat (`parSection` recalculé côté feature).

**Ce que la levée ne couvre PAS**, et je le dis pour que ce ne soit pas lu comme plus large que ça : je ne me prononce **pas** sur le bien-fondé produit des lignes contestées en interne par le narratif lui-même (site 9 `revele_si`→info, site 4 `climat`→info) — c'est hors de mon terrain (périmètre produit), et le tour 2 le traite déjà sous « Tous : contestez une ligne, ou ratifiez ». Mon veto portait sur l'existence et la fermeture de la table, pas sur son contenu ligne à ligne.

### C5 / M6 — la garde KR-217, confirmée, forme exacte

**Confirmé — RETENU sans ambiguïté**, je ne conteste pas la lecture de `.warnings`. L'assertion exacte que je retiens, remplaçant `controles.test.ts` l.336-342 en entier (les DEUX lignes actuelles rougiraient : `not.toContain('validateDossier')` et `not.toContain("from './validate'")`, puisque l'import est retenu) :

```ts
it('le rapport ne lit jamais le canal errors du validateur', () => {
	// KR-217 interdit de PRODUIRE par error/warnings (son motif d'origine : la regle
	// goulot ferait rougir suffisance.test.ts si elle passait par warnings) — pas
	// d'y LIRE. warnings est le seul canal qui survit a la persistance (KR-225).
	expect(SOURCE_CONTROLES).not.toContain('.errors')
	expect(SOURCE_CONTROLES).toContain('.warnings')
})
```

**Sur le balayage naïf** : oui, `SOURCE_CONTROLES.includes('.errors')` attraperait un faux positif — si la JSDoc renversée (mon critère 6) écrit un jour la prose « ne lit jamais `.errors` » avec le point littéral dans un commentaire, la sonde rougirait sur ce commentaire légitime, pas sur du code réel. Contrainte à écrire dans le plan à côté du critère 6 : la JSDoc doit nommer le canal sans le point de propriété — « le canal `error` » ou « la propriété `errors` », jamais « `.errors` » — précédent exact dans ce même fichier : `MARQUEUR_A_ECRIRE` (l.328) sépare déjà « le glyphe littéral interdit en source » du « nom de la constante autorisé », pour la même raison.

### C8 — la phrase unique

> Le témoin de la **preuve verticale d'allumage** (rouge → calme sur un seul champ muté, n'importe quel site) se choisit sur le **coût** — `canon.mj` via `texte-trop-long` est le moins cher, une seule affectation, aucun risque de fabriquer une `error` ; le témoin de la **garde anti-dérivation** `NEUVES` (qui doit voir `path` et `section` DIFFÉRER pour prouver que la section est déclarée et non dérivée) se choisit sur le **contraste** et exclut nommément tout site `canon.*`, dont la racine du `path` égale toujours la section (M5) — deux témoins, pour deux tests différents, jamais le même site pour les deux preuves.

Cette phrase passe telle quelle dans le plan, à poser à l'endroit où le témoin `NEUVES['avertissement-de-validation']` est choisi.

### M5 — la garde d'it3, coïncidence structurelle

**Se documente comme dette nommée dans ce lot, ne se corrige pas ici.** Motif : la corriger changerait l'invariant testé pour les **cinq témoins déjà livrés** (`indice-sans-source`, `depart-desert`, `personnage-sans-presence`, `personnage-sans-voix`, `amorce-non-redigee`) — hors du périmètre déclaré d'it5 (1 lot, contrat sur `controles.ts`/`controles.test.ts`/`issues.ts` commentaire/`panneauControles.test.tsx`, rien sur `sections.ts`). Le contournement du témoin (C8, non-`canon`) suffit à fermer it5 sans toucher au prédicat.

Mais **documenter n'est pas optionnel** : `controles.test.ts` porte déjà le commentaire du témoin `NEUVES` sans jamais nommer cette limite — c'est exactement le silence que M5 vient de rompre. J'exige, dans le même lot, un commentaire ajouté au-dessus de la ligne 241 (ou son équivalent après renumérotation) : *« Ce prédicat (`path.split('.')[0] !== section`) est structurellement insatisfiable pour la section `canon` — `sections.ts` : `canon` est la seule des dix `cle` sans point. Une future règle qui déclare correctement `section: 'canon'` sur un `path` en `canon.*` fera rougir ce test EN ÉTANT JUSTE. Ne pas ajouter un tel témoin ici ; réécrire l'invariant (comparaison à une table déclarée plutôt qu'à un préfixe de chaîne) est la charge de qui touchera `canon.*` en premier. »* Plus, dans `known_risks`/`code-knowledge.json` : une entrée nommée qui pointe vers ce commentaire.

**Sur la question posée : un instrument qui ne peut pas être vert sur un cas correct est-il encore un instrument ?** Non, pas au sens plein — c'est un **proxy dégradé** : il continue de détecter une vraie classe de défaut (dérivation naïve du premier segment du `path`) sur 9 des 10 sections, et c'est une valeur réelle à ne pas jeter ; mais il n'est plus un test de l'invariant qu'il prétend nommer (« la section est déclarée, jamais dérivée »), puisqu'il est aveugle — et faussement rouge — précisément sur le cas où déclaration et dérivation coïncident. Un instrument non documenté qui se comporte ainsi est plus dangereux qu'absent, parce qu'il punira la bonne réponse le jour venu et sera lu comme un bug du code plutôt que de la garde. D'où l'exigence de documentation ci-dessus, non négociable, coût nul (un commentaire), payable dans ce lot puisque le fichier est déjà ouvert.

### M1 / M3 / M4 — mes critères 1 à 8 bougent-ils ?

Oui, sur trois des huit — je les ai réécrits en conséquence (liste finale plus bas) :

- **Ancien critère 7 (« remédiation non fuyante »)** était trop étroit : il ne couvrait que `controleRemediation`, pas `message`, et ne visait que l'interdiction de réutiliser `dossierIssueRemediation` — un mécanisme, pas un résultat. M1 (fuite de clé JSON dans `message`) et M3 (consigne fausse sur `si_bloque`) touchent le **contenu rendu**, pas seulement sa provenance. Je le réécris en critère **piloté par le résultat**, pas par le mécanisme (reprise vs réécriture reste C1/C2, hors de mon terrain de décision — mais quel que soit ce qui est tranché, le résultat doit passer ma sonde). Voir critère 7 final.
- **Critère 6 (« JSDoc renversée »)** ne visait qu'**une** phrase (tour 1) ; tech-lead a mesuré qu'il y en a **deux** distinctes (l.22-23 sur le canal, l.80-81 sur la grammaire du `path`) — je l'élargis aux deux, sans quoi une seule moitié de la doctrine documentée serait vérifiée.
- **Critère 3 (« section déclarée, table totale »)** avait une formulation de mécanisme (« `Record` total fermé par compilation ») qui ne correspond plus au design retenu (`SITES_AVERTISSEMENT: Record<string, …>`, totalité tenue par balayage, pas par union fermée — tech-lead §5.1). Je corrige la formulation sans changer la propriété observée.
- **Critères 1, 2, 4, 5, 8** : inchangés dans leur substance ; M9 ne change que le **motif produit** du critère 2 (« pourquoi aucun bloquant »), pas son assertion — le test reste : `niveau ∈ {'alerte','info'}` jamais `'bloquant'`.

### M8 — correction exacte, et rien d'autre

**Un nom, pas une assertion élargie.** J'ai lu le test (`panneauControles.test.tsx:164-183`) : ses trois assertions vérifient (a) au moins une ligne rendue, (b) aucune ligne ne porte `role="button"` ni `tabindex` manuel, (c) chaque `listitem` contient exactement un élément de rôle `button` natif. C'est une preuve de **forme DOM** (bouton natif, pas de doublon d'accessibilité manuel) — ça ne simule aucune frappe `Tab`, ne vérifie aucun ordre de focus : ce n'est **pas** une preuve de « arrêt de tabulation » au sens comportemental que le nom promet. Élargir l'assertion (simuler `Tab`, vérifier `document.activeElement`) ajouterait une **couverture neuve** — interdit dans ce diff par consigne explicite du tech-lead. Renommer ne touche aucune ligne d'assertion : c'est la seule option à coût de couverture nul.

**Nom proposé** : `'chaque ligne rend un bouton natif unique, sans role ni tabindex manuels'` — remplace `'chaque ligne est un arret de tabulation'`, zéro ligne de corps touchée. Le fichier est déjà `R` dans L1 : coût marginal nul, condition du tech-lead remplie.

---

## Statut de mes objections et rejets — tour 1

| # | Objet | Statut |
|---|---|---|
| VETO principal | Clôture sans table fermée + choix architectural tranché | **LEVÉ** — les deux conditions existent (narratif §1 + tech-lead §2), voir C3 |
| Rejet 1 | Prouver le pont sur les 3 fixtures dormantes seules | **MAINTENU** — personne ne le conteste ; reste distinct du critère 1 (discriminant), qui est le test qui, lui, discrimine |
| Rejet 2 | `Controle.niveau`/champ voisin portant une valeur de `DossierIssueSeverity` | **MAINTENU** — non contesté, `SiteAvertissement.niveau: Exclude<NiveauControle,'bloquant'>` (tech-lead §2) l'exclut par le type, mon critère 2 le vérifie aussi à l'exécution |
| Rejet 3 | Clore sans table fermée `site→NiveauControle` | Fusionné avec le VETO principal (même objet) — **LEVÉ** |
| Rejet 4 | Conserver tel quel `controles.test.ts` l.336-342 si import retenu | **MAINTENU**, forme exacte du remplacement donnée en C5/M6 ci-dessus |

Aucun de mes rejets ne se durcit en veto nouveau à ce tour — la seule chose que j'ajoute en exigence ferme (pas un veto, une condition de clôture au même titre que C3) est la documentation nommée de M5 (§ ci-dessus) : sans ce commentaire + l'entrée `known_risks`, je rouvrirais la question à la revue de vérification (Mode B).

---

## Les 8 critères d'acceptation finaux

**1. Discriminant (le pont est câblé)** — Étant donné `dossier-minimal.json` cloné avec `savoirs[0].revele_si` mis à `{}` (un seul champ muté), quand `controlerDossier` est appelé sur le clone et sur l'intact, alors le rapport du clone porte un constat de section `personnages` absent du rapport intact (comparaison dans le même test). Niveau **contrat (brain)**, `src/brain/dossier/controles.test.ts`.

**2. Niveau jamais bloquant** — Étant donné les quatre mutations à un seul champ (§ mesure orchestrateur §2 : `synopsis_mj` > budget, `revele_si: {}`, `condition_expr` d'une fin retiré, `duree` de `si_bloque` retirée), quand `controlerDossier` est appelé sur chaque clone, alors chaque constat produit porte `niveau ∈ {'alerte','info'}`, jamais `'bloquant'` — tenu par le type (`Exclude<NiveauControle,'bloquant'>`) et vérifié à l'exécution. Niveau **contrat (brain)**, `controles.test.ts`.

**3. Section déclarée, totalité tenue par balayage (KR-199)** — Étant donné chaque `path` de `BUDGETS_DE_MOTS`, chaque famille de `FAMILLES_DE_CONDITIONS` où `alerteSansExpr` est vrai, et les deux sites isolés (`revele_si`, `si_bloque`), quand ils sont comparés à `SITES_AVERTISSEMENT`, alors chacun y a une entrée déclarée (`niveau`/`section`/`remediation`) — un onzième site ajouté à l'un des deux registres sans entrée correspondante fait échouer ce test à la porte de commit. Niveau **contrat (brain)**, `controles.test.ts`.

**4. Garde KR-217 reformulée : `.errors` interdit, `.warnings` autorisé** — Étant donné le code source de `controles.ts` après le lot, quand un balayage de source est exécuté, alors `SOURCE_CONTROLES` ne contient jamais `.errors` et contient `.warnings`. Ce test remplace `controles.test.ts` l.336-342 en entier (ses deux lignes actuelles rougiraient). Contrainte associée : la JSDoc du critère 6 n'écrit jamais le substring littéral `.errors` en prose (sinon faux positif, voir C5). Niveau **contrat (brain), source-scan**, `controles.test.ts`.

**5. Non-régression des trois dormantes** — Étant donné `dossier-minimal.json`, `dossier-reference.json` (intact) et `construireAmorce(...)`, quand `controlerDossier` est appelé, alors le rapport est identique, ligne pour ligne, à l'état pré-lot (zéro avertissement, mesuré §1 de l'orchestrateur). Niveau **contrat (brain) + composant**, `controles.test.ts` + `src/features/dossier-controles/tests/panneauControles.test.tsx`.

**6. Les deux JSDoc renversées** — Étant donné les phrases `controles.ts` l.22-23 (« ce module n'importe pas le validateur : il n'a rien à y lire ») et l.80-81 (« une clé de `DESTINATION_DES_CHAMPS` »), quand un balayage de source est exécuté après le lot, alors aucune des deux formulations ne subsiste littéralement, remplacées par les deux formulations de tech-lead §2 (canal : produit jamais / lit `warnings` jamais `errors` ; grammaire : clé, **ou** chemin de bloc dont au moins une feuille en est une). Niveau **contrat (brain), source-scan**, `controles.test.ts` (+ `issues.ts`, commentaire seul, l.76, zéro ligne exécutable).

**7. Message et remédiation sans fuite ni contradiction de canal** — Étant donné l'ensemble des constats produits par `CONTROLES` — les témoins des **cinq règles déjà livrées** (`seme()`, `cloneIndiceOrphelin()`, `cloneSansPresence()`, `cloneSansVoix()`) **et** les dix témoins neufs du bridge (un par site, mutation d'un seul champ) — quand `controle.message` et `controleRemediation(controle)` sont lus pour chacun, alors aucune chaîne ne contient `'↪'`, une clé technique du schéma (`_texte`, `_expr`, `si_bloque`, `revele_si`), une mention du canal (`'bloquant'`/`'non bloquant'`/`'warning'`/`'error'`), ni « réimport ». Sonde vérifiée en négatif avant adoption (elle doit rougir si l'on branche `issue.message`/`dossierIssueRemediation` verbatim sur un des cinq sites `condition-sans-expr`/`revelation-sans-porte` — à exécuter par l'ouvrier, précédent BUG-084, je ne la compte pas vérifiée tant que ce négatif n'a pas été rejoué). Cette formulation reste neutre sur C1/C2 (reprise vs réécriture) : elle contraint le résultat, pas le mécanisme. Niveau **contrat (brain)**, `controles.test.ts`.

**8. Rendu composant** — Étant donné un contrôle importé rendu dans le panneau via une fixture **locale** clonée-mutée (jamais `dossier-minimal.json`/`dossier-reference.json` directement, precedent it3), quand le panneau est rendu, alors sa ligne suit l'anatomie à trois lignes + pastille déjà en production, sans nœud neuf. Inclut la correction M8 (renommage seul, zéro ligne d'assertion touchée) du test voisin `'chaque ligne rend un bouton natif unique, sans role ni tabindex manuels'`. Niveau **composant**, `src/features/dossier-controles/tests/panneauControles.test.tsx`.

---

## Ce que je n'ai pas pu vérifier moi-même, à ne pas compter comme couvert

- Les chiffres de coût M7 (0,743 ms / 0,018 ms / ×41) et les chaînes réelles M1/M9 : lus tels que rapportés par l'orchestrateur, non rejoués par moi-même (je n'ai pas relancé de sonde destructive à ce tour — le seul travail que j'ai exécuté est une lecture directe de `controles.test.ts` l.260-360, `issues.ts` l.60-90, `sections.ts` et `code-knowledge.json` KR-217, plus `git status`, pour confirmer M5, M6 et l'état de l'arbre). Je les prends comme base au sens du dossier tour 2 (« ne les rejuge pas »), mais je ne les revendique pas comme vérifiés par moi.
- La sonde négative du critère 7 (le « cas négatif vérifiable » narratif §4/§6) : personne n'a confirmé l'avoir exécutée — voir RISQUE ci-dessus.
- Le volume de lignes sur une aventure réelle écrite à la main (narratif §5) : hors de mes 8 critères, reste un relevé daté à faire à la revue, pas une assertion committée.
- La justesse produit des niveaux `info` pour les sites 4 et 9 (contestés en interne par le narratif lui-même) : hors de mon terrain, à trancher par les autres rôles.

Fichiers lus pour vérification directe : `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.test.ts` (l.200-360), `C:\Users\pierr\Desktop\genliv\src\brain\dossier\issues.ts` (l.60-90), `C:\Users\pierr\Desktop\genliv\src\brain\dossier\sections.ts`, `C:\Users\pierr\Desktop\genliv\code-knowledge.json` (KR-217), `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\tests\panneauControles.test.tsx` (l.160-185), plus les six notes du tour 1/2 et `mesure-orchestrateur.md` en entier.