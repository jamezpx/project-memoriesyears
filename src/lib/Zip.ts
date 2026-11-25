import { downloadZip } from "client-zip";

export type ZipEntry = { name: string; date: Date; blob: Blob };

const MIN_ZIP_DATE = new Date(1980, 0, 1);

export function saveFile(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function saveZip(entries: ZipEntry[], filename: string) {
	const used = new Map<string, number>();
	const unique = (name: string) => {
		const count = (used.get(name) ?? 0) + 1;
		used.set(name, count);
		if (count === 1) return name;
		const dot = name.lastIndexOf(".");
		return dot > 0
			? `${name.slice(0, dot)} (${count})${name.slice(dot)}`
			: `${name} (${count})`;
	};

	const zip = await downloadZip(
		entries.map((e) => ({
			name: unique(e.name),
			lastModified: e.date < MIN_ZIP_DATE ? MIN_ZIP_DATE : e.date,
			input: e.blob,
		})),
	).blob();

	saveFile(zip, filename);
}
