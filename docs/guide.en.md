## What it's for

If you sell a subscription (software, maintenance, coaching), five numbers say whether the business is healthy: monthly recurring revenue (MRR), new customers, departures, churn rate and customer lifetime value (LTV). This script computes them month by month from your list of subscriptions.

## Before you start

- A CSV: `customer`, `mrr` (monthly amount), `start` (start date), `end` (end date, empty if still active).

## Step by step

1. Run over a period:
   ```bash
   node src/subscription-metrics.mjs samples/abonnements.csv --from 2026-06 --to 2026-10
   ```
2. Read the MRR column: its monthly growth is the first thing to track.
3. Watch churn: above a few percent a month, growth comes at the price of a leaky bucket.

## Reading the output

A subscription counts for a month if it started before the end of that month and is not finished by then. Month **churn** = departures ÷ customers at the start of the month. **ARPA** = MRR ÷ active customers. **LTV** = ARPA ÷ monthly churn; it stays empty until a departure has been observed (an infinite value teaches nothing).

## Automating it

Export your subscriber list at the start of each month and re-run; keep the outputs to trace the trend.

## Pitfalls

- With few customers, a single departure makes churn jump: read trends, not an isolated month.
- The script assumes a constant price per subscription; an upgrade is recorded as a new line.
