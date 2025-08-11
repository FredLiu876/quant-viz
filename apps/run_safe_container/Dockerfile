# Dockerfile.sandbox
# docker build -t sandbox .

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Create non-root user
RUN useradd -u 10001 -m runner

WORKDIR /code

COPY main.py /app/main.py
ENV PYTHONPATH="/code:/app"

USER runner
CMD ["python", "/app/main.py"]
