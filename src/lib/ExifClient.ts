import { parseMetadata, writeMetadata } from "@uswriting/exiftool";

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
	const run = queue.then(task);
	queue = run.catch(() => undefined);
	return run;
}

export function readTags(file: File, args: string[]) {
	return enqueue(async () => {
		const result = await parseMetadata(file, { args });
		if (!result.success) throw new Error(result.error || "Could not read the metadata");
		const parsed = JSON.parse(result.data) as Record<string, unknown>[];
		return parsed[0] ?? {};
	});
}

export function writeTags(file: File, tags: Record<string, string>) {
	return enqueue(async () => {
		const result = await writeMetadata(file, tags);
		if (!result.success) throw new Error(result.error || "Could not write the metadata");
		return new Uint8Array(result.data);
	});
}
