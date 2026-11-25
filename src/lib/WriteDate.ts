import { writeTags } from "./ExifClient";
import { toExifDate } from "./DateParts";
import { patchDateInPlace } from "./PatchDate";

export async function writeCaptureDate(file: File, date: Date): Promise<Blob> {
	const exifDate = toExifDate(date);

	const patched = await patchDateInPlace(file, exifDate.slice(0, 10)).catch(() => null);
	if (patched) return patched;

	return writeTags(file, {
		DateTimeOriginal: exifDate,
		CreateDate: exifDate,
		ModifyDate: exifDate,
	});
}
