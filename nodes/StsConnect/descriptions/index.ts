import type { INodeProperties } from 'n8n-workflow';

import { agentOperations } from './AgentDescription';
import { contactFields, contactOperations } from './ContactDescription';
import { conversationFields, conversationOperations } from './ConversationDescription';
import { inboxFields, inboxOperations } from './InboxDescription';
import { labelOperations } from './LabelDescription';
import { messageFields, messageOperations } from './MessageDescription';
import { teamFields, teamOperations } from './TeamDescription';

export const resourceField: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Agent', value: 'agent' },
			{ name: 'Contact', value: 'contact' },
			{ name: 'Conversation', value: 'conversation' },
			{ name: 'Inbox', value: 'inbox' },
			{ name: 'Label', value: 'label' },
			{ name: 'Message', value: 'message' },
			{ name: 'Team', value: 'team' },
		],
		default: 'conversation',
	},
];

export const nodeProperties: INodeProperties[] = [
	...resourceField,
	...conversationOperations,
	...conversationFields,
	...messageOperations,
	...messageFields,
	...contactOperations,
	...contactFields,
	...inboxOperations,
	...inboxFields,
	...labelOperations,
	...teamOperations,
	...teamFields,
	...agentOperations,
];
