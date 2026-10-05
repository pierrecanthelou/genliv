# Tour 2 — Narratif & IA — moteur-horloge it1

**Réponse au PM (objection 2, `depuis` / KR-249).** Le PM a raison. Sans durée dans le tick, la formule `tour − depuis >= duree` n'existe pas, et `depuis` n'a aucun lecteur. Je le concède hors it1. Contrainte de phasage non négociable : `depuis` est non re-dérivable (KR-298) — il ne peut être écrit qu'au moment de la transition. L'itération qui introduit durée DOIT poser `depuis` dans le même lot que la formule. `etape_plan?: { rang }` en it1 ; `{ rang, depuis }` en it2. Jamais `rang` dans un lot et `depuis` dans un autre.

**Réponse au TL (ligne « bloqué »).** Le TL la proposait comme lecteur de `depuis`. Avec durée reportée, cette ligne tombe. Mon R-2 de tour 1 la rejetait déjà (dérivable, KR-013, sans consommateur avant it2). UX concourt. Ligne bloquée et formule de blocage → it2, avec leur lecteur R3.

**Statut de mes objections**

1. J2 avant code — **MAINTENUE**. La table complète (6 cas) est écrite dans `REGLES-PLAY.md` avant `horloge.ts`, portions it2 marquées. Un J2 partiel sans horizon reproduit la contradiction du goal.
2. Journal = identifiants + rang — **MAINTENUE**, inchangée. UX confirme (veto registre a). Base 1 adoptée (UX tour 2).
3. `rang` hors bornes — **MAINTENUE, SATISFAITE.** Ligne 6 de ma table C (`rang >= plan_actions.length` → no-op) reprise par le TL.

**Décisions prises en autonomie**

- `declencheur_expr` absent sur étape 0 → PNJ n'entre pas (`etapeDeclenchee` rend `false`, TL) → coût si inverse : entrée dans tout plan sans filtre, invisible pour l'auteur.
- J2 complet maintenant, portions it2 marquées → coût si inverse : règle éclatée entre deux docs, contradiction au raffinage d'it2.
- `depuis` entre avec durée, même lot → coût si inverse : champ orphelin (KR-249), ou sessions d'it1 sans `depuis` qui forcent un fallback dans chaque lecteur d'it2.

---

## ANNEXE — frontière code/IA (mise à jour tour 2, hors quota)

### A. Contrat de sortie IA (MISE À JOUR — `depuis` retiré d'it1)
- **Entrée injectée : aucune.** Gardes `contexte/acteur.ts:76` et `narrateur.ts` inchangées.
- **Schéma de sortie : aucun.** Aucun appel modèle.
- **Comportement en cas d'échec : sans objet.** Le tick est pur et total.
- **Preuve exigée :**
  - `moteurSansIA.test.ts` reste vert ;
  - la fixture instancie `monde.pnj.<id>.etape_plan.rang` (PAS `depuis` — it1 ne l'écrit pas) ;
  - aucune ligne `'ia'` ajoutée à `sessionDestinations.ts`.
- **Audience `'moteur'`** : un modèle qui lirait `rang` connaîtrait l'étape courante et jouerait une urgence non constatée par le moteur.

### B. Qui décide, qui raconte, qui persiste (MISE À JOUR — déclencheur seul)

| Capacité | Décide | Raconte | Persiste |
|---|---|---|---|
| Entrée au rang 0 | `tickHorloge` via `etapeDeclenchee` (`evaluate.ts`) | personne en it1 | `monde.pnj.<id>.etape_plan.rang` |
| Passage de k à k+1 | `tickHorloge` via `etapeDeclenchee` | personne en it1 ; R3 en it2 | idem + ligne journal `moteur` |
| Étape bloquée | **REPORTÉE it2** — dérivée, jamais stockée | R3 en it2 (`si_bloque`) | rien |
| Minuterie (durée sans déclencheur) | **REPORTÉE it2** — `depuis` entre avec | personne | `depuis` (it2) |
| Constat journal | le code | `role: 'moteur'`, identifiants + rang base 1 | `journal` |

### C. Table J2 — version phasée (k = rang courant)

| Situation | it1 | it2 |
|---|---|---|
| `etape_plan` absent, `declencheur_expr[0]` présent et vrai | entre au rang 0 | idem |
| `etape_plan` absent, `declencheur_expr[0]` absent | ne bouge pas | entre par minuterie si `duree` prévue |
| k+1 porte un `declencheur_expr` vrai | passe à k+1 | idem |
| k+1 porte un `declencheur_expr` faux | reste à k | reste à k ; `duree[k]` échue → bloqué (dérivé) |
| k+1 sans déclencheur, `duree[k]` posée | reste à k (minuterie reportée) | passe quand `tour − depuis >= duree[k]` |
| k+1 sans déclencheur ni durée | plan arrêté | idem |
| k est le dernier rang | ne bouge plus | bloqué si `duree[k]` échue |
| `rang >= plan_actions.length` | no-op | idem |

Règles transverses inchangées : un cran/PNJ/pas, entrée = cran du pas, ordre = `monde.personnages[]`, pas de tick en combat (KR-295).

### D. Contrat journal du tick (MISE À JOUR — base 1, UX tranche)
- Format : `etape_plan : {pnj.id} {rang_avant+1} → {rang_apres+1}`. Premier passage : `etape_plan : {pnj.id} 1`, sans flèche (précédent `lieu_courant`, UX tour 2).
- `role: 'moteur'`, sans `origine`/`recit`/`jet`/`deltas`/`interlocuteur`.
- Borne : au plus Σ |plan_actions| lignes par session.

### E. REJETÉ (MISE À JOUR)
- R-1 à R-7 maintenus (tour 1).
- **R-8** Écrire `depuis` dans `EtatPnj.etape_plan` sans consommateur dans le même lot : KR-249.

### F. REPORTÉ vers it2 (MISE À JOUR)
- Durée, `depuis`, formule de blocage, `si_bloque` dans R3, minuterie — un bloc indissociable.
- Contrainte : `depuis` entre AVEC la formule `tour − depuis >= duree[k]`, même lot, même itération. Le moment de la transition est sa seule porte d'écriture (KR-298).
- `changementsDe(avant, après)` lit l'état, jamais le texte du journal (veto : texte parsé par du code).
