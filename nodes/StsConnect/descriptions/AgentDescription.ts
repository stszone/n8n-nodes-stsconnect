import type { INodeProperties } from 'n8n-workflow';

export const agentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['agent'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many agents',
				action: 'Get many agents',
			},
		],
		default: 'getMany',
	},
];
