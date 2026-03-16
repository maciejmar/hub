# App B - Warsaw Pressure

## Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

## Frontend (Angular)
```bash
cd frontend
npm install
ng serve --port 4202
```

App URL: http://localhost:4202
API URL: http://localhost:8002/api/pressure/warsaw
