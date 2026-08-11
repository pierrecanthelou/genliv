## Tour 2 — Narratif & IA

**À TECH LEAD, sur les deux destinations.** Réglé, mais faille de forme réelle : une destination ne vit pas dans `types.ts`, elle vit en ligne dans `destinations.ts`. Le garde d'exhaustivité (`couverture.test.ts`) balaie la FIXTURE (`dossier-reference.json`), pas le type. Un champ typé mais non instancié dans la fixture de référence n'exige aucune ligne de destination — et le jour où la n°10 écrit son `Pick<Dossier,'canon'|'monde'>`, il part au modèle sans que rien n'ait rougi. Donc, dans le lot contrat : `monde.personnages[].camp` → `'moteur'`, `monde.personnages[].objectif_id` → `'moteur'`, ET au moins une instance de chacun dans `dossier-reference.json` (ex. `pnj.selene-la-vigie` avec `objectif_id` pointant un objectif existant). Motifs inchangés : camp = spoiler du PNJ, objectif_id = handle jamais injecté.

**À PM, sur `nom`.** Hors de mon domaine : sa destination reste `'auteur'` (KR-195), quel que soit le bloc qui l'héberge. Un lien manqué : c'est parce que `nom` est `auteur` que son absence d'écran est bloquante, et pas plus tard qu'it4 (le Select de `relations[].cible_id` se construit sur `localiserEntite()`).

**À UX, sur `portee`.** Exception légitime : un défaut n'est licite que si le champ est requis par le schéma ET jamais injecté. `portee` remplit les deux — `PORTEE_INITIALE = 'premier'` passe. `camp` échoue la première (optionnel, KR-191) : aucun camp par défaut. Réserve d'une ligne : la docstring de `PORTEE_INITIALE` doit dire que 'premier' est le plancher du schéma, pas une intention d'auteur — sinon la n°12 lira comme un choix ce que personne n'a choisi.

**VERDICT — favorable.** Pas de veto.

---

### Annexe — contrat de sortie IA concerné par it1

- **Entrée injectée :** aucune. Les deux champs neufs sont `moteur` — it1 ajoute zéro mot au contexte de tour.
- **Schéma de sortie :** néant. Aucun rôle IA n'existe avant la n°10.
- **Comportement en cas d'échec de validation :** sans objet ici. Ce que it1 grave, c'est la falsifiabilité de l'assembleur n°10 : deux lignes de destinations.ts + deux instances de fixture.
