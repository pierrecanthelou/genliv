# Tour 2 — `pm-produit` · `dossier-copilote` it3a

**RISQUE** — Gater le `Select PERSONNAGE` sur le constat du linter (`personnage-sans-voix`) rend corvin **inatteignable** par le copilote sans nécessité technique : une amputation silencieuse de la promesse « un personnage » de la phrase de démo, pour un gain de mesure qu'on obtient de toute façon autrement (la fixture, pas le runtime).

**OBJECTION** — Je réponds nommément à **TL3a-7 / C4**. Le motif « registre à deux domiciles » ne tient pas : `PARLER_REPLIQUES` (2) borne ce que le **document** peut contenir, `REPLIQUES_PROPOSEES_MAX` (3) borne ce que le **modèle** génère par appel — deux questions distinctes, pas une valeur dupliquée sous deux noms. `narratif-ia` l'a déjà écrit et je m'y range : recopier 2 dans l'invite serait la vraie duplication. Côté valeur produit : proposer 3 pour en garder 2 n'est pas du déchet, c'est du **choix** — l'UI accepte/rejette déjà ligne à ligne (le rejet est le mode nominal du produit), et la règle « un seul rejeu, jamais deux relances » rend une 3ᵉ candidate utile plutôt que superflue.

**PROPOSITION** — (1) `REPLIQUES_PROPOSEES_MAX = 3` retenu comme borne de **sortie**, `PARLER_REPLIQUES` intact comme borne d'**acceptation**, aucun alignement des deux. (2) C7 : le `Select` reste **ouvert aux six personnages**, sans filtrage par le linter — celui-ci sert de preuve de mesure/fixture, jamais de contrôle d'accès ; corvin reste atteignable. (3) C6 : je penche pour une **carte dédiée** plutôt qu'un segment de la carte 1 — un rôle, une forme d'écriture, une carte — mais ce n'est **pas un veto** : la surface reste à l'UX/tech-lead.

**VERDICT** — recevable sous réserve des trois points ci-dessus.

---

## Statut de mes points du tour 1

1. **`parler[]` seul** — **MAINTENUE.** Convergence totale (UX, tech-lead, `narratif-ia`, moi).
2. **« Pas de 3ᵉ variante AJOUT »** — **RETIRÉE.** Mon inquiétude portait sur la prolifération de variantes dans les composants existants ; l'architecture retenue (`LigneReplique`, composant **sœur dédié**) la referme sans forcer une sémantique scalaire sur une collection. Forcer REMPLACEMENT aurait en outre contredit le modèle mental déjà en place côté édition manuelle (« + Ajouter » dans `BlocCaractere.tsx`) : un copilote demandant de « remplacer une case » sur un champ que l'auteur perçoit comme additif serait un **second modèle d'écriture pour le même champ**, pour zéro gain. TL3a-1 et l'objection UX l'emportent, à raison.
3. **`jamais` et `cede_si` hors périmètre** — **MAINTENUE**, avec le raffinement que j'entérine : `jamais` REPORTÉ vers `personnage-prose` (clés imbriquées, arbitrage réel non gratuit) ; `cede_si` REPORTÉ avec condition d'ouverture écrite aux deux sites.
4. **« Résoudre l'écart `PROPOSITIONS_MAX=3` vs deux répliques à l'écran »** — **RETIRÉE. Ma prémisse était fausse** : il n'y a pas un écart à corriger mais **deux bornes de nature différente** (interface vs génération), toutes deux sourcées. Ma demande du tour 1 (« une seule valeur ») aurait produit **le vrai bug** — aligner l'invite sur la borne document. Je clos avec « deux bornes, deux sources, zéro contradiction ».
5. **« La décision curseurs est purement contractuelle »** — **MAINTENUE**, confirmée : veto tenu, 3d supprimée, aucun champ curseur dans 3a.

## Hors-périmètre définitif de 3a

- `caractere.jamais` et `caractere.cede_si` (REPORTÉS, conditions d'ouverture écrites par `narratif-ia`).
- Les six curseurs (non proposables — **3d supprimée**) ; la variante `GROUPE` de `LigneProposition` (zéro appelant, **non construite**).
- Toute variante « AJOUT » du composant scalaire existant — `parler[]` porte son propre composant.
- Extraction anticipée d'une `BarreDecision` partagée (TL3a-12) ; un 3ᵉ lot `worker/` isolé.
- **Filtrage du `Select` par le constat du linter** — le sélecteur reste ouvert aux six personnages *(précision de ce tour)*.
- `BUG-106`, le remontage du panneau, la recette Worker Route Parity — dettes ouvertes, non aggravées, non fermées.
- Injection des répliques déjà écrites ; un prédicat de similarité ; réutilisation de `PROPOSITIONS_MAX` ; alignement de `REPLIQUES_PROPOSEES_MAX` sur `PARLER_REPLIQUES`.
- Toute création automatique de `caractere.curseurs` lors de l'écriture d'une première réplique.
