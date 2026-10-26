## À quoi ça sert

Si vous vendez un abonnement (logiciel, maintenance, coaching), cinq chiffres disent si l'entreprise va bien : le revenu mensuel récurrent (MRR), les nouveaux clients, les départs, le taux de départ (churn) et la valeur d'un client (LTV). Ce script les calcule mois par mois depuis la liste de vos abonnements.

## Avant de commencer

- Un CSV : `customer`, `mrr` (montant mensuel), `start` (date de début), `end` (date de fin, vide si toujours actif).

## Pas à pas

1. Lancez sur une période :
   ```bash
   node src/subscription-metrics.mjs samples/abonnements.csv --from 2026-06 --to 2026-10
   ```
2. Lisez la colonne MRR : sa croissance mensuelle est la première chose à suivre.
3. Surveillez le churn : au-dessus de quelques % par mois, la croissance se fait au prix d'un seau percé.

## Lire le résultat

Un abonnement compte pour un mois s'il a commencé avant la fin du mois et n'est pas terminé à cette date. Le **churn** du mois = départs ÷ clients en début de mois. L'**ARPA** = MRR ÷ clients actifs. La **LTV** = ARPA ÷ churn mensuel ; elle reste vide tant qu'aucun départ n'a été observé (une valeur infinie n'apprend rien).

## L'automatiser

Exportez la liste de vos abonnés chaque début de mois et relancez ; conservez les sorties pour tracer la tendance.

## Pièges à éviter

- Sur peu de clients, un seul départ fait bondir le churn : lisez les tendances, pas un mois isolé.
- Le script suppose un prix constant par abonnement ; une montée en gamme se note par une nouvelle ligne.
