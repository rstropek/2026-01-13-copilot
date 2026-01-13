"""Tests for configurable machine base classes."""
import pytest
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


class TestMachine(ConfigurableMachine):
    """Test machine for unit tests."""
    
    @property
    def settings(self) -> list[Setting]:
        """Get test settings."""
        return [
            BooleanSetting(
                namespace="req",
                identifier="requiredNoDefault",
                description="Required boolean without default",
                type=SettingType.BOOLEAN
            ),
            StringSetting(
                namespace="defaults",
                identifier="stringWithDefault",
                description="String with default",
                type=SettingType.STRING,
                default_value="hello"
            ),
            NumericSetting(
                namespace="numbers",
                identifier="tempC",
                description="Temperature in °C",
                type=SettingType.NUMBER,
                uom=UnitOfMeasure.DEGREE_CELSIUS,
                min_value=0.0,
                max_value=100.0
            ),
            NumericSetting(
                namespace="numbers",
                identifier="plainNumber",
                description="Number without uom",
                type=SettingType.NUMBER,
                min_value=0.0,
                max_value=10.0
            ),
            NumericSetting(
                namespace="nullable",
                identifier="nullableNumber",
                description="Nullable number without default",
                type=SettingType.NUMBER,
                nullable=True
            )
        ]
    
    def verify(self, values: list[SettingValue]) -> list[SettingError]:
        """Public method to test verification."""
        return self._verify_settings(values)
    
    def apply_settings(self, settings: list[SettingValue]) -> list[SettingError]:
        """Apply settings (no-op for tests)."""
        return []


def test_flags_unknown_identifiers():
    """Test that unknown identifiers are flagged."""
    m = TestMachine()
    errors = m.verify([SettingValue(identifier="doesNotExist", value=1)])
    
    assert any(
        e.identifier == "doesNotExist" and 
        e.message == "Unknown setting identifier"
        for e in errors
    )


def test_flags_duplicate_identifiers():
    """Test that duplicate identifiers are flagged."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="stringWithDefault", value="a"),
        SettingValue(identifier="stringWithDefault", value="b")
    ])
    
    assert any(
        e.identifier == "stringWithDefault" and
        e.message == "Duplicate setting identifier provided"
        for e in errors
    )


def test_requires_values_for_non_nullable_without_defaults():
    """Test that required values without defaults are flagged."""
    m = TestMachine()
    errors = m.verify([])
    
    assert any(
        e.identifier == "requiredNoDefault" and
        e.message == "Missing value (no default and not nullable)"
        for e in errors
    )


def test_validates_types():
    """Test that type validation works."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="stringWithDefault", value=123)
    ])
    
    assert any(
        e.identifier == "stringWithDefault" and
        e.message == "Value must be a string"
        for e in errors
    )


def test_checks_numeric_min_max():
    """Test that numeric min/max validation works."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="tempC", value=120, uom=UnitOfMeasure.DEGREE_CELSIUS),
        SettingValue(identifier="plainNumber", value=5)
    ])
    
    assert any(
        e.identifier == "tempC" and
        e.message == "Value must be <= 100.0"
        for e in errors
    )


def test_accepts_convertible_uom():
    """Test that convertible units are accepted and used for range checks."""
    m = TestMachine()
    # 212°F -> 100°C, should be within [0..100]
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="tempC", value=212, uom=UnitOfMeasure.DEGREE_FAHRENHEIT),
        SettingValue(identifier="plainNumber", value=5)
    ])
    
    assert len(errors) == 0


def test_flags_non_convertible_uom():
    """Test that non-convertible units are flagged."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="tempC", value=10, uom=UnitOfMeasure.BAR),
        SettingValue(identifier="plainNumber", value=5)
    ])
    
    assert any(
        e.identifier == "tempC" and
        e.message == "Unit of measure is not convertible to required unit"
        for e in errors
    )


def test_flags_uom_for_settings_that_dont_support_it():
    """Test that UOM is flagged for settings that don't support it."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="plainNumber", value=5, uom=UnitOfMeasure.SECOND)
    ])
    
    assert any(
        e.identifier == "plainNumber" and
        e.message == "Unit of measure is not supported for this setting"
        for e in errors
    )


def test_allows_missing_values_for_nullable():
    """Test that nullable settings can have missing values."""
    m = TestMachine()
    errors = m.verify([
        SettingValue(identifier="requiredNoDefault", value=True),
        SettingValue(identifier="tempC", value=50),
        SettingValue(identifier="plainNumber", value=5)
    ])
    
    assert len(errors) == 0
