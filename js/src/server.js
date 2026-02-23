const express = require("express");
const app = express();
const port = 8000;

// Set up static filepath
const path = require("path");
const rootDir = path.join(__dirname, "..");
app.use("/thumbnails", express.static(
	path.join(rootDir, "thumbnails")
));

const multer = require("multer");
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const ImageProcessor = require("./image_processor");
const imageProcessor = new ImageProcessor(`${rootDir}/thumbnails`);

const ImageDatabase = require("./image_database");
const imageDatabase = new ImageDatabase(`${rootDir}/database`);
imageDatabase.init();

const DOMAIN = `http://localhost:${port}`;

// Helper function to construct a JSON for api/images/{id} and api/images
function constructJsonResponse(imageData) {
	const response = {
		status: imageData.status,
		data: {
			image_id: imageData.image_id,
			original_name: imageData.original_name,
			processed_at: imageData.processed_at,
			processing_time: null,
			metadata: {},
			thumbnails: {}
		},
		error: imageData.error_msg
	};

	if (imageData.error_msg === null) {
		response.data.processing_time = imageData.processing_time;

		response.data.metadata = {
			width: imageData.width,
			height: imageData.height,
			format: imageData.format,
			size_bytes: imageData.size_bytes
		};

		response.data.thumbnails = {
			small: `${DOMAIN}/api/images/${imageData.thumbnail}/thumbnails/small`,
			medium: `${DOMAIN}/api/images/${imageData.thumbnail}/thumbnails/medium`
		}

		response.data.caption = imageData.caption;
	}

	return response;
}

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.post("/api/images", upload.single("image"), (req, res) => {
	// Process image metadata
	const imageId = imageProcessor.processImage(req.file, imageDatabase);

	// Generate caption for image
	fetch('http://python-server:3000/api/image/upload', {
		method: "POST",
		headers: {
			"Content-Type": "application/octet-stream",
		},
		body: req.file.buffer,
	})
	.then(response => {
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		return response.json();
	})
	.then(data => {
		imageDatabase.setImageCaption(data.caption, imageId);
	})
	.catch(error => {
		console.error("There was a problem with the fetch operation:", error);
	});

	res.redirect(`/api/images/${imageId}`);
});

app.get("/api/images", (_, res) => {
	const imageDataArray = imageDatabase.getImageDataArray();
	const response = imageDataArray.map(imageData => constructJsonResponse(imageData));
	res.json(response);
});

app.get("/api/images/:id", (req, res) => {
	const imageId = req.params.id;
	const imageData = imageDatabase.getImageData(imageId);
	if (imageData === undefined) {
		return res.status(404).send(`Image Data with ID "${imageId}" not found.`);
	}
	const response = constructJsonResponse(imageData);
	res.json(response);
});

app.get("/api/stats", (_, res) => {
	const stats = imageDatabase.getProcessingStats();
	const successRate = (stats.total === 0) ? 0 : `${(1 - (stats.failed / stats.total)) * 100}%`;
	const averageProcessingTime = (stats.total === 0) ? 0 : stats.total_processing_time_seconds / stats.total;
	const response = {
		total: stats.total,
		failed: stats.failed,
		success_rate: successRate,
		average_processing_time_seconds: averageProcessingTime
	};
	res.json(response);
});

app.get("/api/images/:id/thumbnails/:size", (req, res) => {
	const imageId = req.params.id;
	const imageData = imageDatabase.getImageData(imageId);
	if (imageData !== undefined) {
		const filename = `${DOMAIN}/thumbnails/${imageId}_${req.params.size}.webp`
		res.send(`<img src="${filename}" style="display:block"/><p>${imageData.caption}</p>`);
	}
	else {
		res.status(404).send(`Thumbnail with ID "${imageId}" not found.`);
	}
});

app.listen(port, () => {
	console.log(`App is running on http://localhost:${port}`);
});
