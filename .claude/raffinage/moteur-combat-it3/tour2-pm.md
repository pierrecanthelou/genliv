## PM · moteur-combat it3 · Tour 2

RÉPONSE À Tech Lead — « enregistrement moteur par round (`dernierAssaut`) + 2 lots » : d'accord. C'est le plus petit bouchon possible : un champ optionnel posé aux 3 sites du moteur, qui ne touche aucune feuille de session. KR-293 tient : le moteur consigne un fait, il ne projette rien. Mon découpage à 3 lots est retiré au profit de ses 2 lots (11 et 14 fichiers). Je soutiens la scission moteur/feature si le lot 2 dépasse 16 fichiers.

RÉPONSE À Narratif-IA — « ni nom ni capacité ni postures » :
- Nom du monstre : je refuse « aucun nom ». « L'adversaire » appauvrit ce que l'auteur lit, et l'exemple de l'UX nomme le gobelin. Le nom vient du bestiaire, un registre de code, donc KR-232 n'est pas touché. Je suis le TL.
- `capacite`, postures, `round` dans la projection : refusés. La capacité coûte une itération de plus (37 sites de journal, selon le TL). L'ajout reste additif plus tard.
- Engagement « rejet > 30 % → 600 caractères » : refusé. KR-296 est clos et rien dans la porte de commit ne mesure ce taux. La constante n'a qu'un site, donc elle se changera à l'usage.

RÉPONSE À QA — « message Narrateur indisponible » : refusé. Le cadrage et l'UX imposent le silence, c'est-à-dire un nœud absent. Le rejeu unique vit déjà dans `jusquAuRejeuUnique` (`CopiloteService`), donc son test va au lot 1, pas à l'écran.

MES OBJECTIONS :
1. « Chaque round » flou — retirée.
2. Récit non persisté — retirée.
3. `canon.ton` et `interdits_ton[]` — maintenue, sans veto.
4. Vocabulaire — maintenue, sans veto.
5. Critère « 2–3 phrases » — retirée.

VERDICT FINAL — recevable sous réserve.
