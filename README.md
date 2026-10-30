# n8n-nodes-stsconnect

n8n community nodes for [STS Connect](https://stsconnect.chat) - the business
messaging inbox for WhatsApp, Messenger, Instagram, Telegram, email and web
chat.

This package ships two nodes:

- **STS Connect** - call the account API: manage conversations, send messages,
  work with contacts, and read inboxes, labels, teams and agents.
- **STS Connect Trigger** - receive webhook events from the STS Connect Inbox
  (new messages, conversation updates, and more) with signature verification.

## Installation

In your self-hosted n8n instance go to **Settings → Community Nodes**, choose
**Install**, and enter:

```
n8n-nodes-stsconnect
```

## Credentials

### STS Connect API (account API key)

Create an API key in the inbox under **Settings → API & webhooks**:

- A **read** key can only read data. Write calls fail with
  `403 api_key_read_only`.
- A **read + write** key can also create and update conversations, messages and
  contacts.

The key is shown **once** when created - afterwards only the last 4 characters
are visible. Keys look like `sts_live_` followed by 32 lowercase hex characters.

The credential asks for:

- **Base URL** - default `https://app.stsconnect.chat`. Change it only if your
  inbox lives on a different host (for example staging). Trailing slashes are
  stripped.
- **Account ID** - the numeric ID from the inbox URL
  (`/app/accounts/<id>/...`).
- **API Key** - the `sts_live_...` key.

The credential test calls `GET /api/v1/accounts/<id>/inboxes`.

### STS Connect Webhook (endpoint secret)

The secret of a webhook endpoint, revealed in the inbox via **Settings → API &
webhooks → Webhooks → (endpoint) → Show secret**. Used by the trigger node to
verify signatures.

## Trigger setup

Webhook endpoints are registered by an admin in the inbox - API keys cannot
manage webhooks, so this is a manual step:

1. Add the **STS Connect Trigger** node to your workflow and activate the
   workflow.
2. Copy the node's **Production URL** (note: the Test URL is a different URL
   and only works while you are testing in the editor).
3. In the STS Connect Inbox open **Settings → API & webhooks → Webhooks →
   Add webhook**, paste the URL, and pick the same events you selected in the
   node's **Events** parameter.
4. Reveal the endpoint secret with **Show secret** and paste it into the
   node's **STS Connect Webhook** credential.

Every delivery is verified before anything enters your workflow:

- `X-STS-Connect-Signature` must be `sha256=` + hex of
  `HMAC-SHA256(secret, "<timestamp>.<raw body>")`, compared in constant time.
- `X-STS-Connect-Timestamp` (Unix seconds) must be within **300 seconds** of
  the current time, in both directions.

Deliveries that fail verification get a 401 and never reach your workflow.
Events you did not select (or that are filtered out by the options) are
acknowledged with a 2xx response so the sender does not retry them.

Each emitted item contains the parsed event body plus a `_delivery` object with
the delivery `id`, retry `attempt` and `timestamp` from the headers.

**Options:**

- **Ignore Typing Events** (default on) - drops `conversation_typing_on` /
  `conversation_typing_off` even when selected.
- **Only Incoming Messages** (default off) - message events pass only when
  `message_type` is `incoming` and the message is not private.

## Rate limits

Per API key: 120 requests/minute. Per account: 300 requests/minute (30/minute
during the free trial), in fixed one-minute windows. Every response carries
`X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers.

When a request is rate limited (HTTP 429 with a `Retry-After` header), the node
automatically retries **once** if the wait is 10 seconds or less; otherwise it
fails with an error that includes the `retry_after` value.

## Operations

**Conversation**

- Create (inbox, optional contact, status, assignee/team, initial message,
  custom and additional attributes)
- Get
- Get Many - filters (status, assignee type, inbox, team, labels, search term)
  with Return All / Limit pagination
- Update Status (open, resolved, pending, snoozed + snoozed-until)
- Set Priority (urgent, high, medium, low, none)
- Assign (agent and/or team)
- Set Labels - **replaces the whole label list**
- Get Labels
- Set Custom Attributes

**Message**

- Send - text; options: private note, reply-to message ID, WhatsApp template
  (name, language, category, body parameters)
- Get Many - with before/after message ID cursors

**Contact**

- Create (name, email, E.164 phone number, identifier, custom/additional
  attributes, inbox)
- Get
- Get Many - with Return All / Limit pagination and sorting
- Search (name, identifier, email or phone number)
- Update
- Get Conversations
- Set Labels - **replaces the whole label list**
- Get Labels
- Create Contact Inbox - link a contact to an inbox with a source ID

**Inbox** - Get, Get Many
**Label** - Get Many
**Team** - Get Many, Get Members
**Agent** - Get Many

## Local development

```bash
npm ci --ignore-scripts
npm run lint     # eslint with the n8n community rules
npm run build    # tsc → dist/, copies SVG icons and codex JSON
npm test         # unit tests (node:test) over dist-test/
```

To try the nodes in a local n8n instance, build the package and link it into
your n8n custom nodes directory (`~/.n8n/custom`), then restart n8n.

## License

MIT - Smart Telecom
