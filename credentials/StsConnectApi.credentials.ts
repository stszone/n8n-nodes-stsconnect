import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StsConnectApi implements ICredentialType {
	name = 'stsConnectApi';

	displayName = 'STS Connect API';

	documentationUrl = 'https://stsconnect.chat/help';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.stsconnect.chat',
			placeholder: 'https://app.stsconnect.chat',
			description:
				'The base URL of the STS Connect Inbox. Change this only if your inbox lives on another host, for example a staging environment. Trailing slashes are ignored.',
		},
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'number',
			required: true,
			default: 0,
			description:
				'The numeric account ID. You can copy it from the inbox URL: /app/accounts/&lt;id&gt;/...',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'sts_live_...',
			description:
				'An account API key from the inbox (Settings → API & webhooks). Format: sts_live_ followed by 32 lowercase hex characters. The key is shown only once when created.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				api_access_token: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '=/api/v1/accounts/{{$credentials.accountId}}/inboxes',
			method: 'GET',
		},
	};
}
