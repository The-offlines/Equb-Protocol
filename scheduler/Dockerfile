FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN echo "Files in /app:" && ls -la /app

CMD ["python", "-u", "main.py"]
