# Tour 1 — Tech Lead (`/cadrer dossier-copilote`) — effort élevé

RISQUE — Le copilote devient un SECOND écrivain du dossier. Une proposition en attente est facile à fabriquer comme un instantané du dossier au moment de la demande ; acceptée deux minutes plus tard, elle réécrit en bloc ce que l'auteur — ou l'adoption cloud sur `dossier:updated` — a changé entre-temps. Le dossier vit dans `DossierService` : la recette d'`update` reçoit le document COURANT gelé, et une proposition s'applique DESSUS, champ par champ, par identifiant stable. Même foyer, seconde forme : une proposition persistée serait un document fantôme que `validateDossier` n'a jamais vu.

OBJECTION — Trois itérations mettent dans la MÊME tranche la première infrastructure d'appel modèle du dépôt (route worker, contrat de sortie, rejouement, panneau de diff) ET le seul assistant qui CRÉE des entités : « Éclater le synopsis » frappe neuf identifiants à l'acceptation. L'ordre est inversé — le chemin d'acceptation se prouve sur des entités existantes avant de créer.

PROPOSITION — **4 itérations** : prose d'une fiche → fiche complète → indices → synopsis. Zéro champ de schéma neuf en it1, donc la triade Décision A n'est jamais ouverte. Contexte = projections étroites dans `brain/copilote/contexte.ts`, gardées par un test qui recoupe `destinations.ts` — première PREUVE de confinement du dépôt. Worker : `POST` absent de `BASE_CORS` (échec de préflight silencieux) ; `/ia/*` fermé si `ALLOWED_ORIGINS` est vide ; plafond de corps mesuré ; `worker/**` ajouté à `testMatch`.

VERDICT — **recevable sous réserve**

> **Vérifié par l'orchestrateur (2026-09-17)** : `BASE_CORS` = `'GET, PUT, DELETE, OPTIONS'` (pas de POST) ✔ · `jest.config.cjs` l. 8 `testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}']` ✔ · `wrangler.toml` laisse `[vars] ALLOWED_ORIGINS` commenté ✔.

## 1. Arbitrage de surface — tranché
**Le copilote reçoit sa PROPRE destination de navigation.** Troisième prop sœur de `DossierEditorScreen.tsx`, posée une seule fois par le lot contrat de l'it1, plus jamais touchée ensuite :
```ts
panneauCopilote?: (onSelectSection: (section: SectionId) => void) => ReactNode
```
Signature identique à `panneauControles` — `SectionId` seul franchit la frontière, l'état illégal de BUG-082 reste irreprésentable. L'union locale devient `SectionId | 'controles' | 'copilote'`.
L'alternative (bouton dans chaque panneau) **est vétoée** : elle touche trois features déjà `done`. Précédent KR-200/KR-205.
**Conséquence acquise : à partir de l'it2, aucun lot ne sort de `src/features/dossier-copilote/**` ni de `src/brain/copilote/**`.**

## 2. Contrats `brain/` — signatures
Aucune ligne ne touche `types.ts`, `destinations.ts` ni `validate.ts` : **la triade Décision A reste fermée sur toute la feature.**

`src/brain/copilote/types.ts` (NOUVEAU) : `RoleCopilote`, `ChampPropose { entiteId: string | null; champ: string; valeur: string }`, `Proposition { role, champs }`. **`entiteId` et jamais un index de tableau** : une proposition sur un personnage supprimé entre-temps doit échouer explicitement (KR-021), pas écrire dans le rang 3.

`src/brain/CopiloteService.ts` (NOUVEAU) : `ResultatCopilote` = union discriminée `propose | indisponible{raison} | illisible`, même doctrine qu'`EcritureDossier`. `estDisponible()` + `demander(role, dossier, cible, signal?)`. `getWorkerUrl()`/`getSyncKey()` relus à chaque `demander`.

`src/brain/copilote/contexte.ts` (NOUVEAU) : `CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]>` + `assemblerContexte`.
`src/brain/copilote/valider.ts` (NOUVEAU) : `validerProposition(role, brut): Proposition | null`, total et défensif — la sortie du modèle est une frontière de confiance au même titre qu'un fichier d'auteur (KR-116). Réutilise `estObjet`/`estCleDe`/`decrireValeur`.

CONSOMMÉ sans changement : `DossierService.update`, `controlerDossier`, `frapperIdentifiant`, `localiserEntite`, `brain/components/*`. **Aucun événement neuf.**

## 3. Réponses aux quatre questions
**Q1 — `destinations.ts`** : les deux. Le contexte de rédaction est une **projection distincte** (la n° 10 reste propriétaire de l'assembleur général) mais **soumise à la même table d'audience** : un champ `moteur` ou `auteur` n'entre pas davantage dans un prompt de rédaction que de jeu. Garde : `contexte.test.ts`, deux assertions — (a) tout chemin de `CHAMPS_INJECTES` a `destination === 'ia'` ; (b) sur la fixture, l'objet assemblé ne contient aucune valeur textuelle ≥ 12 caractères venant d'un champ `moteur`/`auteur`. **Première démonstration de confinement du dépôt.**

**Q2 — clé d'API** : dans le **worker**, secret d'environnement `Env.AI_API_KEY`. **Rien dans `CloudSettingsService` ni `persistenceKeys.ts`**, donc aucune entrée `// SENSITIVE` neuve, KR-114 non rouvert. Dit honnêtement : `X-Sync-Key` est une clé d'espace de noms, pas une autorisation — quiconque en connaît une valide peut brûler du budget modèle.

**Q3 — un lot contrat par itération**, comme `dossier-registres` (KR-210) et `dossier-fiches` (KR-190). Itérations strictement sérielles.

**Q4 — worker** : propriété = infrastructure de rang `brain/`, **pas de propriétaire de feature** ; seul un lot `contrat` peut le nommer. Test = oui, sur le neuf seulement : +1 ligne `testMatch`, `/** @jest-environment node */`. **Rattrapage des routes `/kv/` REJETÉ ici** (dette préexistante).

## 4. Ordre des itérations
| # | Tranche | Pourquoi pas avant |
|---|---|---|
| 1 | **Infra + « Compléter une fiche », prose seule** (`fonction`, `apparence`, `description_joueur` d'UN personnage existant) | Trois champs `ia` déjà au schéma, une entité existante, aucun identifiant frappé, aucun champ `moteur`. **Zéro champ de schéma neuf.** Pose route, service, validation, rejouement, diff, acceptation. |
| 2 | **« Compléter une fiche » en entier** — répliques, plan d'actions, relations, curseurs | Formes structurées sur un chemin d'acceptation déjà prouvé. Porte l'arbitrage « curseurs ». |
| 3 | **« Tisser les indices »** | Détection déjà livrée (n° 7) ; n'écrit que la PROPOSITION, dans `savoirs[]` d'un personnage existant. Zéro création. |
| 4 | **« Éclater le synopsis »** | Seule tranche qui CRÉE (9 personnages + objectifs), seule qui frappe des identifiants. Le faire en premier, c'est valider l'infrastructure sur son cas le plus dur. |

Tension notée honnêtement : **la valeur produit la plus forte (la page blanche) est en dernier.** L'argument est unidirectionnel — la dépendance technique va dans ce sens, pas la valeur. Si le comité inverse, il achète le risque en connaissance de cause.

## 5. Liste de contrôle du worker (mesurée sur CE worker, 111 l.)
1. **`POST` absent de `BASE_CORS`** (l. 27) → l'ajouter. Sans ça, préflight refusé : **panne silencieuse invisible en test unitaire**, équivalent du 404 de route manquante.
2. **Aucun en-tête neuf** — le rôle voyage dans le CHEMIN (`POST /ia/:role`), pas dans un `X-Copilote-Role`.
3. **Auth** `X-Sync-Key` héritée telle quelle ; `AI_API_KEY` jamais renvoyée ni journalisée.
4. **Plafond de corps** : 25 Mo sur PUT est absurde pour un prompt → `PLAFOND_CORPS_IA`, 413 avec corps JSON. Valeur **mesurée** à l'it1, arrondie `ceil(mesure ÷ 5 kio) × 5 kio`.
5. **Origine** : `ALLOWED_ORIGINS` vide ⇒ repli `'*'`, et `wrangler.toml` le laisse commenté ⇒ **la prod est ouverte**. `/ia/*` **échoue fermé** (403) là où `/kv/*` reste ouvert par compatibilité. Honnêtement : `Origin` est forgeable hors navigateur. Limiteur de débit = point d'extension nommé, pas livré.
6. **Forme de réponse** alignée sur `ResultatCopilote`. **Jamais le corps brut du fournisseur.**
7. **Routeur de modèle et d'effort** : `ROLES_IA: Record<RoleCopilote, {modele, effort, invite, plafondCorps}>` dans `worker/ia.ts`, **une entrée aujourd'hui**. Une table, pas une abstraction.
8. **L'invite vit dans le worker.** Le client décide QUELLES DONNÉES sortent, le worker CE QU'ON DEMANDE. Friction : itérer sur l'invite exige un redéploiement — **à confirmer par `narratif-ia`**.
9. **Délai** : `CopiloteService` porte son propre `AbortController` et accepte un `signal` externe.
10. **Rejouement + dégradation** : rejoué une fois puis **abandon explicite** (`{statut:'illisible'}`). En rédaction il n'existe pas de repli canonique. **À confirmer par `narratif-ia`.**
11. **Découpage** : handler dans `worker/ia.ts` NEUF ; `index.ts` gagne ~3 lignes.
12. **Relevé de parité** : 2 sites aujourd'hui, 3 après it1. À réexécuter à chaque itération.

## 6. Duplication de la source de vérité — la règle
1. Une proposition en attente est de l'**état d'écran**. Non persistée. Meurt à la navigation.
2. **Une proposition ne capture jamais le dossier** — elle capture `(role, entiteId, champ, valeur)`.
3. Le modèle ne frappe aucun identifiant.
4. **La contradiction du § 2.8 est levée ici, une fois** : « aucune création d'entité » est un garde-fou du **JEU** ; en **RÉDACTION** le modèle propose des entités **nommées et sans identifiant**, c'est le code qui crée après un geste de l'auteur.
5. **Curseurs** (position tech-lead) : proposer une valeur que l'auteur accepte en rédaction n'est pas « modifier une statistique » ; ce que la décision n° 4 interdit, c'est l'écriture par le modèle **pendant une partie**. Mais la frontière d'INJECTION ne bouge pas : les curseurs peuvent être **proposés** sans être **lus**. `stats` et `Revelation.jet` restent **hors de toute proposition**.

## 7. Lots — 2 par itération, sériels
**It1** — `1-A` contrat (worker/ia.ts, worker/index.ts, jest.config.cjs, wrangler.toml, brain/copilote/*, CopiloteService, BrainContext, brain/index.ts, **DossierEditorScreen.tsx** + son test) ; `1-B` feature (`src/features/dossier-copilote/**` + **`src/App.tsx`**). **Aucun fichier partagé.**
**It2-4** — `N-A` contrat (une entrée `ROLES_IA`, `brain/copilote/*`) ; `N-B` feature (`dossier-copilote/**` seul).

## REJETÉS
1. **Proposition en attente persistée** — second document que `validateDossier` n'a jamais vu.
2. **Diff rendu EN PLACE dans la fiche personnage / le panneau indices** — propriété exclusive de fichier (KR-200/205).
3. **`dossier-copilote` important un bloc d'édition d'une autre feature** — import inter-features.
4. **Un événement `copilote:*`** — aucun abonné ; `dossier:updated` suffit.
5. **SSE pour le copilote** — D2 réserve le flux à la narration ; une sortie structurée ne gagne rien à être diffusée.
6. **Clé d'API dans `CloudSettingsService`/`persistenceKeys.ts`** — D2 l'interdit côté client.
7. **Un assembleur général de contexte** — trois projections étroites suffisent ; la n° 10 en est propriétaire déclaré.
8. **Le modèle propose `stats` ou `Revelation.jet`** — décision n° 4 et fuite de seuil.
9. **Le modèle frappe un identifiant** — décision n° 6.
10. **Un en-tête HTTP neuf pour le rôle** — il faudrait le déclarer dans `Allow-Headers` et on l'oublierait.
11. **Rattraper les tests des routes `/kv/` ici** — dette préexistante, hors périmètre.
12. **Renvoyer au client le corps brut du fournisseur** — couple le client au fournisseur.

## Pour le tour 3
- **Budget** : la compaction de `code-knowledge.json` doit être **dans le même lot** que l'écriture de la spec.
- **Roadmap § 2, ligne n° 8** : colonne « Itér. » `3` → `4` si retenu.
- **Deux arbitrages dus à `narratif-ia`** : la dégradation = abandon explicite (§ 5.10) ; l'invite hébergée côté worker (§ 5.8).
