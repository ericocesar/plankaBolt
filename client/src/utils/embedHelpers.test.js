import { parsePrefill, getEmbedCSP } from './embedHelpers';

describe('embedHelpers', () => {
  describe('parsePrefill', () => {
    it('should return empty object for null/undefined/empty input', () => {
      expect(parsePrefill(null)).toEqual({});
      expect(parsePrefill(undefined)).toEqual({});
      expect(parsePrefill('')).toEqual({});
    });

    it('should parse valid base64 json', () => {
      const data = { name: 'Test', email: 'test@example.com' };
      const json = JSON.stringify(data);
      const base64 = btoa(json);

      expect(parsePrefill(base64)).toEqual(data);
    });

    it('should return empty object and log error for invalid base64', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(parsePrefill('invalid-base64')).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return empty object and log error for invalid json', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const base64 = btoa('invalid-json');

      expect(parsePrefill(base64)).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getEmbedCSP', () => {
    it('should return default allowed origin if not provided', () => {
      expect(getEmbedCSP(undefined)).toBe('frame-ancestors https://bolt360.com.br');
    });

    it('should return provided allowed origins', () => {
      const origins = 'https://example.com https://another.com';
      expect(getEmbedCSP(origins)).toBe(`frame-ancestors ${origins}`);
    });
  });
});
