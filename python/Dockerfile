FROM python:3.14.2-slim

WORKDIR /app/python

COPY requirements.txt .
RUN apt-get update && apt-get install -y build-essential libglib2.0-0 && \
	pip install --root-user-action=ignore --no-cache-dir -r requirements.txt && \
	pip3 install --root-user-action=ignore --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu126

COPY . .

EXPOSE 3000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
