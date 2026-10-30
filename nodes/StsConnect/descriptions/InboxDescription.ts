import type { INodeProperties } from 'n8n-workflow';

export const inboxOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['inbox'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an inbox by ID',
				action: 'Get an inbox',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many inboxes',
				action: 'Get many inboxes',
			},
		],
		default: 'getMany',
	},
];

export const inboxFields: INodeProperties[] = [
	{
		displayName: 'Inbox Name or ID',
		name: 'inboxId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getInboxes',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['inbox'],
				operation: ['get'],
			},
		},
		description:
			'The inbox to get. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];
