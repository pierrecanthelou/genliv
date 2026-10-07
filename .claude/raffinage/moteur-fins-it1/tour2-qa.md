## Tour 2 — QA — moteur-fins it1

RÉPONSES CROISÉES
- **PM objection 4** (Rejouer sans critère) : Rejouer est UX pure, pas un critère d'acceptation. Si c'est un chemin utilisateur distinct, il doit porter un critère observable. PM recadre juste : il manque un critère pour distinguer l'état final « fin atteinte + bouton Rejouer visible » du reste.

- **PM objection 2 + TL correction 2** (mort = combat_en_cours) : contradiction dans le critère 4 original. TL clair : si mort est dans `combat_en_cours`, alors it1 doit énoncer « l'auteur ne peut pas terminer une partie en mort » comme condition limite, sinon le critère de fin est incomplet. Le refus `partie_terminee` après fin passe-t-il par deux chemins (console vs saisie libre) ? C'est le point de mon veto 1. Cela n'est toujours pas tranché.

- **TL correction 5** (fin.vigie-abandonnee rougit tests) : c'est une régression non-régression. À auditer : la fixture dossier-reference porte-t-elle une fin avec vigie-abandonnee ? Si oui, KR-302 exige une assertion qui le construit explicitement (fixture[0], fixture[1]). C'est mon veto 2.

STATUT DE MES OBJECTIONS
- Veto 1 (console vs saisie libre non énumérés) : **maintenue**. Doit trancher avant essaim si ça touche deux chemins (entrée directe vs dialogue).
- Veto 2 (KR-302 fixture + assertion) : **maintenue**. Voir fin.vigie-abandonnee ci-dessus.
- Veto 3 (texte de mort) : **retirée**. Mort reportée it2 par PM/TL.
- Veto 4 (traçabilité test) : **durcie en veto**. Chaque critère reçoit son test nommé et son assertion. La traçabilité se lit dans la revue d'itération : « critère 1 → test: `it('…')` assertion: `expect(…).toBe(…)` ».

VERDICT FINAL — **Recevable sous réserve**. Accepter it1 si : (1) refus `partie_terminee` après fin clarifié (un chemin ou deux ?), (2) KR-302 porte fixture[0] vigie-abandonnee et fixture[1] sans, (3) critère Rejouer nommé et testé, (4) traçabilité test écrite.
