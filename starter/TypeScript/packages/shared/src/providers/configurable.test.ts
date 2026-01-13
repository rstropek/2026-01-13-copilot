import { describe, it, expect } from '@jest/globals';
import { ConfigurableMachine, SettingType, UnitOfMeasure } from './configurable.js';
import type { Setting } from './configurable.js';

class TestMachine extends ConfigurableMachine {
  get settings(): Setting[] {
    return [
      {
        namespace: 'test',
        identifier: 'temp',
        description: 'Temperature',
        nullable: false,
        dataType: SettingType.NUMBER,
        defaultValue: null,
        uom: UnitOfMeasure.DEGREE_CELSIUS,
        minValue: 0,
        maxValue: 100
      },
      {
        namespace: 'test',
        identifier: 'name',
        description: 'Machine name',
        nullable: false,
        dataType: SettingType.STRING,
        defaultValue: 'default'
      },
      {
        namespace: 'test',
        identifier: 'enabled',
        description: 'Is enabled',
        nullable: true,
        dataType: SettingType.BOOLEAN,
        defaultValue: null
      },
      {
        namespace: 'test',
        identifier: 'optionalNum',
        description: 'Optional number',
        nullable: false,
        dataType: SettingType.NUMBER,
        defaultValue: 42
      }
    ];
  }
}

describe('verifySettings', () => {
  it('should return no errors for valid settings', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_CELSIUS }
    ]);
    
    expect(errors).toHaveLength(0);
  });

  it('should detect duplicate identifiers', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_CELSIUS },
      { identifier: 'temp', value: 60, uom: UnitOfMeasure.DEGREE_CELSIUS }
    ]);
    
    expect(errors).toHaveLength(1);
    expect(errors[0]!.identifier).toBe('temp');
    expect(errors[0]!.message).toBe('Duplicate identifier');
  });

  it('should detect invalid identifiers', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_CELSIUS },
      { identifier: 'invalid', value: 123 }
    ]);
    
    expect(errors.some(e => e.identifier === 'invalid' && e.message === 'Setting identifier does not exist')).toBe(true);
  });

  it('should detect missing required settings', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([]);
    
    expect(errors).toHaveLength(1);
    expect(errors[0]!.identifier).toBe('temp');
    expect(errors[0]!.message).toBe('Required setting is missing');
  });

  it('should detect null value for non-nullable setting without default', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: null }
    ]);
    
    expect(errors).toHaveLength(2);
    expect(errors.some(e => e.message === 'Value is required (not nullable and no default value)')).toBe(true);
  });

  it('should detect type mismatch for string', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_CELSIUS },
      { identifier: 'name', value: 123 }
    ]);
    
    expect(errors.some(e => e.identifier === 'name' && e.message.includes('Expected string value'))).toBe(true);
  });

  it('should detect type mismatch for number', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 'not a number', uom: UnitOfMeasure.DEGREE_CELSIUS }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('Expected number value'))).toBe(true);
  });

  it('should detect type mismatch for boolean', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_CELSIUS },
      { identifier: 'enabled', value: 'yes' }
    ]);
    
    expect(errors.some(e => e.identifier === 'enabled' && e.message.includes('Expected boolean value'))).toBe(true);
  });

  it('should detect value below minimum', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: -10, uom: UnitOfMeasure.DEGREE_CELSIUS }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('below minimum'))).toBe(true);
  });

  it('should detect value above maximum', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 150, uom: UnitOfMeasure.DEGREE_CELSIUS }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('exceeds maximum'))).toBe(true);
  });

  it('should detect incorrect unit of measure', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.DEGREE_FAHRENHEIT }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('Unit of measure must be'))).toBe(true);
  });

  it('should detect missing unit of measure', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50 }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('Unit of measure must be'))).toBe(true);
  });
});
