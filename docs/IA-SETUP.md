# IA-SETUP — rendre l'IA fonctionnelle

Ce runbook explique comment activer les fonctions IA de l'éditeur (le « copilote de rédaction », et bientôt le moteur de jeu). Il ne documente **pas** un choix entre Cloudflare et une clé API Claude — les deux sont nécessaires, chacun avec un rôle distinct :

```
Navigateur (éditeur)  →  Worker Cloudflare (POST /ia/:role)  →  API Anthropic (Claude)
     aucune clé              détient la clé API                 exécute le modèle
```

Le navigateur ne connaît **jamais** la clé API Claude. Il ne connaît que l'URL de votre worker déployé et une clé de synchronisation personnelle. C'est le worker, déployé sur votre compte Cloudflare, qui détient la clé API et qui appelle Claude — c'est aussi lui qui protège votre facturation Anthropic (KR-236 : « le client décide quelles données sortent, le worker décide ce qu'on demande »).

Le même worker sert aussi la synchronisation cloud de vos dossiers d'aventure (route `/kv/:key`) — c'est un seul et même déploiement pour les deux usages.

## 1 — Prérequis

- Un compte Cloudflare (gratuit suffit pour commencer).
- [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) installé et authentifié :
  ```
  npm install -g wrangler
  wrangler login
  ```
- Une clé API Anthropic — créez-la sur [console.anthropic.com](https://console.anthropic.com/) → **API Keys**. Le compte doit avoir de quoi facturer les appels (Claude n'est pas gratuit au-delà d'un éventuel crédit d'essai).

## 2 — Déployer le worker

Le worker est à la racine du dépôt (`worker/index.ts`), configuré par `wrangler.toml`. Il utilise déjà un espace KV nommé `GENLIV_KV` pour la synchronisation cloud :

```toml
[[kv_namespaces]]
binding = "GENLIV_KV"
id = "279136ba55ae4f6d8fedb6c22c38bc47"
```

<!-- À vérifier : cet id de namespace KV est celui déjà présent dans wrangler.toml au moment de l'écriture de ce document. Si vous déployez sous votre propre compte Cloudflare, cet id appartient à un AUTRE compte et ne fonctionnera pas chez vous. -->

Si vous déployez sous votre propre compte, créez votre propre espace KV et remplacez l'`id` :

```
npx wrangler kv:namespace create GENLIV_KV
```

Recopiez l'`id` renvoyé dans `wrangler.toml`, puis déployez :

```
npx wrangler deploy
```

<!-- À vérifier : le dépôt ne définit aucun script npm dédié ("wrangler deploy"/"wrangler dev" n'apparaissent pas dans package.json au moment de l'écriture) — la commande ci-dessus s'exécute directement via npx. -->

La sortie de `wrangler deploy` donne l'URL de votre worker, de la forme `https://genliv.<votre-sous-domaine>.workers.dev` — gardez-la, elle sert à l'étape 6.

## 3 — Configurer les secrets IA

Trois secrets d'environnement, **jamais** posés en clair dans `wrangler.toml`, jamais transmis au navigateur, jamais renvoyés dans une réponse (ce sont les seuls réglages qui rendent la route `POST /ia/:role` fonctionnelle — `worker/index.ts` refuse avec un `503` tant que l'un des trois manque) :

```
npx wrangler secret put IA_API_KEY
```
→ collez votre clé API Anthropic (celle créée à l'étape 1).

```
npx wrangler secret put IA_BASE_URL
```
→ `https://api.anthropic.com/v1/messages`

```
npx wrangler secret put IA_MODEL
```
→ un identifiant de modèle Claude valide, par exemple `claude-sonnet-5` (voir la liste à jour dans la console Anthropic ou la doc `claude-api`).

Le protocole amont est **épinglé** à l'API Messages d'Anthropic (version `2023-06-01`, en-têtes `x-api-key` + `anthropic-version`, enveloppe `{model, max_tokens, system, messages}`) — `IA_BASE_URL` doit donc pointer vers un point de terminaison compatible avec ce protocole. Ce n'est **pas** un fournisseur interchangeable : ne pointez pas vers Cloudflare Workers AI ou un autre fournisseur, leur format de requête/réponse diffère et le worker ne le comprendrait pas.

## 4 — Dev local (optionnel)

<!-- À vérifier : aucun fichier .dev.vars ni .dev.vars.example n'existe dans le dépôt au moment de l'écriture. wrangler charge automatiquement un fichier .dev.vars s'il est présent à la racine de worker/ ou du projet — ce fichier n'est PAS commité (à ajouter à .gitignore). -->

Pour tester le worker en local sans toucher au déploiement de production, créez un fichier `.dev.vars` (non versionné) à côté de `wrangler.toml` :

```
IA_API_KEY=sk-ant-...
IA_BASE_URL=https://api.anthropic.com/v1/messages
IA_MODEL=claude-sonnet-5
```

puis lancez :

```
npx wrangler dev
```

## 5 — Côté client : brancher l'éditeur sur votre worker

Dans l'éditeur, ouvrez la modale **« Synchronisation Cloudflare »** (`CloudSyncSettings`, `src/features/cloud-sync/components/CloudSyncSettings.tsx`) et renseignez :

- **URL du worker** : celle obtenue à l'étape 2 (`https://genliv.<votre-sous-domaine>.workers.dev`).
- **Clé de synchronisation** : une clé que **vous choisissez** (bouton « Générer une clé » disponible) — elle n'est enregistrée nulle part côté serveur, elle sert uniquement de préfixe d'espace de noms dans le KV partagé. Conservez-la : vous en aurez besoin sur chaque appareil pour retrouver vos dossiers.

Ces deux valeurs sont stockées localement sur l'appareil (jamais synchronisées elles-mêmes, KR-114) et lues par `CopiloteService.estDisponible()` avant tout appel IA. Sans elles, le copilote de rédaction reste inactif — sans erreur bloquante, simplement indisponible.

## 6 — Vérifier que ça marche

Un appel direct à la route, avec un rôle réellement défini par le worker (`INVITES`, `worker/index.ts`) :

```
curl -X POST https://genliv.<votre-sous-domaine>.workers.dev/ia/personnage-prose \
  -H "Content-Type: application/json" \
  -H "X-Sync-Key: une-cle-de-test" \
  -d '{"contexte":"test"}'
```

Une configuration correcte renvoie `200` avec un JSON produit par le modèle. Si vous obtenez `503 {"erreur":"non-configure"}`, l'un des trois secrets IA manque encore — revérifiez l'étape 3 (`npx wrangler secret list` liste les secrets posés, sans révéler leur valeur).

## 7 — Dépannage

| Code | Cause | Correctif |
|---|---|---|
| `405` | Méthode autre que `POST` sur `/ia/:role` | Vérifiez votre client HTTP |
| `404` `{"erreur":"role-inconnu"}` | Le rôle dans l'URL n'existe pas dans `INVITES` | Vérifiez l'orthographe du rôle (`personnage-prose`, `indice-detenteurs`, …) |
| `503` `{"erreur":"non-configure"}` | `IA_API_KEY`, `IA_BASE_URL` ou `IA_MODEL` manque | `npx wrangler secret put <NOM>` (étape 3) |
| `413` `{"erreur":"trop-grand", ...}` | Corps de requête au-delà de la limite (53 248 octets) | Réduisez le contexte envoyé — ce plafond protège le budget modèle, pas la bande passante |
| `400` `{"erreur":"corps-illisible"}` | JSON invalide dans le corps | Vérifiez l'encodage de la requête |
| `502` `{"erreur":"amont"}` | L'appel à l'API Anthropic a échoué (clé invalide, modèle inconnu, panne réseau côté Anthropic) | Vérifiez la validité de `IA_API_KEY` et le nom exact de `IA_MODEL` |
| `400` sur `/kv/:key` | En-tête `X-Sync-Key` absent ou hors Latin-1 | Vérifiez que le client envoie bien cet en-tête |

## 8 — Et pour la suite (moteur-interprete)

Cette configuration prépare aussi l'infrastructure requise par la feature **`moteur-interprete`** (n°10, en cours de construction), qui ajoute un rôle `'interprete'` (puis `'narrateur'` en it2) à cette même route `POST /ia/:role`. Aucune configuration supplémentaire ne sera nécessaire pour ces rôles futurs — ils passeront par le même worker, les mêmes trois secrets, une fois codés.
