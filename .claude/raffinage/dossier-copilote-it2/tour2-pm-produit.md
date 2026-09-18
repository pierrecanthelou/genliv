# Tour 2 — `pm-produit` · `dossier-copilote` it2

```
RISQUE      — Le risque a changé de nature : ce n'est plus « anatomie non
              tranchée » (réglé, voir statut ci-dessous) mais « la démo de
              porte 2 capture un REFUS et personne ne le remarque avant
              l'humain ». Sur `dossier-reference.json` non modifié, le seul
              indice flaggé par `indice-sans-source` (`trace-du-guet`) a
              `verite` vide → refus `a-ecrire` nommé par `narratif-ia`. Sans
              script de démo explicite, un ouvrier capture ce refus en
              croyant montrer une acceptation.

OBJECTION   — Je réponds nommément à `tech-lead` §G.6 (C12) : accepter un
              détenteur allume `revelation-sans-porte` en éteignant
              `indice-sans-source`. Ce n'est PAS un déplacement de voyant
              cosmétique — les deux alertes portent des faits différents
              (absence de détenteur vs absence de porte de révélation), et
              le `goal` ne promet que « qui d'autre pourrait le savoir »,
              jamais « rendre l'indice jouable ». Valeur réelle, à condition
              que rien dans les textes ne prétende « résolu » — vérifié :
              aucun texte drafté par l'UX ne le fait.

PROPOSITION — Sur C11 (ma question) : ne pas toucher `dossier-reference.json`
              (accord avec le tech-lead). Deux usages, deux dossiers : (a)
              tests automatisés → clone mutable (`cloneReference()` +
              `verite` ajoutée), jamais le fichier ; (b) démo humaine de
              porte 2 → l'auteur ÉCRIT D'ABORD la vérité de `trace-du-guet`
              via l'éditeur de fiche déjà livré (geste hors code, hors
              périmètre de cette itération), PUIS ouvre le copilote. Zéro
              lot ajouté.

VERDICT     — recevable sous réserve : la précondition « vérité écrite
              d'abord » doit figurer littéralement dans le script de démo
              ET dans un critère d'acceptation, sinon la porte 2 valide un
              refus en le prenant pour un succès.
```

---

## STATUT DE MES OBJECTIONS ET PROPOSITIONS DU TOUR 1

**Objection tour 1** (« un ou plusieurs candidats par appel — lacune non tranchée ») → **RETIRÉE**. Motif : elle est tranchée, pas par mon vote mais par convergence indépendante de trois rôles (`tech-lead` : `DetenteursRendus { detenteurs: DetenteurRendu[] }` ; `ux-designer` : `LigneDetenteur` en liste ; `narratif-ia` : sortie `{"detenteurs": [...]}`, `PROPOSITIONS_MAX = 3`, liste vide légale) — et le `goal` dit « CHAQUE détenteur proposé », pluriel qu'une lecture « un candidat par appel » forçait à ignorer.

**Proposition 1** (point de départ = liste filtrée par `Controle` `indice-sans-source`, jamais un rebalayage) → **MAINTENUE**. Confirmée à l'identique par l'UX et par le tech-lead. Aucun désaccord.

**Proposition 2** (UN candidat par appel) → **RETIRÉE**, même motif. Je ne maintiens pas une anatomie que les trois autres rôles ont indépendamment rejetée pour la même raison — et `LigneDetenteur` n'a rien à hériter de `LigneProposition`, donc pas de composant réutilisé perdu en changeant d'anatomie.

**Proposition 3** (hors périmètre) → **MAINTENUE**, confirmée mot pour mot par `narratif-ia` (§ 2 et § 11.1). Liste définitive ci-dessous.

**Proposition 4** (`estDisponible()` hors de mon domaine ; si retenu, pas d'écran neuf) → **MAINTENUE**. Le tech-lead tranche « on la consomme » en ~4 lignes, exactement dans l'esprit que je posais en réserve. Je confirme (C14) : pas d'objection.

## Les cinq conflits, un par un

- **C13** → tranché : liste, plafonnée à 3, vide légale. Mon objection est **retirée**, pas maintenue.
- **C11** → ne pas toucher la fixture partagée ; démo humaine = geste d'auteur ordinaire (écrire la vérité avant d'ouvrir le copilote) ; tests automatisés = clone mutable. **Je transforme cette exigence en critère obligatoire**, sinon veto sur « valeur utilisateur nulle » — une itération qui ne peut démontrer une acceptation nulle part n'a rien livré.
- **C12** → valeur réelle, pas cosmétique, à condition que l'écran ne prétende jamais « résolu ». `dossier-controles` recalcule déjà et affichera la nouvelle alerte sans nouveau code.
- **C1** → **je rejoins `narratif-ia`**, contre l'inclusion de `certitude` dans la sortie modèle. L'auteur ne perd **rien de fonctionnel** — `certitude` ne pèse pas sur l'atteignabilité (mesuré) — et garde son geste de correction habituel sur la fiche. Il gagne qu'aucune assertion non vérifiée (« ce personnage CROIT un fait ») n'entre dans son dossier au nom d'un clic. Ce n'est pas un veto de mon poste, mais je pose l'objection produit : `CERTITUDE_INITIALE = 'sait'` posé par le code, jamais rendu par le modèle.
- **C14** → confirmée, voir Proposition 4.

## Phrase de démo — inchangée, mais avec précondition écrite

« À la fin de cette itération, l'auteur peut confier un indice mal servi à un personnage que le copilote lui désigne. »

**Ajout obligatoire au script de démo et à un critère d'acceptation** : *« Étant donné un indice signalé par `indice-sans-source` dont l'auteur a déjà écrit la vérité, quand il lance le copilote et accepte un détenteur proposé, alors un `Savoir` est ajouté au personnage désigné. »* — sans cette précondition, la démo capturée sur le dossier de référence brut est un refus, pas une acceptation.

## Hors périmètre — liste définitive

`revele_comment` (non injecté, non affiché) · création/édition des portes `revele_si` et `mene_a` · création d'un nouvel indice · création d'un nouveau personnage (désignation parmi l'EXISTANT seulement) · édition de la `certitude` proposée avant acceptation (nouvelle `open_question` de l'UX, candidate it3/it4, **pas fusionnée** avec la n° 3 existante) · exclusion des candidats refusés lors d'une relance / toute mémoire de session sur les refus (REPORTÉ par `narratif-ia`) · toute UI ou traitement actif de la nouvelle alerte `revelation-sans-porte` (elle reste visible via `dossier-controles`, déjà livré — zéro code neuf) · modification de `dossier-reference.json` · tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`.

Aucun lot ajouté par mes soins à ce tour — je retire plus que je ne propose.
