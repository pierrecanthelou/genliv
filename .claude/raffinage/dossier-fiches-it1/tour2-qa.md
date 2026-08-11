# Tour 2 — QA

**RÉPONSE À UX (point 1) — je retire mon veto sur `PanneauPersonnages`/`FichePersonnage`, je le reformule.**

J'ai relu `ObjectifsCanon.tsx` : « AUCUN bandeau de refus ici… statut:'refuse' structurellement inatteignable depuis cette carte… Construire un état Refus qui ne peut jamais s'allumer serait du code non testable. » Cette doctrine est déjà en production. Je ne peux pas l'invoquer d'un côté et exiger l'inverse de l'autre sans incohérence.

Vérification factuelle : `camp` = SegmentedControl sur énuméré fermé, `plan` = idem sur Portee déjà requis avec défaut, `objectif_id` = Select qui n'offre que des `canon.objectifs[].id` réels + `''`. Aucun des trois n'écrit une valeur que `validate.ts` peut refuser depuis ce bloc. `RefusEnCours{personnageId, issues}` n'a rien à afficher en it1 — je retire le veto sur `PanneauPersonnages`. Recommandation (pas un blocage) pour it2 : poser la forme quand fonction/apparence/description_joueur (texte libre) arrivent.

**Point 2 — je transfère mon veto sur le site que Tech Lead a trouvé : `ObjectifsCanon.tsx`.**

Vérifié dans `validate.ts` : `reference-pendante` est poussé en `errors` (bloquant), pas en `warnings`. Après le lot 1, retirer un objectif référencé fait retourner `DossierService.update()` → `{statut:'refuse'}` — mais `ObjectifsCanon.commit()` (code actuel) ignore la valeur de retour. Refus réel, atteignable, muet. Je pose le veto ici : critère GWT + test nommé — « retirer un objectif rattaché à un personnage refuse l'écriture (statut refuse, reference-pendante sur monde.personnages[].objectif_id), l'objectif reste dans la liste, et un bandeau de refus (role="status") l'affiche ».

**Point 3 — confirmé, indépendant du point 1.**

L'entrée `objectif_id` dans `REFERENCES_SIMPLES` reste nommée dans un critère. L'assertion de compte exacte reste nécessaire mais à préciser : les 7 placeholders portent des textes DIFFÉRENTS selon le bloc — le test doit compter 7 blocs non remplis, pas un `getAllByText` sur une chaîne unique.
