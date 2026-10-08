# QA — dossier-repetition it3, tour 1

**RISQUE** — La définition de « PNJ atteint » est suspendue à une open question (parler/agir). Sans décision, le critère #8 n'est pas observable. Les cas limites (0 PNJ, tous atteints, PNJ sans presence[]) ne sont pas énumérés.

**OBJECTION**
1. Critère #8 non observable : « PNJ atteint » non défini. parler/agir ou co-présence ? Un test qui passe sur un critère flou valide le code faux.
2. État « aucun blocage » non spécifié dans le design contract.
3. « ListeConstats » et « dépliable des pas » indéfinis : in-scope it3 ou reportés ?
4. Niveau de test non nommé : #8 = unit ou component ? #12 = quel test-grep ?
5. Définition de fini incomplète (score de mutation, table dorée, régression).

**PROPOSITION**
1. Décider parler/agir AVANT raffinage.
2. Trois critères cas limites : dossier sans PNJ, tous lieux visités, PNJ sans presence[].
3. Clarifier dépliable et ListeConstats en critères distincts (ou déclarer reporté).
4. Nommer le test-grep pour KR-309.
5. Écrire la définition de fini chiffrée.

**VERDICT** — VETO. Critère #8 non observable tant que « PNJ atteint » n'est pas défini.
