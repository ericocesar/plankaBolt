import { buildInitialValues } from './formSchema';

describe('formSchema', () => {
  describe('buildInitialValues', () => {
    it('should use defaultValue for select when no prefill is provided', () => {
      const schema = {
        steps: [
          {
            fields: [
              {
                id: 'field-priority',
                type: 'select',
                defaultValue: 'opcao_1',
                options: [
                  { label: 'Normal', value: 'opcao_1' },
                  { label: 'Alta', value: 'opcao_2' },
                ],
              },
            ],
          },
        ],
      };

      const values = buildInitialValues(schema, {});
      expect(values).toEqual({ 'field-priority': 'opcao_1' });
    });

    it('should prefer explicit prefill over defaultValue', () => {
      const schema = {
        steps: [
          {
            fields: [
              {
                id: 'field-priority',
                type: 'select',
                defaultValue: 'opcao_1',
              },
            ],
          },
        ],
      };

      const values = buildInitialValues(schema, { 'field-priority': 'opcao_2' });
      expect(values).toEqual({ 'field-priority': 'opcao_2' });
    });

    it('should support boolean defaultValue for checkbox', () => {
      const schema = {
        steps: [
          {
            fields: [
              {
                id: 'field-consent',
                type: 'checkbox',
                defaultValue: true,
              },
            ],
          },
        ],
      };

      const values = buildInitialValues(schema, {});
      expect(values).toEqual({ 'field-consent': true });
    });
  });
});
