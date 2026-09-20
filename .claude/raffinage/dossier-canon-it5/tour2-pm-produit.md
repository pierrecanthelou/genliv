# Tour 2 — pm-produit — `dossier-canon` it5 (tranche B1)

> **NOTE DE L'ORCHESTRATEUR** — cette note a été rendue **en parallèle** de celle de `narratif-ia`, qui a **retiré son veto** et **retiré sa demande de `acces[].description`**. Le veto de regroupement posé ci-dessous n'a donc plus de cible : personne ne propose plus de livrer les deux ensemble. Ce qui reste opposable est la **condition** de Q1 (pas de report flou).

## Position sur le veto de `narratif-ia`

Je ne soutiens pas le veto tel qu'écrit (un seul lot, `vers_lieu_id` + `description` ensemble), mais je ne le rejette pas sur le fond — je le fais bifurquer en deux itérations.

**Q1 — cinquième occurrence du patron rejeté (`tier` KR-192, `lie_au_canon` KR-206, `Indice.portee`, classifications `Evenement`) ?** Partiellement différent, à une condition. Les quatre précédents sont de la **métadonnée de classification** sans lecteur auteur ni lecteur machine avant une feature lointaine — un pari pur. `description` est de la **prose d'auteur** : son premier lecteur légitime, c'est l'auteur qui la relit dans sa propre fiche, indépendamment de tout consommateur IA. Ce n'est donc pas rigoureusement le même patron — **à condition que le lot qui l'introduit soit planifié immédiatement, nommé, numéroté**. Si `description` est repoussée « pour quand la n° 10 en aura besoin » sans créneau ferme, elle redevient exactement le pari des quatre précédents, et je la veto sur ce motif-là.

**Q2 — la phrase de démo survit-elle sans « et » si l'itération livre aussi une prose par arête ?** Non. « L'auteur peut relier ses lieux les uns aux autres » (2 clics) et « l'auteur peut décrire l'issue par laquelle on quitte un lieu » (2 zones de texte par passage réciproque) sont deux capacités démontrables séparément. Réunies, la phrase de démo devient composée. Signal de coupe, durci en **veto sur le regroupement**, pas sur `description` elle-même.

## Réponse nommée — objection 2 `tech-lead` / liste « ACCESSIBLE DEPUIS »

Hors périmètre de B1 — **seconde démonstration**, pas un veto de ma part. La liste en lecture seule ne donne à l'auteur aucun verbe nouveau : il peut déjà créer des culs-de-sac aujourd'hui sans elle, elle rend seulement visible un état déjà atteignable. Coût marginal faible (~12 lignes, dérivé, KR-013 respecté) — je ne m'y oppose pas dans l'absolu, mais je refuse qu'elle grossisse B1 par défaut.

## Statut de mes objections du tour 1

- **Rider `validate.ts` hors périmètre de B1** : **MAINTENUE, renforcée** par la mesure de l'orchestrateur. Les nouvelles anomalies d'`acces` portent `entityId` dès l'écriture ; les 4 sites existants + `designerSavoir` restent un lot séparé, déclenché sur `validate.ts`, jamais sur B1.
- **Nouvelle, tour 2 : regroupement `vers_lieu_id` + `description` dans le même lot** : **VETO** (phrase de démo composée).

## Découpage proposé — 2 itérations

**Itération 1 (= B1)** — *« À la fin, l'auteur peut relier un lieu à un autre lieu — ajouter, changer ou retirer un accès sortant — sans saisir de prose. »* Les 2 lots du `tech-lead`. **Hors périmètre** : `description`, liste « ACCESSIBLE DEPUIS », bouton de création réciproque, rider `validate.ts`, `atteignabilite.ts`, `condition_expr`/`cache`.

**Itération 2 (immédiatement suivante)** — *« À la fin, l'auteur peut décrire, pour chaque accès déjà posé, l'issue par laquelle on quitte le lieu. »* Champ `description`, une zone de texte par ligne d'accès. Aucun appel modèle.

Si le comité préfère les fusionner malgré mon veto, je demande l'arbitrage humain plutôt que de signer une phrase de démo composée.
