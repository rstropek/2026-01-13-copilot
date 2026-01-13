"""Demo router for simple endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from shared import add

router = APIRouter()


class AddRequest(BaseModel):
    """Request model for add endpoint."""
    a: float
    b: float


class AddResponse(BaseModel):
    """Response model for add endpoint."""
    result: float


@router.post("/add", response_model=AddResponse)
async def add_numbers(request: AddRequest) -> AddResponse:
    """Add two numbers together.
    
    Args:
        request: Request containing two numbers to add
        
    Returns:
        Result of addition
    """
    result = add(request.a, request.b)
    return AddResponse(result=result)
