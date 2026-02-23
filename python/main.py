from fastapi import FastAPI, Request, HTTPException
from io import BytesIO
from transformers import BlipProcessor, BlipForConditionalGeneration, logging
from PIL import Image

app = FastAPI()
processor = None
model = None
logging.disable_progress_bar()

@app.on_event("startup")
async def startup_event():
	global processor, model
	processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
	model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

@app.post("/api/image/upload")
async def upload(request: Request):
	file_content = await request.body()
	try:
		image = Image.open(BytesIO(file_content))
		inputs = processor(images=image, return_tensors="pt")
		outputs = model.generate(**inputs)
		caption = processor.decode(outputs[0], skip_special_tokens=True)
		return { "caption": caption }
	except:
		raise HTTPException(status_code = 400)
