# Tour 2 — QA — moteur-horloge it1

### Réponse nommée au Tech Lead (couture refus/combat + ligne jamais porteuse)

**Couture acceptée.** Refus → aucun tick (arrêt avant jalons). Combat → refusé avant tout tick. Vérification par test combinatoire dans `horloge.test.ts`.

**Ligne jamais porteuse, approuvé.** Pas de `origine`, `deltas`, `recit` ni `jet` → jamais prisonnière de `ligneDuPas` ni `consignerJet`. Vérification structurelle dans `horloge.test.ts`.

---

### Verdicts sur mes 5 objections

| Objection | Statut |
|---|---|
| **AC2 : non observable** | **RETIRÉE** — Table J2 (3 cas) + scénario séparateur (NIA) sont observables |
| **AC3 : dépend it2** | **MAINTENUE** — Spec doit clarifier que AC3 est reportée it2 |
| **AC8 : non observable** | **RETIRÉE** — Tech Lead spécifie test nommé |
| **Cas limites absents** | **RETIRÉE** — Table J2 les énumère tous |
| **`depuis` non défini** | **RETIRÉE** — Formule bloqué clairement spécifiée par NIA |

---

### Scénario séparateur suffisant ?

**OUI.** Plan 2 étapes, déclencheur étape 1 = indice, duree[0]=2, entrée pas 1. Pas 3 sans indice → bon = rang 0 bloqué, fautif = rang 1. Discrimine « durée avance » vs « durée bloque sans déclencheur ».

---

### Condition résiduelle

**AC1 et AC3 doivent être réécrits** dans la spec pour refléter : « it1 = déclencheur seul ; durée/depuis/bloqué/R3 reportés it2 ».
