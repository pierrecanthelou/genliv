## Note — NARRATIF & IA · `dossier-fiches` it7 « retrait d'un personnage » · tour 1

**RISQUE** — J'ai vérifié : côté identifiants, il n'y a pas de trou. Tous les chemins qui pointent un `pnj.*` produisent un `reference-pendante` bloquant (annexe). Le trou est ailleurs, et il est structurel : rien ne référence le personnage retiré, mais une douzaine de champs de prose destinés `'ia'` le NOMMENT. Après retrait, `canon.mj.synopsis_mj`, `jalons[].enonce_texte`, le `lien` d'une relation d'un autre personnage disent toujours « Aldûr ». C'est cette prose que la n° 10 injecte au narrateur : le dossier redevient valide, la fiction non. Invisible au validateur par construction, et ce n'est pas un défaut du validateur.

**OBJECTION** — Deux. (1) « Zéro lot `brain/` » tient pour le refus, pas pour ce que l'auteur lit : la ligne QUOI FAIRE de `reference-pendante` (`issues.ts:93`) dit « puis réimportez-le » — fausse dans l'éditeur, impasse pour l'auteur, corollaire exact de KR-171/BUG-042. `dossier-canon` it4 l'a déjà livrée sur le Lieu ; it7 la double sur un chemin plus fréquent. (2) Le goal ne dit nulle part que le refus reste au SSOT. Un pré-vol côté feature dupliquerait la règle et se tromperait sur KR-194.

**PROPOSITION** — 1. Trois tests, un par classe : relation entrante d'un tiers → refusé ; `pnj_a_revele` imbriqué sous `non`/`et` → refusé (`collectRefs` récurse, un test à profondeur 1 ne prouve rien) ; auto-référence seule → retiré, pas refusé. 2. Interdit écrit en spec : aucun prédicat de pré-vol feature. 3. `issues.ts:93` → « ↪ Corrigez « {champ} » ou rétablissez l'élément correspondant. » 4. Un KR : la prose ne se scanne jamais par `nom`.

**VERDICT** — recevable sous réserve (1, 2, 3).

---

## Annexe A — chemins référençant un `pnj.*`, et leur couverture

| # | Chemin | Mécanisme | Refus bloquant ? | Preuve |
|---|---|---|---|---|
| 1 | `monde.personnages[].relations[].cible_id` | `REFERENCES_SIMPLES`, `espace:'pnj'` | Oui — `reference-pendante`, `severity:'error'` | `tables.ts:451` → `validate.ts:384-417` |
| 2 | `canon.objectifs[].reussi_si_expr` | prédicat `pnj_a_revele`, position 0 | Oui | `predicates.ts:66` → `validate.ts:711-723` |
| 3 | `canon.objectifs[].echoue_si_expr` | idem | Oui | idem |
| 4 | `charpente.fins[].condition_expr` | idem | Oui | idem |
| 5 | `charpente.jalons[].declencheur_expr` | idem | Oui | idem |
| 6 | `monde.evenements[].declencheur_expr` | idem | Oui | idem |
| 7 | `monde.personnages[].plan_actions[].declencheur_expr` | idem | Oui | idem |
| 8 | `monde.personnages[].contre_mesures[].declencheur_expr` | idem | Oui | idem |

Points de mécanique à ne pas supposer :

- Le `pnj` des 2-8 se cache à profondeur arbitraire : `collectRefs` (`expr.ts:258-277`) descend `et`/`ou`/`non` jusqu'à `PROFONDEUR_MAX_EXPR = 8`. Un test à profondeur 1 ne prouve pas la récursion.
- `pnj_a_revele` est le seul prédicat d'arité 2 ; son `pnj` est en position 0.
- `monstre_ref` ne peut pas porter un `pnj` (`estIdentifiantBienForme(x,'bestiaire')` refuse) — hors sujet.
- Les 4 `CHEMINS_DE_DELTAS` ne peuvent pas nommer un `pnj` aujourd'hui (`DELTAS.refKinds ⊆ {objet, indice, jalon}`) — pas un trou, et le jour où un delta gagne `refKinds:['pnj']`, la boucle existante le couvre sans ligne neuve.
- La couverture est totale parce que `DossierService.update` revalide le document ENTIER, pas le patch — indifférent au chemin, et c'est cela qu'un pré-vol feature détruirait.

### Le seul cas qui doit réussir (KR-194)

Un personnage dont la SEULE référence entrante est la sienne (`relations[].cible_id` pointant son propre id) : cette relation disparaît dans le même geste que le personnage, `idsPortes` ne la voit jamais orpheline, donc `update` écrit. Un prédicat de pré-vol côté feature verrait « une relation pointe cet id » et refuserait à tort — discriminant entre « refus au SSOT » et « refus recopié dans la feature ».

### Chemins qui nomment un personnage sans identifiant (non couverts, et non couvrables)

Destination `'ia'`/`'auteur'` : `relations[].lien`, `plan_actions[].action`, `plan_actions[].si_bloque`, `contre_mesures[].action`, `but.libelle`, `but.pourquoi`, `fonction`, `apparence`, `description_joueur`, `savoirs[].revele_comment`, `evenements[].resolutions[].resultat`, `jalons[].enonce_texte`, `depart.texte_ouverture_joueur`, `canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`.

Ce ne sont pas des références au sens de CLAUDE.md — aucun code ne les résout, le schéma ne ment pas. Ce qui casse est la COHÉRENCE de la fiction, pas le graphe. La parade évidente est un piège : un scan par `nom` rouvrirait la référence par nom libre que la règle de domaine interdit. Position : ne rien mécaniser en it7, écrire le KR, poser la charge sur la n° 10.

## Annexe B — contrat de sortie IA concerné

Aucun. it7 ne déclenche aucun appel modèle. Deux conséquences en aval, à consigner et non à traiter ici :

1. n° 10 (contexte) — les 15 champs de prose ci-dessus sont injectés tels quels. Le retrait d'un personnage est le seul geste de Temps 1 qui peut rendre le canon factuellement faux vis-à-vis de `monde.personnages[]`.
2. n° 9+ (mémoire de session) — `pnj_a_revele` lit `monde.pnj.<id>.a_dit[]`. Une session sauvegardée indexe des personnages par identifiant : retirer un personnage en Temps 1 est le seul geste capable de rendre une session pendante. Comportement attendu non spécifié, pas à spécifier en it7 — mais à NOMMER dans la spec.
