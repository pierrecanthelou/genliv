RISQUE — Le vrai danger n'est pas narratif mais visuel : `AMORCE_ISSUE` passe de 2 à 3 clés (`reussit_net`/`reussit_juste`/`echoue`), et un ouvrier pressé peut être tenté de refléter ces 3 états sur `CarteJet.tsx` en ajoutant un 3e ton de `Badge` (ex. "RÉUSSITE NETTE" en une couleur à part). Le composant `Badge` n'a que `good`/`bad`/`neutral` — introduire une 3e couleur sémantique romprait la règle « deux couleurs sémantiques seulement, réussite/échec » (CLAUDE.md) et dérouterait les futures itérations combat/XP qui réutilisent `Badge`.

OBJECTION — Le point 5 du cadrage reste ouvert alors que le `design_contract` d'it2 (déjà `resolved_decisions`, non rouvert par it3) fixe `CarteJet` en Badge binaire good/bad. La définition de l'itération 3 ne dit nulle part explicitement que `CarteJet.tsx`/`BandeauHeros.tsx` sont **hors périmètre visuel** — ambiguïté qui laisse la porte ouverte à une extension non spécifiée.

PROPOSITION — Trancher le point 5 : AUCUN affichage de la nuance à l'écran en it3. `CarteJet.tsx` et `BandeauHeros.tsx` : zéro ligne modifiée (seul `heros.xp`, déjà un entier lu tel quel par `BandeauHeros`, augmente — aucun changement de composant). La nuance (`réussit nettement` / `réussit de justesse` / `échoue`, 3e personne infinitif, KR-269) reste confinée à `AMORCE_ISSUE` dans `narrateur.ts`, injectée uniquement dans la ligne `CE PAS` lue par R3. Si un retour visuel de la marge est souhaité plus tard, ce sera une itération dédiée, en texte mono `--text-body` sous le Badge existant — jamais une couleur neuve.

VERDICT — recevable sous réserve : le plan d'itération doit dire explicitement « `CarteJet.tsx`/`BandeauHeros.tsx` : aucune modification » pour fermer l'ambiguïté du point 5.

---

CONTRAT DE DESIGN — itération 3, `moteur-arbitre`

**Composants touchés : AUCUN.** Zéro fichier `.tsx` dans `src/features/play-mode/components/` n'est modifié par cette itération. Le seul changement visible à l'écran est la valeur numérique `XP {n}` du `BandeauHeros` qui augmente — le composant lui-même (JSX, styles, tokens) reste identique à celui livré en it1/it2.

**Fichiers purs/texte concernés (hors composants) :**

1. `src/brain/xp.ts` — extraction d'une constante nommée depuis le littéral `margin >= 3` de `challengeXp` (ex. `MARGE_FRANCHE = 3`). Aucune conséquence visuelle : ce fichier n'a pas de rendu.

2. `src/brain/copilote/contexte/narrateur.ts` — `AMORCE_ISSUE` passe de
   ```ts
   Record<IssueEpreuve, string> = { reussit: 'réussit', echoue: 'échoue' }
   ```
   à un dictionnaire à 3 entrées (si `IssueEpreuve` s'étend à 3 valeurs — décision tech-lead/narratif-ia, hors de mon domaine) :
   ```ts
   {
     reussit_net: 'réussit nettement',
     reussit_juste: 'réussit de justesse',
     echoue: 'échoue',
   }
   ```
   Registre : 3e personne du présent, infinitif de forme verbale identique aux libellés de geste (KR-269 — déjà acté it2 §8#10). **Jamais** « vous réussissez » (2e personne, veto registre). **Jamais** de chiffre (marge, seuil) dans ces chaînes — elles doivent être lisibles sans savoir qu'un seuil existe (KR-262/273).

   La ligne composée (`ligneDeJet`) reste au format `${amorce}${SEPARATEUR_AMORCE}${enjeu}` — aucun changement de structure, uniquement le dictionnaire source.

**États — explicitement SANS changement :**
- `CarteJet.tsx` : Badge reste binaire (`tone="good"` → `RÉUSSITE` ; `tone="bad"` → `ÉCHEC`), roll brut inchangé (`{roll} vs {characteristicValue}`). Aucune 3e valeur de `tone`, aucun texte "nettement"/"de justesse" affiché sur la carte.
- `BandeauHeros.tsx` : `XP {heros.xp}` lu tel quel (`--text-strong`), tons neutres inchangés, pas de couleur sémantique, pas d'animation de gain.
- Aucun nouvel état vide, aucune nouvelle interaction clavier : cette itération n'ajoute aucune surface interactive.

**Discipline de l'accent / tokens** : rien à vérifier côté tokens — aucun CSS/JSX nouveau. La seule vigilance est lexicale (le dictionnaire `AMORCE_ISSUE`) et numérique (aucun chiffre dans la prose injectée à R3).

**Garde ESLint proposée (à valider tech-lead)** : règle ciblée interdisant toute string littérale dans `AMORCE_ISSUE` (ou tout dictionnaire exporté de `narrateur.ts` nommé `*_ISSUE`) contenant un chiffre `[0-9]` ou un pronom de 2e personne (`vous`) — matérialise KR-262/273 et KR-269 sans dépendre de la revue humaine. Secondaire : règle `no-restricted-syntax` interdisant l'ajout d'une 3e valeur à `BadgeTone` (ou tout litéral `tone=` hors `good|bad|neutral`) dans `src/features/play-mode/**`, pour bloquer mécaniquement la tentation décrite au RISQUE si un ouvrier l'essaie quand même.

**Décisions prises en autonomie faute de spécification :**
- Le point 5 (nuance visible à l'écran ou non) n'était pas tranché → j'ai choisi « non, narration seule, zéro changement visuel » → si c'est l'inverse (affichage voulu), ça coûte une itération supplémentaire pour ajouter une ligne mono sous le Badge (`CarteJet.tsx`) et potentiellement un test de régression visuelle, mais ne casse rien de ce qui est déjà livré — c'est additif, pas un retour en arrière.
- Les libellés exacts `reussit_net`/`reussit_juste` et leurs textes français n'étaient pas donnés par le cadrage → j'ai proposé des formes qui respectent KR-269 (3e personne, infinitif) sans contrainte de nommage de clé (c'est au tech-lead/`IssueEpreuve` de fixer le nom du type) → si le nom de clé ou le texte diffère, coût nul pour moi (pas de composant à retoucher), seul `narrateur.ts` et son test associé en seraient affectés.

Fichiers lus : `src/features/moteur-arbitre/specification.json`, `src/features/play-mode/components/BandeauHeros.tsx`, `src/features/play-mode/components/CarteJet.tsx`, `src/brain/xp.ts`, `src/brain/copilote/contexte/narrateur.ts`, `src/brain/components/Badge.tsx`.
