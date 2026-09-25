# Tour 1 — PM produit — `moteur-interprete` (n° 10)

**RISQUE** — Le goal (« écrire en langage libre ») ne couvre qu'une moitié de J2 (« le joueur écrit, le monde répond ») : sans narration, une commande s'exécute en silence — `journal[].texte` reste le relevé déterministe de n°9, décision close, jamais `'ia'`. La surface d'entrée (console debug vs écran §2.9) n'est PAS tranchée ; le brief confie ce choix à CE cadrage.

**OBJECTION** — Collision de nom vérifiée en code : `validerIntention`/`CLES_SORTIE_PLAN` (`schemaSortie.ts`) servent déjà `personnage-plan` (intention d'un PNJ, auteur). Si R1 produit aussi `{intention}`, deux domaines partagent un nom — j'exige un nom distinct pour R1 avant le premier lot contrat.

**PROPOSITION** — 4 itérations, squelette d'abord, aucune ne porte de « et » :
1. Le joueur écrit une action libre ; R1 la traduit en commande existante (aller) ou demande une précision — pas de prose.
2. Le joueur lit le résultat en 2-6 phrases de R3, pas un relevé technique — nouveau champ de session, jamais `journal[].texte`.
3. Le joueur retrouve, dix tours plus tard, un fait établi par le monde, sans contradiction — contexte par la scène + mémoire à trois niveaux.
4. L'auteur voit la narration se raccourcir au-delà du budget de jetons plutôt que d'attendre — garde-fous §2.8 + balayage des onze chemins de prose ia, dérogation nommée (précédent n°9 it4).
Hors périmètre : R2/R4, marge<3, PNJ méfiant, reprise de session, replay déterministe, écran §2.9 complet.

**VERDICT** — Ordre tenu (n°9 terminée, 4/4, 0.7.5). Pas de veto. Recevable si l'UX tranche la surface d'entrée avant it1 et renomme la sortie de R1.

---

## Notes complémentaires (hors format imposé, pour l'orchestrateur)

**Décision déjà actée que j'ai vérifiée et qui contraint la découpe** : le comité de n°9 a tranché (`resolved_decisions`) que `journal[].texte` ne basculera JAMAIS à l'audience `'ia'` et reste « un relevé d'état, jamais une troisième prose ». Conséquence pour n°10 : la prose de R3 doit vivre dans un NOUVEAU champ de session (lot `contrat`, optionnel à vie par KR-251/160/191), pas remplacer le journal existant. Si un rôle du comité propose de réutiliser `journal[].texte` pour la narration, c'est une réouverture d'une décision close — je le signalerai en tour 2.

**Ce que je n'ai pas tranché car hors de mon mandat (à trancher par l'UX/tech-lead)** : si le champ libre remplace la console de debug de play-mode, la complète, ou si un nouvel écran l'héberge (§2.9 du plan de cible, périmé par endroits). Mon découpage en 4 itérations reste valable sous les trois réponses possibles — je ne l'ai pas fait dépendre de ce choix.

**Sur les « onze chemins de prose `ia` »** (mentionné au paragraphe roadmap de n°10) : je le traite comme faisant partie de l'itération 4 (garde-fous), au même titre que la dérogation nommée sans phrase de démo qu'a portée n°9 it4 — un jalon d'ingénierie, pas une tranche verticale à part entière. Si le tech-lead préfère le sortir en 5e itération, je n'y ferai pas veto (pas mon domaine de blocage) mais je demanderai qu'elle reste nommée comme dérogation, pas gonflée en fausse feature.
