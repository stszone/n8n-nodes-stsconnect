import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { nodeProperties } from './descriptions';
import {
	fetchAllPages,
	mapApiErrorMessage,
	parseJsonField,
	StsConnectApiError,
	stsConnectApiRequest,
	unwrapPayload,
} from './GenericFunctions';

export class StsConnect implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'STS Connect',
		name: 'stsConnect',
		icon: 'file:stsConnect.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with conversations, messages and contacts in the STS Connect Inbox',
		usableAsTool: true,
		defaults: {
			name: 'STS Connect',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'stsConnectApi',
				required: true,
			},
		],
		properties: nodeProperties,
	};

	methods = {
		loadOptions: {
			async getInboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await stsConnectApiRequest.call(this, 'GET', '/inboxes');
				return unwrapPayload(response).map((inbox) => ({
					name: String(inbox.name ?? inbox.id),
					value: Number(inbox.id),
				}));
			},
			async getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await stsConnectApiRequest.call(this, 'GET', '/teams');
				return unwrapPayload(response).map((team) => ({
					name: String(team.name ?? team.id),
					value: Number(team.id),
				}));
			},
			async getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await stsConnectApiRequest.call(this, 'GET', '/agents');
				return unwrapPayload(response).map((agent) => ({
					name: String(agent.available_name ?? agent.name ?? agent.email ?? agent.id),
					value: Number(agent.id),
				}));
			},
			async getLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await stsConnectApiRequest.call(this, 'GET', '/labels');
				return unwrapPayload(response).map((label) => ({
					name: String(label.title),
					value: String(label.title),
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const results = await executeOperation.call(this, resource, operation, i);
				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof StsConnectApiError) {
					const mapped = mapApiErrorMessage(error.statusCode, error.body, error.retryAfter);
					const errorResponse =
						error.body && typeof error.body === 'object'
							? (error.body as JsonObject)
							: ({ message: error.message } as JsonObject);
					throw new NodeApiError(this.getNode(), errorResponse, {
						itemIndex: i,
						message: mapped ?? error.message,
					});
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

async function executeOperation(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	let response: IDataObject | IDataObject[];

	if (resource === 'conversation') {
		response = await executeConversationOperation.call(this, operation, itemIndex);
	} else if (resource === 'message') {
		response = await executeMessageOperation.call(this, operation, itemIndex);
	} else if (resource === 'contact') {
		response = await executeContactOperation.call(this, operation, itemIndex);
	} else if (resource === 'inbox') {
		if (operation === 'get') {
			const inboxId = this.getNodeParameter('inboxId', itemIndex);
			response = await stsConnectApiRequest.call(this, 'GET', `/inboxes/${inboxId}`);
		} else {
			const body = await stsConnectApiRequest.call(this, 'GET', '/inboxes');
			response = unwrapPayload(body);
		}
	} else if (resource === 'label') {
		const body = await stsConnectApiRequest.call(this, 'GET', '/labels');
		response = unwrapPayload(body);
	} else if (resource === 'team') {
		if (operation === 'getMembers') {
			const teamId = this.getNodeParameter('teamId', itemIndex);
			const body = await stsConnectApiRequest.call(this, 'GET', `/teams/${teamId}/team_members`);
			response = unwrapPayload(body);
		} else {
			const body = await stsConnectApiRequest.call(this, 'GET', '/teams');
			response = unwrapPayload(body);
		}
	} else if (resource === 'agent') {
		const body = await stsConnectApiRequest.call(this, 'GET', '/agents');
		response = unwrapPayload(body);
	} else {
		throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported.`);
	}

	const list = Array.isArray(response) ? response : [response];
	return list.map((entry) => ({
		json: toJsonObject(entry),
		pairedItem: { item: itemIndex },
	}));
}

function toJsonObject(entry: unknown): IDataObject {
	if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
		return entry as IDataObject;
	}
	return { value: entry } as IDataObject;
}

async function executeConversationOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const inboxId = Number(this.getNodeParameter('inboxId', i));
		const fields = this.getNodeParameter('additionalFields', i) as IDataObject;
		const contactId = Number(this.getNodeParameter('contactId', i));
		if (!Number.isInteger(contactId) || contactId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Set the Contact ID of the conversation.', {
				itemIndex: i,
			});
		}
		const body: IDataObject = { inbox_id: inboxId, contact_id: contactId };
		// Without a source ID the inbox derives the contact's address for the channel itself.
		if (fields.sourceId) body.source_id = fields.sourceId;
		if (fields.status) body.status = fields.status;
		if (fields.assigneeId) body.assignee_id = Number(fields.assigneeId);
		if (fields.teamId) body.team_id = Number(fields.teamId);
		if (fields.messageContent) body.message = { content: fields.messageContent };
		const customAttributes = fields.customAttributes as string;
		if (customAttributes && customAttributes !== '{}') {
			body.custom_attributes = parseJsonField(customAttributes, 'Custom Attributes');
		}
		const additionalAttributes = fields.additionalAttributes as string;
		if (additionalAttributes && additionalAttributes !== '{}') {
			body.additional_attributes = parseJsonField(additionalAttributes, 'Additional Attributes');
		}
		return stsConnectApiRequest.call(this, 'POST', '/conversations', body);
	}

	if (operation === 'get') {
		const conversationId = this.getNodeParameter('conversationId', i);
		return stsConnectApiRequest.call(this, 'GET', `/conversations/${conversationId}`);
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs: IDataObject = {};
		if (filters.status && filters.status !== 'all') qs.status = filters.status;
		if (filters.assignee_type && filters.assignee_type !== 'all') {
			qs.assignee_type = filters.assignee_type;
		}
		if (filters.inbox_id) qs.inbox_id = Number(filters.inbox_id);
		if (filters.team_id) qs.team_id = Number(filters.team_id);
		if (filters.q) qs.q = filters.q;
		if (Array.isArray(filters.labels) && filters.labels.length > 0) {
			qs.labels = filters.labels;
		}
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
		return fetchAllPages(
			async (page) => {
				const body = await stsConnectApiRequest.call(this, 'GET', '/conversations', {}, {
					...qs,
					page,
				});
				return unwrapPayload(body);
			},
			limit,
		);
	}

	const conversationId = this.getNodeParameter('conversationId', i);

	if (operation === 'updateStatus') {
		const status = this.getNodeParameter('status', i) as string;
		const body: IDataObject = { status };
		if (status === 'snoozed') {
			const snoozedUntil = this.getNodeParameter('snoozedUntil', i) as string;
			if (snoozedUntil) {
				// The API expects a Unix timestamp in seconds.
				body.snoozed_until = Math.floor(new Date(snoozedUntil).getTime() / 1000);
			}
		}
		return stsConnectApiRequest.call(
			this,
			'POST',
			`/conversations/${conversationId}/toggle_status`,
			body,
		);
	}

	if (operation === 'setPriority') {
		const priority = this.getNodeParameter('priority', i) as string;
		// The API clears the priority with null; "none" is only the option's value here.
		return stsConnectApiRequest.call(
			this,
			'POST',
			`/conversations/${conversationId}/toggle_priority`,
			{ priority: priority === 'none' ? null : priority },
		);
	}

	if (operation === 'assign') {
		const assigneeId = this.getNodeParameter('assigneeId', i) as string | number;
		const teamId = this.getNodeParameter('teamId', i) as string | number;
		const body: IDataObject = {};
		if (assigneeId !== '' && assigneeId !== 0) body.assignee_id = Number(assigneeId);
		if (teamId !== '' && teamId !== 0) body.team_id = Number(teamId);
		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(this.getNode(), 'Set an assignee, a team, or both.');
		}
		return stsConnectApiRequest.call(this, 'POST', `/conversations/${conversationId}/assignments`, body);
	}

	if (operation === 'setLabels') {
		const labels = this.getNodeParameter('labels', i) as string[];
		return stsConnectApiRequest.call(this, 'POST', `/conversations/${conversationId}/labels`, {
			labels,
		});
	}

	if (operation === 'getLabels') {
		const body = await stsConnectApiRequest.call(
			this,
			'GET',
			`/conversations/${conversationId}/labels`,
		);
		return unwrapPayload(body);
	}

	if (operation === 'setCustomAttributes') {
		const customAttributes = parseJsonField(
			this.getNodeParameter('customAttributes', i) as string,
			'Custom Attributes',
		);
		return stsConnectApiRequest.call(
			this,
			'POST',
			`/conversations/${conversationId}/custom_attributes`,
			{ custom_attributes: customAttributes },
		);
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
}

async function executeMessageOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const conversationId = this.getNodeParameter('conversationId', i);

	if (operation === 'send') {
		const content = this.getNodeParameter('content', i) as string;
		const options = this.getNodeParameter('options', i) as IDataObject;
		const body: IDataObject = {
			content,
			message_type: (options.messageType as string) || 'outgoing',
		};
		if (options.private) body.private = true;
		if (options.inReplyTo) {
			body.content_attributes = { in_reply_to: Number(options.inReplyTo) };
		}
		const templateName = (options.templateName as string) || '';
		if (templateName) {
			const processedBody: IDataObject = {};
			const templateParams = options.templateBodyParameters as IDataObject | undefined;
			const parameterList = (templateParams?.parameter as IDataObject[] | undefined) ?? [];
			for (const parameter of parameterList) {
				if (parameter.key) {
					processedBody[String(parameter.key)] = parameter.value ?? '';
				}
			}
			body.template_params = {
				name: templateName,
				category: (options.templateCategory as string) || 'UTILITY',
				language: (options.templateLanguage as string) || 'en_US',
				processed_params: { body: processedBody },
			};
		}
		return stsConnectApiRequest.call(
			this,
			'POST',
			`/conversations/${conversationId}/messages`,
			body,
		);
	}

	if (operation === 'getMany') {
		const options = this.getNodeParameter('options', i) as IDataObject;
		const qs: IDataObject = {};
		if (options.before) qs.before = Number(options.before);
		if (options.after) qs.after = Number(options.after);
		const body = await stsConnectApiRequest.call(
			this,
			'GET',
			`/conversations/${conversationId}/messages`,
			{},
			qs,
		);
		return unwrapPayload(body);
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
}

async function executeContactOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const inboxId = Number(this.getNodeParameter('inboxId', i));
		const fields = this.getNodeParameter('additionalFields', i) as IDataObject;
		const body = buildContactBody(fields);
		body.inbox_id = inboxId;
		return stsConnectApiRequest.call(this, 'POST', '/contacts', body);
	}

	if (operation === 'getMany' || operation === 'search') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
		const qs: IDataObject = {};
		let endpoint = '/contacts';
		if (operation === 'search') {
			endpoint = '/contacts/search';
			qs.q = this.getNodeParameter('query', i) as string;
		} else {
			const options = this.getNodeParameter('options', i) as IDataObject;
			if (options.sort) qs.sort = options.sort;
		}
		return fetchAllPages(
			async (page) => {
				const body = await stsConnectApiRequest.call(this, 'GET', endpoint, {}, {
					...qs,
					page,
				});
				return unwrapPayload(body);
			},
			limit,
		);
	}

	const contactId = this.getNodeParameter('contactId', i);

	if (operation === 'get') {
		const body = await stsConnectApiRequest.call(this, 'GET', `/contacts/${contactId}`);
		return (body.payload as IDataObject) ?? body;
	}

	if (operation === 'update') {
		const fields = this.getNodeParameter('updateFields', i) as IDataObject;
		const body = buildContactBody(fields);
		if (fields.blocked !== undefined) body.blocked = fields.blocked;
		const result = await stsConnectApiRequest.call(this, 'PUT', `/contacts/${contactId}`, body);
		// The API answers 204 No Content; return something meaningful.
		return { success: true, id: contactId, ...result };
	}

	if (operation === 'getConversations') {
		const body = await stsConnectApiRequest.call(this, 'GET', `/contacts/${contactId}/conversations`);
		return unwrapPayload(body);
	}

	if (operation === 'getLabels') {
		const body = await stsConnectApiRequest.call(this, 'GET', `/contacts/${contactId}/labels`);
		return unwrapPayload(body);
	}

	if (operation === 'setLabels') {
		const labels = this.getNodeParameter('labels', i) as string[];
		return stsConnectApiRequest.call(this, 'POST', `/contacts/${contactId}/labels`, { labels });
	}

	if (operation === 'createContactInbox') {
		const inboxId = Number(this.getNodeParameter('inboxId', i));
		const sourceId = this.getNodeParameter('sourceId', i) as string;
		const body: IDataObject = { inbox_id: inboxId };
		if (sourceId) body.source_id = sourceId;
		return stsConnectApiRequest.call(this, 'POST', `/contacts/${contactId}/contact_inboxes`, body);
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
}

function buildContactBody(fields: IDataObject): IDataObject {
	const body: IDataObject = {};
	if (fields.name) body.name = fields.name;
	if (fields.email) body.email = fields.email;
	if (fields.phoneNumber) body.phone_number = fields.phoneNumber;
	if (fields.identifier) body.identifier = fields.identifier;
	const customAttributes = fields.customAttributes as string | undefined;
	if (customAttributes && customAttributes !== '{}') {
		body.custom_attributes = parseJsonField(customAttributes, 'Custom Attributes');
	}
	const additionalAttributes = fields.additionalAttributes as string | undefined;
	if (additionalAttributes && additionalAttributes !== '{}') {
		body.additional_attributes = parseJsonField(additionalAttributes, 'Additional Attributes');
	}
	return body;
}
