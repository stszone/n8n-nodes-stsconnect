import type { INodeProperties } from 'n8n-workflow';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new contact',
				action: 'Create a contact',
			},
			{
				name: 'Create Contact Inbox',
				value: 'createContactInbox',
				description: 'Link a contact to an inbox with a source ID',
				action: 'Create a contact inbox',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a contact by ID',
				action: 'Get a contact',
			},
			{
				name: 'Get Conversations',
				value: 'getConversations',
				description: 'Get the conversations of a contact',
				action: 'Get the conversations of a contact',
			},
			{
				name: 'Get Labels',
				value: 'getLabels',
				description: 'Get the labels of a contact',
				action: 'Get the labels of a contact',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many contacts',
				action: 'Get many contacts',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search contacts by name, identifier, email or phone number',
				action: 'Search contacts',
			},
			{
				name: 'Set Labels',
				value: 'setLabels',
				description:
					'Set the labels of a contact. This replaces the whole label list: labels that are not included are removed.',
				action: 'Set the labels of a contact',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a contact',
				action: 'Update a contact',
			},
		],
		default: 'get',
	},
];

const contactIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Contact ID',
	name: 'contactId',
	type: 'number',
	required: true,
	default: 0,
	displayOptions: {
		show: {
			resource: ['contact'],
			operation: operations,
		},
	},
	description: 'The numeric ID of the contact.',
});

const contactAttributeOptions: INodeProperties[] = [
	{
		displayName: 'Additional Attributes (JSON)',
		name: 'additionalAttributes',
		type: 'json',
		default: '{}',
		description: 'Additional attributes of the contact as a JSON object.',
	},
	{
		displayName: 'Custom Attributes (JSON)',
		name: 'customAttributes',
		type: 'json',
		default: '{}',
		description: 'Custom attributes of the contact as a JSON object.',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'The email address of the contact.',
	},
	{
		displayName: 'Identifier',
		name: 'identifier',
		type: 'string',
		default: '',
		description: 'A unique identifier of the contact in an external system.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'The name of the contact.',
	},
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		placeholder: '+15551234567',
		default: '',
		description: 'The phone number of the contact in E.164 format.',
	},
];

export const contactFields: INodeProperties[] = [
	contactIdField([
		'createContactInbox',
		'get',
		'getConversations',
		'getLabels',
		'setLabels',
		'update',
	]),
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
				resource: ['contact'],
				operation: ['create'],
			},
		},
		description:
			'The inbox the contact belongs to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		options: [...contactAttributeOptions],
	},
	// --------------------------------- getMany ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getMany', 'search'],
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
				resource: ['contact'],
				operation: ['getMany', 'search'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return.',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Email (A-Z)', value: 'email' },
					{ name: 'Email (Z-A)', value: '-email' },
					{ name: 'Last Activity (Newest First)', value: '-last_activity_at' },
					{ name: 'Last Activity (Oldest First)', value: 'last_activity_at' },
					{ name: 'Name (A-Z)', value: 'name' },
					{ name: 'Name (Z-A)', value: '-name' },
					{ name: 'Phone Number (A-Z)', value: 'phone_number' },
					{ name: 'Phone Number (Z-A)', value: '-phone_number' },
				],
				default: 'name',
				description: 'The field to sort the contacts by.',
			},
		],
	},
	// ---------------------------------- search ----------------------------------
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['search'],
			},
		},
		description: 'Search contacts by name, identifier, email or phone number.',
	},
	// ---------------------------------- update ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Blocked',
				name: 'blocked',
				type: 'boolean',
				default: false,
				description: 'Whether the contact is blocked.',
			},
			...contactAttributeOptions,
		],
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
				resource: ['contact'],
				operation: ['setLabels'],
			},
		},
		description:
			'The complete label list of the contact. This operation replaces all existing labels: labels that are not selected here are removed. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	// ---------------------------- createContactInbox ----------------------------
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
				resource: ['contact'],
				operation: ['createContactInbox'],
			},
		},
		description:
			'The inbox to link the contact to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Source ID',
		name: 'sourceId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createContactInbox'],
			},
		},
		description: 'The source ID of the contact in the inbox, for example a phone number or an external user ID.',
	},
];
