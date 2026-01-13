"""Injection molder machine configuration."""
import json
from dataclasses import dataclass
from typing import Optional

from .configurable import (
    ConfigurableMachine,
    Setting,
    SettingType,
    UnitOfMeasure,
    SettingValue,
    SettingError,
    NumericSetting,
    StringSetting,
    BooleanSetting,
)


@dataclass
class InjectionMolderConfig:
    """Configuration for an injection molder machine."""
    file_path: str


class InjectionMolder(ConfigurableMachine):
    """Injection molder machine."""
    
    name = "InjectionMolder"
    
    def __init__(self, config: InjectionMolderConfig):
        """Initialize injection molder with configuration.
        
        Args:
            config: Machine configuration
        """
        self.config = config
    
    @property
    def settings(self) -> list[Setting]:
        """Get the list of settings for this machine."""
        return [
            StringSetting(
                namespace="material",
                identifier="materialName",
                description="Material name / resin grade used for the current job.",
                type=SettingType.STRING,
                default_value="PP"
            ),
            BooleanSetting(
                namespace="safety",
                identifier="guardsClosedRequired",
                description="Require safety guards to be closed before cycle start.",
                type=SettingType.BOOLEAN
            ),
            NumericSetting(
                namespace="process",
                identifier="barrelTemperature",
                description="Barrel (melt) temperature setpoint.",
                type=SettingType.NUMBER,
                default_value=230.0,
                uom=UnitOfMeasure.DEGREE_CELSIUS
            ),
            NumericSetting(
                namespace="process",
                identifier="moldTemperature",
                description="Mold temperature setpoint.",
                type=SettingType.NUMBER,
                default_value=60.0,
                uom=UnitOfMeasure.DEGREE_CELSIUS
            ),
            NumericSetting(
                namespace="process",
                identifier="injectionPressure",
                description="Peak injection pressure limit.",
                type=SettingType.NUMBER,
                default_value=1200.0,
                uom=UnitOfMeasure.BAR
            ),
            NumericSetting(
                namespace="process",
                identifier="screwSpeed",
                description="Screw rotation speed during plasticizing.",
                type=SettingType.NUMBER,
                default_value=80.0,
                uom=UnitOfMeasure.RPM
            ),
            NumericSetting(
                namespace="process",
                identifier="coolingTime",
                description="Cooling time before mold opening, no cooling if set to null.",
                type=SettingType.NUMBER,
                nullable=True,
                uom=UnitOfMeasure.SECOND
            )
        ]
    
    def apply_settings(self, settings: list[SettingValue]) -> list[SettingError]:
        """Apply settings to the machine.
        
        Args:
            settings: List of settings to apply
            
        Returns:
            List of errors (empty if successful)
        """
        errors = self._verify_settings(settings)
        if errors:
            return errors
        
        # Convert settings to dict for JSON serialization
        settings_dict = []
        for setting in settings:
            setting_dict = {"identifier": setting.identifier}
            if setting.value is not None:
                setting_dict["value"] = setting.value
            if setting.uom is not None:
                setting_dict["uom"] = setting.uom.value
            settings_dict.append(setting_dict)
        
        # Save settings to file
        with open(self.config.file_path, 'w') as f:
            json.dump(settings_dict, f, indent=2)
        
        return []
