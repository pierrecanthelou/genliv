# Raffinage `moteur-arbitre` it1 — Tour 2 — PM Produit

## RISQUE
Deux dérives, l'une sur le périmètre, l'une sur la valeur : (1) si la spec d'it1 garde pour seule liste d'acceptation les 9 critères feature (qui couvrent R2/R3/XP — it2/it3), aucun jalon ne peut jamais clôturer « it1 done » sans mentir sur ce qu'elle contient réellement ; (2) si `--good`/`--bad` reste au `design_contract`, le bandeau livre un état sémantique qu'aucun scénario d'it1 ne peut jamais atteindre (zéro jet, zéro source de dégât de PV) — du polish mort avant le squelette.

## OBJECTION
Je ratifie nommément l'objection n°1 de QA (`tour1-qa.md`) : la liste de critères de la spec FEATURE n'est pas la liste d'it1. C'est mon domaine (périphérie), pas une négociation — le plan d'it1 porte sa propre liste, restreinte à ce qu'il livre.

Je réponds à la question d'UX (`tour1-ux-designer.md`, VERDICT) : un signal visuel de PV bas n'a **aucune** valeur produit démontrable avant it2. Aucun mécanisme d'it1 ne fait baisser PV — `--bad` serait un état que personne ne verra jamais en jouant it1. Ce n'est pas un argument esthétique, c'est un argument de preuve : un signal qui ne se déclenche jamais n'a pas de valeur, il a un coût (laisser croire qu'un danger de PV existe déjà).

## PROPOSITION
1. Critères propres à it1 (dans `iterations[0]`, pas recopiés de `plan.acceptance_criteria`) : (a) écran de création, caracs générés/répartis, une relance ; (b) `EtatSession.heros` écrit ET lu dans le même lot (bandeau) ; (c) bandeau nom/PV/PE/XP, AUCUNE couleur sémantique ; (d) A4 câblée sur `aller`, vérifiable seulement par test (invisible à l'écran en it1 — QA l'a déjà noté, ce n'est pas un bug).
2. `design_contract.bandeau_heros` amendé pour it1 : retrait de `--good`/`--bad`, tons neutres. Rien n'est perdu côté UX — la paire sémantique est réservée au `Badge` de `CarteJet` (déjà prévu, it2), juste déplacée à sa bonne itération.
3. Hors périmètre it1 : inchangé (jet, IA, XP, boutique, dialogue dangereux de suppression héros).

Contrepartie anti-empilement : je ne retire rien de nouveau ce tour — le retrait des couleurs EST la compensation (pas un ajout net), et la liste de critères restreint plutôt que gonfle.

## VERDICT
GO, sans veto. Mon objection tour1 (tension KR-013) est **RETIRÉE**.

---

## ANNEXE

### A. Statut de mon objection unique du tour 1
« GO conditionnel. Si la tension KR-013 n'est pas tranchée en toutes lettres avant l'écriture du lot contrat, je durcis en veto au tour 2. »

→ **RETIRÉE.** Le tech-lead l'a tranchée par écrit dans sa propre note **tour 1** (`tour1-tech-lead.md`, section F) : « `pvMax`/`peMax` stockés, écrits une seule fois par `maxPV`/`caracs.EN` à la construction, jamais recalculés à la lecture » — avec le raisonnement complet (section A : c'est un instantané pur à un seul site d'écriture, pas l'anti-patron des 5 précédents rejetés ; le risque de divergence future est explicitement loggé en `known_risk`, pas escamoté). Ma condition — « tranché avant l'écriture du lot contrat » — est satisfaite au sens strict : nous sommes encore en raffinage, aucune ligne du lot A n'est écrite. Rien à durcir.

Mes deux décisions autonomes du tour 1 (déclenchement de la création lu comme déjà tranché par le critère n°1 ; pas de dialogue dangereux pour la création héros) ne sont contredites par aucune note des 4 autres rôles — elles tiennent sans amendement.

### B. Prise de position sur les deux désaccords ouverts

**KR-013 / signal narratif-ia (« `heros.caracs` sans lecteur en it1 si stocké »)** — pas un veto, je ne le traite pas comme une ouverture de périmètre. Les caracs ont déjà un lecteur réel : le joueur, pendant leur répartition à l'écran de création (c'est littéralement l'interaction centrale d'it1), et `maxPV` à la construction. L'absence d'un second affichage *dans la session* après coup n'est pas une case KR-249 vide — KR-249 exige un écrivain ET un lecteur réels, pas un lecteur à chaque point d'observation possible. Je ne vote pas pour un sous-panneau caracs dans `BandeauHeros` : aucun critère d'acceptation ne le demande, et ça gonflerait it1 sans contrepartie retirée. À rouvrir seulement si un besoin réel s'exprime, avec son propre critère.

**UX / `--good`/`--bad`** — tranché ci-dessus (section PROPOSITION 2) : retirés d'it1, réservés au `Badge` de `CarteJet` en it2. Je valide la citation de règle d'UX (CLAUDE.md : « réussite/échec, seules couleurs sémantiques ») et j'ajoute l'argument produit manquant : la condition de déclenchement de `--bad` n'existe pas encore dans le jeu livré par it1.

**Signal latéral (hors désaccord posé, mais touche mon domaine)** — l'objection du tech-lead sur le périmètre de fichiers du lot contrat (`sessionDestinations.ts`, fixture saturée, absents du cadrage) : je n'arbitre pas l'architecture, mais je confirme côté produit qu'inclure ces fichiers dans le lot A ne viole pas la règle « un seul lot contrat, en premier » — c'est l'inverse qui la violerait (un second passage de contrat improvisé en cours de lot B). Pas d'objection PM à l'ajout proposé par le tech-lead.

### C. Décisions prises en autonomie faute de spécification
- Granularité des critères d'acceptation d'it1 (feature-level vs itération-level) non distinguée dans la spec actuelle → j'ai choisi une liste d'acceptation propre à it1, distincte de `plan.acceptance_criteria` (qui reste l'index des 3 itérations) → si c'était l'inverse (garder les 9 critères feature comme « les » critères d'it1), le lot contrat se livrerait sans preuve d'acceptation propre à son périmètre réel, et it1 ne pourrait jamais être déclarée `done` sans se mesurer à des critères qu'elle ne contient pas (R2, R3, XP).
- Couleurs sémantiques du bandeau en it1, contradiction entre le `design_contract` de cadrage et la règle CLAUDE.md non tranchée formellement → j'ai arbitré en faveur de CLAUDE.md (retrait), au nom de la valeur produit nulle de l'état `--bad` en it1 → si c'était l'inverse (garder les couleurs), ça livrerait un état mort jamais atteignable en jeu et diluerait la portée sémantique des couleurs au moment où `CarteJet` en a réellement besoin en it2.
- Extension du bandeau pour donner un lecteur runtime aux caracs (signal narratif-ia) → j'ai choisi de ne pas étendre le périmètre d'it1 pour ça → si c'était l'inverse (ajouter un sous-panneau caracs), ça gonflerait it1 d'un élément qu'aucun critère d'acceptation ne demande, contraire à ma règle anti-empilement — j'aurais dû retirer autre chose en échange, et rien dans cette itération n'est négociable à la baisse sans casser le squelette.

### Fichiers lus ce tour
- `.claude/raffinage/moteur-arbitre-it1/tour1-pm-produit.md`
- `.claude/raffinage/moteur-arbitre-it1/tour1-tech-lead.md`
- `.claude/raffinage/moteur-arbitre-it1/tour1-ux-designer.md`
- `.claude/raffinage/moteur-arbitre-it1/tour1-qa.md`
- `.claude/raffinage/moteur-arbitre-it1/tour1-narratif-ia.md`
- `src/features/moteur-arbitre/specification.json`
