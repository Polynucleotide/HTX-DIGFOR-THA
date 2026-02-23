const Database = require('better-sqlite3');

class ImageDatabase {
	#db;
	#queries = {};

	// Create Database file and tables.
	constructor(destDir) {
		const fs = require("fs");
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir);
		}
		this.#db = new Database(`${destDir}/database.db`);
		this.#db.pragma("journal_mode = WAL");
    }

	init() {
		let stmt = this.#db.prepare(
			"CREATE TABLE IF NOT EXISTS processed_images(" +
				"row_id INTEGER PRIMARY KEY AUTOINCREMENT," +
				"image_id VARCHAR(32) UNIQUE," +
				"status VARCHAR(16) DEFAULT 'processing'," +
				"original_name VARCHAR(255)," +
				"processed_at TEXT," +
				"processing_time FLOAT," +
				"width INTEGER," +
				"height INTEGER," +
				"format VARCHAR(8)," +
				"size_bytes INTEGER," +
				"thumbnail VARCHAR(255)," +
				"caption VARCHAR(128)," +
				"error_msg VARCHAR(255)" +
			");"
		);
		const info = stmt.run();

		// Store prepared statements to use later
		this.#queries.insert_stmt = this.#db.prepare(
			"INSERT INTO processed_images(" +
				"original_name," +
				"processed_at" +
			") VALUES (?, datetime());"
		);

		this.#queries.update_stmt = this.#db.prepare(
			"UPDATE processed_images SET " +
				"(image_id, status, processing_time, width, height, format, size_bytes, thumbnail, error_msg) = " +
				"(?, ?, ?, ?, ?, ?, ?, ?, ?) " +
			"WHERE row_id = ?;"
		);

		this.#queries.set_caption_stmt = this.#db.prepare(
			"UPDATE processed_images SET caption = ? WHERE image_id = ?;"
		);

		this.#queries.get_stmt = this.#db.prepare(
			"SELECT * FROM processed_images WHERE image_id = ?;"
		);

		this.#queries.get_all_stmt = this.#db.prepare(
			"SELECT * FROM processed_images;"
		);

		this.#queries.stats_stmt = this.#db.prepare(
			"SELECT " +
				"COALESCE(SUM(IIF(status != 'processing', 1, 0)), 0) AS total," +
				"COALESCE(SUM(IIF(status == 'failed', 1, 0)), 0) AS failed," +
				"COALESCE(SUM(processing_time), 0) / 1000 AS total_processing_time_seconds " +
			"FROM processed_images;"
		);
	}

	insertImageRow(imageOriginalName) {
		const info = this.#queries.insert_stmt.run(imageOriginalName);
		return info.lastInsertRowid;
	}

	updateImageData(processedImageData) {
		const info = this.#queries.update_stmt.run(
			processedImageData.imageId,
			processedImageData.status,
			processedImageData.processingTime,
			processedImageData.width,
			processedImageData.height,
			processedImageData.format,
			processedImageData.sizeBytes,
			processedImageData.thumbnail,
			processedImageData.errorMsg,
			processedImageData.rowId
		);
	}

	setImageCaption(caption, imageId) {
		this.#queries.set_caption_stmt.run(caption, imageId);
	}

	getImageData(imageId) {
		return this.#queries.get_stmt.get(imageId);
	}

	getImageDataArray() {
		return this.#queries.get_all_stmt.all();
	}

	getProcessingStats() {
		return this.#queries.stats_stmt.get(); 
	}
};

module.exports = ImageDatabase;
