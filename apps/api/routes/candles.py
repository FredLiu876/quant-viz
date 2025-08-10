from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import yfinance as yf
import pandas as pd

router = APIRouter()

@router.get("/candles/{symbol}")
def get_candles(symbol: str, months: int = 6, granularity: str = "1d"):
    assert isinstance(months, int) and months >= 0 and months <= 60, "months must be an integer between 1 and 60"
    allowed_granularities = {"1d", "1wk", "1mo", "1m", "5m", "15m", "30m", "60m", "90m"}
    assert granularity in allowed_granularities, f"granularity must be one of {allowed_granularities}"
    sym = symbol.upper().strip()

    period = f"{months}mo" if months > 0 else "max"
    df = yf.download(
        sym,
        period=period,
        interval=granularity,
        auto_adjust=False,
        progress=False,
        group_by="column",
        actions=False,
    )

    if df is None or df.empty:
        return []

    if isinstance(df.columns, pd.MultiIndex):
        if sym in df.columns.get_level_values(-1):
            df = df.xs(sym, axis=1, level=-1, drop_level=True)
        else:
            df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]

    keep = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
    df = df[keep].reset_index(drop=False)

    date_col = "Date" if "Date" in df.columns else "Datetime"
    df[date_col] = pd.to_datetime(df[date_col], utc=True, errors="coerce").dt.tz_localize(None)

    out_df = df.assign(
        time=df[date_col].dt.strftime("%Y-%m-%d"),
        open=df["Open"].astype(float).round(2),
        high=df["High"].astype(float).round(2),
        low=df["Low"].astype(float).round(2),
        close=df["Close"].astype(float).round(2),
        volume=df["Volume"].fillna(0).astype("int64"),
    )[["time", "open", "high", "low", "close", "volume"]]

    out_df = out_df.where(pd.notnull(out_df), None)
    out = jsonable_encoder(out_df.to_dict(orient="records"))
    return JSONResponse(content=out)
