#!/usr/bin/env node
/* Indicateurs d'abonnement : MRR, nouveaux clients, résiliations, taux de départ, ARPA et valeur vie client, mois par mois. */
import { readFileSync } from 'node:fs'
import { parseCsv, toNumber, toDate } from '../lib/csv.mjs'
import { money, pct, round } from '../lib/format.mjs'
import { isMain, parseArgs, usage, fail } from '../lib/cli.mjs'

const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
const monthStart = (key) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)) }

/** Abonnements : customer, mrr (montant mensuel), start, end (vide = actif). Un abonnement est actif un mois s'il a commencé avant sa fin et n'est pas terminé. */
export function metrics(subs, months) {
  let prev = null
  return months.map((month) => {
    const from = monthStart(month)
    const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1))
    const active = subs.filter((s) => s.start < to && (!s.end || s.end >= to))
    const newSubs = subs.filter((s) => s.start >= from && s.start < to)
    const churned = subs.filter((s) => s.end && s.end >= from && s.end < to)
    const mrr = round(active.reduce((t, s) => t + s.mrr, 0))
    const startCount = prev ? prev.customers : subs.filter((s) => s.start < from && (!s.end || s.end >= from)).length
    const churnRate = startCount ? churned.length / startCount : 0
    const arpa = active.length ? mrr / active.length : 0
    const row = { month, customers: active.length, mrr, new: newSubs.length, churned: churned.length, churnRate, arpa: round(arpa), ltv: churnRate > 0 ? round(arpa / churnRate) : null, growth: prev && prev.mrr ? (mrr - prev.mrr) / prev.mrr : null }
    prev = row
    return row
  })
}

export function parseSubs(text) {
  return parseCsv(text).records.map((r, i) => {
    const start = toDate(r.start), mrr = toNumber(r.mrr), end = r.end ? toDate(r.end) : null
    if (!start || Number.isNaN(mrr)) throw new Error(`ligne ${i + 2} : start ou mrr illisible.`)
    if (r.end && !end) throw new Error(`ligne ${i + 2} : date de fin illisible.`)
    return { customer: r.customer, mrr, start, end }
  })
}

export function monthRange(from, to) {
  const out = []
  for (let d = monthStart(from); monthKey(d) <= to; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) out.push(monthKey(d))
  return out
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['help'])
  usage(`
Usage : node src/subscription-metrics.mjs abonnements.csv [--from 2026-06] [--to 2026-11]
Colonnes : customer, mrr (montant mensuel), start (AAAA-MM-JJ), end (vide si toujours actif).
LTV = ARPA ÷ taux de départ mensuel (non calculée sans départ observé : une LTV infinie n'est pas une information).`, args, 1)
  let rows
  try {
    const subs = parseSubs(readFileSync(args._[0], 'utf8'))
    const first = args.from ?? monthKey(new Date(Math.min(...subs.map((s) => s.start))))
    const last = args.to ?? monthKey(new Date())
    if (!/^\d{4}-\d{2}$/.test(first) || !/^\d{4}-\d{2}$/.test(last) || first > last) fail('--from et --to doivent être au format AAAA-MM, dans l\'ordre.')
    rows = metrics(subs, monthRange(first, last))
  } catch (e) { fail(e.message) }
  console.log('Mois     Clients  MRR          Nouv.  Départs  Churn    ARPA       LTV         Croissance')
  rows.forEach((r) => console.log(`${r.month}  ${String(r.customers).padStart(7)}  ${money(r.mrr).padStart(11)}  ${String(r.new).padStart(5)}  ${String(r.churned).padStart(7)}  ${pct(r.churnRate).padStart(7)}  ${money(r.arpa).padStart(9)}  ${(r.ltv === null ? '—' : money(r.ltv)).padStart(10)}  ${r.growth === null ? '—' : pct(r.growth)}`))
}
