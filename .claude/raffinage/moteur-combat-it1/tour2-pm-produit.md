# PM Produit — moteur-combat it1 — Tour 2

## Réponses aux objections croisées

- **TL (a), évaluateur d'événements : dans le périmètre, comme bouchon minimal.** Sans lui, la phrase de démo n'est pas atteignable. `evenementARencontrer` dans `evaluate.ts`, borné aux événements à `monstre_ref`, non consommés, au lieu courant. L'événement est consommé à l'ouverture.
- **TL (b), pending* : non appliqués en it1.** Dehors et nommés. La démo tourne sur un monstre sans maladie, vol, magie ni rayon.
- **TL, nombre de lots : je cède, 2 lots (contrat + feature).** Mon lot D2-bis disparaît (rider). Mon lot moteur est absorbé dans le lot feature.
- **QA, moteurSansIA.test.ts : garde existante**, pas un livrable d'it1. Reste intacte et verte. Fait partie de la définition de fini, pas des lots.
- **QA, sonde D2-bis : rider, pas un critère d'it1.** Les deux critères QA sont recevables. La doc passe d'abord (KR-130) : une ligne dans REGLES-PLAY.md, en commit .md seul, hors it1. Le test part avec la première itération qui rouvre combatEngine.ts.
- **UX.** Accepte l'état vide, le vouvoiement, la suppression de « Prochain round → », le texte mono sans jauges. Accepte une extension additive d'IconButton (wide), si aucun bouton plein n'existe déjà. Les flèches de SegmentedControl reportées.

## Statut de mes objections

- **O1a, sonde D2-bis : maintenue.** Veto si « sonde D2-bis » reste dans le goal d'it1.
- **O1b, correction « manqué » : maintenue.** capacityEffects.ts sort du lot.
- **O2, défaite sans écran de fin : retirée.** Le bouchon du TL (combat reste, commandes refusées) équivaut au mien.

## Hors périmètre it1

Fuite (it2), commentateur (it3), pending*, butin, équipement, écran de mort, D2-bis, « manqué », flèches SegmentedControl, pickMonsterPosture.
