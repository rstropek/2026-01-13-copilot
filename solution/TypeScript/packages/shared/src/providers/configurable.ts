export abstract class ConfigurableMachine {
    abstract get settings(): Setting[];

    protected verifySettings(settings: SettingValue[]): SettingError[] {
        // Perform the following checks:
        // * Each identifier must existing in settings (see getter)
        // * No duplicate identifiers
        // * There must be a value or a default value for each setting that is not nullable
        // * Value must be of the correct type
        // * If numeric, value must be >= minValue and <= maxValue
        // * If numeric, uom must fit or be convertible to the setting's uom
        const errors: SettingError[] = [];

        const definitionMap = new Map<string, Setting>();
        for (const def of this.settings) {
            // Machine definitions are assumed to be manually kept consistent/unique.
            definitionMap.set(def.identifier, def);
        }

        const seenProvided = new Set<string>();
        const duplicateProvided = new Set<string>();
        for (const provided of settings) {
            if (seenProvided.has(provided.identifier)) {
                duplicateProvided.add(provided.identifier);
            } else {
                seenProvided.add(provided.identifier);
            }
        }
        for (const id of duplicateProvided) {
            errors.push({ identifier: id, message: "Duplicate setting identifier provided" });
        }

        const providedMap = new Map<string, SettingValue>();
        for (const provided of settings) {
            if (!definitionMap.has(provided.identifier)) {
                errors.push({ identifier: provided.identifier, message: "Unknown setting identifier" });
                continue;
            }

            // Keep the first occurrence (duplicates already flagged).
            if (!providedMap.has(provided.identifier)) {
                providedMap.set(provided.identifier, provided);
            }
        }

        for (const [identifier, def] of definitionMap.entries()) {
            const provided = providedMap.get(identifier);
            const nullable = def.nullable === true;

            const hasProvidedValue = provided?.value !== undefined;
            const defaultValue = (def as NumericSetting | StringSetting | BooleanSetting).defaultValue;
            const hasDefaultValue = defaultValue !== undefined;

            if (!nullable && !hasProvidedValue && !hasDefaultValue) {
                errors.push({
                    identifier,
                    message: "Missing value (no default and not nullable)"
                });
                continue;
            }

            // If no value is provided, the default (if any) becomes effective.
            const effectiveValue = (hasProvidedValue ? provided?.value : defaultValue);
            if (effectiveValue === undefined) {
                // Nullable without value is fine.
                if (def.type !== SettingType.NUMBER && provided?.uom !== undefined) {
                    errors.push({
                        identifier,
                        message: "Unit of measure is only allowed for numeric settings"
                    });
                }
                continue;
            }

            if (def.type !== SettingType.NUMBER && provided?.uom !== undefined) {
                errors.push({
                    identifier,
                    message: "Unit of measure is only allowed for numeric settings"
                });
            }

            switch (def.type) {
                case SettingType.STRING:
                    if (typeof effectiveValue !== "string") {
                        errors.push({ identifier, message: "Value must be a string" });
                    }
                    break;
                case SettingType.BOOLEAN:
                    if (typeof effectiveValue !== "boolean") {
                        errors.push({ identifier, message: "Value must be a boolean" });
                    }
                    break;
                case SettingType.NUMBER: {
                    if (typeof effectiveValue !== "number" || Number.isNaN(effectiveValue)) {
                        errors.push({ identifier, message: "Value must be a number" });
                        break;
                    }

                    const settingUom = def.uom;
                    const providedUom = provided?.uom;

                    if (providedUom !== undefined && settingUom === undefined) {
                        errors.push({ identifier, message: "Unit of measure is not supported for this setting" });
                        break;
                    }

                    let valueForRange = effectiveValue;
                    if (
                        settingUom !== undefined &&
                        providedUom !== undefined &&
                        providedUom !== settingUom
                    ) {
                        const converted = this.convertUom(effectiveValue, providedUom, settingUom);
                        if (converted === undefined) {
                            errors.push({ identifier, message: "Unit of measure is not convertible to required unit" });
                            break;
                        }
                        valueForRange = converted;
                    }

                    if (def.minValue !== undefined && valueForRange < def.minValue) {
                        errors.push({ identifier, message: `Value must be >= ${def.minValue}` });
                    }
                    if (def.maxValue !== undefined && valueForRange > def.maxValue) {
                        errors.push({ identifier, message: `Value must be <= ${def.maxValue}` });
                    }
                    break;
                }
            }
        }

        return errors;
    }

    abstract applySettings(settings: SettingValue[]): SettingError[];

    protected convertUom(value: number, from: UnitOfMeasure, to: UnitOfMeasure): number | undefined {
        if (from === to) {
            return value;
        }

        // Note: don't use `switch ([from, to])` here - arrays compare by reference in JS/TS.
        if (from === UnitOfMeasure.DEGREE_CELSIUS && to === UnitOfMeasure.DEGREE_FAHRENHEIT) {
            return (value * 9 / 5) + 32;
        }
        if (from === UnitOfMeasure.DEGREE_FAHRENHEIT && to === UnitOfMeasure.DEGREE_CELSIUS) {
            return (value - 32) * 5 / 9;
        }
        if (from === UnitOfMeasure.BAR && to === UnitOfMeasure.PSI) {
            return value * 14.5037738007218;
        }
        if (from === UnitOfMeasure.PSI && to === UnitOfMeasure.BAR) {
            return value / 14.5037738007218;
        }
        if (from === UnitOfMeasure.RPM && to === UnitOfMeasure.RPS) {
            return value / 60;
        }
        if (from === UnitOfMeasure.RPS && to === UnitOfMeasure.RPM) {
            return value * 60;
        }
        if (from === UnitOfMeasure.SECOND && to === UnitOfMeasure.MINUTE) {
            return value / 60;
        }
        if (from === UnitOfMeasure.MINUTE && to === UnitOfMeasure.SECOND) {
            return value * 60;
        }

        return undefined;
    }
}

export enum SettingType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean"
}

export enum UnitOfMeasure {
    DEGREE_CELSIUS = "°C",
    DEGREE_FAHRENHEIT = "°F",
    BAR = "bar",
    PSI = "psi",
    RPM = "rpm",
    RPS = "rps",
    SECOND = "s",
    MINUTE = "min",
}

type SettingBase = {
    namespace: string | undefined;
    identifier: string; // Must be globally unique
    description: string;
    nullable?: boolean | undefined;
}

export type NumericSetting = SettingBase & {
    type: SettingType.NUMBER;
    defaultValue?: number | undefined;
    uom?: UnitOfMeasure | undefined;
    minValue?: number | undefined;
    maxValue?: number | undefined;
}

export type StringSetting = SettingBase & {
    type: SettingType.STRING;
    defaultValue?: string | undefined;
    uom?: never;
}

export type BooleanSetting = SettingBase & {
    type: SettingType.BOOLEAN;
    defaultValue?: boolean | undefined;
    uom?: never;
}

export type Setting = NumericSetting | StringSetting | BooleanSetting;

export type SettingValue = {
    identifier: string; // Must be globally unique
    value: string | number | boolean | undefined;
    uom?: UnitOfMeasure | undefined;
}

export type SettingError = {
    identifier: string; // Must be globally unique
    message: string;
}
