"""Base classes for configurable machines."""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Optional, Union
from dataclasses import dataclass


class SettingType(str, Enum):
    """Type of setting value."""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


class UnitOfMeasure(str, Enum):
    """Unit of measure for numeric settings."""
    DEGREE_CELSIUS = "°C"
    DEGREE_FAHRENHEIT = "°F"
    BAR = "bar"
    PSI = "psi"
    RPM = "rpm"
    RPS = "rps"
    SECOND = "s"
    MINUTE = "min"


@dataclass
class SettingBase:
    """Base class for all settings."""
    namespace: Optional[str]
    identifier: str
    description: str
    nullable: Optional[bool] = None


@dataclass
class NumericSetting(SettingBase):
    """Numeric setting with optional unit of measure and range."""
    type: SettingType = SettingType.NUMBER
    default_value: Optional[float] = None
    uom: Optional[UnitOfMeasure] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None


@dataclass
class StringSetting(SettingBase):
    """String setting."""
    type: SettingType = SettingType.STRING
    default_value: Optional[str] = None


@dataclass
class BooleanSetting(SettingBase):
    """Boolean setting."""
    type: SettingType = SettingType.BOOLEAN
    default_value: Optional[bool] = None


Setting = Union[NumericSetting, StringSetting, BooleanSetting]


@dataclass
class SettingValue:
    """A setting value to be applied."""
    identifier: str
    value: Optional[Union[str, float, bool]] = None
    uom: Optional[UnitOfMeasure] = None


@dataclass
class SettingError:
    """An error in a setting value."""
    identifier: str
    message: str


class ConfigurableMachine(ABC):
    """Abstract base class for configurable machines."""
    
    @property
    @abstractmethod
    def settings(self) -> list[Setting]:
        """Get the list of settings for this machine."""
        pass
    
    def _verify_settings(self, settings: list[SettingValue]) -> list[SettingError]:
        """Verify that settings are valid.
        
        Performs the following checks:
        * Each identifier must exist in settings (see getter)
        * No duplicate identifiers
        * There must be a value or a default value for each setting that is not nullable
        * Value must be of the correct type
        * If numeric, value must be >= minValue and <= maxValue
        * If numeric, uom must fit or be convertible to the setting's uom
        
        Args:
            settings: List of settings to verify
            
        Returns:
            List of errors (empty if valid)
        """
        errors: list[SettingError] = []
        
        # Build definition map
        definition_map: dict[str, Setting] = {}
        for definition in self.settings:
            definition_map[definition.identifier] = definition
        
        # Check for duplicates
        seen_provided: set[str] = set()
        duplicate_provided: set[str] = set()
        for provided in settings:
            if provided.identifier in seen_provided:
                duplicate_provided.add(provided.identifier)
            else:
                seen_provided.add(provided.identifier)
        
        for identifier in duplicate_provided:
            errors.append(SettingError(
                identifier=identifier,
                message="Duplicate setting identifier provided"
            ))
        
        # Build provided map (keep first occurrence)
        provided_map: dict[str, SettingValue] = {}
        for provided in settings:
            if provided.identifier not in definition_map:
                errors.append(SettingError(
                    identifier=provided.identifier,
                    message="Unknown setting identifier"
                ))
                continue
            
            if provided.identifier not in provided_map:
                provided_map[provided.identifier] = provided
        
        # Verify each definition
        for identifier, definition in definition_map.items():
            provided = provided_map.get(identifier)
            nullable = definition.nullable is True
            
            has_provided_value = provided is not None and provided.value is not None
            default_value = getattr(definition, 'default_value', None)
            has_default_value = default_value is not None
            
            if not nullable and not has_provided_value and not has_default_value:
                errors.append(SettingError(
                    identifier=identifier,
                    message="Missing value (no default and not nullable)"
                ))
                continue
            
            # Determine effective value
            effective_value = provided.value if has_provided_value else default_value
            if effective_value is None:
                # Nullable without value is fine
                if definition.type != SettingType.NUMBER and provided is not None and provided.uom is not None:
                    errors.append(SettingError(
                        identifier=identifier,
                        message="Unit of measure is only allowed for numeric settings"
                    ))
                continue
            
            # Check if UOM is used on non-numeric settings
            if definition.type != SettingType.NUMBER and provided is not None and provided.uom is not None:
                errors.append(SettingError(
                    identifier=identifier,
                    message="Unit of measure is only allowed for numeric settings"
                ))
            
            # Type-specific validation
            if definition.type == SettingType.STRING:
                if not isinstance(effective_value, str):
                    errors.append(SettingError(
                        identifier=identifier,
                        message="Value must be a string"
                    ))
            elif definition.type == SettingType.BOOLEAN:
                if not isinstance(effective_value, bool):
                    errors.append(SettingError(
                        identifier=identifier,
                        message="Value must be a boolean"
                    ))
            elif definition.type == SettingType.NUMBER:
                if not isinstance(effective_value, (int, float)):
                    errors.append(SettingError(
                        identifier=identifier,
                        message="Value must be a number"
                    ))
                    continue
                
                assert isinstance(definition, NumericSetting)
                setting_uom = definition.uom
                provided_uom = provided.uom if provided is not None else None
                
                if provided_uom is not None and setting_uom is None:
                    errors.append(SettingError(
                        identifier=identifier,
                        message="Unit of measure is not supported for this setting"
                    ))
                    continue
                
                # Convert value if needed
                value_for_range = effective_value
                if (setting_uom is not None and 
                    provided_uom is not None and 
                    provided_uom != setting_uom):
                    converted = self._convert_uom(effective_value, provided_uom, setting_uom)
                    if converted is None:
                        errors.append(SettingError(
                            identifier=identifier,
                            message="Unit of measure is not convertible to required unit"
                        ))
                        continue
                    value_for_range = converted
                
                # Check range
                if definition.min_value is not None and value_for_range < definition.min_value:
                    errors.append(SettingError(
                        identifier=identifier,
                        message=f"Value must be >= {definition.min_value}"
                    ))
                if definition.max_value is not None and value_for_range > definition.max_value:
                    errors.append(SettingError(
                        identifier=identifier,
                        message=f"Value must be <= {definition.max_value}"
                    ))
        
        return errors
    
    @abstractmethod
    def apply_settings(self, settings: list[SettingValue]) -> list[SettingError]:
        """Apply settings to the machine.
        
        Args:
            settings: List of settings to apply
            
        Returns:
            List of errors (empty if successful)
        """
        pass
    
    def _convert_uom(
        self, 
        value: float, 
        from_uom: UnitOfMeasure, 
        to_uom: UnitOfMeasure
    ) -> Optional[float]:
        """Convert a value from one unit of measure to another.
        
        Args:
            value: The value to convert
            from_uom: The unit to convert from
            to_uom: The unit to convert to
            
        Returns:
            Converted value or None if conversion is not supported
        """
        if from_uom == to_uom:
            return value
        
        # Temperature conversions
        if from_uom == UnitOfMeasure.DEGREE_CELSIUS and to_uom == UnitOfMeasure.DEGREE_FAHRENHEIT:
            return (value * 9 / 5) + 32
        if from_uom == UnitOfMeasure.DEGREE_FAHRENHEIT and to_uom == UnitOfMeasure.DEGREE_CELSIUS:
            return (value - 32) * 5 / 9
        
        # Pressure conversions
        if from_uom == UnitOfMeasure.BAR and to_uom == UnitOfMeasure.PSI:
            return value * 14.5037738007218
        if from_uom == UnitOfMeasure.PSI and to_uom == UnitOfMeasure.BAR:
            return value / 14.5037738007218
        
        # Speed conversions
        if from_uom == UnitOfMeasure.RPM and to_uom == UnitOfMeasure.RPS:
            return value / 60
        if from_uom == UnitOfMeasure.RPS and to_uom == UnitOfMeasure.RPM:
            return value * 60
        
        # Time conversions
        if from_uom == UnitOfMeasure.SECOND and to_uom == UnitOfMeasure.MINUTE:
            return value / 60
        if from_uom == UnitOfMeasure.MINUTE and to_uom == UnitOfMeasure.SECOND:
            return value * 60
        
        return None
