import { describe, expect, it } from 'vitest';

describe('test environment sanity', () => {
	it('provides a working jsdom document', () => {
		const div = document.createElement('div');
		div.id = 'root';
		document.body.appendChild(div);

		expect(document.getElementById('root')).toBe(div);
	});
});
