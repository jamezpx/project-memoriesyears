import { parseMetadata } from "@uswriting/exiftool";

type ExifDates = {
	DateTimeOriginal?: string;
	CreateDate?: string;
};

// Información mas confiable primero: DateTimeOriginal es cuando se disparó el obturador
const TAGS = ["DateTimeOriginal", "CreateDate"] as const;

// Información EXIF se escribe como "2026:11:24 20:32:12"
// pero XMP lo puede escribir como "2026-11-24T20-32-12"
const EXIF_DATE = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;

function parseExifDate(value: unknown): Date | null {
	if (typeof value !== "string") return null;

	const match = EXIF_DATE.exec(value);

	if (!match) return null;

	const [year, month, day, hour, minute, second] = match.slice(1).map(Number);

	if (year === 0 || month === 0 || day === 0) return null;

	return new Date(year, month - 1, day, hour, minute, second);
}

export async function readOnce(file: File): Promise<Date | null> {
	const result = await parseMetadata(file, {
		args: ["-json", ...TAGS.map((tag) => `-${tag}`)],
		transform: (data) => JSON.parse(data) as ExifDates[],
	});

	if (!result.success) {
		throw new Error(result.error || "Could not read the file metadata");
	}

	const tags = result.data[0];

	for (const tag of TAGS) {
		const date = parseExifDate(tags?.[tag]);

		if (date) return date;
	}

	return null;
}

// La instancia de ExifTool WASM solo puede manejar una llamada al tiempo
let queue: Promise<unknown> = Promise.resolve();

export function enqueueExif<T>(task: () => Promise<T>): Promise<T> {
	const run = queue.then(task);
	queue = run.catch(() => undefined);
	return run;
}

export function readCaptureDate(file: File): Promise<Date | null> {
	return enqueueExif(() => readOnce(file));
}
