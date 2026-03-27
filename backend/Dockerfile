# FROM python:3.12-slim  # Docker Hub — niedostępne w sieci BGK
FROM repo.bank.com.pl/zrai-docker-remote-dev/python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
