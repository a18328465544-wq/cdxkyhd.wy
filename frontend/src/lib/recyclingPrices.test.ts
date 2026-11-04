import assert from 'node:assert/strict';
import test from 'node:test';
import type { GpuPrice } from '../types';
import { filterRecyclingPrices, recyclingColumnTitle, recyclingModelName, recyclingSeries, recyclingVram } from './recyclingPrices';

const quote = (name: string, category: GpuPrice['category'] = 'gaming', vram = '按行情档案'): GpuPrice => ({ name, category, basePrice: '1234', trend: 'stable', specs: { vram, tdp: '' } });

test('series tabs classify only actual models and retain professional cards', () => {
  assert.equal(recyclingSeries(quote('NVIDIA RTX 5090 D V2')), 'rtx50');
  assert.equal(recyclingSeries(quote('RTX4070Ti SUPER')), 'rtx40');
  assert.equal(recyclingSeries(quote('RTX 3090', 'both')), 'rtx30');
  assert.equal(recyclingSeries(quote('RTX A6000', 'both')), 'professional');
  assert.equal(recyclingSeries(quote('A100', 'ai')), 'professional');
  assert.equal(recyclingSeries(quote('RTX 5000 ADA')), 'professional');
  assert.equal(recyclingSeries(quote('RTX ADA 6000')), 'professional');
  assert.equal(recyclingSeries(quote('PRO6000 工作站版，NVIDIA')), 'professional');
  assert.equal(recyclingSeries(quote('RX 7900 XTX')), 'other');
});

test('search tolerates spacing but keeps D, V2, Ti, Super and memory identities', () => {
  const prices = [quote('RTX5090'), quote('RTX 5090 D'), quote('RTX5090DV2'), quote('RTX4070Ti SUPER'), quote('RTX4070'), quote('RTX5060Ti', 'gaming', '8GB'), quote('RTX5060Ti 16GB', 'gaming', '16GB')];
  assert.deepEqual(filterRecyclingPrices(prices, 'all', '5090 d v2').map(gpu => gpu.name), ['RTX5090DV2']);
  assert.deepEqual(filterRecyclingPrices(prices, 'all', '4070 ti super').map(gpu => gpu.name), ['RTX4070Ti SUPER']);
  assert.deepEqual(filterRecyclingPrices(prices, 'rtx50', '5060 ti 16 gb').map(gpu => gpu.name), ['RTX5060Ti 16GB']);
  assert.equal(filterRecyclingPrices(prices, 'rtx40', '5090').length, 0);
  assert.equal(filterRecyclingPrices(prices, 'all', '').length, prices.length);
});

test('ordering does not mutate quotes and never fills missing specifications', () => {
  const prices = [quote('RTX3080'), quote('RTX5090'), quote('RTX4080')];
  const before = structuredClone(prices);
  assert.deepEqual(filterRecyclingPrices(prices, 'all', '').map(gpu => gpu.name), ['RTX5090', 'RTX4080', 'RTX3080']);
  assert.deepEqual(prices, before);
  assert.equal(recyclingVram('按行情档案'), null);
  assert.equal(recyclingVram(''), null);
  assert.equal(recyclingVram('24GB GDDR6X'), '24GB GDDR6X');
  assert.equal(recyclingModelName('NVIDIA RTX 5090 D V2'), 'RTX 5090 D V2');
  assert.equal(recyclingModelName('RTX5090DV2'), 'RTX 5090 D V2');
  assert.equal(recyclingModelName('RTX4070Ti SUPER'), 'RTX 4070 Ti SUPER');
  assert.equal(recyclingColumnTitle(prices), 'RTX 30系 / RTX 50系等');
});
