# Tour 1 — `pm-produit` · `dossier-controles` it9 (« la porte d'un savoir est infranchissable »)

**RISQUE** — Le risque nommé par le cadrage est réel : sous `objectif-sans-chemin` (BLOQUANTE), un producteur retiré à tort dit « ton objectif est impossible » à un auteur dont l'objectif est jouable. **Mais ce risque est structurellement contenu, pas ouvert** : `apres_indice_id` ne ferme QUE si l'indice cible n'entre JAMAIS dans `indicesProduits` au point fixe (une nécessité GLOBALE sur tout le dossier, pas une absence locale) ; `contrepartie.objet_id` ne ferme QUE si AUCUN delta `donner_objet` du dossier ne distribue cet objet — **aucun inventaire de départ n'existe au schéma, donc `donner_objet` est la SEULE porte d'entrée d'un objet, pas d'angle mort**. Les deux sont des « jamais » vrais sur un document statique.

**Le risque résiduel propre à cette itération** : un savoir portant **PLUSIEURS portes à la fois** (ex. `contrepartie` fermée + `jet` laissé ouvert). Rien dans le cadrage ne dit explicitement que la fermeture d'UNE porte suffit à fermer tout `revele_si` (logique **ET** sur les portes PRÉSENTES). Un ouvrier qui manquerait ce cas laisse un producteur fantôme vivant — exactement le défaut que l'itération corrige.

**OBJECTION** — Le goal resserré ne dit pas si le message distingue la porte en cause (`apres_indice_id` vs `contrepartie`) : sans ça, l'auteur voit « indice non produit » sans savoir quoi réparer dans la fiche du savoir.

**PROPOSITION** — (a) le plan écrit explicitement le **ET sur les portes présentes** d'un même `revele_si`, avec un test à deux portes sur le même savoir (une fermée, une ouverte) ; (b) le message réutilise tel quel le dispositif d'it6/it7 (nomme l'indice ou la feuille fautive, pas la porte) — **zéro texte neuf à inventer**, ce qui garde le lot petit.

**Réponses aux trois questions posées**
- **Ce que l'auteur gagne** : un vrai signal. Un producteur fantôme derrière une porte typée ou mal référencée cessait d'être détecté, et ce défaut **existe déjà réellement** (précédent `dossier-reference.json`, it7).
- **Le prix du faux positif** est justifié **SI** le ET ci-dessus est testé.
- **Deux portes ou une ?** Une seule itération suffit, même logique que « six chemins en union » d'it3 : même règle « ce producteur est-il réel », deux sources techniques de fermeture, une seule démonstration.

**VERDICT** — recevable sous réserve (le ET sur portes multiples doit être écrit ET testé explicitement dans le plan).

---

## Note de l'orchestrateur

**Affirmation vérifiée, et elle est décisive** : `Depart` (`types.ts`) ne porte que `lieu_id` et `texte_ouverture_joueur` ; aucun `inventaire`, `objets_depart` ou équivalent n'existe dans le schéma. **`donner_objet` est bien la seule porte d'entrée d'un objet** — c'est ce qui rend la fermeture de `contrepartie` sûre, et c'est le motif à écrire au plan plutôt qu'à supposer.

**Trou réel dans mon cadrage** : je n'avais pas spécifié la composition des portes d'un même `revele_si`. `Revelation` porte quatre champs optionnels ; une porte fermée parmi plusieurs suffit-elle ? À trancher au plan, et à tester.
