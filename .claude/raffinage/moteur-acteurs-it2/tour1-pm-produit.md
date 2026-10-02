# Raffinage `moteur-acteurs` it2 — Tour 1 — PM Produit

## RISQUE
Rejouer BUG-142 à l'identique, côté carnet cette fois : le `design_contract` décrit `CarnetIndices.tsx` et son déclencheur 🗝, mais aucun des « fichiers probables » ne nomme QUI le monte dans l'arbre de rendu (`EcranPartie.tsx` ?) ni où vit le bouton — exactement le trou de découpage que le RETOUR-COMITÉ d'it1 (`.claude/raffinage/moteur-acteurs-it1.revue.md`) demande explicitement de fermer pour cette itération précise : « le carnet d'indices introduit sa propre surface d'affichage neuve — à vérifier qu'elle est bien dans la liste d'un lot ».

## OBJECTION
Le goal écrit « un objet à donner ». Ce verbe actif n'existe nulle part dans les fichiers probables : aucune commande `donner`, aucune nouvelle entrée `COMMANDES`. Or `possede_objet` (simple possession, `predicates.ts`) répond déjà au besoin — si `contrepartie` s'évalue par possession passive, la formulation induit en erreur et un ouvrier pourrait construire un verbe `donner <objet> à <pnj>` hors périmètre : nouvelle commande, nouvelle surface, lots en plus, et une seconde porte d'entrée que les `resolved_decisions` d'it1 n'ont jamais prévue (`parler` seul).

## PROPOSITION
(1) Réécrire le goal : « …reste muet tant que le joueur ne possède pas déjà l'objet exigé » — `possede_objet` seul lit la porte, zéro nouveau verbe. `consomme:true` ⇒ `retirer_objet` (delta déjà au registre) entre dans le même évaluateur, coût marginal nul.
(2) Lot explicite listant le fichier qui monte `CarnetIndices.tsx` et son bouton — condition bloquante avant essaim, pas une mention au seul `design_contract`.
(3) Porter le savoir conjonctif par Harek (déjà `presence`, déjà démo it1) plutôt qu'un nouveau PNJ — réduit le lot fixture. Ce que je retire en échange : aucune mention d'un verbe `donner` dans aucun lot, nulle part.

## VERDICT
Recevable sous réserve — les deux clarifications (mécanisme passif de `contrepartie`, propriétaire nommé du montage carnet) entrent au plan avant essaim, sinon veto (répétition directe de BUG-142).

---

## ANNEXE — décisions prises en autonomie faute de spécification écrite (hors quota)

- **Mécanisme de `contrepartie`** (don actif mimé par un geste joueur, vs simple possession testée par le moteur) → j'ai choisi : possession passive via `possede_objet` (predicate existant) → coût si l'inverse est vrai (don actif requis) : un verbe `donner <objet> à <pnj>` neuf entre dans `COMMANDES`, avec sa propre garde structurelle et sa propre surface, ce qui casse le plafond de 4 lots et la règle « une seule porte d'entrée nouvelle par itération ».
- **Propriétaire du montage de `CarnetIndices.tsx`** dans l'arbre → j'ai présumé `EcranPartie.tsx`, précédent direct de `PlayerInputBar.tsx`/`EcranPartie.tsx` corrigés hors-lot en it1 pour l'entête de réplique → coût si c'est un autre composant parent : nul en soi tant que le plan le nomme explicitement dans un lot ; le vrai coût est que PERSONNE ne le nomme, ce qui reproduit BUG-142.
- **PNJ porteur du savoir conjonctif de la démo** → j'ai proposé de réutiliser Harek (déjà `presence` au Foyer du Guet, déjà démo it1) plutôt qu'un nouveau PNJ → coût si l'inverse (nouveau PNJ créé) : fixture légèrement plus grosse, aucun blocage réel, juste un walking skeleton moins minimal.
- **Portée de `contrepartie.consomme:true`** dans l'évaluateur it2 (fait disparaître l'objet de l'inventaire au moment de la révélation, ou reporté) → j'ai choisi : inclus, car il réutilise `retirer_objet` déjà au registre, coût marginal nul → coût si reporté : le champ `consomme` resterait posé par l'auteur mais jamais appliqué par le moteur — une porte à moitié câblée, à documenter en `open_questions` si c'est l'option retenue par le comité.

## Fichiers lus
`src/features/moteur-acteurs/specification.json` ; `.claude/raffinage/moteur-acteurs-it1.revue.md` ; `src/brain/dossier/types.ts` (interface `Revelation` l.536-563 ; `Savoir.revele_si`/`revele_comment` l.565-594) ; `src/brain/dossier/destinations.ts` (audience des portes de `revele_si`, l.279-302) ; `src/brain/dossier/predicates.ts` (registre `PREDICATES`, confirme `possede_objet`/`indice_connu` déjà existants) ; `src/brain/dossier/deltas.ts` (registre `DELTAS`, confirme `reveler_indice`/`retirer_objet` déjà existants) ; `src/brain/dossier/evaluate.ts` (évaluateur bivalent déjà en place pour les jalons, aucun équivalent encore pour `Revelation`) ; `src/brain/dossier/__fixtures__/dossier-reference.json` (Mira = confiance_min+apres_indice_id sans presence ; Tobin = contrepartie seule sans presence ; Harek = jet seul avec presence — aucun PNJ atteignable ne porte aujourd'hui une conjonction contrepartie+apres_indice_id).
