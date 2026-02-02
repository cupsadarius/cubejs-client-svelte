import { describe, it, expect } from 'vitest';
import { isQueryPresent } from '../../utils/isQueryPresent.js';

describe('isQueryPresent', () => {
	describe('null and undefined inputs', () => {
		it('returns false for null', () => {
			expect(isQueryPresent(null)).toBe(false);
		});

		it('returns false for undefined', () => {
			expect(isQueryPresent(undefined)).toBe(false);
		});
	});

	describe('empty query objects', () => {
		it('returns false for empty object', () => {
			expect(isQueryPresent({})).toBe(false);
		});

		it('returns false for query with empty measures array', () => {
			expect(isQueryPresent({ measures: [] })).toBe(false);
		});

		it('returns false for query with empty dimensions array', () => {
			expect(isQueryPresent({ dimensions: [] })).toBe(false);
		});

		it('returns false for query with empty timeDimensions array', () => {
			expect(isQueryPresent({ timeDimensions: [] })).toBe(false);
		});

		it('returns false for query with all empty arrays', () => {
			expect(isQueryPresent({ measures: [], dimensions: [], timeDimensions: [] })).toBe(false);
		});
	});

	describe('queries with measures', () => {
		it('returns true for query with one measure', () => {
			expect(isQueryPresent({ measures: ['Orders.count'] })).toBe(true);
		});

		it('returns true for query with multiple measures', () => {
			expect(isQueryPresent({ measures: ['Orders.count', 'Orders.totalAmount'] })).toBe(true);
		});
	});

	describe('queries with dimensions', () => {
		it('returns true for query with one dimension', () => {
			expect(isQueryPresent({ dimensions: ['Orders.status'] })).toBe(true);
		});

		it('returns true for query with multiple dimensions', () => {
			expect(isQueryPresent({ dimensions: ['Orders.status', 'Orders.customer'] })).toBe(true);
		});
	});

	describe('queries with timeDimensions', () => {
		it('returns true for query with one timeDimension', () => {
			expect(
				isQueryPresent({
					timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }]
				})
			).toBe(true);
		});

		it('returns true for query with multiple timeDimensions', () => {
			expect(
				isQueryPresent({
					timeDimensions: [
						{ dimension: 'Orders.createdAt', granularity: 'day' },
						{ dimension: 'Orders.updatedAt', granularity: 'month' }
					]
				})
			).toBe(true);
		});
	});

	describe('combined queries', () => {
		it('returns true for query with measures and dimensions', () => {
			expect(
				isQueryPresent({
					measures: ['Orders.count'],
					dimensions: ['Orders.status']
				})
			).toBe(true);
		});

		it('returns true for query with measures and timeDimensions', () => {
			expect(
				isQueryPresent({
					measures: ['Orders.count'],
					timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }]
				})
			).toBe(true);
		});

		it('returns true for full query with measures, dimensions, and timeDimensions', () => {
			expect(
				isQueryPresent({
					measures: ['Orders.count'],
					dimensions: ['Orders.status'],
					timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }]
				})
			).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('handles query with other properties but no measures/dimensions/timeDimensions', () => {
			expect(
				isQueryPresent({
					filters: [{ member: 'Orders.status', operator: 'equals', values: ['completed'] }],
					limit: 100
				})
			).toBe(false);
		});

		it('handles query with measures as non-array value', () => {
			// Even though this is invalid, we should handle it gracefully
			expect(isQueryPresent({ measures: 'Orders.count' as unknown as string[] })).toBe(false);
		});

		it('handles query with dimensions as non-array value', () => {
			expect(isQueryPresent({ dimensions: 'Orders.status' as unknown as string[] })).toBe(false);
		});

		it('handles query with timeDimensions as non-array value', () => {
			expect(
				isQueryPresent({
					timeDimensions: { dimension: 'Orders.createdAt' } as unknown as []
				})
			).toBe(false);
		});
	});
});
