import { createHmac, timingSafeEqual } from 'crypto';

/** Maximum allowed age of a webhook timestamp, in seconds (both directions). */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Verifies the signature of an incoming STS Connect webhook delivery.
 *
 * The signature header must be `sha256=<64 lowercase hex>` of
 * HMAC-SHA256(secret, `${timestamp}.${rawBody}`). The timestamp must be an
 * integer within 300 seconds of `nowSeconds` in both directions.
 *
 * Pure function: returns false on any failure, never throws.
 */
export function verifyWebhookSignature(
	secret: string,
	timestampHeader: string | undefined | null,
	signatureHeader: string | undefined | null,
	rawBody: Buffer,
	nowSeconds: number,
): boolean {
	if (!secret || !timestampHeader || !signatureHeader || !rawBody) {
		return false;
	}

	if (!/^\d+$/.test(timestampHeader)) {
		return false;
	}
	const timestamp = Number(timestampHeader);
	if (!Number.isSafeInteger(timestamp)) {
		return false;
	}
	if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
		return false;
	}

	const match = /^sha256=([0-9a-f]{64})$/.exec(signatureHeader);
	if (!match) {
		return false;
	}

	const expected = createHmac('sha256', secret)
		.update(timestampHeader)
		.update('.')
		.update(rawBody)
		.digest();
	const received = Buffer.from(match[1], 'hex');
	if (expected.length !== received.length) {
		return false;
	}
	return timingSafeEqual(expected, received);
}
