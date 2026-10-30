import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get the messages of a conversation',
				action: 'Get many messages',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send a message to a conversation',
				action: 'Send a message',
			},
		],
		default: 'send',
	},
];

export const messageFields: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		description: 'The numeric ID of the conversation.',
	},
	// ---------------------------------- send ------------------------------------
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		description: 'The text content of the message.',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		options: [
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				options: [
					{ name: 'Incoming', value: 'incoming' },
					{ name: 'Outgoing', value: 'outgoing' },
				],
				default: 'outgoing',
				description: 'The direction of the message.',
			},
			{
				displayName: 'Private Note',
				name: 'private',
				type: 'boolean',
				default: false,
				description:
					'Whether the message is an internal note that is only visible to the team, not to the customer.',
			},
			{
				displayName: 'Reply To Message ID',
				name: 'inReplyTo',
				type: 'number',
				default: 0,
				description: 'The ID of the message this message replies to. Leave 0 for no reply.',
			},
			{
				displayName: 'Template Body Parameters',
				name: 'templateBodyParameters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Parameter',
				description:
					'The values for the variables of the WhatsApp template body, sent as processed_params. Only used when a template name is set.',
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Variable Number',
								name: 'key',
								type: 'string',
								default: '1',
								description: 'The number of the template variable, for example 1 for {{1}}.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'The value of the template variable.',
							},
						],
					},
				],
			},
			{
				displayName: 'Template Category',
				name: 'templateCategory',
				type: 'options',
				options: [
					{ name: 'Issue Resolution', value: 'ISSUE_RESOLUTION' },
					{ name: 'Marketing', value: 'MARKETING' },
					{ name: 'Shipping Update', value: 'SHIPPING_UPDATE' },
					{ name: 'Ticket Update', value: 'TICKET_UPDATE' },
					{ name: 'Utility', value: 'UTILITY' },
				],
				default: 'UTILITY',
				description: 'The category of the WhatsApp template. Only used when a template name is set.',
			},
			{
				displayName: 'Template Language',
				name: 'templateLanguage',
				type: 'string',
				default: 'en_US',
				description:
					'The language code of the WhatsApp template (BCP 47), for example en_US. Only used when a template name is set.',
			},
			{
				displayName: 'Template Name',
				name: 'templateName',
				type: 'string',
				default: '',
				description:
					'The name of an approved WhatsApp template. When set, the message is sent as a template message.',
			},
		],
	},
	// --------------------------------- getMany ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'After Message ID',
				name: 'after',
				type: 'number',
				default: 0,
				description:
					'Only return messages after the message with this ID (up to 100, ascending). Leave 0 to ignore.',
			},
			{
				displayName: 'Before Message ID',
				name: 'before',
				type: 'number',
				default: 0,
				description:
					'Only return messages before the message with this ID (up to 20, ascending). Leave 0 to ignore.',
			},
		],
	},
];
