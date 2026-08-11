# Tour 1 — Narratif & IA

RISQUE. « Un identifiant est un handle technique, donc `moteur` » est **faux comme règle générale dans cette table** : `monde.personnages[].savoirs[].indice_id` y est déjà `'ia'`, parce que le protocole de révélation le fait traverser le contexte et revenir en `indices_reveles: string[]`. Poser `objectif_id: 'moteur'` en invoquant « le précédent de tout `.id` » écrirait une justification fausse à côté d'une ligne juste (KR-176) : le prochain lecteur en dérivera que `indice_id` est une exception distraite.

OBJECTION. Aucune sur le fond des deux destinations. Une sur la **création** : si « + Ajouter un personnage… » écrit dans le document un `nom` de repli (« Personnage n°3 ») ou un `camp` par défaut, deux invariants tombent — l'absent-calme (dispense `NOM_LIBRE`) et KR-191, sans quoi le « sans camp » du CA 3 devient inatteignable. Et si n°10 bascule `Entite.nom` vers `ia` (KR-195), le narrateur prononcera « Personnage n°3 ». Placeholders et repli sont du **rendu**, jamais de la donnée.

PROPOSITION.
1. `'monde.personnages[].camp': 'moteur'` — motif propre, pas emprunté : le camp est le **spoiler du PNJ**. Le rôle acteur joue des intentions (`plan_actions[].action`, `contre_mesures[].action`, déjà `ia`), jamais l'étiquette ; un traître injecté « antagoniste » se joue hostile au premier tour.
2. `'monde.personnages[].objectif_id': 'moteur'` — motif : **aucun schéma de sortie R1–R4 ne nomme cet identifiant**, et la motivation atteindra le modèle en prose (`objectif.libelle`, it3). Écrire le discriminant contre `indice_id`.
3. Création : zéro champ texte semé, `camp` absent.

VERDICT. **Favorable** aux deux destinations, sous réserve des motifs 1–3.

---

## Annexe (hors quota) — contrat de sortie IA concerné

**Néant, et c'est vérifiable, pas déclaratif.** Cette itération n'ouvre aucun appel modèle : aucune entrée injectée, aucun schéma de sortie, aucun comportement d'échec de validation à définir. Ce qu'elle engage, ce sont deux lignes d'audience qui contraindront l'assembleur n°10.

**Entrée injectée après it1 : inchangée.** Les deux champs neufs sont `moteur` ; l'ensemble injecté de `monde.personnages[]` reste exactement `plan_actions[].action`, `savoirs[].indice_id`, `savoirs[].certitude`, `savoirs[].revele_comment`. Budget de contexte par personnage : +0 mot.

**Discriminant à écrire en commentaire au-dessus de la ligne `objectif_id`** : un identifiant est `moteur` **par défaut** ; il ne devient `ia` que quand un **schéma de sortie de rôle le nomme**, comme `indice_id` que le protocole de révélation renvoie en `indices_reveles: string[]`. Aucun rôle ne renvoie un objectif rattaché.

**Porte D1 — rien à gagner, confirmé sur pièces.** `camp` est un énuméré fermé : ligne dans `ENUMERES_FERMES` avec `requis: false`, précédent exact (`savoirs[].revele_si.confiance_min`). `objectif_id` est une référence simple : ligne dans `REFERENCES_SIMPLES`, espace `objectif`, déjà au registre. Ni l'un ni l'autre n'a de jumeau `…_expr`/`…_texte`. `FAMILLES_DE_CONDITIONS` reste à cinq familles ; la sixième (`contre_mesures[]`) arrive en it3 (KR-196) — ne pas l'anticiper ici.

**Comportement en cas d'échec de validation** : `camp` hors énuméré → **bloquant** via `ENUMERES_FERMES` ; `objectif_id` pendant → **référence-pendante** via `REFERENCES_SIMPLES` ; absents tous deux → **état calme**.

**Ce que l'annexe ne prouve pas** : aucune de ces lignes ne démontre le confinement — aucun assembleur n'existe avant n°10. Elles déclarent l'intention et forcent la déclaration.
