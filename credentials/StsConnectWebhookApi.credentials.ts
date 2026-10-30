import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class StsConnectWebhookApi implements ICredentialType {
	name = 'stsConnectWebhookApi';

	displayName = 'STS Connect Webhook';

	documentationUrl = 'https://stsconnect.chat/help';

	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Secret',
			name: 'secret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'The secret of the webhook endpoint. In the STS Connect Inbox open Settings → API & webhooks → Webhooks, edit the endpoint and use "Show secret" to reveal it.',
		},
	];
}
