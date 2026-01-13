"""Tests for logic module."""
import pytest
from .logic import add


def test_add_positive_numbers():
    """Test adding two positive numbers."""
    assert add(2, 3) == 5


def test_add_negative_numbers():
    """Test adding negative numbers."""
    assert add(-5, -3) == -8


def test_add_positive_and_negative():
    """Test adding positive and negative numbers."""
    assert add(10, -5) == 5


def test_add_with_zero():
    """Test adding with zero."""
    assert add(0, 0) == 0
    assert add(5, 0) == 5
    assert add(0, 5) == 5


def test_add_decimal_numbers():
    """Test adding decimal numbers."""
    assert add(1.5, 2.5) == 4
    assert abs(add(0.1, 0.2) - 0.3) < 1e-9
