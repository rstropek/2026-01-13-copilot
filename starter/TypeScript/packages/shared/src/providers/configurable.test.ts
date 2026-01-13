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

  it('should successfully convert Fahrenheit to Celsius', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 122, uom: UnitOfMeasure.DEGREE_FAHRENHEIT } // 122°F = 50°C
    ]);
    
    expect(errors).toHaveLength(0);
  });

  it('should detect missing unit of measure', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50 }
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('Unit of measure is required'))).toBe(true);
  });
  it('should detect incompatible unit of measure conversion', () => {
    const machine = new TestMachine();
    const errors = machine['verifySettings']([
      { identifier: 'temp', value: 50, uom: UnitOfMeasure.RPM } // Cannot convert RPM to Celsius
    ]);
    
    expect(errors.some(e => e.identifier === 'temp' && e.message.includes('Cannot convert from'))).toBe(true);
  });

  it('should validate min/max after UOM conversion', () => {
    const machine = new TestMachine();
    // 212°F = 100°C, which is at the maximum (0-100°C)
    const errorsAtMax = machine['verifySettings']([
      { identifier: 'temp', value: 212, uom: UnitOfMeasure.DEGREE_FAHRENHEIT }
    ]);
    expect(errorsAtMax).toHaveLength(0);

    // 213°F > 100°C, should exceed maximum
    const errorsAboveMax = machine['verifySettings']([
      { identifier: 'temp', value: 213, uom: UnitOfMeasure.DEGREE_FAHRENHEIT }
    ]);
    expect(errorsAboveMax.some(e => e.identifier === 'temp' && e.message.includes('exceeds maximum'))).toBe(true);

    // 32°F = 0°C, which is at the minimum
    const errorsAtMin = machine['verifySettings']([
      { identifier: 'temp', value: 32, uom: UnitOfMeasure.DEGREE_FAHRENHEIT }
    ]);
    expect(errorsAtMin).toHaveLength(0);

    // 31°F < 0°C, should be below minimum
    const errorsBelowMin = machine['verifySettings']([
      { identifier: 'temp', value: 31, uom: UnitOfMeasure.DEGREE_FAHRENHEIT }
    ]);
    expect(errorsBelowMin.some(e => e.identifier === 'temp' && e.message.includes('below minimum'))).toBe(true);
  });
});

describe('convertUom', () => {
  const machine = new TestMachine();

  it('should return same value for identical UOMs', () => {
    expect(machine['convertUom'](50, UnitOfMeasure.DEGREE_CELSIUS, UnitOfMeasure.DEGREE_CELSIUS)).toBe(50);
    expect(machine['convertUom'](100, UnitOfMeasure.RPM, UnitOfMeasure.RPM)).toBe(100);
  });

  it('should convert temperature correctly', () => {
    // Celsius to Fahrenheit
    expect(machine['convertUom'](0, UnitOfMeasure.DEGREE_CELSIUS, UnitOfMeasure.DEGREE_FAHRENHEIT)).toBe(32);
    expect(machine['convertUom'](100, UnitOfMeasure.DEGREE_CELSIUS, UnitOfMeasure.DEGREE_FAHRENHEIT)).toBe(212);
    
    // Fahrenheit to Celsius
    expect(machine['convertUom'](32, UnitOfMeasure.DEGREE_FAHRENHEIT, UnitOfMeasure.DEGREE_CELSIUS)).toBe(0);
    expect(machine['convertUom'](212, UnitOfMeasure.DEGREE_FAHRENHEIT, UnitOfMeasure.DEGREE_CELSIUS)).toBe(100);
  });

  it('should convert pressure correctly', () => {
    // Bar to PSI
    const barToPsi = machine['convertUom'](1, UnitOfMeasure.BAR, UnitOfMeasure.PSI);
    expect(barToPsi).toBeCloseTo(14.5038, 4);
    
    // PSI to Bar
    const psiToBar = machine['convertUom'](14.5038, UnitOfMeasure.PSI, UnitOfMeasure.BAR);
    expect(psiToBar).toBeCloseTo(1, 4);
  });

  it('should convert rotation speed correctly', () => {
    // RPM to RPS
    expect(machine['convertUom'](60, UnitOfMeasure.RPM, UnitOfMeasure.RPS)).toBe(1);
    expect(machine['convertUom'](120, UnitOfMeasure.RPM, UnitOfMeasure.RPS)).toBe(2);
    
    // RPS to RPM
    expect(machine['convertUom'](1, UnitOfMeasure.RPS, UnitOfMeasure.RPM)).toBe(60);
    expect(machine['convertUom'](2, UnitOfMeasure.RPS, UnitOfMeasure.RPM)).toBe(120);
  });

  it('should convert time correctly', () => {
    // Minutes to Seconds
    expect(machine['convertUom'](1, UnitOfMeasure.MINUTES, UnitOfMeasure.SECONDS)).toBe(60);
    expect(machine['convertUom'](2, UnitOfMeasure.MINUTES, UnitOfMeasure.SECONDS)).toBe(120);
    
    // Seconds to Minutes
    expect(machine['convertUom'](60, UnitOfMeasure.SECONDS, UnitOfMeasure.MINUTES)).toBe(1);
    expect(machine['convertUom'](120, UnitOfMeasure.SECONDS, UnitOfMeasure.MINUTES)).toBe(2);
  });

  it('should return null for incompatible conversions', () => {
    expect(machine['convertUom'](50, UnitOfMeasure.DEGREE_CELSIUS, UnitOfMeasure.RPM)).toBeNull();
    expect(machine['convertUom'](100, UnitOfMeasure.BAR, UnitOfMeasure.SECONDS)).toBeNull();
    expect(machine['convertUom'](60, UnitOfMeasure.RPM, UnitOfMeasure.DEGREE_FAHRENHEIT)).toBeNull();
    expect(machine['convertUom'](30, UnitOfMeasure.MINUTES, UnitOfMeasure.PSI)).toBeNull();
  });});
