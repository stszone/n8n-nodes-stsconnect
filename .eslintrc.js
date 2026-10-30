module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	env: {
		es2021: true,
		node: true,
	},
	plugins: ['n8n-nodes-base'],
	extends: ['plugin:n8n-nodes-base/community'],
	ignorePatterns: ['dist/**', 'dist-test/**', 'node_modules/**', 'scripts/**'],
	rules: {
		// The author is published as "Smart Telecom" without an email address on purpose.
		'n8n-nodes-base/community-package-json-author-email-still-default': 'off',
		// The credential test is defined, but n8n runs it only when the user tests the credential.
		'n8n-nodes-base/cred-class-field-documentation-url-missing': 'off',
		'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
	},
	overrides: [
		{
			files: ['test/**/*.ts'],
			rules: {
				// Test files are not node descriptions; node-param rules do not apply there.
				'n8n-nodes-base/node-param-display-name-miscased': 'off',
			},
		},
	],
};
