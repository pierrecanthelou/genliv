# Tour 2 — PM Produit

RÉPONSE À QA — objection recevable, et je la fais mienne : mon critère #1 (« BUG-048 fermé ») couplait sans le dire deux preuves distinctes — la visibilité `lisible:false` dans `list()` (surface auteur) et le vrai correctif KR-179 dans `importDossier` (constat par clé, pas par validité). Les deux sont dus. Je fais des deux tests nommés de QA une condition de clôture du critère #1, pas une amélioration optionnelle : sans eux, BUG-048 reste ouvert malgré une liste qui s'affiche correctement.

RÉPONSE À UX — confirmé : `DossierResume` (brain_contracts de la spec) n'a que `{id, titre, updatedAt, lisible}`, aucun compteur caché. Carte titre + date, pas de stats. Accord total sur le retrait de « + Nouveau livre ».

MON OBJECTION (tour 1) — le silence fait aux `Book` existants : MAINTENUE, non durcie. Le tech-lead la classe « à écrire au CHANGELOG » ; j'exige qu'elle soit aussi visible à l'écran, à coût nul — une ligne conditionnelle dans `LibraryScreen.tsx`, déjà dans son lot 2, zéro nouveau lot, zéro nouvelle méthode. Ce n'est pas de la documentation : un auteur qui perd de vue son livre sans explication est une perte de valeur, même si rien n'est supprimé en stockage.

SUR LE DÉCOUPAGE TECH-LEAD (2 lots) — rien à objecter, ≤4 lots respecté ; je note comme garde-fou (pas réserve) que le lot 1 sans écran ne ship jamais seul — un PATCH, un stop, les deux lots au même commit.

SUR OPTION (a) — retenue, aucun angle mort : `createEntry` optionnel plutôt que supprimé évite un re-churn d'API en it2.

VERDICT — recevable sous réserve : critère #1 renforcé (2 tests QA + ligne Books-disparus, dans le lot 2), sinon veto maintenu sur ce seul point.
