RISQUE — inchangé sur le fond, actualisé sur la preuve : le rapport n'affichera l'itération sur aucun dossier du dépôt (mesure-orchestrateur §1). Ce que je redoutais au tour 1 — un cinquième voyant mort — est désormais tranché dans l'autre sens par la mesure §5 : les cinq champs porteurs des deux états `condition-sans-expr` sont l'état PAR DÉFAUT des panneaux livrés (`FicheFin.tsx` l.15, `BlocPlanActions.tsx` l.87). Le risque résiduel n'est donc plus « voyant mort » mais « rapport verbeux » : narratif §5 et QA le nomment déjà (volume par site, `si_bloque`/`revele_si` tirant une ligne par élément) — hors de mon terrain, je le signale et je le laisse à eux.

OBJECTION NOMMÉE — Tech-lead R7 (et C1). R7 rejette toute réécriture au motif que `DossierIssue.message` est « déjà une phrase rédigée ». M1/M9.1 de l'orchestrateur le contredisent sur 5 sites/10 : le message de `condition-sans-expr` porte littéralement une clé JSON dans la prose lue par l'auteur (« Le champ « `condition_texte` » »). Depuis mon terrain — vocabulaire produit (CLAUDE.md, Domain rules §8) — c'est non négociable : un nom de champ interne dans une phrase d'auteur est un défaut de valeur, point final, indépendamment de la question architecturale de seconde vérité que le tech-lead pose à raison pour les 2 autres codes. Je RATIFIE donc la réécriture obligatoire des 5 sites `condition-sans-expr` (narratif, QA), je RETIENS la reprise verbatim pour `texte-trop-long` et `revelation-sans-porte` (aucune clé JSON, decompte réel porté). Le COMMENT sans recréer de seconde vérité (dossier le demande au tech-lead) reste hors de mon domaine.

PROPOSITION — GO sans condition suspensive (la mienne du tour 1 est satisfaite, voir C7) ; phrase de démo scindée (C6) ; table de niveaux narratif ratifiée (C3) ; bénéfice it6 nommé dans la section valeur du plan, jamais dans la phrase de démo.

VERDICT — pas de veto. GO.

---

## C6 — la phrase de démo

J'ACCEPTE LA SCISSION. Mon point 2 du tour 1 disait « nommé, jamais dissimulé » — pas « soudé à la phrase ». Le « et » de coordination viole mécaniquement la porte 1 (une phrase de démo, un comportement) ; le forcer dedans achèterait la conformité de forme au prix de la règle elle-même — exactement le genre d'erreur que ce comité corrige chez les autres (cf. M9, motif faux qui cède). La substance de mon exigence est préservée tant que la section valeur du plan porte, mot pour mot, que `condition-sans-expr` est le signal pré-requis de KR-222/it6 (le cadrage le dit déjà au point 1 : « Pré-requis d'it6 » — donc ce n'est même pas une clause neuve, juste un déplacement de l'endroit où elle vit).

**Phrase de démo définitive, mot pour mot, sans « et » :**

> « À la fin de cette itération, l'auteur qui laisse une fin, un blocage ou une révélation sans leur pendant structuré, ou un synopsis trop long, le voit dans son rapport sans réimporter. »

(Les « ou » énumèrent des sites d'un seul geste — être averti dans son rapport — ils ne coordonnent pas deux comportements différents ; ça ne réintroduit pas ce que la porte 1 interdit.)

## C7 — la preuve de reachability par formulaire

**Ma condition est LEVÉE — dépassée, pas seulement remplie.** J'avais demandé « au moins deux des quatre codes » ; la mesure §5 de l'orchestrateur montre les cinq champs porteurs édités par des panneaux déjà livrés, et les composants eux-mêmes documentent ces états comme premiers-rangs (`duree === undefined` a un rendu dédié, pas un cas limite oublié). Retirée par preuve directe, pas par lassitude.

**Sur la conséquence — je la prends explicitement, et je l'endosse contre ma propre lecture du cadrage §4.** Le cadrage présentait « zéro avertissement sur tout dossier du dépôt » comme un fait à peser, possiblement défavorable, « notamment par le PM ». Je corrige ma propre position : ce n'est pas un signal de faiblesse de la règle, c'est un artefact du fait que les fixtures sont *finies* par construction (KR-156, bien formées exprès) — un dossier d'auteur en écriture ne l'est jamais. La valeur de cette itération n'est donc pas dans ce qu'elle montre sur `dossier-reference.json`, elle est dans ce qu'elle montrera sur le dossier réel, encore incomplet, de tout auteur qui pose une fin avant de câbler son `_expr`. C'est même un argument de priorité plus fort que celui que j'avais au tour 1 : la règle ne couvre pas un cas rare, elle couvre l'état le plus fréquent de l'écriture en cours. Corollaire pour QA/narratif (hors mon domaine, je le note pour eux) : ça renforce leur demande de `volume_mesure`, puisqu'un dossier réel et non fini portera plus de ces lignes que les fixtures n'en laissent deviner.

## C3 — la table des dix niveaux (7 alerte / 3 info)

**RATIFIÉE, sans ligne contestée.** Le discriminant du narratif (« le jeu en souffre à chaque partie et l'auteur ne le verra qu'en jouant » vs « aucun consommateur, ou état d'auteur légitime ») est exactement le bon test de valeur pour un auteur : il sépare ce qui coûte cher à ignorer de ce qui entraînerait à ignorer les autres voyants si on le montait à tort (site 9, `revelation-sans-porte`, où le dépôt dit deux fois « laissez tel quel » — monter ça en `alerte` serait le même défaut que le bandeau rouge refusé à it1 et le voyant tautologique refusé sous SANS_COMPTE, deux précédents que j'ai moi-même invoqués ailleurs). Je note pour mémoire, sans rouvrir : le croisement `revelation-sans-porte` × `indice-sans-source` (« porte morte, producteur fantôme ») a une vraie valeur auteur et doit rester nommément la charge d'it6, pas un relèvement de niveau ici en passant.

## Statut de mes propres objections du tour 1

1. **« La mesure n'est pas de même nature que SANS_COMPTE / reference-pendante ; reste non prouvé : la reachability par formulaire »** → **RETIRÉE** (motif : prouvée et dépassée, mesure-orchestrateur §5 ; voir C7 ci-dessus).
2. **« Le bénéfice it6 doit être nommé, jamais dissimulé derrière la seule phrase auteur »** → **RETIRÉE** (motif : satisfaite par relocalisation actée en C6 — nommée dans la section valeur du plan ; l'exigence de fond ne meurt pas, elle change d'adresse).
3. **« La phrase avec « et » doit être adoptée telle quelle »** → **RETIRÉE** (motif : violation mécanique de la porte 1 une fois relue sous cet angle ; remplacée par la phrase sans « et » ci-dessus, qui porte toujours les deux gestes d'auteur nommés — fin/blocage/révélation sans pendant, synopsis trop long).

Aucun veto. Aucune objection durcie. GO, sous réserve des points hors de mon domaine que je ne tranche pas : le mécanisme anti-seconde-vérité pour la réécriture des 5 messages (tech-lead), le remplacement exact de la garde KR-217 l.336-342 (QA/tech-lead, C5 — je ne conteste pas la lecture de `.warnings`, rien à ajouter), et la garde d'it3 sur `canon.*` (C4/M5, tech-lead/narratif).

Fichiers lus : `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-controles-it5\dossier-tour2.md`, `tour1-pm-produit.md`, `tour1-tech-lead.md`, `tour1-narratif-ia.md`, `tour1-ux-designer.md`, `tour1-qa.md`, `mesure-orchestrateur.md`, `cadrage.md` (tous dans ce dossier).