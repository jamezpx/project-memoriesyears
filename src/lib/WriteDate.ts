import { writeMetadata } from "@uswriting/exiftool";
import { enqueueExif } from "./ReadDate";
import { toExifDate } from "./DateParts";

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
const XMP_HEADER = "http://ns.adobe.com/xap/1.0/\0";

function matchesBytes(buf: Uint8Array, offset: number, expected: number[]): boolean {
	if (offset + expected.length > buf.length) return false;
	for (let i = 0; i < expected.length; i++) {
		if (buf[offset + i] !== expected[i]) return false;
	}
	return true;
}

function matchesAscii(buf: Uint8Array, offset: number, text: string): boolean {
	if (offset + text.length > buf.length) return false;
	for (let i = 0; i < text.length; i++) {
		if (buf[offset + i] !== text.charCodeAt(i)) return false;
	}
	return true;
}

function writeAscii20(buf: Uint8Array, offset: number, exifDate: string) {
	for (let i = 0; i < 19; i++) {
		buf[offset + i] = exifDate.charCodeAt(i);
	}
	buf[offset + 19] = 0;
}

function createMinimalExifApp1(exifDate: string): Uint8Array {
	const buf = new Uint8Array(138);
	const view = new DataView(buf.buffer);

	// APP1 marker + length (136 bytes) + "Exif\0\0"
	buf[0] = 0xff;
	buf[1] = 0xe1;
	view.setUint16(2, 136, false);
	buf.set(EXIF_HEADER, 4);

	const t = 10; // tiffStart
	// Big-endian TIFF header ("MM", 42, IFD0 offset = 8)
	buf[t] = 0x4d;
	buf[t + 1] = 0x4d;
	view.setUint16(t + 2, 0x002a, false);
	view.setUint32(t + 4, 8, false);

	// IFD0 at t + 8 (2 entries: 0x0132 ModifyDate, 0x8769 ExifIFDPointer)
	const ifd0 = t + 8;
	view.setUint16(ifd0, 2, false);
	// Entry 0: DateTime (0x0132) -> offset 68
	view.setUint16(ifd0 + 2, 0x0132, false);
	view.setUint16(ifd0 + 4, 2, false);
	view.setUint32(ifd0 + 6, 20, false);
	view.setUint32(ifd0 + 10, 68, false);
	// Entry 1: ExifIFDPointer (0x8769) -> offset 38
	view.setUint16(ifd0 + 14, 0x8769, false);
	view.setUint16(ifd0 + 16, 4, false);
	view.setUint32(ifd0 + 18, 1, false);
	view.setUint32(ifd0 + 22, 38, false);
	view.setUint32(ifd0 + 26, 0, false);

	// ExifIFD at t + 38 (2 entries: 0x9003 DateTimeOriginal, 0x9004 CreateDate)
	const exifIfd = t + 38;
	view.setUint16(exifIfd, 2, false);
	// Entry 0: DateTimeOriginal (0x9003) -> offset 88
	view.setUint16(exifIfd + 2, 0x9003, false);
	view.setUint16(exifIfd + 4, 2, false);
	view.setUint32(exifIfd + 6, 20, false);
	view.setUint32(exifIfd + 10, 88, false);
	// Entry 1: DateTimeDigitized / CreateDate (0x9004) -> offset 108
	view.setUint16(exifIfd + 14, 0x9004, false);
	view.setUint16(exifIfd + 16, 2, false);
	view.setUint32(exifIfd + 18, 20, false);
	view.setUint32(exifIfd + 22, 108, false);
	view.setUint32(exifIfd + 26, 0, false);

	// 3 null-terminated 20-byte date strings
	writeAscii20(buf, t + 68, exifDate);
	writeAscii20(buf, t + 88, exifDate);
	writeAscii20(buf, t + 108, exifDate);

	return buf;
}

type IfdEntry = { type: number; count: number; valueOrOffset: number };

function findTag(
	view: DataView,
	tiffStart: number,
	ifdRelOffset: number,
	limit: number,
	littleEndian: boolean,
	targetTag: number,
): IfdEntry | null {
	const ifdAbs = tiffStart + ifdRelOffset;
	if (ifdAbs + 2 > limit) return null;
	const count = view.getUint16(ifdAbs, littleEndian);
	for (let i = 0; i < count; i++) {
		const entry = ifdAbs + 2 + i * 12;
		if (entry + 12 > limit) return null;
		if (view.getUint16(entry, littleEndian) === targetTag) {
			return {
				type: view.getUint16(entry + 2, littleEndian),
				count: view.getUint32(entry + 4, littleEndian),
				valueOrOffset: view.getUint32(entry + 8, littleEndian),
			};
		}
	}
	return null;
}

async function tryWriteJpegFast(file: File, exifDate: string): Promise<Blob | null> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

	let exifSegment: { start: number; end: number } | null = null;
	let pos = 2;

	while (pos + 4 <= bytes.length && bytes[pos] === 0xff) {
		while (pos < bytes.length && bytes[pos] === 0xff) pos++;
		if (pos >= bytes.length) break;
		const marker = bytes[pos++];
		if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS
		if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
		if (pos + 2 > bytes.length) break;

		const segLen = (bytes[pos] << 8) | bytes[pos + 1];
		if (segLen < 2 || pos + segLen > bytes.length) break;

		const payloadStart = pos + 2;
		const payloadEnd = pos + segLen;

		if (marker === 0xe1) {
			if (matchesAscii(bytes, payloadStart, XMP_HEADER)) {
				// Let ExifTool handle files with XMP so XMP dates also stay updated
				return null;
			}
			if (!exifSegment && matchesBytes(bytes, payloadStart, EXIF_HEADER)) {
				exifSegment = { start: payloadStart, end: payloadEnd };
			}
		}

		pos = payloadEnd;
	}

	const mime = file.type || "image/jpeg";

	// Case 1: JPEG has no EXIF segment at all -> insert a minimal EXIF APP1 block
	if (!exifSegment) {
		let insertAt = 2;
		if (bytes[2] === 0xff && bytes[3] === 0xe0 && bytes.length >= 6) {
			const app0End = 4 + ((bytes[4] << 8) | bytes[5]);
			if (app0End <= bytes.length) insertAt = app0End;
		}
		const app1 = createMinimalExifApp1(exifDate);
		const out = new Uint8Array(bytes.length + app1.length);
		out.set(bytes.subarray(0, insertAt), 0);
		out.set(app1, insertAt);
		out.set(bytes.subarray(insertAt), insertAt + app1.length);
		return new Blob([out], { type: mime });
	}

	// Case 2: JPEG already has EXIF -> patch ModifyDate, DateTimeOriginal, CreateDate in-place
	const tiffStart = exifSegment.start + 6;
	if (tiffStart + 8 > exifSegment.end) return null;

	let littleEndian: boolean;
	if (bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49) {
		littleEndian = true;
	} else if (bytes[tiffStart] === 0x4d && bytes[tiffStart + 1] === 0x4d) {
		littleEndian = false;
	} else {
		return null;
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002a) return null;

	const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
	const modifyEntry = findTag(view, tiffStart, ifd0Offset, exifSegment.end, littleEndian, 0x0132);
	const exifPtr = findTag(view, tiffStart, ifd0Offset, exifSegment.end, littleEndian, 0x8769);
	if (
		!modifyEntry ||
		!exifPtr ||
		(exifPtr.type !== 4 && exifPtr.type !== 13) ||
		exifPtr.count !== 1
	) {
		return null;
	}

	const origEntry = findTag(
		view,
		tiffStart,
		exifPtr.valueOrOffset,
		exifSegment.end,
		littleEndian,
		0x9003,
	);
	const createEntry = findTag(
		view,
		tiffStart,
		exifPtr.valueOrOffset,
		exifSegment.end,
		littleEndian,
		0x9004,
	);
	if (!origEntry || !createEntry) return null;

	for (const entry of [modifyEntry, origEntry, createEntry]) {
		if (entry.type !== 2 || entry.count < 20) return null;
		if (tiffStart + entry.valueOrOffset + 20 > exifSegment.end) return null;
	}

	writeAscii20(bytes, tiffStart + modifyEntry.valueOrOffset, exifDate);
	writeAscii20(bytes, tiffStart + origEntry.valueOrOffset, exifDate);
	writeAscii20(bytes, tiffStart + createEntry.valueOrOffset, exifDate);

	return new Blob([bytes], { type: mime });
}

// Regresa una copia de la foto con su fecha de captura reemplazada
export async function writeCaptureDate(file: File, date: Date): Promise<Blob> {
	const exifDate = toExifDate(date);
	const isJpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);

	if (isJpeg) {
		const fast = await tryWriteJpegFast(file, exifDate);
		if (fast) return fast;
	}

	return enqueueExif(async () => {
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
