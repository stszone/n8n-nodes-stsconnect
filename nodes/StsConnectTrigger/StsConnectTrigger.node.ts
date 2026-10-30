import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { shouldEmitEvent } from './eventFilter';
import { verifyWebhookSignature } from './verifySignature';

export class StsConnectTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'STS Connect Trigger',
		name: 'stsConnectTrigger',
		icon: 'file:stsConnect.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when the STS Connect Inbox sends a webhook event',
		defaults: {
			name: 'STS Connect Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'stsConnectWebhookApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Setup: copy this node\'s Production URL (the Test URL is different and only works while testing). In the STS Connect Inbox open Settings → API & webhooks → Webhooks → Add webhook, paste the URL, and pick the same events as below. Then use "Show secret" on the endpoint and copy the secret into the node\'s credential.',
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['message_created'],
				options: [
					{ name: 'Any Event', value: '*', description: 'Every event the endpoint receives' },
					{ name: 'Contact Created', value: 'contact_created' },
					{ name: 'Contact Updated', value: 'contact_updated' },
					{ name: 'Conversation Created', value: 'conversation_created' },
					{ name: 'Conversation Status Changed', value: 'conversation_status_changed' },
					{ name: 'Conversation Typing Off', value: 'conversation_typing_off' },
					{ name: 'Conversation Typing On', value: 'conversation_typing_on' },
					{ name: 'Conversation Updated', value: 'conversation_updated' },
					{ name: 'Inbox Created', value: 'inbox_created' },
					{ name: 'Inbox Updated', value: 'inbox_updated' },
					{ name: 'Message Created', value: 'message_created' },
					{ name: 'Message Updated', value: 'message_updated' },
					{ name: 'Webwidget Triggered', value: 'webwidget_triggered' },
				],
				description:
					'The events that start the workflow. Register the same events on the webhook endpoint in the STS Connect Inbox.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Ignore Typing Events',
						name: 'ignoreTypingEvents',
						type: 'boolean',
						default: true,
						description:
							'Whether conversation_typing_on and conversation_typing_off events are acknowledged but not emitted.',
					},
					{
						displayName: 'Only Incoming Messages',
						name: 'onlyIncomingMessages',
						type: 'boolean',
						default: false,
						description:
							'Whether message events are only emitted for public incoming messages (message_type incoming and not private). Outgoing messages, activity messages and private notes are skipped.',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();

		const reject = (status: number, message: string): IWebhookResponseData => {
			res.status(status).json({ error: message });
			return { noWebhookResponse: true };
		};

		const rawBody = req.rawBody;
		if (!rawBody || !Buffer.isBuffer(rawBody)) {
			// The signature is computed over the raw body. Never re-serialize JSON
			// for the HMAC - the byte sequence would not match.
			return reject(401, 'Missing raw request body; the signature cannot be verified.');
		}

		const credentials = (await this.getCredentials('stsConnectWebhookApi')) as unknown as {
			secret: string;
		};

		const timestampHeader = headerValue(req.headers['x-sts-connect-timestamp']);
		const signatureHeader = headerValue(req.headers['x-sts-connect-signature']);
		const nowSeconds = Math.floor(Date.now() / 1000);

		if (
			!verifyWebhookSignature(credentials.secret, timestampHeader, signatureHeader, rawBody, nowSeconds)
		) {
			return reject(401, 'Invalid webhook signature.');
		}

		let body: IDataObject;
		try {
			body = JSON.parse(rawBody.toString('utf8')) as IDataObject;
		} catch {
			return reject(400, 'Invalid JSON body.');
		}

		const selectedEvents = this.getNodeParameter('events') as string[];
		const nodeOptions = this.getNodeParameter('options') as IDataObject;
		const emitted = shouldEmitEvent(body.event, body, selectedEvents, {
			ignoreTypingEvents: nodeOptions.ignoreTypingEvents !== false,
			onlyIncomingMessages: nodeOptions.onlyIncomingMessages === true,
		});
		if (!emitted) {
			// 2xx so STS Connect does not retry deliveries we chose to skip.
			return { webhookResponse: 'ignored' };
		}

		body._delivery = {
			id: headerValue(req.headers['x-sts-connect-delivery']),
			attempt: Number(headerValue(req.headers['x-sts-connect-attempt'])) || undefined,
			timestamp: Number(timestampHeader),
		};

		return {
			workflowData: [[{ json: body }]],
		};
	}
}

function headerValue(value: string | string[] | undefined): string | undefined {
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}
