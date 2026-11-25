import { writeMetadata } from "@uswriting/exiftool";
import { enqueueExif } from "./ReadDate";
import { toExifDate } from "./DateParts";

// Regresssa una copia de la foto con su fecha de captura reemplazada
export function writeCaptureDate(file: File, date: Date): Promise<Blob> {
	return enqueueExif(async () => {
		const exifDate = toExifDate(date);
		const result = await writeMetadata(file, {
			DateTimeOriginal: exifDate,
			CreateDate: exifDate,
			ModifyDate: exifDate,
		});
		if (!result.success) {
			throw new Error(result.error || "Could not write the date");
		}
		return new Blob([result.data], { type: file.type });
	});
}
