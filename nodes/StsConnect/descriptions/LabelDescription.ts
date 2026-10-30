import type { INodeProperties } from 'n8n-workflow';

export const labelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['label'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get many labels',
				action: 'Get many labels',
			},
		],
		default: 'getMany',
	},
];
