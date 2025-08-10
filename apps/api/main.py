from app_factory import create_app
from routes.candles import router as candles_router

app = create_app()
app.include_router(candles_router)