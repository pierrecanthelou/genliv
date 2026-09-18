# Cadrage — `dossier-copilote` · itération 2

**Feature** `dossier-copilote` (n° 2 de la bascule IA), itération **2 sur 4**. L'it1 est livrée (`0.6.45`). Comité à **5 rôles** (`narratif-ia` convoqué : prompts, contrat de sortie IA, dossier d'aventure).

**`goal` brut** (`plan.iterations[1]`) : « Tisser les indices : sur un indice que `dossier-controles` signale déjà comme ayant moins de deux détenteurs ou sources, l'auteur demande au copilote qui d'autre pourrait le connaître, puis accepte ou refuse chaque détenteur proposé. Introduit le mécanisme de RANG et sa re-résolution par le code — et aucun entier ne sort d'un modèle dans cette tranche, la certitude étant une énumération fermée de chaînes. Le copilote PART du constat du linter, il ne rebalaye pas le dossier. »

**Phrase de démo proposée** : « à la fin de cette itération, l'auteur peut confier un indice mal servi à un personnage que le copilote lui désigne. »

**Déjà livré à l'it1, à réutiliser et non à réinventer** : route worker `POST /ia/:role` + table `INVITES` (7 branches, tout en JSON, garde d'octets `TAILLE_MAX_CORPS_IA`, témoin KR-236 sur `GABARIT_SORTIE`) ; `CopiloteService.demander(role, dossier, cible, signal)` → union à 4 branches `propose`/`refuse`/`indisponible`/`illisible`, rejeu **exactement une fois** puis état terminal ; `brain/copilote/{types,contexte,schemaSortie}.ts` ; `PanneauCopilote.tsx` (**421 lignes**) où la **carte 2 « Tisser les indices » existe déjà**, badgée « Bientôt — itération 2 » ; `LigneProposition.tsx`, `useDemandeCopilote.ts`, `textes.ts`.

**Fichiers probablement concernés** : `src/brain/copilote/{types,contexte,schemaSortie}.ts` (+ tests), `src/brain/CopiloteService.ts`, `worker/index.ts` (+ `worker/frontiere.test.ts`), `src/features/dossier-copilote/**`. **INTERDITS** : tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres` — l'exception du critère 14 était bornée à l'it1, **non renouvelable**.

**Faits MESURÉS, à ne pas re-dériver** :
- `monde.indices[].nom` et `monde.personnages[].nom` sont d'audience **`auteur`** ; `DEROGATIONS_AUDIENCE` est **vide et assertée vide** (`resolved_decisions` n° 2, zéro dérogation). Le modèle ne voit **aucun nom** — il désigne par **RANG**, le code re-résout (KR-231).
- Champs `ia` disponibles — indice : `verite` (⚠ *sous condition d'état* : seulement quand le moteur l'a constaté acquis), `formulation_joueur`. Savoir : `indice_id`, `certitude`, `revele_comment` (*sous condition d'état*). Personnage : `fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, `plan_actions[].action`, `plan_actions[].si_bloque`, `caractere.parler[]`, `caractere.jamais`, `caractere.cede_si`, `contre_mesures[].action`, `relations[].lien`.
- `CERTITUDES = ['sait','croit','soupconne']` ; `CERTITUDE_INITIALE = 'sait'`.
- Dossier de référence : **6 personnages**, 4 indices. L'it1 a mesuré `M = 1783` caractères pour **UN SEUL** personnage ⇒ `BUDGET_CARACTERES_CONTEXTE = 6000` et `TAILLE_MAX_CORPS_IA = 19456`. Ni l'un ni l'autre n'est un cliquet : **re-dérivés par leurs formules** dès que `CHAMPS_INJECTES` s'élargit.
- Règle `indice-sans-source` (`brain/dossier/controles.ts`) : **bloquant** à 0 producteur, **alerte** à 1, trois messages bloquants distincts. `controlerDossier(dossier)` rend `{controles, jouable, parSection}` ; chaque `Controle` porte `{id, niveau, section, message, location, path, entityId?}`.
- `validerSortie` est écrit pour **UNE** clé (`CLES_SORTIE = ['valeur']`) et **UNE** proposition ; `PropositionResolue = {entiteId, champ, texte}` ; `CibleCopilote = {entiteId, champ: ChampProseChemin}`.

**KR applicables** : KR-229 à KR-236 (spec de la feature) + KR-004, 021, 109, 112, 116, 117, 171, 184, 187, 193, 195, 197/199, 203, 215, 219, 223, 231.

**Ce raffinage DOIT trancher** (`open_questions` de la spec) : n° 4 le **protocole du fournisseur amont** (condition de clôture écrite : « confirmé au premier déploiement réel, ou au raffinage de l'it2 si un second rôle arrive avant » — il arrive) ; n° 5 **l'appelant de `CopiloteService.estDisponible()`** (« soit le panneau la consomme pour désactiver Lancer en amont avec une raison nommée, soit elle sort du contrat », dette KR-109). Et le signal de coupe **KR-112 sur `PanneauCopilote.tsx` (421 > 400)**, noté « à surveiller dès l'it2 ».

**Contrainte de sortie** : 1 à 4 lots à listes de fichiers **disjointes**, tout lot touchant `brain/` ou un contrat de sortie IA marqué `contrat` et ordonné **en premier** ; **8 critères d'acceptation au plus**, tous `Étant donné / Quand / Alors`.
