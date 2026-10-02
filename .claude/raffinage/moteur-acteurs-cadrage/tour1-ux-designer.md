# Cadrage n°12 `moteur-acteurs` — Tour 1 — UX Designer

## RISQUE
Le dialogue de PNJ est de la fiction lue par le joueur (réplique à la 2e personne présent) : risque réel de créer un second afficheur concurrent du canal RÉCIT (PlayerInputBar/journal), exactement l'erreur commise puis auto-corrigée en moteur-arbitre it2 (OutcomeBlock propre à CarteJet, rejeté). Risque jumeau sur le « carnet d'indices » : en faire un nouvel array d'UI dupliquerait `FaitsDeSession.indices_connus` au lieu de le projeter.

## OBJECTION
Le roadmap écrit « un appel par PNJ qui parle » sans dire comment le joueur déclenche ce PNJ. Si c'est un sélecteur de PNJ dédié, c'est une surface neuve non comptée dans les 4 itérations. Si c'est la commande texte existante (« parler à Aldric »), aucune surface neuve n'est nécessaire pour l'initiation — cohérent avec le gate structurel déjà retenu pour `agir`.

## PROPOSITION
(a) La `replique` du PNJ passe par le canal RÉCIT existant, jamais une nouvelle carte-popup. (b) `jet_demande?` (persuasion/intimidation/lecture) réutilise `CarteJet` tel quel — même composant, pas un clone « CarteJetDialogue ». (c) `indices_reveles` s'ajoute à `session.monde.indices_connus`, jamais un second tableau. (d) Carnet d'indices = nouveau composant feature-local qui PROJETTE `indices_connus` résolus contre le registre `monde.indices` (label + `description_joueur`), via `ListRow`/`Card`/`Badge` — jamais une liste maison. État vide : « Aucun indice découvert pour l'instant — explorez, parlez, fouillez. » (e) Registre : `replique` = fiction vouvoyée immersive ; libellés d'UI (bouton ouvrir carnet, en-têtes) = mono majuscules. (f) `delta_confiance` n'est JAMAIS un chiffre affiché au joueur — même famille que marge/TC en it2 — silencieux côté moteur sauf dérogation explicite au cadrage.

## VERDICT
Recevable sous réserve : (a)+(b)+(c) sont des conditions bloquantes (veto sinon), (d) ouvre une nouvelle surface mais composée uniquement de primitives existantes.

---

## ANNEXE (hors quota) — Contrat de design (découpage vertical, niveau cadrage)

### Surfaces/composants impliqués (par brique candidate, détail pixel laissé au /raffiner)

**Brique 1 — déclenchement + réplique simple (sans savoir filtré ni jet)**
- Pas de nouveau composant visuel. Le joueur tape « parler à {nom} » dans `PlayerInputBar` (existant, canal unique de saisie libre, cohérent avec `agir`/`aller`).
- La `replique` de R4 s'ajoute au journal comme une entrée de plus du canal RÉCIT (même mécanisme que la narration de R3), affichée par le même afficheur — **aucun nouveau composant d'affichage de prose**.
- Registre : `replique` est de la fiction — 2e personne, présent, immersive (« Aldric vous jette un regard las. "Encore vous ?" »). Jamais de didascalie technique dans ce texte (pas de « [confiance +1] »).
- États : si le PNJ est absent du lieu courant ou mort → message système (pas une réplique IA) : « {Nom} n'est pas ici. » / « {Nom} n'est plus de ce monde. » — ton neutre, registre interface, pas fiction.
- Clavier : aucun changement — `PlayerInputBar` déjà opérable au clavier (Entrée valide), le focus reste dans le champ après la réponse (même limitation connue que la dette reportée en moteur-arbitre it2 — le retour de focus après récit — qui touche aussi ce flux et doit être réglée AVANT ou AVEC cette feature si elle rouvre `Field`).

**Brique 2 — savoirs filtrés + indices révélés + carnet**
- Nouveau composant feature-local `play-mode/components/CarnetIndices.tsx`. Déclenché par un `IconButton` (glyphe 🗝, cohérent avec la liste Unicode autorisée) dans le bandeau/toolbar de l'écran de partie — PAS un nouveau bouton custom, étendre le composant `IconButton` existant.
- Contenu : tiroir (pas de box-shadow sauf si modale — à trancher au raffinage si c'est un `Modal` ou un panneau latéral inline ; si `Modal`, suit le contrat Modal existant : Échap ferme, focus revient au `IconButton` déclencheur).
- Chaque indice = `ListRow` : libellé = nom interne de l'indice (mono, MAJUSCULES courtes) + `description_joueur` en dessous (registre fiction, lecture seule). AUCUN texte interne (`texte_mj`/condition de révélation) n'apparaît — audience `auteur`/`ia` seulement.
- Dérivation stricte : la liste vient de `session.monde.indices_connus` (ids) résolus contre `monde.indices[]` du dossier — jamais un état miroir local, jamais un second écrivain.
- État vide (carnet jamais ouvert ou aucun indice) : placeholder « Aucun indice découvert pour l'instant — explorez, parlez, fouillez. », style `--text-label`, pas de bordure accent (ce n'est pas une affordance d'ajout d'auteur, c'est un vide de lecture joueur — distinct de la règle « + Ajouter » qui vaut côté édition).
- Badge « NOUVEAU » (tone neutre, jamais `--good`/`--bad` qui restent réservés réussite/échec de jet) sur l'indice gagné au tour courant — à confirmer utile au raffinage, sinon omis en it1 de cette brique.

**Brique 3 — jet de révélation (persuasion/intimidation/lecture)**
- `CarteJet` réutilisé tel quel (déjà pur, props `carteJet`/`onLancer`) — zéro variante. Le contexte de la caractéristique (`caracLabel`) suffit à distinguer visuellement une épreuve de dialogue d'une épreuve d'action ; pas de libellé « ÉPREUVE DE DIALOGUE » ajouté sans nécessité fonctionnelle.
- `enjeu_reussite`/`enjeu_echec` restent à l'infinitif, 3e personne (précédent it2 — un fragment vouvoyé casserait le bloc CE PAS).

**Brique 4 (si retenue) — confiance et plans de PNJ**
- `delta_confiance` : aucun affichage chiffré au joueur. Si un signal est jugé nécessaire, il passe par la PROSE de la réplique suivante (le PNJ se montre plus chaleureux/froid), jamais par un badge numérique — tenir le même principe que marge/TC en it2.

### Composants du design system réutilisés
`ListRow`, `Card` (prop `shadow?` déjà ajouté en it2), `Badge` (tones `good`/`bad` réservées, prévoir un tone neutre existant pour « nouveau »), `IconButton`, `Modal` (si tiroir = modale), `PlayerInputBar` (canal saisie + canal récit, inchangé).

### Composant à créer
`CarnetIndices.tsx` (feature-local, play-mode) — seul composant neuf proposé à ce stade. Aucun autre composant maison.

### Registres de langue — table de vigilance
| Élément | Registre | Exemple |
|---|---|---|
| `replique` du PNJ | Fiction, 2e personne, présent | « Aldric soupire. "Vous encore ? Je n'ai rien de plus à dire." » |
| `description_joueur` d'un indice (carnet) | Fiction, lecture seule | « Un bout de tissu déchiré, encore taché de boue fraîche. » |
| Nom interne de l'indice (libellé carnet) | Interface, mono MAJUSCULES | `TISSU DÉCHIRÉ` |
| Message système (PNJ absent/mort) | Interface, neutre | « {Nom} n'est pas ici. » |
| Libellé bouton carnet | Interface, mono | `INDICES` ou icône seule 🗝 + badge compteur |

### ESLint proposée
Même famille que `moteur-arbitre` : interdire tout import de `src/player/components/{HeroStatusBar,CharacterCreationScreen}` depuis `src/features/moteur-acteurs/**` (précédent exact, à reconduire). Ajouter une règle ciblée interdisant un second composant local nommé `*OutcomeBlock*`/`*Recit*`/`*Replique*` sous `moteur-acteurs/components/` qui ne soit pas `CarnetIndices` ou une réexportation — matérialise le veto « pas de second afficheur » sans dépendre de la seule revue humaine.

---

## Décisions prises en autonomie faute de spécification

- Mode de déclenchement du dialogue (commande texte libre vs sélecteur de PNJ dédié) → j'ai supposé la commande texte libre via `PlayerInputBar`, par cohérence avec le gate structurel déjà retenu pour `agir`/`aller` → si c'est l'inverse (sélecteur dédié de PNJ présents), il faut une surface neuve (liste des PNJ du lieu, probablement un `ListRow` dans un panneau) non comptée ici, et une itération de plus.
- Visibilité de `delta_confiance` → j'ai choisi : jamais un chiffre affiché, uniquement un effet indirect dans la prose de la réplique suivante → si c'est l'inverse (jauge/badge numérique visible), cela rouvre la règle « jamais les chiffres » tranchée en moteur-arbitre it2 et demande un arbitrage explicite du comité, pas une extension silencieuse.
- Forme du carnet d'indices (tiroir modal vs panneau latéral permanent) → j'ai supposé un tiroir ouvrable via `IconButton`, pour ne pas alourdir en permanence un écran de partie déjà chargé (bandeau + journal + console) → si c'est l'inverse (panneau permanent), l'écran de partie doit se redécouper en deux colonnes dès l'itération qui le livre, un changement de layout plus large que cette feature seule.
