## PM — moteur-horloge it4 — tour 1

**RISQUE** — L'activation du climat n'a aucun chemin existant. L'itération promet un cycle complet dont la première phase est à inventer. Elle monte à 5 lots : pré-lot extraction, contrat, tick, bandeau, et R3 manifestation en implicite.

**OBJECTION**
1. **« Activation via Evenement » est un mécanisme neuf, pas un lot.** `Evenement` n'a aucun champ vers un climat. Le moteur ne consomme que les événements à `monstre_ref` (`evaluate.ts:295-311`). `Resolution.consequence` n'est lue que par `atteignabilite.ts`. Un 5e delta heurte `deltas.ts:57-61` : aucun prédicat ne nomme `climat`. **Maintenue ; veto au tour 2 si la route reste ouverte.** `types.ts:1380` n'est pas rouvert : `declencheur_expr` sur `Climat` reste rejeté.
2. **Idempotence : faux problème, retirée.** `avecAjout` (`deltas.ts:94-97`) rend la même référence, donc `donner_objet` ne double pas. Pas de flag « déjà appliqué ».
3. **`effets_regles` n'a aucun éditeur** (`destinations.ts:574-586`) et la fixture porte `[]`. La démo des effets passe par un import JSON. Maintenue.
4. **`climat_actif?: string` (KR-301) ne suffit pas à éteindre** : l'origine d'activation n'est pas dérivable. À remonter au Tech Lead (objection, pas veto).
5. **`manifestation` R3 est « FERMÉ : n° 14 »** (`narrateur.ts:129`) mais absente du goal. À nommer hors périmètre.

**PROPOSITION**
- **Phrase de démo** : « l'auteur lit au bandeau CLIMAT · {nom} apparaître, puis disparaître après sa durée ; PAS #n sert à compter ». PAS #n est l'instrument de lecture de la durée, pas un second comportement.
- **Plafond** : 3 lots + 1 pré-lot (l'extraction est un déplacement pur). Les 3 lots sont contrat · tick (activation une fois, extinction par `===` comme it3) · bandeau.
- **Hors périmètre** : R3 `manifestation`, champ de lien dans `FicheEvenement`, effets au-delà d'une boucle `appliquerDelta` à l'activation. Si cette boucle ne tient pas dans le lot tick, les effets sortent de n°14, avec une ligne roadmap obligatoire.
- **Route d'activation** : le Tech Lead tranche sous 4 contraintes : surface d'édition existante, déjà consommée par le moteur, déclenchée une seule fois, zéro prédicat neuf.

**VERDICT** — recevable sous réserve.
