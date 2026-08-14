## Note — UX-DESIGNER · `dossier-fiches` it6/8 · tour 2 (contre-lecture)

**RISQUE** — Un bouton pointillé qui committe `objets[0].id` écrit une contrepartie que l'auteur n'a pas choisie, indétectable en revue visuelle : exactement le défaut que ma propre doctrine (`handleAjouterRelation(cibleId)`) était censée interdire ailleurs.

**OBJECTION** — 1) J'accepte le veto tech-lead sans réserve : les portes Contrepartie et Indice préalable s'ouvrent par Select, jamais par bouton pointillé. 2) Je confirme sa lecture de `BlocPresence.tsx` : ligne 38, `if (lieux.length === 0)` seul — vérifié, sans le `&& presence.length === 0` que porte `BlocRelations.tsx` (l. 66). C'est la forme non corrigée de M1 : si `lieux` se vide, des présences déjà écrites disparaissent de l'écran sans disparaître du document. Hors périmètre it6, mais c'est ma légende d'état vide qui est violée ailleurs — je demande une entrée `bug_history.json` (sévérité majeure, pas critique tant qu'aucun symptôme n'est rapporté), pas un blocage ici. 3) J'amende le hint de `revele_comment` : le texte actuel ne dit pas « manière, jamais condition » — narratif-ia a raison, la fuite moteur→ia est réelle et évitable à coût nul. Amendé en annexe, avec les exemples mêmes que narratif-ia cite.

**PROPOSITION** — Annexe : layout des 2 portes réécrit (Select unique fait office d'ouverture-et-changement, retrait par `IconButton` inchangé), hint `revele_comment` amendé. Note en passant : `TEXTE_AUCUN_INDICE_CANON` suit déjà le moule exact de `TEXTE_AUCUN_OBJECTIF_CANON` (vérifié en code) — le bouchon PM est déjà couvert, rien à changer.

**VERDICT** — recevable sous réserve : 2 portes réécrites en Select, hint amendé, entrée `bug_history.json` pour `BlocPresence.tsx`.

**Mes objections tour 1** — MAINTENUES, sans changement ce tour : `LIBELLES_CERTITUDE` (registre requis, personne ne l'a contesté) et le réalignement légende/libellé sur le moule 3ᵉ personne (déjà réécrit dans mon annexe tour 1, non affecté par le veto qui porte sur d'autres portes).

---

## ANNEXE — textes amendés

### Les 4 portes — révision : 2 restent bouton pointillé, 2 passent en Select

**Confiance et Jet** : inchangées (fermé = `boutonPointilleStyle`, ouvert = widgets + `IconButton` de retrait) — aucune des deux ne référence une collection auteur, le veto tech-lead ne les vise pas.

**Contrepartie** (remplace intégralement le § 3 de mon annexe tour 1) :
Un seul `Select`, jamais de bouton pointillé — même patron que `OBJECTIF RATTACHÉ` déjà en usage dans `FichePersonnage.tsx` :
- `ariaLabel="Exiger une contrepartie"`, options `[{ value: '', label: '+ Exiger une contrepartie…' }, ...objets.map((o, i) => ({ value: o.id, label: localiserEntite('objet', o, i) }))]`.
- Choisir une option ≠ `''` → `handleOuvrirPorteContrepartie(index, objetId)` si la porte était fermée, `handleChangeContrepartieObjet(index, objetId)` si déjà ouverte (même widget sert les deux gestes).
- Porte ouverte : le `Select` (valeur = `objet_id` courant) reste affiché + `Toggle` `"CONSOMMÉ À L'USAGE"` + `IconButton` `"Retirer la porte de contrepartie"` (efface la clé entière, remet le `Select` à `''`).
- Si `monde.objets.length === 0` : le `Select` est remplacé, scopé à cette porte seule, par `TEXTE_AUCUN_OBJET_CANON` (inchangé) — le reste du bloc Savoirs reste actif.

**Indice préalable** (remplace intégralement le § 4) :
Même patron, options filtrées en self-exclusion : `monde.indices.filter(i => i.id !== savoir.indice_id)`.
- `ariaLabel="Exiger un indice déjà connu"`, options `[{ value: '', label: '+ Exiger un indice déjà connu…' }, ...indicesEligibles.map(...)]`.
- `handleOuvrirPorteApresIndice(index, indiceId)` / `handleChangeApresIndice(index, indiceId)` selon l'état, `IconButton "Retirer la porte d'indice préalable"` en retrait.
- Si `indicesEligibles.length === 0` (0 ou 1 seul indice au total = celui-là même) : `TEXTE_AUCUN_AUTRE_INDICE_CANON = "Aucun autre indice dans le canon — cette porte restera indisponible tant qu'un second n'existe."` remplace le `Select`, scopé à la porte seule (distinct de `TEXTE_AUCUN_INDICE_CANON`, qui gate le bloc entier).

### Hint `COMMENT IL LE RÉVÈLE` — amendé (narratif-ia P3/B.3)

Remplace `"injecté au modèle uniquement quand une porte s'ouvre — jamais un dialogue verbatim"` par :

`"La manière dont il le révèle — jamais la condition : n'écrivez pas « si vous la mettez en confiance » ou « contre la fiole », ces règles vivent dans les portes ci-dessous. Injecté au modèle uniquement quand une porte s'est ouverte."`

Le placeholder existant (`"Elle sort la lettre d'une poche cousue dans sa cape, sans un mot."`) reste inchangé — il était déjà pur registre « manière », aucune fuite à corriger.
