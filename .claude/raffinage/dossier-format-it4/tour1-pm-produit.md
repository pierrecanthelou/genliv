# Tour 1 — PM Produit · `dossier-format` it4

**RISQUE** — vu de mon poste (l'auteur), le risque est que la phrase de démo « voir refusé un effet qui pointe une entité inexistante » — nette, sans « et » — se fasse discrètement élargir par l'énumération qui suit dans le goal. Si un ouvrier lit `relations, presences, acces, mene_a` comme périmètre de code, il invente une forme dans `personnages`/`lieux` avant leur feature éditrice, exactement la dette (« forme sans producteur ni consommateur ») que la décision A a déjà sanctionnée deux fois.

**OBJECTION** — le goal tel qu'écrit **rouvre la décision A** du 2026-08-04. `relations`, `presences`, `acces`, `mene_a` n'existent nulle part dans `types.ts` : leurs racines (`personnages`, `lieux`) sont explicitement données à n° 4 et n° 5 (« chaque racine reçoit sa forme complète dans la feature qui l'édite »). `dossier-format` ne les possède pas et ne doit pas les faire apparaître, même en commentaire d'intégrité référentielle, avant que leur forme existe. C'est une réouverture de décision actée, **matière à veto sur mon terrain**.

**PROPOSITION** — corriger le goal en gardant la démo intacte : « Étoffe le registre DELTAS depuis l'inventaire du runtime joueur, ferme l'intégrité référentielle sur `monstre_ref` (déjà résolu, à ne pas re-livrer) et sur les trois champs réellement ouverts (`savoirs[].indice_id`, `revele_si.contrepartie.objet_id`, `revele_si.apres_indice_id`), et corrige BUG-050. » Je retire `relations, presences, acces, mene_a` de la définition — reportés tels quels à n° 4 / n° 5 / n° 9, comme `contre_mesures[]` l'a été en it3.

**VERDICT** — recevable sous réserve : correction du texte du goal avant tout lot.
