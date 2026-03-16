from datetime import date, datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="App A - Days To Date")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4201", "http://localhost:4202"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/days-to")
def days_to(target_date: str = Query(..., description="Date in YYYY-MM-DD format")):
    try:
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD") from exc

    today = date.today()
    delta_days = (target - today).days

    return {
        "target_date": target.isoformat(),
        "today": today.isoformat(),
        "days_difference": delta_days,
        "status": "future" if delta_days > 0 else "today" if delta_days == 0 else "past",
    }
