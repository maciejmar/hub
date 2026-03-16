# App A - Days To Date

## Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 18001
```

## Frontend (Angular)
```bash
cd frontend
npm install
ng serve --port 4201
```

App URL: http://localhost:4201
API URL: http://localhost:18001/api/days-to?target_date=2026-12-31
