const { LogLevel } = require("./logger");

class ImageProcessor {
	static #supportedExtensions = ["png", "jpeg"];
	#sharp;
	#thumbnailDir;
	#logger;

	constructor(destDir, logger) {
		this.#sharp = require("sharp");
		this.#thumbnailDir = destDir;
		const fs = require("fs");
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir);
		}
		this.#logger = logger;
	}

	processImage(file, database) {
		if (file === undefined || database === undefined) {
			return;
		}

		const start = process.hrtime.bigint();

		// Pre-insert
		const lastInsertRowId = database.insertImageRow(file.originalname);
		
		// Store thumbnails and process image metadata
		const imageId = `img${lastInsertRowId}`;
		const image = this.#sharp(file.buffer);
		const processedImage = {
			rowId: lastInsertRowId,
			imageId: imageId
		};

		image
			.metadata()
			.then(metadata => {
				// Only support PNG and JPG files.
				const format = metadata.format.toString();
				if (!ImageProcessor.#supportedExtensions.includes(format)) {
					throw new Error("invalid file format");
				}

				processedImage.width = metadata.width,
				processedImage.height = metadata.height,
				processedImage.format = format;
				processedImage.thumbnail = imageId

				return Promise.all([
					image.clone().resize(128).toFile(`${this.#thumbnailDir}/${imageId}_small.webp`),
					image.clone().resize(256).toFile(`${this.#thumbnailDir}/${imageId}_medium.webp`)
				]);
			})
			.then(() => {
				// After thumbnail is saved to disk
				// Calculate the full process time at the end
				const end = process.hrtime.bigint();
				processedImage.processingTime = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds
				processedImage.sizeBytes = file.size;
				processedImage.status = "success";
				this.#logger.log(LogLevel.INFO, `Successully processed image "${imageId}" metadata`);
			})
			.catch(_ => {
				processedImage.errorMsg = "invalid file format";
				processedImage.status = "failed";
				this.#logger.log(LogLevel.WARN, `Failed to process image "${imageId}" metadata`);
			})
			.finally(() => {
				database.updateImageData(processedImage);
			});
		
		return imageId;
	}
};

module.exports = ImageProcessor;
