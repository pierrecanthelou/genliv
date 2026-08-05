# Tour 2 — `pm-produit` · `dossier-format` it2

## Réponses nommées

**À `narratif-ia` (`Revelation`).** Je concède la **forme** : `contrepartie: { objet_id, consomme }` et `certitude` obligatoire sur `Savoir` sont des changements de type, quasi gratuits, et corrects au sens de la décision A — les laisser en prose maintenant coûterait une migration cassante une fois n° 4 en production. Mais l'irréversibilité que tu invoques ne s'étend **pas** à ton annexe B : `etatPorte()`, le rejeu unique, le clamp interdit sur `delta_confiance` — c'est le protocole d'assemblage de n° 9-12, qui exige une `session` que rien en it2 ne construit. **Accepter la forme, refuser le protocole** : le lot reste un contrat de types, pas une préfiguration de l'orchestrateur.

**À `tech-lead` (lot unique).** Ce n'est **pas** la coupe horizontale interdite : la démo se rejoue à travers l'écran existant (`ImportDossierDialog` → `IssueList`, générique depuis it1), donc l'itération traverse bien écran + `brain/` — elle ne crée simplement pas de fichier neuf côté feature parce que **la surface est déjà data-driven**. Un lot `contrat` seul est recevable **à condition que la phrase de démo redevienne une catégorie de comportement, pas une liste de six**.

## Statut de mes objections

| # | Statut |
|---|---|
| Sortir le point 2 (`Revelation`) | **RETIRÉE** — la forme resserrée est bon marché ; **mais DURCIE EN VETO partiel** : le protocole d'assemblage (annexe B) reste hors it2 |
| Sortir le point 3 (deltas typés) | **RETIRÉE** — mécanique pure, zéro prose ; mon inquiétude « pas de feature propriétaire » ne tient pas pour une structure sans contenu auteur |
| Compter `meta` parmi les six | **RETIRÉE** — devient un `resolved_decision` (« pas une racine »), pas un test à livrer |
| `ProjectionCharpente` complète en it2 | **DURCIE EN VETO** — dépend de `session`, n'appartient pas à it2. Seul `jalons[].enonce_texte` reste |
| Bornes de contexte | `CONFIANCE_MIN/MAX` **IN** ; `MAX_SAVOIRS_PAR_PNJ` et `BUDGET_CONTEXTE` **hors périmètre**, différés à n° 4 / n° 9 |

## Phrase de démo et périmètre

« **L'auteur peut voir refusé un dossier dont une donnée mécanique — référence de monstre, delta, ou porte de révélation — est mal formée.** »

**Dans it2** : points 1, 2 (type seul), 3, 4, `enonce_texte`, `DESTINATION_DES_CHAMPS`.
**Hors périmètre** : protocole `Revelation` (n° 9-12) · `ProjectionCharpente` fonction/type (n° 9) · `meta` (décision actée, pas code) · bornes d'ergonomie de rédaction (n° 4).
