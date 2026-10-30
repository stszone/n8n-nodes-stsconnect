import type { INodeProperties } from 'n8n-workflow';

export const teamOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['team'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many teams',
				action: 'Get many teams',
			},
			{
				name: 'Get Members',
				value: 'getMembers',
				description: 'Get the members of a team',
				action: 'Get the members of a team',
			},
		],
		default: 'getMany',
	},
];

export const teamFields: INodeProperties[] = [
	{
		displayName: 'Team Name or ID',
		name: 'teamId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeams',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['team'],
				operation: ['getMembers'],
			},
		},
		description:
			'The team to get the members of. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];
