# Tour 1 — Directeur narratif & IA · cadrage `moteur-interprete` (n° 10)

**RISQUE** — Le champ libre installe un second décideur. Si l'intention de R1 est plus riche que ce que le moteur exécute, elle crée des champs qu'aucun code ne lit. Seul R3 les lit : le modèle parle au modèle sans validation, et « la clé rouillée » devient vérité sans delta. Si le rejeu repasse par R1, la partie cesse d'être rejouable.

**OBJECTION** —
1. R1 ne voit aucun identifiant : `monde.lieux[].id` est `moteur` et `nom` est `auteur` (`destinations.ts:385-386`). « Désigner un identifiant existant » ne peut se faire que par rang, re-résolu par le code (KR-231).
2. La mémoire du plan a un trou : la fenêtre fait 5 pas et le résumé est réécrit tous les 10. Au pas 19, les pas 11 à 14 ne sont nulle part.
3. Le SSE (D2) contredit « validé avant affiché ».

**PROPOSITION** —
- La sortie de R1 est une `Commande` en rangs → re-résolution → `executerCommande`. C'est le même entonnoir que la console. `COMMANDES` gagne `agir` (arité 0, § J1 amendé d'abord). Pour R3, la matière d'`agir` est la saisie du joueur. Tout champ d'intention entre avec son consommateur (objet n° 11, pnj n° 12). Les verbes sont injectés depuis le registre, jamais écrits dans l'invite.
- Le rejeu lit les `Commande` acceptées, jamais la saisie : le modèle est hors du rejeu.
- `memoire: null | { resume, faits_etablis[] }`. La fenêtre est dérivée du journal, élastique de 5 à 14 pas. Les faits sont ancrés par rangs, injectés selon la scène, jamais réécrits.
- Pas de SSE en n° 10.

**VERDICT** — GO conditionnel : ces points entrent au premier lot `contrat`. Veto si une sortie modèle non validée atteint le code, si un verbe vit dans une invite, si la mémoire entre sans borne chiffrée, ou si le rejeu appelle le modèle.

---

## Annexe (hors quota) — contrats de sortie IA

### A. R1 · interprète

**Entrée injectée.** Assemblée par le code, sous garde stricte `destinations.ts` + `sessionDestinations.ts`, soupape de dérogation vide.
- **VERBES** — dérivés de `COMMANDES` (`label` + `refKinds`), jamais écrits dans l'invite du worker.
- **CANDIDATS** — `destinationsPossibles` dédoublonnés (dette que la n° 9 laisse à l'injection). Numérotés `L1…Ln`, plafond `CANDIDATS_MAX`. Étiquetés par la `description` du lieu cible, jamais par son `ambiance` ni ses `dangers`. La table rang → id est rendue par l'assembleur, jamais re-dérivée (KR-231).
- **ICI** — `description` du lieu courant.
- **VOIX** — `canon.ton` et `canon.interdits_ton[]`. Jamais `synopsis_mj` : R1 écrit de la prose que lit le joueur (la clarification).
- **ATTENTE** — la clarification pendante (question + saisie d'alors), s'il y en a une.
- **DERNIER PAS** — saisie + récit du pas précédent, un seul (pour « j'y retourne »).
- **SAISIE** — texte du joueur, au plus `SAISIE_MAX`, délimité comme donnée. Au-delà, refus avant tout `fetch`.

**Sortie.** Exactement une de ces deux formes, avec un ensemble de clés exact :
```
{"commande": "<clé de COMMANDES>", "cibles": ["L2"]}
{"clarification": "…"}
```

**Prédicats** (purs, dans `brain/dossier/`) :
1. Une clé en trop est un refus (signal KR-236).
2. `commande` appartient aux clés de `COMMANDES`, et `cibles.length === refKinds.length`, strictement, comme dans `analyserSaisie`. Chaque rang doit appartenir à la table de cet assemblage-ci, pour le bon `refKind` ; sinon, motif `rang-inconnu`.
3. `clarification` : non vide, au plus `CLARIFICATION_MAX` caractères, sans identifiant (`porteUnIdentifiant`), sans `MARQUEUR_A_ECRIRE`. Elle est interdite si une clarification est déjà pendante : deux d'affilée ne sont pas représentables, ce qui coupe la boucle de façon déterministe.

**Typage et nommage.** Deux types distincts : `SortieInterprete` (rangs) et `Commande` (identifiants). Deux noms sont déjà pris par le copilote auteur : `validerIntention` (exporté par `src/brain/copilote/schemaSortie.ts:501`) et la clé `intention` (`CLES_SORTIE_PLAN`). R1 ne doit réutiliser ni l'un ni l'autre.

**Comportement en cas d'échec :**
- **Refus de contexte** (saisie vide ou trop longue) → aucun `fetch`, 0 pas, rien n'est écrit.
- **Indisponible** (réseau, 503, délai, annulation) → pas de rejeu. Arrêt sur message (D2), 0 pas, la saisie reste dans le champ.
- **Illisible après un seul rejeu** → 0 pas, rien n'est écrit. Message système fixe du registre UX (« reformulez »), jamais une fiction, et pas de repli sur `agir`.
- **Clarification** → `attente: { type: 'clarification', question, saisie }` (clé racine optionnelle à vie, KR-251). 0 pas, aucun appel à R3, aucune entrée de journal.

### B. R3 · narrateur

R3 est appelé **après** que le moteur a écrit et persisté l'état : il ne peut rien changer.

**Entrée injectée :**
- **CANON** — `synopsis_mj`, `accroche_joueur`, `ton`, `interdits_ton[]`. C'est le seul bloc toujours chargé.
- **ISSUE** — la `Commande` exécutée, décrite par le code à partir du `label` du registre, et la liste **explicite** des deltas du pas, vide comprise :
  - pour un jalon atteint : `enonce_texte` (porte : `jalons_atteints`) ;
  - pour un indice révélé : `formulation_joueur`.
- **SCÈNE** — `description`, `ambiance` et `dangers` du lieu courant, et la `description_joueur` des objets possédés. Tout est numéroté en rangs.
- **ÉTAT** — une projection de `EtatMonde` faite par le code, jamais stockée (KR-013). L'état prime sur les faits.
- **MÉMOIRE** — le résumé, la fenêtre, et les faits dont un rang appartient à la scène. Faits datés au pas, plafond `FAITS_INJECTES_MAX`.
- **SAISIE** — le texte du joueur pour ce pas.

**Sortie :**
```
{"recit": "…", "faits_etablis": [{"fait": "…", "sur": ["L1"]}], "suggestions": ["…"]}
```

**Prédicats :**
1. Clés exactes, aux deux niveaux.
2. `recit` : non vide, au plus `RECIT_MAX` caractères, sans identifiant, sans marqueur.
3. `faits_etablis` : de 0 à 3 éléments ; `fait` au plus `FAIT_MAX` caractères ; `sur` contient 1 à 3 rangs de la table de cet assemblage. Un fait sans ancre n'est pas représentable, donc **une entité inventée n'atteint jamais la mémoire durable**. C'est la seule forme testable de « aucune création d'entité » : sur la prose libre du récit, « retiré du récit » ne peut pas s'implémenter.
4. `suggestions` : de 0 à 3, au plus `SUGGESTION_MAX` caractères, sans identifiant. Un clic **remplit** le champ, qui repasse ensuite par R1 : une suggestion n'est jamais exécutée directement.

**Écriture.** Le récit va dans `journal[].recit`, qui a son propre chemin et sa propre ligne `ia`. `journal[].texte` reste `moteur`. Les faits s'ajoutent à `memoire.faits_etablis`. L'assertion `sessionCouverture.test.ts:222` est supprimée **dans ce lot-là**.

**Comportement en cas d'échec** (indisponible, ou illisible après un seul rejeu) :
- Le pas reste acquis : c'est un état légal, et `recit` est optionnel à vie.
- Un message système fixe s'affiche ; la mémoire est inchangée ; il n'y a aucune suggestion.
- Jamais de « texte neutre » rédigé comme de la fiction : ce serait une 3e prose, rejetée en n° 9.
- Rien n'est affiché avant validation.

### C. Résumé glissant (tâche confiée à R3)

- **Déclencheur.** Quand la fenêtre atteint 15 pas, le résumé absorbe les 10 plus anciens et la fenêtre revient à 5. `FENETRE_MAX` (14) se dérive de `FENETRE_MIN` (5) et `CADENCE` (10), sans être stocké. Il n'y a aucun trou.
- **Sortie.** `{"resume": "…"}`, au plus `RESUME_MAX` caractères, sans identifiant.
- **Échec.** Pas de rejeu. L'ancien résumé est conservé et une nouvelle tentative a lieu au pas suivant. Au-delà d'un plafond dur, les pas les plus anciens sortent sans trace, sauf leurs faits : **c'est l'oubli nommé**.
- **Autorité.** Le résumé n'est jamais lu par le code et n'a aucune autorité sur l'état.

### D. Budget par pas

- **Appels.** R1 : 2 au plus. R3 : 2 au plus. Résumé : 1 au plus. Soit 5 au plus par pas, 2 en nominal.
- **Borne de contexte de R3.** canon + scène + `FAITS_INJECTES_MAX`×`FAIT_MAX` + `RESUME_MAX` + 14×(`SAISIE_MAX`+`RECIT_MAX`). Toutes ces grandeurs sont des constantes, mesurées puis plafonnées.
- **Dégradation en jeu, sans refus.** On retire d'abord les suggestions, puis les pas les plus anciens de la fenêtre au-delà de 5, puis les faits au-delà de K. Un canon + une scène qui débordent à eux seuls sont un défaut du dossier : c'est au balayage de budget côté auteur de le signaler.

### E. Témoins

- KR-250 survit, resserré : zéro `fetch` dans `src/brain/dossier/**` et `src/player/**`. Le modèle n'atteint le moteur que par le type `Commande`, à travers un port injecté.
- Test : un 2e verbe ajouté à `COMMANDES` dans un test apparaît dans le contexte de R1 sans que le worker soit touché.
- Mutants à vérifier rouges : un rang hors table ; une arité +1 ; un fait sans `sur` ; deux clarifications d'affilée.
- Test : rejouer les `Commande` acceptées sans port IA redonne le même `EtatMonde`. Ce témoin prépare KR-242 pour la n° 11.
- La voix (2e personne, présent, aucune mécanique annoncée) n'est pas testable avec jest : elle vit dans l'invite du worker, et il faut l'écrire tel quel.

---

## Décisions prises en autonomie faute de spécification

- Forme de l'intention de R1 (plan : cible/verbe/moyen/objet) → `Commande` du registre + `agir` → à l'inverse, chaque champ non exécuté devient un canal modèle → modèle, et KR-251 le rend optionnel à vie, donc impossible à retirer.
- L'action libre consomme-t-elle un pas ? → oui, par `agir`, avec § J1 amendé d'abord (KR-130) → sinon, les actions libres gèlent l'horloge de la n° 14 et la fenêtre n'est plus bornée en échanges.
- R1 illisible → 0 pas, « reformulez », pas de repli « action gratuite » → avec le repli, une panne du modèle fait avancer le monde, et R3 interprète une saisie qu'aucun schéma n'a validée.
- Étiquette des sorties (KR-195, dont la n° 10 est propriétaire) → la `description` de la cible, pour R1 seulement, sans bascule d'audience → basculer `lieux[].nom` exige un lot `contrat` DOSSIER transverse aux 8 collections et expose des noms internes d'auteur.
- Trou fenêtre 5 / résumé 10 → fenêtre élastique de 5 à 14 pas → avec une fenêtre fixe, jusqu'à 4 pas s'oublient sans trace à chaque cycle.
- Qui écrit le résumé → une tâche de R3, sans rejeu → un résumé calculé par le code serait moins cher et infalsifiable, mais perdrait la texture des actions libres : à rouvrir sur une mesure de dérive.
- Entrée du rejeu → les `Commande` acceptées, dans un champ structuré, jamais re-parsées depuis `texte` → si c'est la saisie, KR-242 devient impossible par construction. Le domicile est à trancher par le tech-lead, et KR-248 est peut-être à amender.
- Canon de R1 → `ton` et interdits seulement, jamais `synopsis_mj` → sinon, la clarification peut fuiter le secret MJ.
- `texte_ouverture_joueur` → reste hors contexte (audience `moteur`) → l'injecter rouvre la récitation d'une des deux proses verbatim. Le pas 1 repose donc sur `accroche_joueur` + le lieu de départ.
- SSE → hors n° 10 → sinon, le joueur lit un récit que le validateur peut ensuite refuser.
- Clarification persistée → `attente.clarification` → si elle n'est qu'un état d'écran, un rechargement fait perdre le référent de « la deuxième ».

---

Fichiers vérifiés pour ce verdict :
- `src/brain/dossier/commandes.ts`
- `src/brain/dossier/session.ts`
- `src/brain/dossier/sessionDestinations.ts`
- `src/brain/dossier/destinations.ts`
- `src/brain/dossier/sessionCouverture.test.ts`
- `src/brain/CopiloteService.ts`
- `src/brain/copilote/schemaSortie.ts`
- `src/brain/copilote/contexte/registres.ts`
- `worker/index.ts`
- `src/features/play-mode/tests/moteurSansIA.test.ts`
- `docs/REGLES-PLAY.md`
- `docs/ROADMAP-BASCULE-IA.md`
- `docs/PLAN-BASCULE-IA.dc.html`
- `code-knowledge.json` (KR-195, KR-231, KR-232, KR-236)
