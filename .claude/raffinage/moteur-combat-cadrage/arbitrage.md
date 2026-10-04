# Cadrage moteur-combat (n° 13) — Arbitrage

Date : 2026-10-04. Comité : 5 rôles (pm-produit, tech-lead, ux-designer, qa, narratif-ia).

## Consensus

- Un combat = un pas d'horloge (J1, fenêtre mémoire).
- Postures = Normale/Précise/Défensive (KR-130).
- useCombat + CombatScreen supprimés (orphelins).
- Log texte jamais injecté (projection structurée).
- 3 itérations (roadmap corrigé de 2 à 3).
- Mort sans écran de fin (n° 15).
- Fuite = bouton séparé, pas une posture.

## Arbitrages

1. **R5 commentateur** (PM+TL tour 2) — NIA tour 2 retracte R5→R3 par coût. Arbitrage : R5 retenu, deux schémas sous un rôle = aiguillage caché.
2. **Rejeu pur** {monstre_ref, postures[]} (TL tour 2) — retenu, moins de feuilles, pas de snapshot.
3. **rencontre.ts dans player/engine/** (TL tour 2) — retenu, évite arc runtime brain→player.

## REJETÉ

- NIA : R3 avec tentatives:[] → aiguillage caché.
- QA : combat dans interface séparée de player/types.ts → session.ts:211 désigne le type composant.
- QA : Personnage.tier stocké → KR-192, dérivable.

## REPORTÉ

- pickMonsterPosture selon IG → pas de règle écrite.
- Écran de mort → n° 15.
- Équipement du héros → non planifié.
