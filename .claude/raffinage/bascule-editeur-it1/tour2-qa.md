# Tour 2 — QA

```
RISQUE      — Résiduel, pas nouveau : supprimer library.test.tsx (16 tests) et selectVisibleBooks.test.ts sans un compte AVANT/APRÈS écrit rendrait la perte de couverture aussi silencieuse qu'une classification absente — même défaut visé en tour 1, sous une autre forme.

OBJECTION   — Réponse nommée à mon objection de tour 1 : le lot 2 du tech-lead (fichiers D explicites pour BookCard/DeleteBookDialog/useLibrary/selectVisibleBooks + leurs tests) répond à l'orphelinage de search/tri/sync-chip — CONFIRMÉ, à une condition : la revue d'itération consigne le compte de tests avant/après, même patron que le gel de tree-canvas au cadrage (« compte de suites/tests figé avant/après »). Sans ce chiffre écrit, une suppression « propre » reste une suppression tue.

PROPOSITION —
1. AVANT/APRÈS obligatoire au § 7 : 16/0 sur library.test.tsx (compté), + le compte équivalent de selectVisibleBooks.test.ts.
2. Confirmé : mes deux tests rejoignent DossierService.test.ts (fichier unique, lot 1) — « importDossier refuse une clé occupée par un invalide, jamais écrasée » / « remove() retire la clé puis émet dossier:deleted, ordre observé ».
3. Dette CloudSyncService.remove() : un test d'épinglage, pas une ligne — aucun test existant (deleteBook non plus) ne verrouille ce silence ; DossierService.remove() en est le premier appelant réel qui le rend visible (logique KR-179). Un test unique, dans DossierService.test.ts, pin le comportement actuel.
4. 5e critère PM : niveau composant, dans library.test.tsx (ou son successeur) — « BookService.listBooks().length>0 && DossierService.list().length===0 » affiche le texte nommant les livres invisibles ; assertion sur le texte rendu, pas sur les comptes (déjà couverts par 1).

VERDICT     — recevable sous réserve (AVANT/APRÈS écrit + test d'épinglage CloudSyncService.remove()).
```
