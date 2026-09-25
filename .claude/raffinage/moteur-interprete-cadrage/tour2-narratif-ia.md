# Tour 2 — Directeur narratif & IA · cadrage `moteur-interprete` (n° 10)

**1. `agir` quitte l'it1 — je me corrige (réponse au PM).** Je l'avais placé dans le contrat de base, contre ma propre règle : un verbe entre avec son consommateur. Sans R3, `agir` consomme un pas en silence, puisque selon § J1 c'est la demande qui consomme le pas. Il entre donc en it2, avec R3.

La clarification systématique n'est pas plus honnête, et là je pose un **veto**. Pour refuser « je fouille la pièce » en prose, l'invite doit connaître la politique « seul `aller` existe » : c'est une règle dupliquée dans le prompt. Et deux clarifications d'affilée ne sont pas représentables, donc la seconde saisie serait forcée vers `aller` ou vers « illisible ».

En it1, R1 rend une union fermée à trois formes :
```
{"commande": "aller", "cibles": ["L2"]} | {"clarification": "…"} | {"sans_commande": true}
```
`sans_commande` produit un message système fixe, dérivé des `label` de `COMMANDES`. Il consomme 0 pas et n'écrit rien. En it2, il reste le canal pour ce qui sort du monde (demande méta, injection). Le « texte neutre » de l'UX est un message système, jamais une fiction ni une action gratuite.

**2. Au tech-lead, nommément : un lot contrat par itération, pas un seul pour la feature.** La garde `never` de `demander()` est indivisible **par rôle** : R1 seul compile en it1. Geler `memoire` et `recit?` dès l'it1 viole KR-249 (un champ n'entre que si un chemin l'écrit et un autre le lit), et KR-251 les rendrait impossibles à retirer. `session.ts:114` pose déjà la règle pour `attente` : « variante par variante avec son producteur ».
- Lot contrat it1 : `attente.clarification` et sa ligne `ia` ; R1 (service, `schemaSortie`, `INVITES`) ; `moteurSansIA` réécrit.
- Lot contrat it2 : § J1 amendé d'abord, puis `agir` dans `commandes.ts`, `recit?` et R3.
- Lot contrat it3 : la forme de `memoire`.

**Veto** si cette forme est gelée avant l'itération qui écrit sa politique de rétention : une forme sans politique, c'est une mémoire non spécifiée.

**3. À l'UX : un seul pas en cours, sans file d'attente.** Le champ reste éditable. La soumission est bloquée jusqu'à la clôture du pas (R1 → exécution → persistance → R3).
- Avec une file, la saisie B est interprétée contre un état que le joueur n'a pas vu : « la deuxième » viserait l'ancienne table de rangs.
- Deux R1 concurrents rendent représentables deux clarifications d'affilée.
- Un R3 tardif écrit ses faits après que la fenêtre a glissé.

Le verrou vit dans l'orchestrateur, pas dans l'attribut `disabled`. Témoin : deux soumissions dans le même tick donnent un seul `fetch`. Des suggestions qui remplissent le champ **et** soumettent me conviennent, tant que la soumission repasse par R1.

**4. Au QA : deux instruments, une seule constante.**
- KR-261 est statique, côté auteur : il mesure un chemin du dossier, au pire cas.
- Le § D est dynamique : il borne un appel au runtime.

KR-261 fournit le terme « dossier » de la borne du § D. Il ne voit pas le terme « session » (`SAISIE_MAX`, `RECIT_MAX`, `FAIT_MAX`, `RESUME_MAX`). Aucun des deux ne se déduit de l'autre, mais le plafond de contexte vit une seule fois dans `brain/`, et les deux le lisent. Avec deux plafonds, on aurait deux budgets qui dérivent.

KR-262 : l'instrument est la garde d'injection (KR-232), pas un test de sortie. Le modèle n'écrit pas un nom qu'il n'a jamais reçu.

**VERDICT** — GO conditionnel. Les veto du tour 1 sont maintenus, plus deux nouveaux : la clarification utilisée comme refus, et une forme de `memoire` gelée avant sa politique.

---

## Décisions prises en autonomie faute de spécification

- Forme du refus de R1 en it1 → `{"sans_commande": true}`, fermé, sans prose → avec une clarification, la politique du registre vit dans l'invite, et la garde anti-boucle force la seconde saisie.
- Nom de la troisième forme → `sans_commande`. Ni `refus` (déjà pris par le bras pré-appel de `CopiloteService`), ni `intention` → une collision laisse `tsc` vert sur le mauvais bras.
- Entrée d'`agir` → it2, avec R3 → en it1, ce serait un pas d'horloge consommé sans effet ni récit, et § J1 amendé pour un verbe sans consommateur.
- DERNIER PAS dans l'entrée de R1 → absent en it1. En it2, seulement le `recit` du pas précédent, jamais la saisie, ce qui corrige mon annexe du tour 1 → injecter la saisie passée obligerait à la persister, ce qui rouvre le canal de texte libre que ferme `commandes.ts` (KR-247/248).
- Concurrence → un seul pas en cours, soumission bloquée, champ éditable → avec une file, on interprète contre un état que le joueur n'a pas vu, et un bug n'est plus reproductible à partir des saisies.
- Périmètre du verrou en it3 → il couvre le résumé → hors verrou, le résumé entre en concurrence avec le R3 suivant, qui lit `memoire`. Coût : un pas sur dix plus lent.
- Plafond de contexte → une seule constante dans `brain/`, lue par KR-261 et par le § D → deux constantes divergent au premier réglage.
- Voix dès l'it1 → la clarification est la première prose modèle que lit le joueur : `ton` et `interdits_ton` sont injectés, et le validateur est actif → avec « pas de prose » en it1, la clarification échappe aux garde-fous.

---

Fichiers vérifiés pour ce tour :
- `.claude/raffinage/moteur-interprete-cadrage/tour1-pm-produit.md`
- `.claude/raffinage/moteur-interprete-cadrage/tour1-tech-lead.md`
- `.claude/raffinage/moteur-interprete-cadrage/tour1-ux-designer.md`
- `.claude/raffinage/moteur-interprete-cadrage/tour1-qa.md`
- `src/brain/dossier/commandes.ts` : un seul verbe, `aller` ; « pas un caractère de la saisie n'entre dans une `EntreeJournal` ».
- `src/brain/dossier/session.ts` : l. 114 pour `attente` « variante par variante avec son producteur » ; l. 175 pour `memoire: null`.
- `docs/REGLES-PLAY.md` : § J1, « 1 pas = 1 commande acceptée ».
- `docs/PLAN-BASCULE-IA.dc.html` : l. 612, le garde-fou « action gratuite avec un texte neutre » ; l. 630, J2.
- `code-knowledge.json` : KR-242, KR-249, KR-251. KR-261 et KR-262 n'existent pas encore : ce sont les propositions du QA.
