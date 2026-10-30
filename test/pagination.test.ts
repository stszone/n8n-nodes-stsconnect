import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchAllPages } from '../nodes/StsConnect/GenericFunctions';

test('collects pages until an empty page', async () => {
	const pages: number[][] = [[1, 2], [3], []];
	let calls = 0;
	const items = await fetchAllPages(async (page) => {
		calls++;
		return pages[page - 1] ?? [];
	});
	assert.deepEqual(items, [1, 2, 3]);
	assert.equal(calls, 3);
});

test('stops when the limit is reached inside a page', async () => {
	const page = Array.from({ length: 25 }, (_, i) => i);
	let calls = 0;
	const items = await fetchAllPages(async () => {
		calls++;
		return page;
	}, 10);
	assert.equal(items.length, 10);
	assert.equal(calls, 1);
});

test('stops when the limit is reached across pages', async () => {
	const page = Array.from({ length: 25 }, (_, i) => i);
	let calls = 0;
	const items = await fetchAllPages(async () => {
		calls++;
		return page;
	}, 30);
	assert.equal(items.length, 30);
	assert.equal(calls, 2);
});

test('returns everything when no limit is set', async () => {
	const pages: number[][] = [[1, 2, 3], [4, 5], []];
	const items = await fetchAllPages(async (p) => pages[p - 1] ?? []);
	assert.deepEqual(items, [1, 2, 3, 4, 5]);
});

test('returns an empty array when the first page is empty', async () => {
	let calls = 0;
	const items = await fetchAllPages(async () => {
		calls++;
		return [] as number[];
	});
	assert.deepEqual(items, []);
	assert.equal(calls, 1);
});
