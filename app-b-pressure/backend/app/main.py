from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="App B - Warsaw Pressure")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4201", "http://localhost:4202"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WARSAW_LAT = 52.2297
WARSAW_LON = 21.0122


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/pressure/warsaw")
async def warsaw_pressure():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": WARSAW_LAT,
        "longitude": WARSAW_LON,
        "current": "pressure_msl,surface_pressure,temperature_2m",
        "timezone": "Europe/Warsaw",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Weather provider unavailable") from exc

    current = payload.get("current", {})
    if not current:
        raise HTTPException(status_code=502, detail="Invalid weather provider response")

    return {
        "city": "Warsaw",
        "time": current.get("time"),
        "pressure_msl_hpa": current.get("pressure_msl"),
        "surface_pressure_hpa": current.get("surface_pressure"),
        "temperature_c": current.get("temperature_2m"),
        "source": "open-meteo.com",
    }
