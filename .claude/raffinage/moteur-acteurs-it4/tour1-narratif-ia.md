# Narratif & IA — moteur-acteurs it4, tour 1

**RISQUE** — R4 voit pour la première fois un savoir fermé. Aujourd'hui l'étanchéité est structurelle : un savoir fermé est absent du contexte (`acteur.ts:37`). Si le « signal » porte `formulation_joueur`, R4 peut l'écrire dans `enjeu_reussite` (affiché AVANT le dé) ou dans une réplique simple — le secret fuit quel que soit le jet.

**OBJECTION**
1. **VETO conditionnel** — Le catalogue inclut le savoir mais rien n'oblige R4 à le citer. Un jet gagné peut n'ouvrir rien : le modèle annule l'issue du dé.
2. `resiste` ne désigne aucun savoir. Avec deux savoirs gardés, quel `{carac, tc}` le moteur lit-il ? Sans savoir gardé ou sans héros, la carte est irrésoluble.
3. `REGLES-DU-JEU.md` § 6 ne dit rien du jet : re-tentative, XP, condition « seule porte restante ». Si ce n'est pas écrit, ça finira dans l'invite : règle dupliquée.

**PROPOSITION**
- Bloc `CE QUE TU GARDES` : au plus 1 ligne, texte constant du code, sans aucune prose d'auteur. `resiste` n'est légal que si ce bloc est présent. Test d'assembleur : ni `formulation_joueur`, ni `revele_comment`, ni `verite` du savoir gardé ne figurent dans l'appel 1.
- Un seul savoir mis en jeu par appel : le premier de la fiche dont `jet` est la seule porte encore fermée, héros présent.
- La réussite = fait moteur persistant dans `EtatPnj` (champ optionnel, audience `moteur`), lu par `portesOuvertes`. Non re-dérivable : `issueDuJet` lit les caracs courantes.
- Appel 2 : `resiste` refusé. Ligne d'issue écrite par le code (« Tu cèdes » / « Tu tiens bon »), jamais via `AMORCE_ISSUE`. Rang dû exigé dans `indices_reveles`.
- Budget : +120 caractères max, blocs mutuellement exclusifs.

**VERDICT** — Recevable sous réserve. L'objection 1 devient un **veto** si elle n'est pas levée (le catalogue doit rendre la révélation obligatoire, pas optionnelle).

---

## ANNEXE — contrat IA du jet de dialogue

### Frontière code / IA

| Étape | Qui décide | Qui raconte | Qui persiste |
|---|---|---|---|
| Quel savoir peut être mis en jeu | code (`revelation.ts`) | — | rien |
| Résister ou répondre | R4, mais seulement si le bloc existe | R4 écrit les enjeux | rien |
| `carac`/`tc` | dossier (`revele_si.jet`), lu par le moteur | — | `consignerJet` |
| Tirage | `issueDuJet`, seul site (KR-281) | — | journal |
| XP | règle écrite § 6 avant le code | — | `crediterXp` |
| La porte s'ouvre | code, sur réussite | — | fait `EtatPnj` |
| Le savoir est confié | code : la révélation est due | R4 la dit | `consignerReponseActeur` |

### Appel 1 — mise en jeu possible
- Entrée : les 10 blocs actuels + `CE QUE TU GARDES` (si et seulement si `savoirSousEpreuve` rend un savoir). Une ligne constante, sans contenu d'auteur.
- Sortie : forme A `{replique, indices_reveles, delta_confiance}` OU forme B `{resiste:{enjeu_reussite, enjeu_echec}}`.
- Échec de validation : rejeu puis silence (KR-283).

### Appel 2 — après résolution
- Entrée : même assemblage recalculé, `CE QUE TU GARDES` absent, une ligne `À L'INSTANT` (issue binaire).
- Sortie : forme A seule. `resiste` présent → `schema`. Rang dû exigé dans `indices_reveles`.
- Échec de validation : rejeu puis silence. Jet consigné, réussite gardée, dû survit.

### Mémoire de session
- `TU AS DIT` ne reçoit que la réplique de l'appel 2.
- Les enjeux restent sur la carte, jamais mémorisés.
- Le fait de réussite vit toute la session. Le dû est dérivé.

### Amendement `docs/REGLES-DU-JEU.md` § 6
- La porte `jet` n'est mise en jeu que si toutes les autres portes sont ouvertes et qu'un héros existe ; au plus 1 savoir par réplique.
- Challenge ordinaire (§ 2) ; XP suit § 5 — à trancher.
- Réussite acquise pour la session.
- Politique de re-tentative à écrire.
