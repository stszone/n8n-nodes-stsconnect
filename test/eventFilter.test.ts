import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldEmitEvent } from '../nodes/StsConnectTrigger/eventFilter';

const defaults = { ignoreTypingEvents: true, onlyIncomingMessages: false };

test('emits a selected event', () => {
	assert.equal(
		shouldEmitEvent('message_created', { message_type: 'incoming' }, ['message_created'], defaults),
		true,
	);
});

test('drops an event that is not selected', () => {
	assert.equal(
		shouldEmitEvent('contact_created', {}, ['message_created'], defaults),
		false,
	);
});

test('emits any event when * is selected', () => {
	assert.equal(shouldEmitEvent('inbox_updated', {}, ['*'], defaults), true);
});

test('drops typing events when ignoreTypingEvents is set', () => {
	for (const event of ['conversation_typing_on', 'conversation_typing_off']) {
		assert.equal(shouldEmitEvent(event, {}, ['*'], defaults), false, `${event} should be dropped`);
	}
});

test('emits typing events when ignoreTypingEvents is off and the event is selected', () => {
	assert.equal(
		shouldEmitEvent('conversation_typing_on', {}, ['conversation_typing_on'], {
			...defaults,
			ignoreTypingEvents: false,
		}),
		true,
	);
});

test('only incoming messages: drops outgoing messages', () => {
	assert.equal(
		shouldEmitEvent('message_created', { message_type: 'outgoing', private: false }, ['*'], {
			...defaults,
			onlyIncomingMessages: true,
		}),
		false,
	);
});

test('only incoming messages: drops private notes', () => {
	assert.equal(
		shouldEmitEvent('message_created', { message_type: 'incoming', private: true }, ['*'], {
			...defaults,
			onlyIncomingMessages: true,
		}),
		false,
	);
});

test('only incoming messages: keeps public incoming messages', () => {
	assert.equal(
		shouldEmitEvent('message_created', { message_type: 'incoming', private: false }, ['*'], {
			...defaults,
			onlyIncomingMessages: true,
		}),
		true,
	);
});

test('only incoming messages does not affect non-message events', () => {
	assert.equal(
		shouldEmitEvent('contact_created', {}, ['*'], { ...defaults, onlyIncomingMessages: true }),
		true,
	);
});

test('drops events without a name', () => {
	assert.equal(shouldEmitEvent(undefined, {}, ['*'], defaults), false);
	assert.equal(shouldEmitEvent('', {}, ['*'], defaults), false);
});
