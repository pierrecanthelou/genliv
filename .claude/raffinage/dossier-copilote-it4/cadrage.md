# Cadrage — `dossier-copilote` itération **4** (la dernière de la feature)

**Démo** : « à la fin de cette itération, l'auteur peut **faire éclater le synopsis en une distribution de personnages**. »

**`goal` brut (spec)** : *Éclater le synopsis : depuis le synopsis, l'accroche, le ton et les interdits de ton, l'auteur demande au copilote une distribution de personnages, puis accepte ou refuse chaque fiche proposée. SEUL assistant qui CRÉE — des brouillons SANS IDENTITÉ dont le code frappe l'identifiant à l'acceptation, jamais avant — donc livré en DERNIER, sur un tuyau prouvé quatre fois. Sans rattachement automatique aux objectifs en v1.*

**Ce qui est livré et que vous héritez** (4 rôles, it1→3c) : route worker `POST /ia/:role` · `CopiloteService.demander(dossier, cible, signal)` où **`cible` est une UNION ÉTIQUETÉE** à 5 branches avec garde `never` (3c) · rejeu exactement une fois puis terminal · assembleurs par rôle dans `brain/copilote/contexte/` · validateurs par rôle dans `schemaSortie.ts` · `MotifIllisible` (5 motifs) et `MotifRefusContexte` (4 motifs) · cartes `CarteXxx` + lignes `LigneXxx` **sœurs** dans `dossier-copilote/components/`.

## Mesures faites par l'orchestrateur — ne les re-dérivez pas, contestez-les si elles sont fausses

1. **`Personnage` n'a que QUATRE champs requis** : `id`, `portee`, `plan_actions`, `savoirs`. Tout le reste est optionnel.
2. **La création manuelle sème exactement** `{ id: frapperIdentifiant('pnj'), portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }` (`useSocleEcriturePersonnages.ts:128-131`) — **sans nom, sans fonction**. `frapperIdentifiant` et `PORTEE_INITIALE` **sortent déjà de `brain/index.ts`**.
3. ⚠ **`nom` est d'audience `auteur` (KR-195). Le modèle ne peut donc pas nommer ce qu'il crée** — et `frapperIdentifiant` ne dérive pas l'identifiant du nom, donc l'identifiant n'est pas bloqué. **C'est le nœud de l'itération : que voit l'auteur d'un brouillon sans nom, et qui le nomme ?**
4. **`CHAMPS_PROPOSABLES` n'a que TROIS entrées** (`fonction`, `apparence`, `description_joueur`), toutes pensées pour un champ d'une entité **existante**. Rien n'est prévu pour une entité **neuve**.
5. **Le contexte disponible sous garde d'audience stricte est de QUATRE chemins** : `canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.ton`, `canon.interdits_ton[]` — tous `'ia'`, mesuré. ⚠ **`synopsis_mj` a été RETIRÉ des contextes de 3b et 3c « pour point de vue » ; ici il est LA SOURCE.** Dites si ce renversement vous paraît sûr.
6. **`canon.objectifs[]` porte SEPT clés et ZÉRO d'audience `'ia'`** — d'où la décision actée « v1 sans rattachement aux objectifs » : sous garde stricte l'assistant recevrait une liste vide.

## KR et décisions qui s'appliquent

**KR-221** (ne jamais semer un optionnel que l'auteur n'a pas posé) · **KR-229** (la frontière testable est la FORME) · **KR-230** (refuser, jamais tronquer) · **KR-231** (zéro clé commune réseau/re-résolu) · **KR-232** (audience stricte, ce qu'il voit ≠ ce qu'on lui donne) · **KR-235** (un instrument non mesuré n'est pas un instrument) · **KR-194** (auto-référence légale) · **KR-165** (aucun littéral au site d'écriture) · **KR-021** (référence pendante exposée, jamais filtrée) · **KR-109 / KR-112**.

**Décision actée, non rouvrable** : *« CRÉATION D'ENTITÉ — le garde-fou "aucune création d'entité" est reformulé en règle PARAMÉTRÉE : le modèle ne FRAPPE jamais un identifiant ; une entité neuve est un BROUILLON SANS IDENTITÉ dont le code frappe l'id à l'instant où l'auteur accepte. »*

**Doctrines des itérations précédentes, à appliquer ou à amender explicitement** : DÉSIGNATION vs RÉDACTION (3a) · l'injection du champ cible dépend de son **ORDRE**, pas de son audience (3b) · la **règle de tranchage du cas mixte** (3c) · la clé réseau nomme la **forme**, jamais le champ · une borne de sortie ne s'aligne **jamais** sur une borne de document.

## Fichiers probablement concernés
`brain/CopiloteService.ts` · `brain/copilote/{types,schemaSortie}.ts` · `brain/copilote/contexte/{synopsis.ts (N),registres.ts,index.ts}` · `brain/index.ts` · `worker/index.ts` + ses 3 suites · `dossier-copilote/components/{CarteEclaterSynopsis (N),LigneXxx (N),PanneauCopilote,styles}.ts(x)` · `dossier-copilote/textes.ts` · `dossier-copilote/tests/`.

## Ce qu'on vous demande
Format imposé : `RISQUE / OBJECTION / PROPOSITION / VERDICT`, **250 mots maximum**, au moins **une objection** — une note sans objection est renvoyée. Annexe attendue pour `tech-lead`, `ux-designer`, `narratif-ia`.
**C'est la DERNIÈRE itération de la feature** : ce qui n'est pas tranché ici part en `open_questions` vers la n° 10 ou le Temps 2, et n'aura pas de repêchage.
