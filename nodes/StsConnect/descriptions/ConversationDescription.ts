import type { INodeProperties } from 'n8n-workflow';

export const conversationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['conversation'],
			},
		},
		options: [
			{
				name: 'Assign',
				value: 'assign',
				description: 'Assign a conversation to an agent and/or a team',
				action: 'Assign a conversation',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new conversation',
				action: 'Create a conversation',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a conversation by ID',
				action: 'Get a conversation',
			},
			{
				name: 'Get Labels',
				value: 'getLabels',
				description: 'Get the labels of a conversation',
				action: 'Get the labels of a conversation',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many conversations with optional filters',
				action: 'Get many conversations',
			},
			{
				name: 'Set Custom Attributes',
				value: 'setCustomAttributes',
				description: 'Set custom attributes on a conversation',
				action: 'Set custom attributes on a conversation',
			},
			{
				name: 'Set Labels',
				value: 'setLabels',
				description:
					'Set the labels of a conversation. This replaces the whole label list: labels that are not included are removed.',
				action: 'Set the labels of a conversation',
			},
			{
				name: 'Set Priority',
				value: 'setPriority',
				description: 'Set the priority of a conversation',
				action: 'Set the priority of a conversation',
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				description: 'Update the status of a conversation',
				action: 'Update the status of a conversation',
			},
		],
		default: 'get',
	},
];

const conversationIdField: INodeProperties = {
	displayName: 'Conversation ID',
	name: 'conversationId',
	type: 'number',
	required: true,
	default: 0,
	displayOptions: {
		show: {
			resource: ['conversation'],
			operation: [
				'assign',
				'get',
				'getLabels',
				'setCustomAttributes',
				'setLabels',
				'setPriority',
				'updateStatus',
			],
		},
	},
	description: 'The numeric ID of the conversation.',
};

export const conversationFields: INodeProperties[] = [
	conversationIdField,
	// ---------------------------------- create ----------------------------------
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
				resource: ['conversation'],
				operation: ['create'],
			},
		},
		description:
			'The inbox the conversation is created in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['create'],
			},
		},
		description:
			'The contact the conversation is with. Create or search the contact first. The inbox links the contact to it (for WhatsApp, by the contact\'s phone number).',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Additional Attributes (JSON)',
				name: 'additionalAttributes',
				type: 'json',
				default: '{}',
				description: 'Additional attributes of the conversation as a JSON object.',
			},
			{
				displayName: 'Assignee Name or ID',
				name: 'assigneeId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAgents',
				},
				default: '',
				description:
					'The agent to assign the conversation to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Custom attributes of the conversation as a JSON object.',
			},
			{
				displayName: 'Initial Message',
				name: 'messageContent',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'The content of the first message of the conversation.',
			},
			{
				displayName: 'Source ID',
				name: 'sourceId',
				type: 'string',
				default: '',
				description:
					'The contact\'s ID in this inbox (for example a WhatsApp number without +). Leave empty to let the inbox derive it from the contact.',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'open' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Resolved', value: 'resolved' },
				],
				default: 'open',
				description: 'The status of the new conversation.',
			},
			{
				displayName: 'Team Name or ID',
				name: 'teamId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTeams',
				},
				default: '',
				description:
					'The team to assign the conversation to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	},
	// --------------------------------- getMany ---------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['getMany'],
			},
		},
		description: 'Whether to return all results or only up to a set limit.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return.',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Assignee Type',
				name: 'assignee_type',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Assigned', value: 'assigned' },
					{ name: 'Mine', value: 'me' },
					{ name: 'Unassigned', value: 'unassigned' },
				],
				default: 'all',
				description: 'Filter conversations by assignee type.',
			},
			{
				displayName: 'Inbox Name or ID',
				name: 'inbox_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getInboxes',
				},
				default: '',
				description:
					'Filter conversations by inbox. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Label Names or IDs',
				name: 'labels',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getLabels',
				},
				default: [],
				description:
					'Filter conversations by labels. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Search Term',
				name: 'q',
				type: 'string',
				default: '',
				description: 'Only return conversations with messages containing this term.',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Open', value: 'open' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Resolved', value: 'resolved' },
					{ name: 'Snoozed', value: 'snoozed' },
				],
				default: 'all',
				description: 'Filter conversations by status.',
			},
			{
				displayName: 'Team Name or ID',
				name: 'team_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTeams',
				},
				default: '',
				description:
					'Filter conversations by team. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	},
	// ------------------------------- updateStatus -------------------------------
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['updateStatus'],
			},
		},
		options: [
			{ name: 'Open', value: 'open' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Resolved', value: 'resolved' },
			{ name: 'Snoozed', value: 'snoozed' },
		],
		default: 'open',
		description: 'The new status of the conversation.',
	},
	{
		displayName: 'Snoozed Until',
		name: 'snoozedUntil',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['updateStatus'],
				status: ['snoozed'],
			},
		},
		description:
			'When to reopen the conversation. Sent as a Unix timestamp in seconds. If empty, the conversation reopens on the next customer reply.',
	},
	// ------------------------------- setPriority --------------------------------
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['setPriority'],
			},
		},
		options: [
			{ name: 'High', value: 'high' },
			{ name: 'Low', value: 'low' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'None (Clear)', value: 'none' },
			{ name: 'Urgent', value: 'urgent' },
		],
		default: 'none',
		description: 'The priority of the conversation.',
	},
	// --------------------------------- assign -----------------------------------
	{
		displayName: 'Assignee Name or ID',
		name: 'assigneeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getAgents',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assign'],
			},
		},
		description:
			'The agent to assign. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. At least one of assignee or team must be set.',
	},
	{
		displayName: 'Team Name or ID',
		name: 'teamId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeams',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['assign'],
			},
		},
		description:
			'The team to assign. Ignored by the API when an assignee is also sent. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	// -------------------------------- setLabels ---------------------------------
	{
		displayName: 'Label Names or IDs',
		name: 'labels',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getLabels',
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['setLabels'],
			},
		},
		description:
			'The complete label list of the conversation. This operation replaces all existing labels: labels that are not selected here are removed. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	// ---------------------------- setCustomAttributes ---------------------------
	{
		displayName: 'Custom Attributes (JSON)',
		name: 'customAttributes',
		type: 'json',
		required: true,
		default: '{}',
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['setCustomAttributes'],
			},
		},
		description: 'The custom attributes to set on the conversation as a JSON object.',
	},
];
