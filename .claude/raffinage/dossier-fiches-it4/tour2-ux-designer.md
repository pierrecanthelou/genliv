# Tour 2 — UX Designer, `dossier-fiches` it4

**Réponse nommée — tech-lead, objection 3 (collision `portee`).** Confirmé : mon annexe tour 1 place `delai`/`portee` de `contre_mesures` « hors périmètre de ma tâche — non dessinés ici ». Aucun libellé de champ n'a été écrit pour ces deux clés. Un renommage de schéma côté tech-lead a donc **zéro impact** sur mon contrat — rien à modifier.

**Narratif-ia, point 1 (`duree`, Stepper).** Mon « DURÉE (EN TOURS) » est fautif : `docs/REGLES-DU-JEU.md` réserve « tour » au round de combat (loup géant, sorcière) — l'imposer ici crée une collision de vocabulaire, et « pas d'horloge de session » est explicitement **pas encore nommé** par n°9. Je retire « EN TOURS » et pose le libellé neutre **« DURÉE »**, sans unité dans la casse mono ; l'unité vit dans le hint : *« interne — nombre de pas d'horloge de session avant l'échéance de l'étape ; le mot est nommé par la feature n°9 »*. Stepper : min = `DUREE_MIN` (1), pas de max nommé, défaut 1.

**Narratif-ia, point 2 (`si_bloque`).** Le libellé « SI LE JOUEUR BLOQUE » tient — c'est l'inaction/le mauvais chemin du joueur qui prive le déclencheur suivant, le moteur ne fait que le mesurer. Hint durci pour nommer l'agent : *« interne — ce que joue le personnage si le moteur constate l'étape bloquée (durée écoulée sans déclencheur suivant) »*.

**Verdicts tour 1 :**
- RISQUE (avertissement D1 hors accordéon, second `role="status"` sibling) — **maintenue**, aucune objection reçue.
- OBJECTION 1 (ligne bordée `div`, pas `ListRow`) — **maintenue**.
- OBJECTION 2 (« OBJECTIF PERSONNEL » / « CE QU'IL VEUT ») — **maintenue**.
- Annexe hypothèse B (`duree` en `Field` prose) — **retirée** : narratif-ia tranche l'entier moteur, hypothèse obsolète.
