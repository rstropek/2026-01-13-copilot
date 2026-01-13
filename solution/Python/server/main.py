"""Main FastAPI server application."""
import os
from fastapi import FastAPI
import uvicorn

from .routers import demo, configure

app = FastAPI(title="Configurizer API")

# Register routers
app.include_router(demo.router, prefix="/demo", tags=["demo"])
app.include_router(configure.router, prefix="/configure", tags=["configure"])


def run():
    """Run the server."""
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    run()
