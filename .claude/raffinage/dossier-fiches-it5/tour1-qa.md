RISQUE — le risque majeur de cette itération vu de ton poste
Trois familles d'écriture neuves (savoirs-écran, relations, présence) partagent un seul hook déjà à 690 lignes avant toute scission (note #6). Chaque famille est une occasion de plus pour KR-197 (bandeau à double indexation) et KR-199 (nom de test plus large que ses assertions) — la feature cumule déjà 7 occurrences des deux classes en 4 itérations. Sans un test nommé PAR FAMILLE, trois écrans peuvent passer au vert en partageant silencieusement le même défaut.

OBJECTION — au moins une, sur la définition telle qu'elle est écrite
L'item 2 du cadrage fixe `Presence:{lieu_id, quand?}` mais la destination de `quand` (auteur/moteur/ia) est un `open_question` de `specification.json` explicitement assigné « à trancher au raffinage d'it5 ». Tant qu'elle n'est pas tranchée, aucun critère sur le rendu de `quand` (Field prose libre vs widget fermé) n'est observable — l'instrument à écrire dépend de la réponse.

PROPOSITION — au moins une, concrète, chiffrable
1) Un test KR-197 nommé par famille à écriture (relations, présence), sur le patron déjà en place (`panneauPersonnages.test.tsx:448`, sonde de mutation en commentaire, exécutée à la main) — pas un test générique « toutes familles ».
2) Geler les deux tests KR-197 existants (`ecriture sur DEUX personnages, aucune fuite d indexation`, `lecture au montage sur DEUX personnages, sans interaction`) comme non-régression : 0 ligne d'assertion modifiée si le hook est scindé, vérifiable en diff.
3) Trancher `presence.quand` dans ce tour, avant d'écrire le critère du bloc présence.
4) Test dédié KR-194 : seeder `cible_id === personnage.id`, asserter l'absence de refus/warning — pas seulement l'absence de garde côté code.

VERDICT — recevable sous réserve
Bloqué tant que `presence.quand` n'est pas tranché dans ce tour ; sinon un test par famille croisé KR-197/KR-199 est le prix d'entrée de cette itération.

---

ANNEXE — cas limites à couvrir
- Savoir avec `revele_si.jet` (4 portes fermées) vs savoir sans `revele_si` (widgets absents, pas vides) — critère racine #6.
- Relation auto-référentielle (`cible_id === personnage.id`) — KR-194 écrite, pas seulement documentée.
- Relation vers un `cible_id` orphelin/inexistant — référence cassée surfacée, jamais silencieuse (règle domaine CLAUDE.md).
- `intensite` aux bornes -3/+3 (acceptée) et hors bornes -4/+4 (refusée au SSOT) — symétrique de `DUREE_MIN` it4.
- `secret` coché → ligne exclue du contexte destiné au rôle non habilité ; décoché → ligne présente.
- Présence sans `lieu_id` — comportement à statuer selon la forme retenue (entrée refusée vs bloc absent).
- Deux personnages distincts par sous-section (savoirs, relations, présence testés séparément) — critère racine #11, pas un test partagé entre les trois.
- Double clic / soumission rapide sur « + Ajouter une relation » (pas de doublon).
- Liste vide de chaque sous-section au montage — état vide invitant, jamais un void.

Fichiers consultés : `src/features/dossier-fiches/specification.json`, `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` (lignes 440-509 pour l'idiome KR-197/BUG-064 déjà en place).
