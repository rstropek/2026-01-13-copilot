"""Configure router for machine configuration endpoints."""
import json
import os
from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from shared import (
    ConfigurableMachine,
    InjectionMolder,
    InjectionMolderConfig,
    SettingValue,
    UnitOfMeasure,
)

router = APIRouter()

# List of configurable machine types
CONFIGURABLE_MACHINES = {
    "InjectionMolder": InjectionMolder
}

# Load machine configurations
config_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../configurations/machines.json")
)

with open(config_path, 'r') as f:
    machines_config = json.load(f)

# Initialize machines
machines: dict[str, ConfigurableMachine] = {}
for name, config in machines_config.items():
    machine_type_name = config["type"]
    machine_class = CONFIGURABLE_MACHINES.get(machine_type_name)
    
    if not machine_class:
        raise ValueError(f"Machine type {machine_type_name} not found")
    
    # Create config object
    if machine_type_name == "InjectionMolder":
        machine_config = InjectionMolderConfig(**config["config"])
        machines[name] = machine_class(machine_config)
    else:
        raise ValueError(f"Unknown machine type: {machine_type_name}")


class MachineInfo(BaseModel):
    """Information about a machine."""
    name: str
    type: str


class MachinesResponse(BaseModel):
    """Response containing list of machines."""
    machines: list[MachineInfo]


class SettingResponse(BaseModel):
    """Response containing setting definition."""
    machine: str
    settings: list[dict[str, Any]]


class SettingValueRequest(BaseModel):
    """A setting value in a request."""
    identifier: str
    value: Optional[Any] = None
    uom: Optional[str] = None


class ApplySettingsRequest(BaseModel):
    """Request to apply settings."""
    settings: list[SettingValueRequest]


class ApplySettingsResponse(BaseModel):
    """Response from applying settings."""
    message: str
    machine: str


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    errors: Optional[list[dict[str, str]]] = None


@router.get("/machines", response_model=MachinesResponse)
async def list_machines() -> MachinesResponse:
    """List all available machines.
    
    Returns:
        List of available machines
    """
    machine_list = []
    for name in machines.keys():
        config = machines_config[name]
        machine_list.append(MachineInfo(name=name, type=config["type"]))
    
    return MachinesResponse(machines=machine_list)


@router.get("/machines/{name}/settings", response_model=SettingResponse)
async def get_machine_settings(name: str) -> SettingResponse:
    """Get settings definition for a specific machine.
    
    Args:
        name: Machine name
        
    Returns:
        Settings definition
        
    Raises:
        HTTPException: If machine not found
    """
    machine = machines.get(name)
    
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{name}' not found")
    
    # Convert settings to dict
    settings_dict = []
    for setting in machine.settings:
        setting_data = {
            "namespace": setting.namespace,
            "identifier": setting.identifier,
            "description": setting.description,
            "type": setting.type.value,
            "nullable": setting.nullable,
        }
        
        # Add type-specific fields
        if hasattr(setting, 'default_value') and setting.default_value is not None:
            setting_data["defaultValue"] = setting.default_value
        if hasattr(setting, 'uom') and setting.uom is not None:
            setting_data["uom"] = setting.uom.value
        if hasattr(setting, 'min_value') and setting.min_value is not None:
            setting_data["minValue"] = setting.min_value
        if hasattr(setting, 'max_value') and setting.max_value is not None:
            setting_data["maxValue"] = setting.max_value
        
        settings_dict.append(setting_data)
    
    return SettingResponse(machine=name, settings=settings_dict)


@router.post("/machines/{name}/settings", response_model=ApplySettingsResponse)
async def apply_machine_settings(
    name: str, 
    request: ApplySettingsRequest
) -> ApplySettingsResponse:
    """Apply settings to a specific machine.
    
    Args:
        name: Machine name
        request: Settings to apply
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If machine not found or settings invalid
    """
    machine = machines.get(name)
    
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{name}' not found")
    
    # Convert request to SettingValue objects
    settings = []
    for setting_req in request.settings:
        uom = None
        if setting_req.uom:
            try:
                uom = UnitOfMeasure(setting_req.uom)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid unit of measure: {setting_req.uom}"
                )
        
        settings.append(SettingValue(
            identifier=setting_req.identifier,
            value=setting_req.value,
            uom=uom
        ))
    
    # Apply settings
    errors = machine.apply_settings(settings)
    
    if errors:
        error_dicts = [{"identifier": e.identifier, "message": e.message} for e in errors]
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Settings validation failed",
                "errors": error_dicts
            }
        )
    
    return ApplySettingsResponse(
        message=f"Settings applied successfully to machine '{name}'",
        machine=name
    )
