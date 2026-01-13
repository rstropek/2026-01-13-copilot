import { describe, it, expect } from "@jest/globals";
import {
    ConfigurableMachine,
    SettingType,
    UnitOfMeasure,
    type Setting,
    type SettingValue
} from "./configurable.js";

class TestMachine extends ConfigurableMachine {
    get settings(): Setting[] {
        return [
            {
                namespace: "req",
                identifier: "requiredNoDefault",
                description: "Required boolean without default",
                type: SettingType.BOOLEAN
            },
            {
                namespace: "defaults",
                identifier: "stringWithDefault",
                description: "String with default",
                type: SettingType.STRING,
                defaultValue: "hello"
            },
            {
                namespace: "numbers",
                identifier: "tempC",
                description: "Temperature in °C",
                type: SettingType.NUMBER,
                uom: UnitOfMeasure.DEGREE_CELSIUS,
                minValue: 0,
                maxValue: 100
            },
            {
                namespace: "numbers",
                identifier: "plainNumber",
                description: "Number without uom",
                type: SettingType.NUMBER,
                minValue: 0,
                maxValue: 10
            },
            {
                namespace: "nullable",
                identifier: "nullableNumber",
                description: "Nullable number without default",
                type: SettingType.NUMBER,
                nullable: true
            }
        ];
    }

    public verify(values: SettingValue[]) {
        return this.verifySettings(values);
    }

    override applySettings(settings: SettingValue[]) {
        return [];
    }
}

describe("ConfigurableMachine.verifySettings", () => {
    it("flags unknown identifiers", () => {
        const m = new TestMachine();
        const errors = m.verify([{ identifier: "doesNotExist", value: 1 }]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "doesNotExist",
                    message: "Unknown setting identifier"
                })
            ])
        );
    });

    it("flags duplicate provided identifiers", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "stringWithDefault", value: "a" },
            { identifier: "stringWithDefault", value: "b" }
        ]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "stringWithDefault",
                    message: "Duplicate setting identifier provided"
                })
            ])
        );
    });

    it("requires values for non-nullable settings without defaults", () => {
        const m = new TestMachine();
        const errors = m.verify([]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "requiredNoDefault",
                    message: "Missing value (no default and not nullable)"
                })
            ])
        );
    });

    it("validates types", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            { identifier: "stringWithDefault", value: 123 as unknown as string }
        ]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "stringWithDefault",
                    message: "Value must be a string"
                })
            ])
        );
    });

    it("checks numeric min/max (with same uom)", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            { identifier: "tempC", value: 120, uom: UnitOfMeasure.DEGREE_CELSIUS },
            { identifier: "plainNumber", value: 5 }
        ]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "tempC",
                    message: "Value must be <= 100"
                })
            ])
        );
    });

    it("accepts convertible uom and uses it for range checks", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            // 212°F -> 100°C, should be within [0..100]
            { identifier: "tempC", value: 212, uom: UnitOfMeasure.DEGREE_FAHRENHEIT },
            { identifier: "plainNumber", value: 5 }
        ]);
        expect(errors).toEqual([]);
    });

    it("flags non-convertible uom", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            { identifier: "tempC", value: 10, uom: UnitOfMeasure.BAR },
            { identifier: "plainNumber", value: 5 }
        ]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "tempC",
                    message: "Unit of measure is not convertible to required unit"
                })
            ])
        );
    });

    it("flags uom for numeric settings that do not support it", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            { identifier: "plainNumber", value: 5, uom: UnitOfMeasure.SECOND }
        ]);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    identifier: "plainNumber",
                    message: "Unit of measure is not supported for this setting"
                })
            ])
        );
    });

    it("allows missing values for nullable settings", () => {
        const m = new TestMachine();
        const errors = m.verify([
            { identifier: "requiredNoDefault", value: true },
            { identifier: "tempC", value: 50 },
            { identifier: "plainNumber", value: 5 }
        ]);
        expect(errors).toEqual([]);
    });
});

