/** Webhook events that indicate typing activity. */
export const TYPING_EVENTS = ['conversation_typing_on', 'conversation_typing_off'];

/** Webhook events that carry a message object. */
export const MESSAGE_EVENTS = ['message_created', 'message_updated'];

export interface EventFilterOptions {
	ignoreTypingEvents: boolean;
	onlyIncomingMessages: boolean;
}

/**
 * Decides whether a webhook event should start the workflow.
 *
 * - The event must be selected (or `*` must be selected).
 * - Typing events are dropped when `ignoreTypingEvents` is set.
 * - Message events are dropped unless they are public incoming messages when
 *   `onlyIncomingMessages` is set.
 *
 * Pure function, unit-tested in test/eventFilter.test.ts.
 */
export function shouldEmitEvent(
	event: unknown,
	payload: unknown,
	selectedEvents: string[],
	options: EventFilterOptions,
): boolean {
	if (typeof event !== 'string' || event === '') {
		return false;
	}
	if (!selectedEvents.includes('*') && !selectedEvents.includes(event)) {
		return false;
	}
	if (options.ignoreTypingEvents && TYPING_EVENTS.includes(event)) {
		return false;
	}
	if (options.onlyIncomingMessages && MESSAGE_EVENTS.includes(event)) {
		const message = (payload ?? {}) as Record<string, unknown>;
		if (message.message_type !== 'incoming' || message.private === true) {
			return false;
		}
	}
	return true;
}
