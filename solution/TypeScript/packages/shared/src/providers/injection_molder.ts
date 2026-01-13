import { SettingType, ConfigurableMachine, type Setting, UnitOfMeasure, type SettingValue, type SettingError } from "./configurable.js";
import fs from "fs";

export type InjectionMolderConfig = {
    filePath: string;
}

export class InjectionMolder extends ConfigurableMachine {
    constructor(private readonly config: InjectionMolderConfig) {
        super();
    }

    get settings(): Setting[] {
        return [
            {
                namespace: "material",
                identifier: "materialName",
                description: "Material name / resin grade used for the current job.",
                type: SettingType.STRING,
                defaultValue: "PP"
            },
            {
                namespace: "safety",
                identifier: "guardsClosedRequired",
                description: "Require safety guards to be closed before cycle start.",
                type: SettingType.BOOLEAN
            },
            {
                namespace: "process",
                identifier: "barrelTemperature",
                description: "Barrel (melt) temperature setpoint.",
                type: SettingType.NUMBER,
                defaultValue: 230,
                uom: UnitOfMeasure.DEGREE_CELSIUS
            },
            {
                namespace: "process",
                identifier: "moldTemperature",
                description: "Mold temperature setpoint.",
                type: SettingType.NUMBER,
                defaultValue: 60,
                uom: UnitOfMeasure.DEGREE_CELSIUS
            },
            {
                namespace: "process",
                identifier: "injectionPressure",
                description: "Peak injection pressure limit.",
                type: SettingType.NUMBER,
                defaultValue: 1200,
                uom: UnitOfMeasure.BAR
            },
            {
                namespace: "process",
                identifier: "screwSpeed",
                description: "Screw rotation speed during plasticizing.",
                type: SettingType.NUMBER,
                defaultValue: 80,
                uom: UnitOfMeasure.RPM
            },
            {
                namespace: "process",
                identifier: "coolingTime",
                description: "Cooling time before mold opening, no cooling if set to null.",
                type: SettingType.NUMBER,
                nullable: true,
                uom: UnitOfMeasure.SECOND
            }
        ]
    }

    override applySettings(settings: SettingValue[]) {
        const errors: SettingError[] = this.verifySettings(settings);
        if (errors.length > 0) {
            return errors;
        }

        // Save settings to file
        fs.writeFileSync(this.config.filePath, JSON.stringify(settings, null, 2));

        return [];
    }
}