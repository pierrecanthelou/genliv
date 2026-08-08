RISQUE — Ce fichier est le premier que tout auteur recopiera, et le seul document sur lequel la n° 10 mesurera son contexte. Un mauvais exemple ne fait pas un bug : il fait vingt dossiers mal écrits, et la frontière code/IA se déplace par imitation. Les **dix** chemins de destination `ia` (relevé de `destinations.ts`) n'ont aucune borne **agrégée** : `canon` est borné par bloc, `jalons[].enonce_texte` à l'unité — mais injecté *tous ensemble*, et croissant avec la partie. Six PNJ multiplient cette surface pour la première fois. Non mesurée ici, elle se découvre en n° 10, document déjà recopié.

OBJECTION — Le critère 9 date du 2026-08-03, la décision A du 2026-08-04. Trois de ses neuf branches nomment des champs absents du schéma 1 : `antagoniste` (pas de `camp`), `relation secrète` (pas de `relations[]`), `scène figée` (pas de drapeau). C'est la purge déjà faite au raffinage d'it4, qui a retiré `relations` d'un goal au motif « 0 occurrence dans `types.ts`, donné aux n° 4-6 par la décision A ». Les tenir « par le contenu » revient à écrire la relation en clair dans `revele_comment` : référence par nom libre, illisible du linter n° 7 comme du moteur. Je refuse.

PROPOSITION —
1. `antagoniste` + `relation secrète` → **REPORT n° 4** (elle possède `camp` et `relations[].secret`), précédent it4 cité.
2. `scène figée` **reste**, reformulée mécanique : `charpente.depart.texte_ouverture_joueur` non vide **et** destination `moteur` — assertion sur la valeur (KR-174).
3. Branche neuve `budget-injectable` : mots des feuilles `ia`, walker `feuillesDeLaFixture` **importé**, plafond mesuré puis posé ; sous-total `jalons[].enonce_texte`, seule croissance monotone.
4. Le dossier de référence est **sans avertissement** : il ne peut illustrer ni savoir sans porte, ni `…_texte` sans `…_expr`.

VERDICT — **recevable sous réserve** : les trois branches purgées ou reformulées *avant* écriture du fichier.

---

### Annexe (hors quota) — contrat de sortie IA concerné

**Il n'y en a aucun, et je ne l'invente pas.** L'itération 5 ne fait aucun appel modèle : pas de schéma de sortie, pas de rejeu, pas de repli à écrire. Écrire un contrat de sortie ici serait une table sans lecteur — le motif qui a déjà fait retirer `BUDGET_CONTEXTE` en it2. Ce que cette itération fixe, en revanche, est l'**entrée injectée** de tout appel de la n° 10, parce que le dossier de référence en est le premier exemplaire complet.

**Entrée injectée — exhaustive au schéma 1**, dérivée de `DESTINATION_DES_CHAMPS[x] === 'ia'`, dix chemins, relevés dans `src/brain/dossier/destinations.ts` :

- *toujours chargé* : `canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.ton`, `canon.interdits_ton[]` — plus `charpente.jalons[].enonce_texte` des **jalons atteints seulement** ;
- *à la demande, par identifiant* : `monde.personnages[].plan_actions[].action`, `…savoirs[].indice_id`, `…savoirs[].certitude`, `…savoirs[].revele_comment` (uniquement porte ouverte), `monde.evenements[].resolutions[].resultat`.

**Jamais injecté**, et le dossier de référence doit l'illustrer sans le contredire : les six `…_expr`, les six `…_texte`, les quatre portes de `revele_si`, les quatre emplacements de `Delta`, `monstre_ref`, tous les `id`, tous les `nom`, et `charpente.depart.texte_ouverture_joueur` — scène **émise verbatim par le moteur**, pas du contexte.

**Comportement d'échec disponible aujourd'hui** (à citer tel quel dans la revue) : `validateDossier` refuse la forme ; `couverture.test.ts` fait rougir **par nom de champ** tout champ sans ligne de destination, et par valeur les `…_expr → moteur`, `…_texte → auteur`, deltas `→ moteur`. Ce qui n'existe pas, et qui doit rester écrit : **aucun instrument ne prouve qu'un champ `moteur` ou `auteur` n'atteint pas un contexte de modèle** — aucun assembleur avant la n° 10 (déjà en `open_questions`).

**Sur la question 7 (téléchargement)** : hors de mon domaine, une seule condition. L'itération qui livre l'export télécharge **le dossier**, jamais une projection « pour l'IA » ou « pour le moteur » — `brain/utils/playExport.ts` est le précédent à ne pas rejouer : un second document joué serait une seconde source de vérité que personne n'oserait couper en n° 9.
