import exifr from "exifr";

const TAGS = ["DateTimeOriginal", "CreateDate", "ModifyDate"] as const;
const FAST_FORMATS = /\.(jpe?g|heic|heif)$/i;
const EXIF_DATE = /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/;

const ascii = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0));

function replaceAll(bytes: Uint8Array, from: Uint8Array, to: Uint8Array) {
	let count = 0;
	const last = bytes.length - from.length;
	scan: for (let i = 0; i <= last; i++) {
		if (bytes[i] !== from[0]) continue;
		for (let j = 1; j < from.length; j++) {
			if (bytes[i + j] !== from[j]) continue scan;
		}
		bytes.set(to, i);
		count++;
		i += from.length - 1;
	}
	return count;
}

export async function patchDateInPlace(file: File, newDay: string): Promise<Uint8Array | null> {
	if (!FAST_FORMATS.test(file.name)) return null;

	const tags = (await exifr.parse(file, { pick: [...TAGS], reviveValues: false })) as
		Partial<Record<(typeof TAGS)[number], string>> | undefined;
	if (!tags?.DateTimeOriginal && !tags?.CreateDate) return null;

	const originals = new Set(
		TAGS.map((tag) => tags[tag]).filter((v): v is string => !!v && EXIF_DATE.test(v)),
	);
	if (originals.size === 0) return null;

	const bytes = new Uint8Array(await file.arrayBuffer());
	const isoDay = newDay.replaceAll(":", "-");
	let replaced = 0;

	for (const original of originals) {
		const rest = original.slice(10);

		replaced += replaceAll(bytes, ascii(original), ascii(newDay + rest));

		replaced += replaceAll(
			bytes,
			ascii(original.slice(0, 10).replaceAll(":", "-") + "T" + original.slice(11)),
			ascii(isoDay + "T" + original.slice(11)),
		);
	}
	if (replaced === 0) return null;

	const check = (await exifr.parse(bytes, {
		pick: ["DateTimeOriginal", "CreateDate"],
		reviveValues: false,
	})) as { DateTimeOriginal?: string; CreateDate?: string } | undefined;
	const found = [check?.DateTimeOriginal, check?.CreateDate].filter((v): v is string => !!v);
	if (found.length === 0 || !found.every((v) => v.startsWith(newDay))) return null;

	return bytes;
}
