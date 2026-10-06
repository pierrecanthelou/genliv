## NIA — moteur-horloge it4 — tour 2

### Réponses nommées

1. **Extinction `>=` (TL) : ACCORD, je retire `===`.** L'extinction efface l'état (`climat_actif` supprimé), donc `>=` ne répète jamais. Le blocage ne fait que constater (écrire une ligne de journal), d'où le `===` là-bas. Deux sémantiques différentes, deux gardes différentes.
2. **Nom du champ : `depuis` (TL) : ACCORD, je retire `tour_activation`.** Précédent `etape_plan.depuis`. `{id, depuis}` rend « id sans pas » irreprésentable — l'exigence (c) de mon tour 1 est tenue par construction.
3. **R3 manifestation : ACCORD hors it4.** Le bloc CLIMAT (position après ICI A1, avant CE PAS) est reporté. La frontière est nette : `manifestation` reste `'ia'` dans destinations, le bandeau n'y touche pas.
4. **TL question deltas dans CE PAS : ACCORD.** Les deltas de la ligne d'activation entrent dans CE PAS via `narrateur.ts:655` (sans fichier touché en it4). Précédent jalons. C'est voulu : un delta est un fait du monde, il se lit dans le pas qui l'a causé.

### Mes objections

- **Bloc CLIMAT séparé : REPORTÉ.** Hors it4 (R3).
- **`nom` bandeau UI-seul : MAINTENUE.** Le `nom` est lisible par le composant bandeau, jamais par un assembleur de contexte. La destination `'auteur'` suffit, pas de garde supplémentaire.
- **Activation écrit id + depuis ensemble : TENUE par construction** (`{id, depuis}` est atomique).

### Budget contexte

Pas de changement de palier. Les deltas entrent dans CE PAS via le narrateur existant (+149 caractères, palier 8000 intact).

**VERDICT** : recevable, aucun veto. R3 reporté, `>=` adopté, `depuis` adopté.
