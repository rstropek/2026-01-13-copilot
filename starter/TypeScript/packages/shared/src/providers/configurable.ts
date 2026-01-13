// Setup a data model for configurable parameters for machines

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export enum UnitOfMeasure {
    DEGREE_CELSIUS = '°C',
    DEGREE_FAHRENHEIT = '°F',
    BAR = 'bar',
    PSI = 'psi',
    RPM = 'rpm',
    RPS = 'rps',
    SECONDS = 'seconds',
    MINUTES = 'minutes',
}

// Base type for common setting metadata properties
type BaseSettingMetadata = {
  namespace: string;
  identifier: string;
  description: string;
  nullable: boolean;
};

// String setting metadata
type StringSettingMetadata = BaseSettingMetadata & {
  dataType: SettingType.STRING;
  defaultValue: string | null;
};

// Number setting metadata with optional unit of measure and min/max values
type NumberSettingMetadata = BaseSettingMetadata & {
  dataType: SettingType.NUMBER;
  defaultValue: number | null;
  uom?: UnitOfMeasure;
  minValue?: number;
  maxValue?: number;
};

// Boolean setting metadata
type BooleanSettingMetadata = BaseSettingMetadata & {
  dataType: SettingType.BOOLEAN;
  defaultValue: boolean | null;
};

// Union type for all setting metadata types
export type Setting = StringSettingMetadata | NumberSettingMetadata | BooleanSettingMetadata;

export type SettingValue = {
    identifier: string; // Must be globally unique
    value: string | number | boolean | null;
    uom?: UnitOfMeasure;
}

export type SettingError = {
    identifier: string; // Must be globally unique
    message: string;
}
