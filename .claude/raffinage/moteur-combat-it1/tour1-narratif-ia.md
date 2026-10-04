# Narratif & IA — moteur-combat it1 — Tour 1

## RISQUE

Faible. It1 est pure mécanique, zéro appel modèle. L'invariant tient : l'IA ne touche ni aux dés, ni aux stats, ni à l'inventaire. Le RNG est injecté via creerRng(graine, 'combat', tour), déterministe et rejouable. KR-294 sanctuarise le log mécanique hors de tout contexte de modèle.

## OBJECTION

**Le plan d'itération ne nomme pas de lot contrat.** Il consomme pourtant au moins trois fichiers de brain/dossier/ : alea.ts (DomaineAlea += 'combat'), session.ts (EtatSession.combat), sessionDestinations.ts (audiences des feuilles combat). Les n° 11 et n° 12 ont ouvert un lot contrat pour des changements équivalents sur EtatSession. La Décision A dit « toute tranche qui touche le schéma ».

## PROPOSITION

Scinder it1 : contrat d'abord (DomaineAlea, EtatSession.combat, sessionDestinations, RefusCommande 'combat_en_cours'), feature ensuite (rencontre.ts, UI postures, log mécanique, tests). Même bump, même itération — deux lots dans la même passe.

## VERDICT

**Pas de veto.** La frontière code/IA est intacte. Le rejeu pur {monstre_ref, postures[]} évite tout snapshot vieillissant. Un combat = un pas d'horloge (KR-295), aucune croissance de contexte par round. Les identifiants sont stables.

Sur la correction « manqué » : pas de risque. Les deux usages désignent le même fait — aucun dégât infligé. Le log n'est jamais injecté (KR-294). Pas d'action à prendre.

## ANNEXE — Contrat de sortie IA

Il n'y en a pas en it1. Aucune sortie modèle n'est produite ni consommée. Le contrat du R5 commentateur (it3) est déjà esquissé dans la spec.
