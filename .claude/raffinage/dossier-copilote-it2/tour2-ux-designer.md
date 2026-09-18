# Tour 2 — `ux-designer` · `dossier-copilote` it2

```
RISQUE      — Non vu au tour 1 : dans une LISTE de N `LigneDetenteur`, décider une
              ligne (Accepter/Rejeter) démonte son `IconButton` (remplacé par un
              `Badge`) — le focus clavier tombe sur `document.body`. Sur Card 1 (un
              seul candidat, un seul geste) c'est invisible ; sur Card 2, décider
              3 lignes au clavier oblige à reprendre la souris 3 fois. C'est
              exactement la cadence que le point 6 protège, et personne ne l'a
              signalé au tour 1 parce que Card 1 n'a jamais eu de liste.

OBJECTION   — Je réponds nommément à C1/C6 (`narratif-ia` vs mon propre tour 1).
              L'argument MESURÉ de `narratif-ia` (`certitude` ne décide de rien
              dans `atteignabilite.ts` l. 328, un `croit` éteint sa propre alerte
              exactement comme un `sait` sincère) l'emporte sur mon objection de
              registre : si la certitude n'est plus rendue par le modèle, elle n'a
              plus RIEN à afficher par ligne — mon `Badge tone="neutral"` aurait
              montré « Sait » sur 100 % des lignes, un badge constant qui ne
              porte aucune information, la définition même du bruit. Ma proposition
              de promouvoir `LIBELLES_CERTITUDE` vers `brain/` (C6) — de toute façon
              bloquée par le fichier interdit `BlocSavoirs.tsx` (même famille que
              TL-8) — devient sans objet dans cette branche.

PROPOSITION — (1) `LigneDetenteur` SANS `certitude` ni `Badge` de certitude : props
              réduites à `{nom, decision?, onAccepter, onRejeter, onOuvrirFiche}`.
              (2) Focus post-décision : après Accepter/Rejeter une ligne, le focus
              impératif (`useRef`, jamais miroir d'état) passe à l'Accepter de la
              PROCHAINE ligne non décidée, ou à « Lancer » si aucune ne reste — sans
              cette règle, KR-112 livre une liste inopérable au clavier après le
              premier geste. (3) Convergence sur le découpage à 6 fichiers du
              tech-lead ; je RETIRE mon découpage à 2 fichiers : forcer `BarreLancer`
              en composant commun est ce qui empêche la chorégraphie clavier
              (focus/Échap/Annuler) de diverger entre les deux cartes.

VERDICT     — recevable sous réserve : la gestion de focus post-décision et tous
              les textes de l'annexe, mot pour mot, au plan.
```

---

# ANNEXE

## A. Statut de chacun de mes points du tour 1

| Point | Statut | Motif |
|---|---|---|
| Objection tour 1 (registre à deux domiciles, `LIBELLES_CERTITUDE`) | **RETIRÉE** | Prémisse disparue : si `certitude` n'est plus rendue au modèle (C1 tranché en faveur de `narratif-ia`), rien n'est plus affiché par ligne — il n'y a plus de second domicile à créer. Je maintiens la DOCTRINE (un registre de langue ne vit jamais à deux endroits), je retire son APPLICATION à ce cas. |
| Proposition (1) — promouvoir `LIBELLES_CERTITUDE` vers `brain/` | **RETIRÉE** | Motif ci-dessus. *Contingence si le comité maintient la certitude au modèle : **MAINTENUE** telle quelle — mais alors `LigneDetenteur` doit aussi porter le critère de `narratif-ia` § 4 (« une liste de 3 ne peut pas être 3× "croit" sans que l'écran le dise »).* |
| Proposition (2) — extraction à 2 fichiers | **RETIRÉE au profit du découpage à 6 fichiers du tech-lead** | Sans `BarreLancer` partagé, la chorégraphie de focus (§ 3.5 de l'it1 + la règle nouvelle du point B) se réécrit deux fois et peut diverger sans qu'aucun test ne le voie — c'est mon propre terrain qui l'exige, pas seulement KR-112. |
| Proposition (3) — Card 2 lit les `Controle` du linter | **MAINTENUE** | Personne ne l'a contestée ; compatible avec `CibleIndice { indiceId }` (`entityId` du `Controle` = `indice.id`, vérifié `controles.ts` l. 882). |
| `LigneDetenteur` sœur, pas variante | **MAINTENUE, renforcée** | Sans `certitude`, elle n'a plus AUCUN champ en commun avec `LigneProposition`. |
| `open_question` — éditer la certitude | **MAINTENUE, reformulée** | Puisque le modèle ne la choisit plus : « l'auteur doit-il pouvoir changer `sait`→`croit`/`soupçonne` depuis Card 2 » — déjà possible via la fiche (`BlocSavoirs.tsx`), donc à confirmer que ce n'est PAS un besoin d'écran nouveau. Pas de code cette itération. |
| Jetons `--*` (§ F) | **MAINTENUE** | Re-vérifiés un par un dans `src/styles/tokens/{colors,spacing,typography}.css` : tous existent, aucun inventé. |
| REJETÉ § G n° 1 | **MAINTENUE** | *« REJETÉ — faire de `LigneDetenteur` une troisième `variante` de `LigneProposition`. Motif : `chemin`, `valeurAvant`, `valeurApres` — et désormais `certitude` elle-même — n'ont aucune valeur sémantique sur une ligne de détenteur ; les rendre optionnels casse la garantie de forme que `LigneProposition` porte pour Card 1, pour un gain nul. »* |
| REJETÉ § G n° 2 (retaper `LIBELLES_CERTITUDE` localement) | **SANS OBJET** | Plus de cible, `LigneDetenteur` n'affichant plus de certitude. Si le fallback certitude-au-modèle est retenu, ce REJETÉ redevient actif tel quel. |

## B. Les conflits nommés — ma position

**C1/C6 (certitude)** — je vote avec `narratif-ia` : le code écrit `CERTITUDE_INITIALE = 'sait'` pour tout détenteur accepté, comme le ferait l'auteur à la main. `LigneDetenteur` n'affiche aucun indicateur de certitude.

**C12 (voyant déplacé — `revelation-sans-porte`)** — **oui, l'auteur doit le voir venir, et AVANT le geste, pas après.** Un texte permanent (pas un état par ligne, pas de composant neuf) sous `CARD2_CORPS_ACTIF` :
> `TEXTE_SAVOIR_SANS_PORTE = "Un détenteur accepté sait l'indice sans condition de révélation posée — à ajouter ensuite dans sa fiche (Personnages → Savoirs)."`

Motif du choix « permanent et avant » : un avertissement qui n'apparaît qu'une fois l'acte commis est trop tard pour changer la décision, et un état par ligne aurait ajouté une prop pour un fait vrai pour TOUTES les lignes, tout le temps — une valeur constante n'est pas une donnée d'écran, c'est une phrase de corps.

**C13 (un candidat ou une liste)** — **liste**, 3 contre 1. La question posée au copilote a naturellement plusieurs réponses possibles, et un aller-retour par candidat (clic Lancer × N) casse la cadence que le clavier protège. Aucun changement à mon anatomie du tour 1 : c'était déjà une liste.

**C15 (texte de refus « trop-long », carte 2)** — nouveau texte dédié, PAS `TEXTE_REFUS_TROP_LONG` :
> `TEXTE_REFUS_TROP_LONG_DETENTEURS = "Le contexte est trop long pour désigner des détenteurs — ce dossier a trop de personnages, ou leurs fiches sont trop longues. Raccourcissez-les, dans Personnages."`

**KR-112** — je converge sur les 6 fichiers du tech-lead. Ajout depuis mon terrain : `styles.ts` porte AUSSI les styles aujourd'hui privés à `LigneProposition.tsx` (`actionsStyle`, `lienStyle`) — `LigneDetenteur` les réutilise depuis ce fichier commun, jamais recopiés, pour que le jeton du lien « Ouvrir la fiche » ne puisse pas diverger entre les deux cartes sans qu'un import casse.

## C. Le refus « cet indice n'est pas écrit » — le champ qu'il nomme, et pourquoi il ne passe pas par le registre

**Vérifié en source** : `LIBELLE_DES_CHAMPS` est épinglé à 4 entrées par `libelles.test.ts` l. 39-51 (`toHaveLength(4)`, liste littérale), et son en-tête (`libelles.ts` l. 13-15) exige que chaque entrée soit une extraction VERBATIM depuis sa « fiche d'origine ». La fiche d'origine de `verite` est `FicheIndice.tsx:131` (`label="VÉRITÉ"`), dans `dossier-registres` — **interdit**. Une 5ᵉ entrée casserait le test ET obligerait à sourcer depuis un fichier qu'on n'a pas le droit de lire comme source de vérité de registre.

**Ma tranche** : ni chemin détourné, ni refus muet — **un libellé qui ne passe pas par le registre**, en PROSE ordinaire, pas en atome d'écran. Précédent déjà dans ce fichier : `TITRE_AUCUN_PERSONNAGE` nomme « Personnages » sans passer par aucun registre de sections.
> `TEXTE_REFUS_INDICE_SANS_VERITE = "Cet indice n'a pas encore de vérité écrite — complétez d'abord sa fiche, dans Indices."`

Il nomme le champ par le mot français ordinaire « vérité » (minuscule, dans une phrase), jamais par l'atome MAJUSCULE `VÉRITÉ` que porte `Field label` — ce n'est donc pas un second domicile du même token discret.

**Point de contrat côté `brain/` que je signale sans le trancher** (hors mon domaine) : si `MotifRefusContexte.{motif:'a-ecrire'}` reste typé avec un `chemin: CheminLibelle` partagé entre les deux rôles, ce chemin est **irreprésentable** pour `indice-detenteurs` sans la 5ᵉ entrée que TL-8 rejette. Côté écran, je n'ai pas besoin de ce `chemin` : ce rôle n'a qu'UN champ REQUIS possible, donc `motif === 'a-ecrire'` sur ce rôle affiche TOUJOURS `TEXTE_REFUS_INDICE_SANS_VERITE`, sans lire aucun `chemin`.

## D. La liste vide de rangs — deux textes, deux emplacements, jamais confondus

`TEXTE_AUCUN_DETENTEUR_TROUVE` reste **inchangé** et couvre UNIQUEMENT le résultat vide d'UN appel : `"Le copilote n'a trouvé personne d'autre pour cet indice."` — `--text-muted`, pas de `⊘`.

L'absence de mémoire est une propriété PERMANENTE de « Lancer » (vraie qu'il y ait 0, 1 ou 3 résultats), donc elle ne vit **pas** dans le texte de résultat vide — l'auteur qui vient d'accepter 2 candidats et relance ne voit JAMAIS ce texte. Nouveau texte permanent, sous la barre « Lancer », visible dans tous les états :
> `TEXTE_MEMOIRE_ABSENTE = "Chaque lancer repart de zéro — un détenteur refusé peut revenir, un détenteur accepté jamais."`

Deux faits vérifiables (accepté ⇒ exclu de la table de rangs ; refusé ⇒ pas mémorisé), rien de plus.

## E. `estDisponible()` — le texte, corrigé après vérification de la vraie destination

**J'ai failli écrire « Réglages » — vérifié en source, ça n'existe pas.** `CloudSettingsService.isConfigured()` se règle via `CloudSyncSettings.tsx`, ouvert depuis la pastille `SyncIndicator.tsx`, « fixed, bas-droite », pas une section de navigation.
> `TITRE_COPILOTE_INDISPONIBLE = "Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant."`

Consommé par `BarreLancer` (partagée, écrite UNE fois), `title` du bouton désactivé, **priorité la plus haute** (avant « aucun personnage », avant « aucun constat »).

## F. CONTRAT DE DESIGN FINAL — Carte 2 « Tisser les indices »

### Anatomie (composants existants, aucun composant maison)

`Card` → `CarteAssistant` (coquille locale : `EYEBROW_ASSISTANT` + `Entete`, plus de `Badge "Bientôt"`) contenant, dans l'ordre visuel/Tab :

1. `<p>{CARD2_CORPS_ACTIF}</p>` — `corpsStyle` (`--text-body`) :
   `CARD2_CORPS_ACTIF = "Propose qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources."`
2. `<p>{TEXTE_SAVOIR_SANS_PORTE}</p>` — même style, `--text-muted`.
3. `Select` INDICE — `label="INDICE"`, options = `controlerDossier(dossier).controles.filter(c => c.id === 'indice-sans-source').map(c => ({value: c.entityId, label: c.location}))` ; vide → option unique désactivée `OPTION_AUCUN_INDICE_SIGNALE = "Aucun indice signalé"` ; `value` par défaut = premier constat.
4. Ligne de contexte : `<Badge tone={pastilleNiveau(constatCourant.niveau).tone}>{pastilleNiveau(constatCourant.niveau).texte}</Badge>` + `<p>{constatCourant.message}</p>` — message DU LINTER, verbatim.
5. `BarreLancer` (partagée avec Card 1) — « Lancer » (`LABEL_LANCER`), désactivé dans cet ordre de priorité : `!estDisponible()` → `TITRE_COPILOTE_INDISPONIBLE` ; sinon aucun personnage → `TITRE_AUCUN_PERSONNAGE` ; sinon aucun constat → `TITRE_AUCUN_INDICE_SIGNALE = "Ce dossier ne signale aucun indice manquant de détenteur ou de source."` ; sinon appel en cours. En cours : `role="status"`, `TEXTE_CHARGEMENT`, `LABEL_ANNULER`, `Échap` = Annuler, focus impératif Annuler à l'entrée / Lancer à la sortie (§ 3.5 de l'it1, désormais écrit une seule fois).
6. `<p>{TEXTE_MEMOIRE_ABSENTE}</p>` — permanent, `--text-muted`, sous la barre Lancer.
7. Refus SYNCHRONE (avant tout appel, `⊘` + `refusSyncStyle`, `--text-muted`) — dispatch par `motif` :
   - `'a-ecrire'` → `TEXTE_REFUS_INDICE_SANS_VERITE`
   - `'trop-long'` → `TEXTE_REFUS_TROP_LONG_DETENTEURS`
   - `'aucun-candidat'` → `TEXTE_REFUS_AUCUN_CANDIDAT = "Tous les personnages de ce dossier connaissent déjà cet indice — personne d'autre à désigner."`
   - `indisponible` → `TEXTE_INDISPONIBLE` (réutilisé) · `illisible` → `TEXTE_ILLISIBLE` (réutilisé)
8. Résultat : liste vide → `<p>{TEXTE_AUCUN_DETENTEUR_TROUVE}</p>` (pas de `⊘`) ; liste non vide → N `LigneDetenteur`, dans l'ordre rendu par le modèle, séparées par un filet `1px solid var(--border-rule)`.

### `LigneDetenteur` — props finales

```
{ nom: string; decision?: 'acceptee' | 'rejetee'; onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void }
```
- `nom` : résolu côté carte via `localiserEntite('pnj', personnage, index)` sur le `personnageId` re-résolu par `CopiloteService` — jamais recalculé par `LigneDetenteur`.
- `decision === undefined` : `<span>{nom}</span>` (`--font-ui`, `--fs-body`, `--text-body`) + paire `IconButton` `+`/`×` (`tone="accent"`/`"danger"`, labels réutilisés `LABEL_ACCEPTER`/`LABEL_REJETER`).
- Décidée : `Badge tone={acceptee ? 'accent' : 'muted'}` (`BADGE_ACCEPTE`/`BADGE_REJETE`) + sur acceptée seulement `LIEN_OUVRIR_FICHE` → `onSelectSection('personnages')`.
- Styles (`actionsStyle`, `lienStyle`) importés de `components/styles.ts`, partagés avec `LigneProposition`.

### État — gel au lancement (généralisation du `valeurAvantGelee` de l'it1)

Le constat sélectionné (`entityId`, `location`, `message`, `niveau`) est capturé dans un état d'écran au clic « Lancer », jamais relu en direct : si l'acceptation du premier détenteur fait sortir l'indice de la liste `indice-sans-source`, la ligne de contexte et la liste en cours de décision restent celles gelées à l'instant du lancer.

### Comportement clavier (ergonomie de rédaction, pas accessibilité)

- Tab suit l'ordre visuel ; dans la liste, chaque `LigneDetenteur` expose `+` puis `×` avant le lien de la ligne suivante.
- Entrée sur un bouton actif = clic (natif).
- Échap pendant `en-cours` = Annuler (porté par `BarreLancer`, partagé).
- **Nouveau, propre à la liste** : après Accepter/Rejeter, le focus (`useRef`, geste impératif, jamais un effet miroir — KR-013/113) se pose sur le `+` de la PROCHAINE ligne `decision === undefined` ; s'il n'en reste aucune, il revient à « Lancer ».

### États vides — récapitulatif des textes discriminants

| Cas | Texte |
|---|---|
| Aucun personnage | `TITRE_AUCUN_PERSONNAGE` (réutilisé) |
| Copilote non configuré | `TITRE_COPILOTE_INDISPONIBLE` (neuf, partagé par les deux cartes) |
| Aucun indice signalé | `OPTION_AUCUN_INDICE_SIGNALE` + `TITRE_AUCUN_INDICE_SIGNALE` |
| Refus — vérité manquante | `TEXTE_REFUS_INDICE_SANS_VERITE` |
| Refus — contexte trop long | `TEXTE_REFUS_TROP_LONG_DETENTEURS` |
| Refus — aucun candidat | `TEXTE_REFUS_AUCUN_CANDIDAT` |
| Succès — liste vide | `TEXTE_AUCUN_DETENTEUR_TROUVE` |
| Permanent — pas de mémoire | `TEXTE_MEMOIRE_ABSENTE` |
| Permanent — voyant déplacé | `TEXTE_SAVOIR_SANS_PORTE` |

Tous distincts entre eux et des quatre textes de l'it1.

---

**Fichiers lus** : les 5 notes du tour 1 + cadrage ; SKILL.md ; `textes.ts` ; `PanneauCopilote.tsx` ; `LigneProposition.tsx` ; `brain/dossier/{libelles,libelles.test,pastilles,controles}.ts` ; `dossier-fiches/components/BlocSavoirs.tsx` ; `dossier-registres/components/FicheIndice.tsx` ; `brain/CopiloteService.ts` ; `brain/CloudSettingsService.ts` ; `cloud-sync/components/{SyncIndicator,CloudSyncSettings}.tsx` ; `src/styles/tokens/{colors,spacing,typography}.css`. Aucun fichier écrit.
