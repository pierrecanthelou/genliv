# Tour 2 — `ux-designer`

**VERDICT** : recevable.

**RETRAIT** — l'objection du tour 1 (`amorce.ts` non lu) est **levée** : lu en entier, les quatre lignes définitives sont réconciliées avec son texte, sans contradiction ni recopie littérale de ses phrases. **Second retrait** : ma prescription « 11ᵉ position dans le même `<nav>` » — le placement relève de l'architecture, pas de mon domaine.

**MAINTIEN** — non contestés, donc inchangés : aucun sous-titre sous « Contrôles » (une `cle` y serait toujours inventée) ; mapping des trois `NiveauControle` dès it1, INFO compris ; aucune coche verte ni chip « jouable » ; anatomie de ligne (pastille en premier enfant d'un `<li>` en `row`, puis un second enfant en colonne portant OÙ / QUOI / QUOI FAIRE aux jetons d'`IssueList`). Seule change l'interactivité de la ligne.

## Réponses nommées

**D6 (narratif)** — je **compose**, je ne tranche pas d'un bloc. Chaque QUOI s'ouvre sur le manque (« Ce texte porte encore le marqueur … ») — le repère qu'un auteur cherche en premier sur un dossier neuf — puis se ferme sur la **conséquence par destination**, qui seule distingue bloquant d'alerte. KR-199/KR-222 est tenu sans perdre le signal de manque.

**D4 (tech-lead, QA)** — transparent côté design : même `ListRow`, même mécanisme `selected`, même absence de sous-titre, quel que soit le placement.

**D3 (tech-lead)** — accepté, reporté.

## Textes définitifs

`${MARQUEUR_A_ECRIRE}` désigne l'**interpolation** de la constante importée — jamais le glyphe en source. Ordre de rendu : le bloquant, puis `synopsis_mj`, `accroche_joueur`, `ton`.

1. `charpente.depart.texte_ouverture_joueur` — **BLOQUANT**, section `depart`
   OÙ : `DÉPART · TEXTE D'OUVERTURE — lu par le joueur, mot pour mot`
   QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le moteur le lira au joueur mot pour mot, marqueur compris. »
   QUOI FAIRE : « Rédigez le texte que le joueur doit lire en arrivant. »
2. `canon.mj.synopsis_mj` — **ALERTE**, section `canon`
   OÙ : `CANON · SYNOPSIS — matériau du modèle, jamais lu tel quel`
   QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le synopsis partira tel quel dans le contexte du modèle. »
   QUOI FAIRE : « Rédigez le synopsis qui orientera le modèle sur l'intrigue. »
3. `canon.partage.accroche_joueur` — **ALERTE**, section `canon`
   OÙ : `CANON · ACCROCHE — matériau du modèle, jamais lu tel quel`
   QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : l'accroche partira telle quelle dans le contexte du modèle. »
   QUOI FAIRE : « Rédigez l'accroche qui donnera envie de commencer. »
4. `canon.ton` — **ALERTE**, section `canon`
   OÙ : `CANON · TON — matériau du modèle, jamais lu tel quel`
   QUOI : « Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : le ton partira tel quel dans le contexte du modèle. »
   QUOI FAIRE : « Rédigez le ton qui doit guider le modèle — ambiance, registre, limites. »

**État calme** : « Aucun contrôle à signaler — le dossier passe tous les contrôles connus. » Jamais « les quatre proses » (faux dès it3), jamais `✓`.

Vérification anti-recopie contre `amorce.ts` : aucune des quatre lignes ne reprend « la vérité de cette aventure… », « ce que le joueur sait… » ni « par exemple : sombre et feutré » — ces phrases restent la consigne du champ, pas le constat du linter.

## Clavier

**Version A — abandonnée** : lignes en `<button>` natifs appelant `onSelect(controle.section)`, focus reporté. Retirée avec D3.

**Version B — repli, RECOMMANDÉE** : les lignes de `ListeControles` perdent toute interactivité — `<li>` sémantique, aucun `role="button"`, aucun `tabindex`, aucun `onClick`. L'entrée « Contrôles » reste un `ListRow` identique aux dix autres : Tab l'atteint, Entrée ou Espace l'active par le même canal `onSelect`, et le focus **reste sur la ligne de nav activée** — le comportement déjà en place aujourd'hui, aucun contrat nouveau à inventer. À l'intérieur du panneau, aucun arrêt de tabulation.

Conséquence : une ligne de rapport n'a plus qu'un seul état — affiché. Pas de survol, pas de sélection, pas de focus : ce ne sont plus des cibles, ce sont des constats à lire.
