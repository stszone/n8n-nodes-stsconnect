import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { verifyWebhookSignature } from '../nodes/StsConnectTrigger/verifySignature';

const SECRET = 'whsec_test_secret';
const NOW = 1_800_000_000;

function sign(secret: string, timestamp: string, body: Buffer): string {
	const hex = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex');
	return `sha256=${hex}`;
}

const BODY = Buffer.from(JSON.stringify({ event: 'message_created', id: 42 }), 'utf8');

test('accepts a valid signature', () => {
	const ts = String(NOW);
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(SECRET, ts, BODY), BODY, NOW), true);
});

test('accepts timestamps at the 300 second boundary in both directions', () => {
	for (const ts of [NOW - 300, NOW + 300]) {
		const tsHeader = String(ts);
		assert.equal(
			verifyWebhookSignature(SECRET, tsHeader, sign(SECRET, tsHeader, BODY), BODY, NOW),
			true,
			`timestamp ${ts} should be accepted`,
		);
	}
});

test('rejects a wrong secret', () => {
	const ts = String(NOW);
	assert.equal(verifyWebhookSignature('whsec_other', ts, sign(SECRET, ts, BODY), BODY, NOW), false);
});

test('rejects a tampered body', () => {
	const ts = String(NOW);
	const signature = sign(SECRET, ts, BODY);
	const tampered = Buffer.from(JSON.stringify({ event: 'message_created', id: 43 }), 'utf8');
	assert.equal(verifyWebhookSignature(SECRET, ts, signature, tampered, NOW), false);
});

test('rejects a timestamp older than 300 seconds', () => {
	const ts = String(NOW - 301);
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(SECRET, ts, BODY), BODY, NOW), false);
});

test('rejects a timestamp more than 300 seconds in the future', () => {
	const ts = String(NOW + 301);
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(SECRET, ts, BODY), BODY, NOW), false);
});

test('rejects missing headers', () => {
	const ts = String(NOW);
	const signature = sign(SECRET, ts, BODY);
	assert.equal(verifyWebhookSignature(SECRET, undefined, signature, BODY, NOW), false);
	assert.equal(verifyWebhookSignature(SECRET, ts, undefined, BODY, NOW), false);
	assert.equal(verifyWebhookSignature(SECRET, null, null, BODY, NOW), false);
});

test('rejects a malformed signature header', () => {
	const ts = String(NOW);
	const hex = createHmac('sha256', SECRET).update(`${ts}.`).update(BODY).digest('hex');
	// Missing the sha256= prefix.
	assert.equal(verifyWebhookSignature(SECRET, ts, hex, BODY, NOW), false);
	// Wrong prefix.
	assert.equal(verifyWebhookSignature(SECRET, ts, `sha1=${hex}`, BODY, NOW), false);
});

test('rejects a non-hex signature', () => {
	const ts = String(NOW);
	const notHex = `sha256=${'z'.repeat(64)}`;
	assert.equal(verifyWebhookSignature(SECRET, ts, notHex, BODY, NOW), false);
});

test('rejects a signature with the wrong length', () => {
	const ts = String(NOW);
	assert.equal(verifyWebhookSignature(SECRET, ts, `sha256=${'a'.repeat(63)}`, BODY, NOW), false);
	assert.equal(verifyWebhookSignature(SECRET, ts, `sha256=${'a'.repeat(65)}`, BODY, NOW), false);
});

test('rejects a well-formed but wrong signature', () => {
	const ts = String(NOW);
	const wrong = `sha256=${'a'.repeat(64)}`;
	assert.equal(verifyWebhookSignature(SECRET, ts, wrong, BODY, NOW), false);
});

test('rejects a non-integer timestamp', () => {
	const ts = 'not-a-timestamp';
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(SECRET, ts, BODY), BODY, NOW), false);
});
