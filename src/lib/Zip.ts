import { downloadZip } from "client-zip";

export type ZipEntry = { name: string; date: Date; blob: Blob };

// Comprime las fotos en un .zip y empieza la descarga
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
			lastModified: e.date,
			input: e.blob,
		})),
	).blob();

	const url = URL.createObjectURL(zip);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
