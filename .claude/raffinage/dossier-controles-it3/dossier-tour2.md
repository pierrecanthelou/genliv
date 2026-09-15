# Dossier du tour 2 — `dossier-controles` it3

**À lire en entier avant de répondre.** Les cinq notes du tour 1 sont des fichiers voisins :
`tour1-pm-produit.md` · `tour1-tech-lead.md` · `tour1-ux-designer.md` · `tour1-qa.md` · `tour1-narratif-ia.md`.
La mesure de l'orchestrateur est dans `mesure-fixtures.md` — **elle fait foi sur les chiffres**.

Verdicts du tour 1 : **cinq « recevable sous réserve », aucun veto.**

---

## A — Ce sur quoi plusieurs rôles ont convergé SÉPARÉMENT (ne pas re-débattre sans élément neuf)

1. **QUATRE entrées de registre, pas cinq.** « Indice orphelin » (0 producteur → bloquant) et « goulot » (1 producteur → alerte) sont **une cause à deux seuils sur un seul compteur**, entrée unique à `niveaux: ['bloquant','alerte']`. Tech-lead et narratif y arrivent indépendamment ; précédent exact `amorce-non-redigee` ; scinder serait **KR-164 en sens inverse**.
2. **La `resolved_decision` d'it1 sur l'audience est MESURÉMENT FAUSSE.** `destinations.ts` l. 261 range `monde.personnages[].savoirs[].indice_id` en `'ia'`. Les trois rôles qui l'ont mesurée (PM, tech-lead, narratif) concluent que « indice orphelin » **reste bloquante**, par trois motifs différents.
3. **Le `path` d'« indice orphelin » est `monde.indices[].id`** (clé existante, audience `moteur`). Convergence à trois : tech-lead, narratif, QA.
4. **Aucune clé sans suffixe `[]` n'existe** pour `…presence` / `…caractere.parler`, et **en ajouter une est fermé par un test** (`couverture.test.ts`, « aucune ligne morte » ; `destinations.ts` l. 87-90).
5. **Le lot est UNIQUE** et ne touche aucune autre feature (tech-lead), sous la condition du point B-2.

---

## B — LES DÉSACCORDS OUVERTS, à trancher ce tour

**B-1 · `monde.indices[].mene_a[]` compte-t-il comme producteur ?** — Le narratif dit **oui** (chemin n° 6 de son inventaire de six) ; le **script de la QA l'a exclu**, et c'est la seule cause de la divergence de chiffres (réconciliée, `mesure-fixtures.md` § 5). Conséquence mesurée : avec `mene_a`, `dossier-reference.json` porte **0 goulot** et le clone `dossier-minimal.json` en porte **1** ; sans `mene_a`, c'est l'inverse (**2** et **0**). *Défaut de forme relevé par l'orchestrateur, indépendant du chiffre : la formulation à deux branches disjointes de la QA laisse un indice à zéro savoir + un seul delta (`cendres-tiedes`) **tomber entre les deux branches** — le linter se tait sur une source unique, silence de classe KR-222. Le compteur unifié n'a pas ce trou.*

**B-2 · « Lieu de départ désert » doit-il se taire quand `monde.personnages` est vide ?** — Tech-lead (R-7) et QA (rejet n° 2) disent **oui**, tous deux mesurés : sinon la règle se déclenche **par vacuité** sur tout dossier neuf, casse le test « produit les quatre controles » (4 → 5), fait entrer deux fichiers de test de `bascule-editeur` dans le lot et oblige à amender le critère n° 1 de la spec. **Personne ne s'y oppose — reste à l'écrire.**

**B-3 · Le NIVEAU de « lieu de départ désert ».** — Le narratif pose une réserve dans le domaine du PM : « bloquant » repose sur une **prémisse non écrite** (le joueur ne peut pas simplement partir), alors que la feature a adopté l'hypothèse **inverse** — KR-224 monde ouvert — pour amputer « personnage sans présence ». Deux issues : bloquant **avec la prémisse écrite**, ou **alerte**. *Position du PM attendue nommément.*

**B-4 · La `section` de « lieu de départ désert ».** — UX dit `lieux` ; tech-lead et narratif disent `depart`. Les deux `SectionId` existent (`depart` n° 2, `lieux` n° 4). Le champ fautif est `charpente.depart.lieu_id`, dont la `cle` de section est `charpente.depart` ; le remède est dans Personnages.

**B-5 · Borner « personnage sans voix propre » à `portee === 'premier'` ?** — Proposé par le narratif. **Chiffres vérifiés par l'orchestrateur : exacts** (5/6 sans borne, 3/4 avec). **Mais l'effet ne l'est pas** : la borne fait passer le bruit de **83 % à 75 %** des personnages — elle le déplace d'un cran, au prix d'une condition de règle et d'un KR de plus. *Le narratif est invité à statuer sur sa propre proposition au vu de ce chiffre.*

**B-6 · `atteignabilite.ts` dès it3 ?** — Narratif : **oui** (son rejet n° 6, « deux parcours seraient deux vérités », citant les `brain_contracts` de la spec). Tech-lead : **non** (R-3, « un fichier contrat conçu sur un appelant est une dette »), **mais il écrit que it5 EXTRAIT l'index privé, elle ne le ré-implémente pas**. *Observation de l'orchestrateur : les deux positions ne produisent qu'**un seul parcours à tout instant**. Le rejet n° 6 vise une troisième option que personne ne propose. Les deux rôles sont invités à dire si le désaccord subsiste réellement.*

**B-7 · `mene_a` à plat ou saturé par point fixe ?** — Narratif : à plat (sûr dans le sens bloquant, la saturation est la charge d'it5). Tech-lead : saturation dès it3 (sécurité de cycle). **Mesuré : les deux lectures donnent le MÊME résultat sur les deux fixtures** ; elles ne se séparent que sur un cycle sans autre source, qu'aucune fixture ne porte. *Conséquence : le choix ne se prouve que par un clone muté fabriqué pour ça — sans quoi les deux implémentations passent les mêmes tests.*

**B-8 · La tension n° 3 (clic de ligne → section), reportée DEUX fois.** — PM : **reporter une 3ᵉ fois**, contre un **engagement daté**. UX : **trancher maintenant**, c'est le seul levier de navigabilité déjà câblé qui compense un panneau qui grossit. Tech-lead : ne pas l'intégrer (2ᵉ feature, lot unique → deux lots) **mais ne pas le reporter en silence** — lui donner une itération propre ou un propriétaire écrit.

**B-9 · Le relevé de volume demandé par l'UX** (nombre de contrôles sur `dossier-reference.json`, **relevé sans borne**). Personne ne s'y oppose ; à confirmer comme livrable du lot ou de la revue.

---

## C — REJETS NOMMÉS AU TOUR 1 — recopiés intégralement (aucun ne doit disparaître, précédent BUG-082)

**PM** — (1) intégrer le clic de ligne dans it3 ; (2) abaisser « indice orphelin » à alerte au nom de l'audience `ia`.

**Tech-lead** — R-1 deux entrées pour orphelin+goulot · R-2 la fixture d'exercice locale (N) du cadrage · R-3 créer `atteignabilite.ts` à it3 · R-4 ajouter `…presence` / `…caractere.parler` à `DESTINATION_DES_CHAMPS` · R-5 dériver la `section` du `path` · R-6 abaisser « indice orphelin » à alerte · R-7 (position) départ-désert muette sur collection vide · R-8 (position) ne pas intégrer le clic de ligne.

**UX** — (1) grouper ou trier les lignes du panneau à cette itération · (2) plafonner le nombre de lignes affichées (« voir plus » / pagination) · (3) toute différenciation visuelle au-delà du couple mot+teinte de `pastilles.ts`.

**QA** — (1) utiliser `dossier-reference.json` comme dossier « calme » · (2) livrer « départ désert » sans garde `personnages.length > 0` · (3) *(conditionnel)* pointer le `path` d'« indice orphelin » sur `savoirs[].indice_id` sans exception écrite.

**Narratif** — (1) « indice orphelin » calculée depuis `savoirs[].indice_id` seul · (2) le maintien tel quel de la phrase d'audience d'it1 · (3) une exception d'audience accordée au seul chemin `savoirs[].indice_id` · (4) *(d'avance)* toute règle jugeant la QUALITÉ d'une prose · (5) « sans voix propre » à un niveau autre qu'`info` · (6) deux parcours des producteurs · (7) l'exclusion de `climat[].effets_regles` des producteurs.

---

## D — Ce que l'orchestrateur a mesuré lui-même (fait de terrain, non négociable)

- `clone()` lit **`dossier-minimal.json`** (`controles.test.ts` l. 28). Sous **toute** définition retenue, le clone **intact cesse d'être calme** : `cendres-tiedes` a 0 producteur (définition étroite → bloquant) ou exactement 1 (définition large → alerte). **Les quatre assertions de ligne de base (l. 115, 143, 257, 265) tombent donc mécaniquement, quel que soit l'arbitrage de B-1.**
- `dossier-reference.json` : **1 bloquant « départ désert » + 4 alertes « sans présence » + 5 infos « sans voix »** — confirmé à l'identique par deux mesures indépendantes (orchestrateur + QA).
- Les quatre indices de `dossier-reference.json` sont à **exactement deux producteurs** chacun sous la définition large. La régularité est trop nette pour être fortuite.
