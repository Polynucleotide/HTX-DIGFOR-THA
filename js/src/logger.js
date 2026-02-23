const fs = require("fs");

const LogLevel = {
	INFO: "INFO",
	WARN: "WARN"
}

class Logger {
	#logFilepath;
	#writeStream;

	constructor(rootDir) {
		this.#logFilepath = `${rootDir}/logs/app.log`;
		this.#writeStream = fs.createWriteStream(this.#logFilepath, { flags: "a" });
	}

	log(logLevel, message) {
		const entry = `${new Date().toISOString()} ${logLevel} ${message}\n`;
		try {
			this.#writeStream.write(entry);
		} catch (err) {
			console.error("Error writing to log file:", err);
		}
	}
};

module.exports = { LogLevel, Logger };
