# dossier-repetition it2 — UX Designer — Tour 1

RISQUE — Deux fautes d'écran passeraient inaperçues.
1. `combat_ouvert` affiche aujourd'hui `{r.monstre_ref}` brut (`PanneauRepetition.tsx:201`), donc `bestiaire.squelette`. L'auteur lit un identifiant, c'est une faute de registre. Les deux nouveaux motifs la reproduiraient.
2. Le but dit « voir le héros survivre », mais le rapport ne montre que l'arrêt final. Un parcours qui gagne trois combats puis atteint une fin s'affiche comme avant. La démo (« traverser les combats ») est invisible.

OBJECTION
1. Le texte de `combat_ouvert` (« La répétition ne le résout pas encore ») devient faux en it2. La définition dit « 5 motifs » sans dire si ce motif survit. Un motif inatteignable est du code mort à l'écran.
2. « Survivre » n'a pas de surface : ni compteur, ni ligne. Il faut une donnée de rapport (`combats_gagnes`). C'est un champ de rapport, pas un champ de dossier, donc compatible KR-013.
3. Le panneau a cinq blocs JSX presque identiques (titre + ListRow dupliqué). Un motif de plus s'ajoute en copier-coller, sans garde de complétude.

PROPOSITION
- Résoudre le nom du monstre avec `BESTIARY_BY_TEMPLATE[ref.slice(PREFIXE_BESTIAIRE.length)]?.name`. Les deux sont exportés par `brain`, comme dans `FicheEvenement.tsx`. Repli : « un monstre du bestiaire ». Jamais l'identifiant.
- Retirer la branche `combat_ouvert` si le type la perd. Sinon, texte factuel sans « pas encore ».
- Un Badge neutre `n combat(s) gagné(s)` à côté de `Parcours n°`, masqué à 0.
- Une table motif → titre/corps, un seul `ListRow`, et `default: never`. Un motif sans copie ne compile pas.
- La mort s'affiche en `--text-strong`, jamais `--bad` ni `--good` (KR-308). Le bleu ne marque pas un résultat.

VERDICT — recevable sous réserve. Les objections 1 et 2 sont à trancher. Afficher le nom brut du monstre est un veto de registre.

## ANNEXE — Contrat de design

**Composants.** `Card` (shadow=false), `Badge` (tone `neutral` uniquement), `ListRow`. Aucun nouveau composant. Le bouton primaire reste l'objet local `buttonStyle`. La liste canonique n'a pas de primitif Bouton, et ce style est dupliqué dans 14 fichiers qui utilisent `--text-on-accent`. C'est une dette notée, hors périmètre it2.

**Tokens.** Tous vérifiés dans `src/styles/tokens/` et `design_handoff_gamebook_editor/tokens/` : `--text-strong`, `--text-body`, `--text-label`, `--fs-title`, `--fs-body`, `--fs-eyebrow`, `--lh-body`, `--track-eyebrow`, `--font-mono`, `--space-1/5/7`, `--accent`, `--accent-bg`, `--accent-line`, `--hit-target` (défini dans `src/styles/tokens/spacing.css`). Interdits : `--good*`, `--bad*`, tout hex, tout `px` littéral.

**Eyebrow (inchangé).** `ARRÊT — PAS {pas} SUR {PAS_MAX}`. `PAS_MAX` est importé. La borne de tours de combat doit être une constante exportée à côté de `PAS_MAX`, jamais retapée dans le JSX.

**Textes par motif.** Voix à la 3e personne, noms internes, « arrêt » partout, « blocage » nulle part.

| Motif | Titre (`--fs-title`, `--text-strong`) | Corps (`--text-body`) |
|---|---|---|
| `fin` | Le joueur synthétique a atteint la fin « {fin.nom} ». | — |
| `impasse` | Impasse pour un joueur qui ne fait qu'aller. | — |
| `mort` | Le joueur synthétique est mort face à {monstre.nom}. | Relancez pour tirer un autre parcours. |
| `combat_sans_issue` | Le combat contre {monstre.nom} n'a pas été tranché en {BORNE} tours. | Ni le joueur synthétique ni {monstre.nom} ne l'a emporté. |
| `pas_max` | Le joueur synthétique a parcouru {PAS_MAX} pas sans atteindre de fin. | — |
| `combat_ouvert` | À retirer. Si conservé : « Le joueur synthétique est engagé contre {monstre.nom}. » | — |

**Badge de survie.** Pluriel : « 1 combat gagné » / « 2 combats gagnés ». Le Badge est absent à 0, pas de « 0 combat ».

**ListRow lieu.** `title` = nom du lieu, `subtitle` = description du lieu (texte joueur). Si le lieu est introuvable, rien ne s'affiche (comportement actuel), jamais l'identifiant.

**États.**
- Invite (inchangé) : « Lancez la répétition : un joueur synthétique parcourt votre dossier et vous dit où il s'arrête. » avec le bouton `Lancer la répétition`.
- À corriger (inchangé).
- Résultat : un rendu par motif, selon la table ci-dessus.
- Pas d'état de chargement, le calcul est synchrone. Pas d'état d'erreur nouveau.

**Clavier.**
- `autoFocus` sur le bouton primaire de chaque état (existant).
- Entrée sur `Relancer` relance.
- Pas de modale, donc pas d'Échap.
- Tab : un seul contrôle par état.
- `Relancer` reste monté d'un résultat au suivant, le focus n'est pas perdu.
