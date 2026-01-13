import { InjectionMolder, ConfigurableMachine, type SettingValue } from "shared";
import express, { type Request, type Response } from "express";
import fs from "fs";

const configurableMachines = [
    InjectionMolder
];

type MachineConfig = {
    type: string;
    config: unknown;
}

// read configurations/machines.json
const machinesConfig = JSON.parse(fs.readFileSync("/Users/rstropek/github/Samples/KI/Configurizer/TypeScript/configurations/machines.json", "utf8")) as Record<string, MachineConfig>;
const machines: Record<string, ConfigurableMachine> = {};
for (const [name, config] of Object.entries(machinesConfig)) {
    const machineType = configurableMachines.find(m => m.name === config.type) as new (config: unknown) => ConfigurableMachine;
    if (!machineType) {
        throw new Error(`Machine type ${config.type} not found`);
    }
    const machine = new machineType(config.config);
    machines[name] = machine;
}

export const configureRouter = express.Router();

// GET /machines - List all available machines
configureRouter.get('/machines', (_req: Request, res: Response) => {
    const machineList = Object.keys(machines).map(name => {
        const config = machinesConfig[name];
        if (!config) {
            throw new Error(`Configuration for machine '${name}' not found`);
        }
        return {
            name,
            type: config.type
        };
    });
    res.json({ machines: machineList });
});

// GET /machines/:name/settings - Get settings definition for a specific machine
configureRouter.get('/machines/:name/settings', (req: Request, res: Response) => {
    const name = req.params.name;
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Machine name is required' });
        return;
    }
    
    const machine = machines[name];
    
    if (!machine) {
        res.status(404).json({ error: `Machine '${name}' not found` });
        return;
    }
    
    res.json({ 
        machine: name,
        settings: machine.settings 
    });
});

// POST /machines/:name/settings - Apply settings to a specific machine
configureRouter.post('/machines/:name/settings', (req: Request, res: Response) => {
    const name = req.params.name;
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Machine name is required' });
        return;
    }
    
    const machine = machines[name];
    
    if (!machine) {
        res.status(404).json({ error: `Machine '${name}' not found` });
        return;
    }
    
    const settings = req.body.settings as SettingValue[];
    
    if (!Array.isArray(settings)) {
        res.status(400).json({ error: 'Request body must contain a "settings" array' });
        return;
    }
    
    const errors = machine.applySettings(settings);
    
    if (errors.length > 0) {
        res.status(400).json({ 
            error: 'Settings validation failed',
            errors 
        });
        return;
    }
    
    res.json({ 
        message: `Settings applied successfully to machine '${name}'`,
        machine: name
    });
});
