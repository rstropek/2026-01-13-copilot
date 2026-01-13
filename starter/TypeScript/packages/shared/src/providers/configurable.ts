export abstract class ConfigurableMachine {
    abstract get settings(): Setting[];

    protected verifySettings(settings: SettingValue[]): SettingError[] {
        const errors: SettingError[] = [];
        const seenIdentifiers = new Set<string>();

        // Check for duplicate identifiers
        for (const setting of settings) {
            if (seenIdentifiers.has(setting.identifier)) {
                errors.push({
                    identifier: setting.identifier,
                    message: 'Duplicate identifier'
                });
            }
            seenIdentifiers.add(setting.identifier);
        }

        // Get all valid setting metadata
        const validSettings = new Map(this.settings.map(s => [s.identifier, s]));

        // Check each provided setting value
        for (const settingValue of settings) {
            const metadata = validSettings.get(settingValue.identifier);

            // Check if identifier exists in machine's settings
            if (!metadata) {
                errors.push({
                    identifier: settingValue.identifier,
                    message: 'Setting identifier does not exist'
                });
                continue;
            }

            // Check if value is null when it shouldn't be
            if (settingValue.value === null) {
                if (!metadata.nullable && metadata.defaultValue === null) {
                    errors.push({
                        identifier: settingValue.identifier,
                        message: 'Value is required (not nullable and no default value)'
                    });
                }
                continue;
            }

            // Check value type matches
            const valueType = typeof settingValue.value;
            if (metadata.dataType === SettingType.STRING && valueType !== 'string') {
                errors.push({
                    identifier: settingValue.identifier,
                    message: `Expected string value, got ${valueType}`
                });
            } else if (metadata.dataType === SettingType.NUMBER && valueType !== 'number') {
                errors.push({
                    identifier: settingValue.identifier,
                    message: `Expected number value, got ${valueType}`
                });
            } else if (metadata.dataType === SettingType.BOOLEAN && valueType !== 'boolean') {
                errors.push({
                    identifier: settingValue.identifier,
                    message: `Expected boolean value, got ${valueType}`
                });
            }

            // For numeric settings, check min/max and uom
            if (metadata.dataType === SettingType.NUMBER && valueType === 'number') {
                const numMetadata = metadata as NumberSettingMetadata;
                let numValue = settingValue.value as number;

                // Handle UOM conversion if metadata specifies a UOM
                if (numMetadata.uom !== undefined) {
                    if (!settingValue.uom) {
                        errors.push({
                            identifier: settingValue.identifier,
                            message: `Unit of measure is required, expected ${numMetadata.uom}`
                        });
                        continue;
                    }

                    // Attempt UOM conversion
                    const convertedValue = this.convertUom(numValue, settingValue.uom, numMetadata.uom);
                    if (convertedValue === null) {
                        errors.push({
                            identifier: settingValue.identifier,
                            message: `Cannot convert from ${settingValue.uom} to ${numMetadata.uom}`
                        });
                        continue;
                    }
                    numValue = convertedValue;
                }

                // Check min value (after conversion)
                if (numMetadata.minValue !== undefined && numValue < numMetadata.minValue) {
                    errors.push({
                        identifier: settingValue.identifier,
                        message: `Value ${numValue} is below minimum ${numMetadata.minValue}`
                    });
                }

                // Check max value (after conversion)
                if (numMetadata.maxValue !== undefined && numValue > numMetadata.maxValue) {
                    errors.push({
                        identifier: settingValue.identifier,
                        message: `Value ${numValue} exceeds maximum ${numMetadata.maxValue}`
                    });
                }
            }
        }

        // Check that all non-nullable settings without defaults have values
        for (const metadata of this.settings) {
            if (!metadata.nullable && metadata.defaultValue === null) {
                const hasValue = settings.some(s => s.identifier === metadata.identifier && s.value !== null);
                if (!hasValue) {
                    errors.push({
                        identifier: metadata.identifier,
                        message: 'Required setting is missing'
                    });
                }
            }
        }

        return errors;
    }

    protected convertUom(value: number, fromUom: UnitOfMeasure, toUom: UnitOfMeasure): number | null {
        // If UOMs are the same, no conversion needed
        if (fromUom === toUom) {
            return value;
        }

        // Temperature conversions
        if (fromUom === UnitOfMeasure.DEGREE_CELSIUS && toUom === UnitOfMeasure.DEGREE_FAHRENHEIT) {
            return (value * 9 / 5) + 32;
        }
        if (fromUom === UnitOfMeasure.DEGREE_FAHRENHEIT && toUom === UnitOfMeasure.DEGREE_CELSIUS) {
            return (value - 32) * 5 / 9;
        }

        // Pressure conversions
        if (fromUom === UnitOfMeasure.BAR && toUom === UnitOfMeasure.PSI) {
            return value * 14.5038;
        }
        if (fromUom === UnitOfMeasure.PSI && toUom === UnitOfMeasure.BAR) {
            return value / 14.5038;
        }

        // Rotation speed conversions
        if (fromUom === UnitOfMeasure.RPM && toUom === UnitOfMeasure.RPS) {
            return value / 60;
        }
        if (fromUom === UnitOfMeasure.RPS && toUom === UnitOfMeasure.RPM) {
            return value * 60;
        }

        // Time conversions
        if (fromUom === UnitOfMeasure.MINUTES && toUom === UnitOfMeasure.SECONDS) {
            return value * 60;
        }
        if (fromUom === UnitOfMeasure.SECONDS && toUom === UnitOfMeasure.MINUTES) {
            return value / 60;
        }

        // Incompatible UOMs
        return null;
    }
    
}

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
