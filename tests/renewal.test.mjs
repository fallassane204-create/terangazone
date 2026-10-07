import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renewalDate } from '../lib/renewal.ts';
const now = new Date('2026-01-01T12:00:00Z');
test('monthly renewal clamps the last day', () => assert.equal(renewalDate('2026-01-31','1 mois',now),'2026-02-28'));
test('annual renewal respects the offer duration', () => assert.equal(renewalDate('2026-06-15','1 an',now),'2027-06-15'));
test('expired renewal starts today', () => assert.equal(renewalDate('2025-12-01','1 mois',now),'2026-02-01'));
test('one-off services cannot be renewed', () => assert.throws(() => renewalDate(null,'Service',now)));
test('invalid dates are rejected', () => assert.throws(() => renewalDate('invalid','1 mois',now)));
