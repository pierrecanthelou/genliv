# Tour 1 — `ux-designer` · `dossier-copilote` it2

**RISQUE** — Le panneau accueille une SECONDE carte active avec sa propre boucle demander/accepter-un-par-un/vide-mais-réussi, sur un fichier déjà à 421 lignes. Le risque n'est pas visuel, il est lexical : `certitude` a DÉJÀ un registre français ailleurs dans le dépôt (`LIBELLES_CERTITUDE` dans `dossier-fiches/components/BlocSavoirs.tsx` — `sait→'Sait'`, `croit→'Croit'`, `soupconne→'Soupçonne'`), et si l'it2 le retape localement (isolation de feature oblige, `dossier-copilote` ne peut pas importer `dossier-fiches`), le même mot aura deux orthographes de fait le jour où l'une des deux dérive.

**OBJECTION** — Sur la définition écrite : `LIBELLES_CERTITUDE` n'est PAS promu dans `brain/`, alors que `CERTITUDES`/`CERTITUDE_INITIALE` le sont déjà (`brain/dossier/types.ts`, ré-exportés par `brain/index.ts`). Un registre de langue à deux domiciles est exactement le défaut que je dois bloquer.

**PROPOSITION** — (1) Promouvoir `LIBELLES_CERTITUDE` (3 entrées) vers `brain/dossier/types.ts`, ré-exporté par `brain/index.ts` ; `dossier-fiches` et `dossier-copilote` importent la MÊME table. (2) Extraire `CarteCompleterFiche.tsx` (corps actuel de la Card 1) et ajouter `CarteTisserIndices.tsx` sœur ; `PanneauCopilote.tsx` redevient une coquille de composition (~110-130 lignes), chaque carte porte son anatomie dans son propre fichier — sert le design (une carte = un fichier = un contrat lisible) autant que KR-112. (3) Card 2 lit les CONSTATS du linter (`controlerDossier(dossier).controles.filter(c => c.id === 'indice-sans-source')`), jamais `dossier.monde.indices` en direct — le `Select` INDICE est peuplé par `c.location` (`localiserEntite('indice', …)` déjà appliqué par le linter), et affiche la sévérité via `pastilleNiveau(c.niveau)` déjà promu — aucune couleur neuve inventée.

**VERDICT** — recevable sous réserve (promotion de `LIBELLES_CERTITUDE`, textes exacts de l'annexe repris tels quels).

---

## ANNEXE — Contrat de design, Card 2 « Tisser les indices »

### A. Ce qui existe déjà et doit être RÉUTILISÉ, jamais retapé

| Besoin | Source existante | Où |
|---|---|---|
| Désignation d'un indice flagué | `localiserEntite('indice', indice, index)` | `brain/utils/references.ts`, déjà utilisé par `controles.ts:880` |
| Désignation d'un personnage proposé | `localiserEntite('pnj', personnage, index)` | déjà utilisé par `PanneauCopilote.tsx:228` (Card 1) |
| Sévérité du constat (bloquant/alerte) | `pastilleNiveau(niveau)` → `{texte, tone}` | `brain/dossier/pastilles.ts`, déjà consommé par `ListeControles.tsx` et la nav (2 appelants, KR-109 déjà réglé) |
| Constats à lister | `controlerDossier(dossier).controles.filter(c => c.id === 'indice-sans-source')` | `brain/dossier/controles.ts` — **jamais** un rebalayage de `monde.indices` par la feature |
| Libellés de certitude | **À PROMOUVOIR** : `LIBELLES_CERTITUDE` (local à `dossier-fiches/components/BlocSavoirs.tsx:38`) → `brain/dossier/types.ts`, ré-exporté par `brain/index.ts`, à côté de `CERTITUDES`/`CERTITUDE_INITIALE`. Deux consommateurs après promotion = second appelant justifiant KR-109. |

### B. Anatomie de la Card 2 (active)

- `Entete` (composition locale déjà en place) : `eyebrow="ASSISTANT"`, `title="Tisser les indices"`. Plus de `Badge tone="muted"` « Bientôt » — la carte quitte définitivement l'état futur.
- **Corps** (présent, jamais futur) : `CARD2_CORPS_ACTIF = "Propose qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources."`
- **`Select` INDICE** : `label="INDICE"`. Options construites depuis les `Controle` filtrés (`id === 'indice-sans-source'`), PAS depuis `dossier.monde.indices` : `{value: c.entityId, label: c.location}`. `value` par défaut : premier constat de la liste.
  - Sous le `Select`, une ligne de contexte, **jamais retapée** : `<Badge tone={pastilleNiveau(constatCourant.niveau).tone}>{pastilleNiveau(constatCourant.niveau).texte}</Badge>` + `<p>{constatCourant.message}</p>` (`--text-muted`, mêmes styles que `refusSyncStyle` de Card 1) — c'est le message DU LINTER, verbatim.
- **Bouton « Lancer »** : identique à Card 1. Désactivé si : (1) `personnages.length === 0` → `title={TITRE_AUCUN_PERSONNAGE}` (RÉUTILISÉE) ; (2) sinon aucun constat → `title={TITRE_AUCUN_INDICE_SIGNALE}` ; (3) sinon appel en cours.
- **État de chargement** : IDENTIQUE au § 3.5 de l'it1 (région `role="status"`, « Le copilote réfléchit… » + Annuler, focus impératif, Échap = Annuler).
- **Liste des détenteurs proposés** : N `LigneDetenteur` (nouveau composant local, PAS une variante de `LigneProposition`).

### C. `LigneDetenteur` — nouveau composant local, sœur de `LigneProposition`, PAS une variante

`LigneProposition` est câblée sur `chemin: CheminLibelle` + `Field` REMPLISSAGE/REMPLACEMENT : props sans aucun sens pour un détenteur. Forcer `LigneDetenteur` dedans obligerait des props optionnelles mutuellement exclusives sur un composant qui n'en a pas aujourd'hui — ici c'est la RÉUTILISATION forcée qui serait la faute, pas l'ajout d'une sœur.

    props: { nom: string; certitude: Certitude; decision?: 'acceptee' | 'rejetee'; onAccepter; onRejeter; onOuvrirFiche }

- Ligne : `<span>{nom}</span>` (`--font-ui`, `--fs-body`, `--text-body`) + `<Badge tone="neutral">{LIBELLES_CERTITUDE[certitude]}</Badge>` (certitude **lecture seule** — jamais une `SegmentedControl` : elle invite au geste, un `Badge` ne l'invite jamais).
- `decision === undefined` : même paire `IconButton` `+`/`×` (tons `accent`/`danger`) que `LigneProposition`.
- Décidée : `Badge tone={accent|muted}` `BADGE_ACCEPTE`/`BADGE_REJETE` (réutilisées) + sur acceptée seulement `LIEN_OUVRIR_FICHE` → `onSelectSection('personnages')`.

### D. `open_question` n° 3 — la certitude se pose différemment, et je tranche : PAS la même question

L'it1 différait « éditer un `Field` de PROSE LIBRE avant acceptation » — risque de contenu (KR-223, audience). Éditer la `certitude`, c'est choisir parmi **trois chaînes fermées**. Ce n'est PAS la même famille de risque. **Mais** je recommande de NE PAS l'ouvrir dans cette tranche : le `goal` dit « accepte ou refuse », pas « accepte, refuse ou corrige » — l'ajouter élargirait la démo au-delà de sa phrase sans « et ». Je pose une **nouvelle** `open_question` distincte de la n° 3 (ne pas les fusionner, ce serait perdre la distinction) : *« Éditer la CERTITUDE d'un détenteur proposé avant acceptation — enum fermée, risque bas, candidate naturelle it3/it4. »*

### E. Les trois textes vides — exacts

| Cas | Texte | Où |
|---|---|---|
| Aucun personnage dans le dossier | `TITRE_AUCUN_PERSONNAGE` (RÉUTILISÉE) | `title` du Lancer désactivé, Card 2 |
| Aucun indice signalé par le linter | `OPTION_AUCUN_INDICE_SIGNALE = "Aucun indice signalé"` (option unique désactivée) + `TITRE_AUCUN_INDICE_SIGNALE = "Ce dossier ne signale aucun indice manquant de détenteur ou de source."` | `Select` INDICE + Lancer |
| Vide-mais-réussi | `TEXTE_AUCUN_DETENTEUR_TROUVE = "Le copilote n'a trouvé personne d'autre pour cet indice."` — remplace la zone liste, PAS de préfixe `⊘` (réservé aux refus SYNCHRONES pré-appel, § 3.6 de l'it1 : ici l'appel a eu lieu et a réussi), `--text-muted`, registre calme | sous « Lancer » |

Ces trois textes sont discriminants entre eux ET des quatre textes de l'it1 (`indisponible`/`illisible`/`refuse a-ecrire`/`refuse trop-long`).

### F. Jetons `--*` — tous vérifiés existants dans `src/styles/tokens/{colors,spacing}.css`, aucun nouveau

`--text-muted`, `--text-body`, `--text-label`, `--text-strong`, `--text-disabled`, `--text-on-accent`, `--surface-card`, `--surface-inset`, `--surface-sunken`, `--border-field`, `--border-card`, `--border-rule`, `--accent`, `--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-body`, `--fs-title`, `--track-eyebrow`, `--r-md`, `--hit-target`, `--space-1/3/4/8/10/12`. Badge `tone` fermé : `neutral | muted | accent | good | bad` — `good`/`bad` hors de portée ici (aucun jet de dé).

### G. Registre des désaccords (recopiable tel quel)

- **REJETÉ** (si un ouvrier faisait de `LigneDetenteur` une troisième `variante` de `LigneProposition`) : motif — `chemin`, `valeurAvant`, `valeurApres` n'ont aucune valeur sémantique sur un détenteur ; les rendre optionnels casse la garantie de forme que `LigneProposition` porte pour Card 1, pour un gain nul (aucune ligne de style réellement partagée entre `Field` diff et `Badge` certitude).
- **REJETÉ** (si un ouvrier retapait `LIBELLES_CERTITUDE` localement plutôt que de la promouvoir) : motif — deuxième domicile pour le même mot français, dérive silencieuse jamais testée par un grep inter-features.

Fichiers lus : SKILL.md, cadrage, `dossier-copilote-it1.plan.md` (§ 3), `PanneauCopilote.tsx`, `LigneProposition.tsx`, `textes.ts`, `specification.json` (open_questions), `brain/dossier/controles.ts`, `brain/dossier/types.ts`, `brain/components/{Badge,Select,IconButton}.tsx`, `brain/dossier/pastilles.ts`, `dossier-controles/components/ListeControles.tsx`, `dossier-fiches/components/BlocSavoirs.tsx`.
