# In this directory, docker build -t sandbox

# Dockerfile.sandbox
FROM python:3.11-alpine
# Make a non-root user
RUN adduser -D -u 10001 runner
USER runner
WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
CMD ["python", "/workspace/main.py"]
