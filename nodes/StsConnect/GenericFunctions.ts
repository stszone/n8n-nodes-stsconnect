import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

/** Credentials of the STS Connect account API. */
interface StsConnectCredentials {
	baseUrl: string;
	accountId: number;
	apiKey: string;
}

/** Error raised for non-2xx responses from the STS Connect API. */
export class StsConnectApiError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly body: unknown,
		public readonly retryAfter?: number,
	) {
		super(`STS Connect API request failed with status ${statusCode}`);
		this.name = 'StsConnectApiError';
	}
}

/**
 * Maps an API error to a clear, actionable message.
 * Returns null when there is no specific mapping for the status code.
 */
export function mapApiErrorMessage(
	statusCode: number,
	body: unknown,
	retryAfter?: number,
): string | null {
	const code =
		body && typeof body === 'object'
			? (body as IDataObject).code ?? (body as IDataObject).error_code
			: undefined;

	if (statusCode === 401) {
		return 'The API key is wrong, revoked, expired or for another account.';
	}
	if (statusCode === 403 && code === 'api_key_read_only') {
		return 'This API key can only read. Create a read + write key.';
	}
	if (statusCode === 403 && code === 'api_key_endpoint_not_allowed') {
		return 'API keys cannot use this endpoint.';
	}
	if (statusCode === 429) {
		const seconds =
			retryAfter ??
			(body && typeof body === 'object'
				? Number((body as IDataObject).retry_after) || undefined
				: undefined);
		return seconds !== undefined
			? `Rate limit exceeded. Retry after ${seconds} seconds.`
			: 'Rate limit exceeded. Try again in a minute.';
	}
	return null;
}

/** Maximum seconds to wait for an automatic retry after a 429 response. */
const MAX_AUTO_RETRY_SECONDS = 10;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Performs an authenticated request against the STS Connect account API.
 *
 * - Builds the URL from the credential's base URL (trailing slashes stripped)
 *   and account ID.
 * - On HTTP 429, retries exactly once after `Retry-After` seconds when that
 *   value is 10 seconds or less; otherwise throws.
 * - Throws an StsConnectApiError for every other non-2xx response.
 */
export async function stsConnectApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const credentials = (await this.getCredentials('stsConnectApi')) as unknown as StsConnectCredentials;
	const baseUrl = String(credentials.baseUrl).replace(/\/+$/, '');
	const accountId = credentials.accountId;

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1/accounts/${accountId}${endpoint}`,
		body,
		qs,
		// Rails reads list parameters as labels[]=a&labels[]=b
		arrayFormat: 'brackets',
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	let response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'stsConnectApi',
		options,
	);

	if (response.statusCode === 429) {
		const retryAfter = readRetryAfter(response.headers, response.body);
		if (retryAfter !== undefined && retryAfter <= MAX_AUTO_RETRY_SECONDS) {
			await sleep(retryAfter * 1000);
			response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'stsConnectApi',
				options,
			);
		}
	}

	if (response.statusCode >= 400) {
		throw new StsConnectApiError(
			response.statusCode,
			response.body,
			readRetryAfter(response.headers, response.body),
		);
	}

	// Some write endpoints (for example contact update) answer 204 with no body.
	if (response.body === undefined || response.body === null || response.body === '') {
		return { success: true };
	}
	return response.body as IDataObject;
}

function readRetryAfter(headers: IDataObject, body: unknown): number | undefined {
	const headerValue = headers?.['retry-after'];
	const fromHeader = Number(headerValue);
	if (headerValue !== undefined && Number.isFinite(fromHeader)) {
		return fromHeader;
	}
	if (body && typeof body === 'object') {
		const fromBody = Number((body as IDataObject).retry_after);
		if (Number.isFinite(fromBody)) {
			return fromBody;
		}
	}
	return undefined;
}

/**
 * Fetches all pages of a paginated endpoint.
 *
 * Calls `fetchPage` with a 1-based page number and collects items until a page
 * comes back empty or `limit` items have been collected. Pass no limit to
 * return everything.
 */
export async function fetchAllPages<T>(
	fetchPage: (page: number) => Promise<T[]>,
	limit?: number,
): Promise<T[]> {
	const items: T[] = [];
	let page = 1;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const pageItems = await fetchPage(page);
		if (pageItems.length === 0) {
			break;
		}
		items.push(...pageItems);
		if (limit !== undefined && items.length >= limit) {
			return items.slice(0, limit);
		}
		page++;
	}
	return items;
}

/** Unwraps list responses: arrays pass through, otherwise the payload array is used. */
export function unwrapPayload(response: unknown): IDataObject[] {
	if (Array.isArray(response)) {
		return response as IDataObject[];
	}
	if (response && typeof response === 'object') {
		const obj = response as IDataObject;
		if (Array.isArray(obj.payload)) {
			return obj.payload as IDataObject[];
		}
		const data = obj.data as IDataObject | undefined;
		if (data && Array.isArray(data.payload)) {
			return data.payload as IDataObject[];
		}
	}
	return [];
}

/** Parses a JSON editor field, throwing a clear error for invalid JSON. */
export function parseJsonField(value: string, fieldName: string): IDataObject {
	try {
		const parsed = JSON.parse(value) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('not an object');
		}
		return parsed as IDataObject;
	} catch {
		throw new Error(`The field "${fieldName}" must contain a valid JSON object.`);
	}
}
