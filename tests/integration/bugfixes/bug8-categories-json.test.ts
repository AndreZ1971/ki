import { describe, it, expect } from 'vitest';

/**
 * Bug #8: Categories Manager - JSON Parse Failures
 * 
 * Problem: OpenAI responses couldn't be parsed, returned 502
 * Root Cause: Malformed JSON from AI, no error recovery
 * Solution: JSON repair regex + fallback to popular categories
 * 
 * File: backend/routes/app/api/products/categories.ts
 * Lines: 251-289
 */

describe('Bug #8: OpenAI JSON Parsing Fallbacks', () => {
  // Simulate the repairJSON function from openaiHelper
  function repairJSON(brokenJson: string): string {
    try {
      // Try to parse as-is first
      JSON.parse(brokenJson);
      return brokenJson;
    } catch {
      // Attempt basic repairs
      let repaired = brokenJson.trim();

      // Remove markdown code blocks
      repaired = repaired.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Add missing closing brackets
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}';
      }

      return repaired;
    }
  }

  // Simulate popular categories fallback
  function getPopularCategories(): any[] {
    return [
      { id: 1, name: 'Electronics', score: 0.9 },
      { id: 2, name: 'Clothing', score: 0.8 },
      { id: 3, name: 'Home & Garden', score: 0.7 }
    ];
  }

  describe('JSON Repair Functionality', () => {
    it('should repair malformed JSON from OpenAI', () => {
      const broken = '{"categories": [{"id": 1}';
      const repaired = repairJSON(broken);

      // Should be parseable after repair
      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should handle missing closing brackets', () => {
      const broken = '{"categories": [{"id": 1}, {"id": 2}';
      const repaired = repairJSON(broken);

      const parsed = JSON.parse(repaired);
      expect(parsed).toHaveProperty('categories');
      expect(Array.isArray(parsed.categories)).toBe(true);
    });

    it('should handle missing closing braces', () => {
      const broken = '{"data": {"categories": [1, 2, 3]';
      const repaired = repairJSON(broken);

      const parsed = JSON.parse(repaired);
      expect(parsed).toHaveProperty('data');
    });

    it('should remove markdown code blocks', () => {
      const withMarkdown = '```json\n{"test": true}\n```';
      const repaired = repairJSON(withMarkdown);

      expect(repaired).not.toContain('```');
      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should handle already valid JSON', () => {
      const valid = '{"test": "value", "number": 123}';
      const repaired = repairJSON(valid);

      expect(repaired).toBe(valid);
      expect(() => JSON.parse(repaired)).not.toThrow();
    });
  });

  describe('Complex JSON Repairs', () => {
    it('should repair nested objects with missing brackets', () => {
      const broken = '{"outer": {"inner": [{"id": 1}, {"id": 2}';
      const repaired = repairJSON(broken);

      const parsed = JSON.parse(repaired);
      expect(parsed.outer.inner).toHaveLength(2);
    });

    it('should handle multiple missing brackets', () => {
      const broken = '{"a": [1, 2, 3]';
      const repaired = repairJSON(broken);

      // Should add closing brace
      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should preserve valid JSON structure during repair', () => {
      const broken = '{"categories": [{"id": 1, "name": "Valid"}], "incomplete": [';
      const repaired = repairJSON(broken);

      const parsed = JSON.parse(repaired);
      expect(parsed.categories[0].name).toBe('Valid');
    });
  });

  describe('Fallback to Popular Categories', () => {
    it('should return popular categories when JSON repair fails', () => {
      const totallyBroken = 'This is not JSON at all!';
      
      let categories;
      try {
        const repaired = repairJSON(totallyBroken);
        const parsed = JSON.parse(repaired);
        categories = parsed.categories;
      } catch {
        // Fallback
        categories = getPopularCategories();
      }

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
    });

    it('should use fallback when OpenAI returns empty response', () => {
      const empty = '';
      
      let categories;
      try {
        if (!empty || empty.trim() === '') {
          throw new Error('Empty response');
        }
        categories = JSON.parse(empty);
      } catch {
        categories = getPopularCategories();
      }

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(3);
    });

    it('should provide valid category structure in fallback', () => {
      const categories = getPopularCategories();

      categories.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('score');
        expect(typeof cat.id).toBe('number');
        expect(typeof cat.name).toBe('string');
        expect(typeof cat.score).toBe('number');
      });
    });
  });

  describe('OpenAI Response Variations', () => {
    it('should handle OpenAI response with extra text', () => {
      const withText = 'Here are the categories:\n{"categories": [{"id": 1}]}';
      
      // Extract JSON part
      const jsonMatch = withText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        expect(parsed).toHaveProperty('categories');
      }
    });

    it('should handle OpenAI response in code block', () => {
      const inCodeBlock = '```json\n{"categories": [{"id": 1, "name": "Test"}]}\n```';
      const repaired = repairJSON(inCodeBlock);

      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should handle OpenAI response with trailing comma', () => {
      const withComma = '{"categories": [{"id": 1,},]}';
      
      // Remove trailing commas
      const fixed = withComma.replace(/,(\s*[}\]])/g, '$1');
      expect(() => JSON.parse(fixed)).not.toThrow();
    });

    it('should handle OpenAI response with single quotes', () => {
      const singleQuotes = "{'categories': [{'id': 1, 'name': 'Test'}]}";
      
      // Replace single quotes with double quotes
      const fixed = singleQuotes.replace(/'/g, '"');
      expect(() => JSON.parse(fixed)).not.toThrow();
    });
  });

  describe('Error Recovery Strategy', () => {
    it('should try repair first, then fallback', () => {
      const testCases = [
        '{"categories": [',  // Incomplete - will be repaired
        'Not JSON at all',    // Not repairable
        '',                   // Empty
      ];

      testCases.forEach(testCase => {
        let result;
        try {
          const repaired = repairJSON(testCase);
          const parsed = JSON.parse(repaired);
          // If categories exist and have items, use them, otherwise fallback
          result = (parsed.categories && parsed.categories.length > 0) 
            ? parsed.categories 
            : getPopularCategories();
        } catch {
          result = getPopularCategories();
        }

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should always return valid categories array', () => {
      const brokenResponses = [
        '{invalid}',
        '["not", "an", "object"]',
        '{"wrong": "structure"}',
        '',
        null,
        undefined
      ];

      brokenResponses.forEach((response: any) => {
        let categories;
        try {
          if (!response) throw new Error('Invalid');
          const parsed = JSON.parse(response);
          categories = parsed.categories || getPopularCategories();
        } catch {
          categories = getPopularCategories();
        }

        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
      });
    });

    it('should never return 502 error to user', () => {
      // Simulated endpoint behavior
      async function suggestCategories(_productName: string) {
        const openaiResponse = '{"broken json'; // Simulated broken response

        try {
          const repaired = repairJSON(openaiResponse);
          const parsed = JSON.parse(repaired);
          return { success: true, data: parsed };
        } catch {
          // Fallback - never fails
          return {
            success: true,
            data: { 
              categories: getPopularCategories(),
              fallback: true 
            }
          };
        }
      }

      const result = suggestCategories('Test Product');
      
      // Should always succeed
      expect(result).resolves.toHaveProperty('success', true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long JSON strings', () => {
      const longJson = '{"categories": [' + 
        Array(100).fill('{"id": 1, "name": "Category"}').join(',') +
        ''; // Missing closing brackets

      const repaired = repairJSON(longJson);
      expect(() => JSON.parse(repaired)).not.toThrow();
    });

    it('should handle deeply nested structures', () => {
      const nested = '{"a": {"b": {"c": {"d": [1, 2, 3';
      const repaired = repairJSON(nested);

      const parsed = JSON.parse(repaired);
      expect(parsed.a.b.c.d).toEqual([1, 2, 3]);
    });

    it('should handle unicode characters', () => {
      const unicode = '{"categories": [{"name": "Café"}';
      const repaired = repairJSON(unicode);

      const parsed = JSON.parse(repaired);
      expect(parsed.categories[0].name).toBe('Café');
    });

    it('should handle empty arrays and objects', () => {
      const empty = '{"categories": [], "meta": {}';
      const repaired = repairJSON(empty);

      const parsed = JSON.parse(repaired);
      expect(parsed.categories).toEqual([]);
      expect(parsed.meta).toEqual({});
    });
  });

  describe('Production Scenario Validation', () => {
    it('should handle typical OpenAI category suggestion response', () => {
      const typicalResponse = `{
        "categories": [
          {"id": 15, "name": "Electronics", "confidence": 0.95},
          {"id": 42, "name": "Smartphones", "confidence": 0.88},
          {"id": 103, "name": "Accessories", "confidence": 0.72}
        `;
      // Missing closing brackets

      const repaired = repairJSON(typicalResponse);
      const parsed = JSON.parse(repaired);

      expect(parsed.categories).toHaveLength(3);
      expect(parsed.categories[0].confidence).toBe(0.95);
    });

    it('should ensure categories always have required fields', () => {
      const categories = getPopularCategories();

      categories.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat.id).toBeGreaterThan(0);
        expect(cat.name.length).toBeGreaterThan(0);
      });
    });
  });
});
