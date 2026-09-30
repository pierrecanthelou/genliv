# Tour 1 — PM Produit — moteur-interprete it4

## RISQUE
Le goal cite au mot près le §2.8 n°4 du plan de cible (« affiché en mode auteur »), alors que `design_contract.degradation` a déjà tranché « SILENCIEUSE, aucun message affiché ». Si cette contradiction reste implicite, un rôle du comité va la lire comme une exigence d'indicateur visible — nouvelle surface d'écran, donc une SECONDE tranche verticale sous couvert d'une seule itération. Risque secondaire : l'AC « suggestions retirées d'abord » désigne un champ de SORTIE (`suggestions[]`, produit par R3) alors que le budget mesuré est celui du CONTEXTE D'ENTRÉE (`BUDGET_CARACTERES_NARRATEUR`) — si ce flou n'est pas fermé, le lot peut dériver vers une modification du schéma `SortieNarrateur`/de l'invite, hors du strict assemblage de contexte.

## OBJECTION (maintenue en tour 1)
Refus que l'itération avance sans que « hors périmètre » nomme explicitement : aucun indicateur de plafond affiché en mode auteur — le §2.8 est une citation de justification du garde-fou, pas une commande d'écran pour cette itération ; question ouverte, propriétaire non assigné aujourd'hui.

## PROPOSITION
1. Hors périmètre écrit noir sur blanc : affichage du plafond, scission de `controles.ts`, toute UI nouvelle (aucun fichier de `play-mode/components/` autre que ceux déjà en place).
2. « suggestions retirées d'abord » = ne plus les DEMANDER au modèle (allège l'invite/le budget de sortie), jamais une refonte de `SortieNarrateur` — à confirmer tech-lead.
3. Le tri de « EN SA POSSESSION » réutilise l'ordre déjà stocké de l'inventaire, sans inventer une politique de tri neuve ; à défaut d'ordre, dégrader le bloc entier plutôt que de spécifier un classement.

Le goal (une phrase, sans « et ») tient : « l'auteur lit un récit plus court plutôt que d'attendre indéfiniment, une fois le budget par pas dépassé. »

## VERDICT
Pas de veto à ce stade — tranche encore dans le tuyau existant (narrateur.ts + constante brain/ + orchestration), plausiblement 2 lots. **Veto DURCI** si un rôle propose un indicateur visible « mode auteur » ou une politique de tri d'inventaire neuve : chacun serait une tranche à part, pas it4.

---

Note complémentaire (hors format imposé) : fichiers lus — `src/features/moteur-interprete/specification.json` (plan.goal it4, acceptance_criteria #9, resolved_decisions KR-261/268/271/272, open_questions), `docs/ROADMAP-BASCULE-IA.md` (§3 ligne n°10, §2bis dette « scission de controles.ts »), `src/brain/copilote/contexte/narrateur.ts` (lignes 1-190, 340-454).
