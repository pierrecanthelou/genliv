# Tour 2 — PM Produit — dossier-canon it4

**RISQUE** — Le fait nouveau déplace mon risque, il ne l'éteint pas. La corruption silencieuse est écartée (SSOT bloque déjà `depart.lieu_id` pendant). Le risque résiduel est une mauvaise lecture de ce fait : conclure « le blocage est acquis, donc le retrait n'a plus besoin d'être construit à l'écran » — et livrer une fiche sans bouton retirer. Ça violerait AC#8 (« ajouté ou supprimé » met à jour le compteur), déjà dans la spec, pas une invention du raffinage.

**OBJECTION** — Maintenue en partie, résolue en partie : AC#8 tranche déjà que la suppression est dans le goal — ce n'est plus une question ouverte de périmètre. Ce qui reste à écrire dans la définition, c'est le mécanisme (Modal + bandeau Refus existant), pas l'opportunité.

**PROPOSITION** — Lot 2 doit livrer le retrait complet : bouton `IconButton tone="danger"` + `Modal` de confirmation (précédent chiffré par UX) pour tout lieu, et vérifier que le retrait du lieu de `charpente.depart` remonte le bandeau `Refus` déjà câblé — zéro règle neuve dans `tables.ts`/`validate.ts`. Le test QA #2 (orphelin) devient un test d'intégration UI sur un comportement SSOT déjà prouvé, pas un test de règle neuve.

**VERDICT** — Recevable, condition satisfaite par les annexes tour1 (tech-lead lot 2, UX contrat Modal) : la suppression, avec confirmation et bandeau de refus, est explicitement dans le lot feature de cette itération.

---

## RÉPONSES TOUR 2

**Réponse au tech-lead et à l'UX, sur « la suppression doit-elle être tranchée dans cette itération ? »** — Oui, et ce n'est pas une décision de raffinage à prendre aujourd'hui : elle est **déjà prise**, par AC#8 (feature-level, cité dans ma propre note tour1) qui exige qu'un lieu « ajouté **ou supprimé** » mette à jour le compteur. Reporter la suppression à une it5 romprait la clôture de feature annoncée par le roadmap (3/4 → 4/4). Le fait nouveau ne rouvre pas la question « faut-il supprimer » — il répond seulement à « faut-il une règle de blocage neuve » (non : elle existe déjà, `tables.ts:222`, testée). Reste ouvert, et hors de mon domaine : le tech-lead/UX tranchent le mécanisme d'affichage (Modal systématique vs bandeau seul) — je n'ai pas d'objection tant que le lot 2 contient le bouton retirer, ce que leurs deux annexes tour1 montrent déjà.

**Réponse au tech-lead, sur les 3 destinations `ia`/`auteur` et le risque de « promettre un narrateur qui n'existe pas encore »** — J'ai vérifié `destinations.ts` : `'ia'` est une valeur déjà massivement utilisée depuis it1-3 (`canon.mj.synopsis_mj`, `plan_actions[].action`, `savoirs[].indice_id`, `evenements[].resolutions[].resultat`, etc.) — ce n'est pas un terme neuf, c'est une classification architecturale existante qui documente « ce que le moteur Temps 2 lira », sans rien construire ni promettre à l'écran aujourd'hui. Ce n'est pas une question de valeur produit, c'est une question de catégorisation technique (domaine du tech-lead, je n'y mets pas mon veto par mandat). Vérification faite côté auteur : le hint UX proposé pour ces champs est « interne — jamais lu par le joueur » — aucune mention d'IA, donc aucune surpromesse faite à l'auteur qui remplit le champ. Je ne récuse ni ne rouvre ce point. Sur le fond de la proposition du tech-lead (`description`/`ambiance` → `'ia'`, `dangers` → `'auteur'`), je n'ai pas d'objection : aucun vocabulaire produit nouveau (point 8 de mon mandat), rien à trancher côté auteur.

**Statut de mes propres points tour1** :
- **RISQUE tour1** (feature qui se ferme sans surface d'écriture) — **maintenu**, mais satisfait par les annexes tour1 du tech-lead (lot 2 = `PanneauLieux.tsx` création+édition+suppression) et de l'UX (contrat Modal complet). Condition de mon verdict remplie, pas de veto.
- **OBJECTION tour1** (suppression absente du goal brut, à trancher) — **retirée pour la partie « faut-il supprimer »** : AC#8 tranche déjà, ce n'est pas un angle mort, c'est un rappel que j'ai moi-même mal isolé en tour1 en le présentant comme une question ouverte alors que la spec la référence déjà. Maintenue seulement pour la forme : la définition doit **citer** AC#8 explicitement au lieu de laisser le lecteur la déduire.
- **PROPOSITION tour1** (« suppression sans confirmation, motif déjà acté it1/it3 : aucune référence vivante ») — **retirée, motif erroné**. Ce précédent ne transfère pas à Lieu : contrairement aux entités supprimées en it1/it3, `charpente.depart.lieu_id` est une référence vivante réelle (livrée it2). Je m'aligne sur la proposition UX (Modal systématique, indépendant du fait que ce lieu-là soit référencé ou non — plus simple à auditer qu'une branche conditionnelle « confirmer seulement si c'est le lieu de départ »). Ce changement ne fait pas grossir mon lot : la Modal est de l'UI, pas un champ, ma boîte chiffrable (2 lots, ≤4 champs, zéro référence croisée neuve) tient toujours.
- **VERDICT tour1** — **maintenu**, désormais satisfait : la surface d'écriture, suppression comprise, est explicitement dans le lot 2 des deux autres rôles. Pas de durcissement en veto — les annexes tour1 font déjà le travail que je réclamais.

## Fichiers consultés
- `.claude\raffinage\dossier-canon-it4\tour1-{pm-produit,tech-lead,ux-designer,qa}.md`
- `src\brain\dossier\destinations.ts` (vérification empirique de `'ia'`/`'auteur'` comme vocabulaire déjà établi)

*(Note orchestrateur : à l'arbitrage, le PM avait initialement adopté la proposition Modal de l'UX au tour 1 ; l'UX a retiré sa propre proposition au tour 2 après vérification empirique du précédent ObjectifsCanon — voir tour2-ux-designer.md. Ce document du PM n'a pas connaissance de ce retrait, les 4 notes tournant en parallèle sans lecture croisée du tour 2 lui-même.)*
