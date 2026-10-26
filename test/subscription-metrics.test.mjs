import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, toDate } from '../lib/csv.mjs'

const sample = (n) => readFileSync(new URL(`../samples/${n}`, import.meta.url), 'utf8')
const mod = (n) => import(`../src/${n}.mjs`)
const run = (n, args = []) => spawnSync(process.execPath, [fileURLToPath(new URL(`../src/${n}.mjs`, import.meta.url)), ...args], { encoding: 'utf8' })
const samplePath = (n) => fileURLToPath(new URL(`../samples/${n}`, import.meta.url))

test('33 abonnements : MRR, nouveaux, départs, churn, ARPA, LTV, croissance', async () => {
  const { metrics, parseSubs, monthRange } = await mod('subscription-metrics')
  assert.deepEqual(monthRange('2026-11', '2027-02'), ['2026-11', '2026-12', '2027-01', '2027-02'])
  const rows = metrics(parseSubs(sample('abonnements.csv')), monthRange('2026-06', '2026-10'))
  assert.deepEqual(rows.map((r) => r.mrr), [100000, 120000, 190000, 190000, 190000]); assert.deepEqual(rows.map((r) => r.customers), [2, 3, 5, 5, 5])
  assert.deepEqual(rows.map((r) => [r.new, r.churned]), [[2, 0], [1, 0], [2, 0], [1, 1], [1, 1]]); assert.equal(rows[3].churnRate, 0.2); assert.equal(rows[3].ltv, 190000); assert.equal(rows[2].ltv, null); assert.equal(rows[0].growth, null); assert.ok(Math.abs(rows[2].growth - 0.5833) < 0.001)
  assert.throws(() => parseSubs('customer,mrr,start,end\nc,10,pas-une-date,'), /ligne 2/)
})
