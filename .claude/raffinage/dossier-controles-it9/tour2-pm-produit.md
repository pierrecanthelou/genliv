# Tour 2 — `pm-produit` · `dossier-controles` it9

**RISQUE** — Je retiens la lecture du `narratif-ia` et **je la durcis**. `contrepartie` ferme sur un jugement que le document ne permet pas : l'absence, au schéma, d'un inventaire de départ. Le cas mesuré (`lanterne-de-corvin`) n'est qu'ALERTE aujourd'hui, **mais le mécanisme est de classe BLOQUANT** — tout indice dont l'UNIQUE producteur serait un savoir gardé par `contrepartie` tomberait à zéro sur un dossier tout aussi sain. C'est exactement le défaut que mon poste protège : **une fausse déclaration d'impossibilité faite à un auteur qui n'a rien à se reprocher**.

**OBJECTION (nommée)** — à ma propre proposition (b) du tour 1 (« zéro texte neuf ») : **RETIRÉE**. `ux-designer`, `tech-lead` et `narratif-ia` convergent indépendamment, par trois chemins distincts (le texte, la docstring des six chemins, la classification du compte), vers la même conclusion vérifiée en code : réutiliser un message existant serait **FAUX** (classe BUG-088). J'adopte le troisième message de l'`ux-designer` tel quel.

**PROPOSITION** — **`contrepartie` SORT de la tranche.** it9 livre `apres_indice_id` seul, prouvé par témoins construits, sans mouvement de fixture canon — **assumé, pas caché**. `contrepartie` part en `open_questions`, **pas en itération numérotée** : la renommer « objet non donné » ne répare rien tant que le format n'a pas de notion d'inventaire de départ.

**VERDICT** — recevable, **périmètre réduit à une porte**.

---

## Statut de mes positions du tour 1

| # | Position | Statut |
|---|---|---|
| 1 | RISQUE « angle mort `donner_objet` » | Le **fait** mesuré est MAINTENU. **La conclusion que j'en tirais (« pas d'angle mort ») est RETIRÉE : elle était fausse.** L'angle mort n'est pas dans le compte des deltas, il est **dans le schéma**, qui ne sait pas écrire un départ. |
| 2 | Risque « ET sur portes multiples » | **MAINTENU**, reformulé : la clause doit être écrite dans `porteOuverte` pour ne pas être refaite le jour où une porte revient — mais elle ne se démontre plus à deux portes fermées, faute de seconde porte au périmètre. |
| 3 | OBJECTION « le message ne distingue pas la porte » | **SATISFAITE / RETIRÉE** — le troisième message y répond, vérifié contre `BlocSavoirs.tsx`. |
| 4 | PROPOSITION (a) « ET testé » | **MAINTENUE**, portée ajustée : un test de non-régression architecturale, pas une démonstration à deux portes fermées. |
| 5 | PROPOSITION (b) « zéro texte neuf » | **RETIRÉE**. |
| 6 | « Une seule itération pour les deux portes » | **RETIRÉE.** Le prix d'un faux BLOQUANT structurel dépasse le coût de séparer. |
| 7 | — | **REJETÉ : le découpage T1/T2 du `tech-lead`** tel que rédigé, qui range `contrepartie` en **premier** temps. J'inverse : `apres_indice_id` est la SEULE porte d'it9 ; `contrepartie` n'est pas un T2 à venir, **elle sort du plan entier**. |

## Réponses aux trois questions

**(a) Tranche à une porte, aucune fixture ne bouge — je la signe.** « Démontrable » ne veut pas dire « visible sur le dossier canon » : it7/it8 ont aussi démontré par construction. Le risque à nommer honnêtement : **c'est un filet dormant, pas un correctif visible**. Phrase de démo resserrée à proposer.

**(b) Fausse alerte — je tranche CONTRE le précédent d'it7, et ce n'est pas une préférence.** À it7 le narratif avait **cherché** une lecture qui sauve la fixture et n'en avait trouvé **aucune** — **preuve négative complète**, d'où « vrai positif ». Ici il a **trouvé** la lecture qui sauve le dossier (la lanterne comme bien de départ implicite, que le schéma ne sait pas écrire) — **preuve positive d'une lacune du MODÈLE, pas d'une faute de l'AUTEUR**. Le renversement de verdict suit **le renversement du type de preuve produite**, pas un choix de ma part.

Et le coût est négatif, pas nul : un `objectif-sans-chemin` déclenché sur un objet légitimement supposé en poche fait **perdre du temps à l'auteur à « réparer » ce qui n'était pas cassé**, potentiellement **en dénaturant sa fiction** (ajouter un `donner_objet` artificiel pour satisfaire l'outil).

**(c) La règle « objet non donné » — REJETÉE en l'état.** Renommer la cause et pointer l'écran Objets **ne répare rien** : `objetsDonnes` reste sous-comptée tant que le format n'a pas de notion d'inventaire de départ. **Déplacer l'écran cible déplace le faux positif, il ne le corrige pas.** Classée en `open_questions`, portée par une décision de **format** (candidate : un retour sur `dossier-format`), pas par un numéro d'itération de cette feature. Si le comité veut un filet avant cette décision, je n'accepterais qu'une version **non bloquante**, `alerte` informative — **jamais** classée `objectif-sans-chemin`/BLOQUANT tant que le schéma ne peut pas distinguer « personne ne le donne » de « l'auteur le suppose en poche ».

## Périmètre pour le plan final

**Dedans** : `apres_indice_id` seul (récursif, point fixe unique) · le troisième message de l'`ux-designer` · la correction H2/H3 · `porteOuverte` conçue pour accueillir une porte future sans réécriture.

**Dehors** : `contrepartie.objet_id` (reportée, non planifiée) · toute évaluation de `jet`/`confiance_min` · un second `ControleId` · deux passes · mémoïsation.

---

## Note de l'orchestrateur

**Le critère de (b) est la meilleure chose produite par ce tour.** Il distingue une **preuve négative complète** (« j'ai cherché la lecture qui sauve, elle n'existe pas » → vrai positif, it7) d'une **preuve positive d'une lacune du modèle** (« la lecture qui sauve existe, le schéma ne sait pas l'écrire » → faux positif, it9). Ce n'est pas un arbitrage de goût, et il est réutilisable par les itérations suivantes.

**Le durcissement du risque est juste et personne ne l'avait posé** : le cas mesuré n'est qu'une alerte, mais le mécanisme est de classe bloquante. On ne juge pas une règle sur l'échantillon qu'on a sous la main.

**Trois retraits volontaires** dans cette note, dont un où le PM déclare fausse sa propre conclusion du tour 1.
