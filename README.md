# Image Processing Pipeline

## 1. Project Overview
This project is an automated image processing pipeline. The system accepts image uploads, performs asynchronous processing to generate multi-size thumbnails, extracts metadata, and utilizes AI models to provide descriptive captions for each image.

## 2. Pre-requisites
You need these programs in order to run this project
1. [curl](https://curl.se/download.html)
2. [Docker](https://www.docker.com/)

## 3. Installation Steps
**1. Clone the repository**
```bash
git clone <repo-url>
cd <project-folder>
```

**2. Configure Environment (Optional)**  
Create a .env file in the python/ directory and add your HuggingFace access token.  
You don't need the token, but the .env file must exist.
```bash
# .env
HF_TOKEN=<hugging-face-access-token>
```

**3. Launch with Docker**  
This process will take quite a while.
```bash
docker-compose up --build

# When it's done setting up, you should see something like this
node-server-1  | App is running on http://localhost:8000
python-server-1  | INFO:     Application startup complete.
python-server-1  | INFO:     Uvicorn running on http://0.0.0.0:3000 (Press CTRL+C to quit)
```

**4. Stop Docker**
```bash
docker-compose down

# If you want to clean containers off your disk
docker system prune -a
```  

## 4. How to upload images / Tests
Uploading images is done with `curl`
```bash
curl -X POST http://localhost:8000/api/images -F "image=@C:/path/to/image.png"
```
If you're lazy, I've provided a script, `script.sh`, that sends a request for every file in the `images/` folder.  
If you want, you can add some of your own images.

## 5. API Usage
```
POST /api/images
- Accept image uploads
- Generate thumbnails (small, medium)
- Extract basic metadata (dimensions, format, size, date time of the file)
- AI captions the image (https://huggingface.co/Salesforce/blip-image-captioning-large)
- Supported formats: JPG, PNG

GET /api/images
- List all processed or processing images
- Include processing status

GET /api/images/{id}
- Get specific image details
- Include URLs for thumbnails
- Show metadata and analysis

GET /api/images/{id}/thumbnails/{small,medium}
- Return either the small or the medium thumbnail
- Includes the generated caption, null if still processing

GET /api/stats
- Processing statistics
- Success/failure rates
- Average processing time
```

## 6. Pipeline Explanation
- Validation: Filters for supported JPG and PNG formats.
- Asynchronous: Returns an image ID immediately while processing occurs in the background.
- Metadata Extraction: Gathers dimensions, format, and file size.
- Thumbnail Generation: Creates two distinct sizes (Small and Medium).
- AI Analysis: Uses the Salesforce/blip-image-captioning-large model to generate descriptive captions.
- Logging: Utilizes proper system logging to track successes and failures.

## 7. Generated Folders
- js/logs (Shared, you can view logs in your local disk)
- js/database (Stored in container)
- js/thumbnails (Stored in container)

## 8. Architecture
- NodeJS server (Image processing for metadata, logging, persistence using sqlite)
- Python server (Reads image buffer sent from the NodeJS server, and generates a caption using AI)
