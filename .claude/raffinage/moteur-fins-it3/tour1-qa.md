# QA — moteur-fins it3 — tour 1

RISQUE
Le texte constant du moteur (mort du héros) n'est pas défini. La spec dit « en --text-strong » (le token), pas ce qu'on écrit. It1 et it2 ont noté des déviations (bandeau absent). Un test qui passe sur deux libellés différents n'est pas un test.

OBJECTION
1. Texte absent. KR-308 nomme le token, pas le libellé. Aucune source dans docs/REGLES-DU-JEU.md (contrairement aux registres, KR-130).
2. Cas limites. Reprise post-mort (session avec combat hero-mort demeurant) : rejouable ou bloquée ? Aucune décision écrite. AiguillagePartie it2 teste finAtteinte, pas hero-mort.
3. Bandeau. It1 a dévié : bandeau absent de l'écran de fin. It3 le promet à nouveau. Aucune clause anti-déviation.
4. R5. Critère 6 nomme un test qui n'existe pas. Aucun instrument spécifié (spy narrateur, journalAgent, autre).

PROPOSITION
1. Ajouter à docs/REGLES-DU-JEU.md une section portant le libellé constant (ex. « Le héros tombe au combat »). Citer cette section dans known_risks.
2. Énumérer trois cas : (a) hero-mort détecté → EcranMort + partie_terminee ; (b) reprise sur combat hero-mort → ouverture directe ; (c) EcranMort affiche bandeau + bouton.
3. Test nommé : CombatEnCours — « R5 non appelé quand hero-mort » — spy narrateur.
4. Test EcranMort.test.tsx — RTL du libellé + bandeau + bouton.

VERDICT
Recevable sous réserve. Bloquer si : (1) libellé non sourcé, (2) cas reprise non tracé, (3) test R5 non nommé, (4) bandeau sans anti-déviation.
