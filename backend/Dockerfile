# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/code

# Set the working directory in the container
WORKDIR /code

# Install system dependencies for ChromaDB and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /code
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /code
COPY . .

# Create a directory for the database and set permissions
# Hugging Face Spaces runs as a non-root user (id 1000)
RUN mkdir -p /code/chroma_db && chmod 777 /code/chroma_db
RUN touch /code/database.db && chmod 777 /code/database.db

# Expose the port that the app runs on
EXPOSE 7860

# Command to run the application
# Use 0.0.0.0 and port 7860 (standard for HF Spaces)
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:7860"]
