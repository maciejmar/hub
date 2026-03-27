# FROM python:3.12-slim  # Docker Hub — niedostępne w sieci BGK
FROM repo.bank.com.pl/zrai-docker-remote-dev/python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN --mount=type=secret,id=pip_conf,target=/etc/pip.conf \
    pip install \
    --trusted-host repo.bank.com.pl \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
