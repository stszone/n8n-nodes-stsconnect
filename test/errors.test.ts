import assert from 'node:assert/strict';
import test from 'node:test';

import { mapApiErrorMessage } from '../nodes/StsConnect/GenericFunctions';

test('maps 401 to a wrong-key message', () => {
	assert.equal(
		mapApiErrorMessage(401, { error: 'unauthorized' }),
		'The API key is wrong, revoked, expired or for another account.',
	);
});

test('maps 403 api_key_read_only to the read-only message', () => {
	assert.equal(
		mapApiErrorMessage(403, { code: 'api_key_read_only' }),
		'This API key can only read. Create a read + write key.',
	);
});

test('maps 403 api_key_endpoint_not_allowed to the not-allowed message', () => {
	assert.equal(
		mapApiErrorMessage(403, { code: 'api_key_endpoint_not_allowed' }),
		'API keys cannot use this endpoint.',
	);
});

test('does not map other 403 codes', () => {
	assert.equal(mapApiErrorMessage(403, { code: 'something_else' }), null);
	assert.equal(mapApiErrorMessage(403, {}), null);
});

test('maps 429 with retry_after from the body', () => {
	assert.equal(
		mapApiErrorMessage(429, { error: 'Rate limit exceeded', code: 'rate_limited', retry_after: 42 }),
		'Rate limit exceeded. Retry after 42 seconds.',
	);
});

test('maps 429 with retry_after from the header argument', () => {
	assert.equal(mapApiErrorMessage(429, {}, 7), 'Rate limit exceeded. Retry after 7 seconds.');
});

test('maps 429 without retry information', () => {
	assert.equal(mapApiErrorMessage(429, {}), 'Rate limit exceeded. Try again in a minute.');
});

test('does not map other status codes', () => {
	assert.equal(mapApiErrorMessage(500, { error: 'boom' }), null);
	assert.equal(mapApiErrorMessage(404, {}), null);
});
