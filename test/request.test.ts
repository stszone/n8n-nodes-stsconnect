import assert from 'node:assert/strict';
import test from 'node:test';

import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

import { StsConnectApiError, stsConnectApiRequest } from '../nodes/StsConnect/GenericFunctions';
import { StsConnect } from '../nodes/StsConnect/StsConnect.node';

interface FakeResponse {
	statusCode: number;
	headers?: IDataObject;
	body?: unknown;
}

// A minimal stand-in for n8n's execution context: records every request and answers from `responses`.
function fakeContext(params: IDataObject, responses: FakeResponse[]) {
	const requests: IHttpRequestOptions[] = [];
	const context = {
		getCredentials: async () => ({
			baseUrl: 'https://inbox.example.test/',
			accountId: 7,
			apiKey: 'sts_live_EXAMPLE_NOT_A_REAL_KEY',
		}),
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string) => {
			if (!(name in params)) throw new Error(`unexpected parameter ${name}`);
			return params[name];
		},
		getNode: () => ({ name: 'STS Connect', type: 'stsConnect', typeVersion: 1, parameters: {} }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (_credential: string, options: IHttpRequestOptions) => {
				requests.push(options);
				const response = responses.shift();
				if (!response) throw new Error('no response left');
				return { headers: {}, ...response };
			},
		},
	};
	return { context: context as unknown as IExecuteFunctions, requests };
}

test('builds the account URL without a doubled slash and sends lists as labels[]', async () => {
	const { context, requests } = fakeContext({}, [{ statusCode: 200, body: { ok: true } }]);
	const result = await stsConnectApiRequest.call(context, 'GET', '/conversations', {}, { labels: ['a'] });
	assert.deepEqual(result, { ok: true });
	assert.equal(requests[0].url, 'https://inbox.example.test/api/v1/accounts/7/conversations');
	assert.equal(requests[0].arrayFormat, 'brackets');
});

test('retries a 429 once when Retry-After is short', async () => {
	const { context, requests } = fakeContext({}, [
		{ statusCode: 429, headers: { 'retry-after': '0' }, body: { code: 'rate_limited', retry_after: 0 } },
		{ statusCode: 200, body: { ok: true } },
	]);
	assert.deepEqual(await stsConnectApiRequest.call(context, 'GET', '/inboxes'), { ok: true });
	assert.equal(requests.length, 2);
});

test('does not wait out a long Retry-After', async () => {
	const { context, requests } = fakeContext({}, [
		{ statusCode: 429, headers: { 'retry-after': '45' }, body: { code: 'rate_limited', retry_after: 45 } },
	]);
	await assert.rejects(stsConnectApiRequest.call(context, 'GET', '/inboxes'), (error: unknown) => {
		assert.ok(error instanceof StsConnectApiError);
		assert.equal(error.statusCode, 429);
		assert.equal(error.retryAfter, 45);
		return true;
	});
	assert.equal(requests.length, 1);
});

test('creates a conversation for the contact and leaves the source id to the inbox', async () => {
	const node = new StsConnect();
	const { context, requests } = fakeContext(
		{
			resource: 'conversation',
			operation: 'create',
			inboxId: 3,
			contactId: 42,
			additionalFields: { messageContent: 'Hello' },
		},
		[{ statusCode: 200, body: { id: 9 } }],
	);
	await node.execute.call(context);
	assert.equal(requests[0].method, 'POST');
	assert.deepEqual(requests[0].body, { inbox_id: 3, contact_id: 42, message: { content: 'Hello' } });
});

test('clears the priority with null', async () => {
	const node = new StsConnect();
	const { context, requests } = fakeContext(
		{ resource: 'conversation', operation: 'setPriority', conversationId: 5, priority: 'none' },
		[{ statusCode: 200, body: '' }],
	);
	await node.execute.call(context);
	assert.equal(requests[0].url, 'https://inbox.example.test/api/v1/accounts/7/conversations/5/toggle_priority');
	assert.deepEqual(requests[0].body, { priority: null });
});
