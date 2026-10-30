# Changelog

## 0.1.0

Initial release.

- **STS Connect** node: conversations (create, get, get many with filters and
  pagination, update status, set priority, assign, set/get labels, set custom
  attributes), messages (send text, private notes, replies, WhatsApp templates;
  get many), contacts (create, get, get many, search, update, get conversations,
  set/get labels, create contact inbox), and read-only lookups for inboxes,
  labels, teams, team members and agents.
- **STS Connect Trigger** node: receives webhook events from the STS Connect
  Inbox with HMAC-SHA256 signature verification, timestamp tolerance checks,
  event filtering, typing-event suppression and an incoming-messages-only mode.
- **STS Connect API** credential (account API key) and **STS Connect Webhook**
  credential (endpoint secret).
