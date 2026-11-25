import { useState } from "react";
import { Attachment, DropZone } from "@unlocalhosted/metalui";
import YearRangeCard from "./YearRangeCard";
import { readCaptureDate } from "../lib/ReadDate";

type Item = { id: string; file: File; captureDate?: Date | null; error?: string };

const dateFormat = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});

function yearsAgo(n: number) {
	const now = new Date();
	const year = now.getFullYear() - n;
	const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
	return new Date(year, now.getMonth(), Math.min(now.getDate(), lastDay));
}

// Corre el worker sobre la `list`, por mucho con el `limit` al tiempo
async function runPool<T>(list: T[], limit: number, worker: (item: T) => Promise<void>) {
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, list.length) }, async () => {
			while (next < list.length) await worker(list[next++]);
		}),
	);
}

function CaptureDate({ date, failed }: { date?: Date | null; failed: boolean }) {
	if (failed) return <span className="opacity-70">-</span>;

	if (date === undefined) return <span className="opacity-70">Reading...</span>;

	if (date === null) return <span className="opacity-70">No date</span>;

	return <span>{dateFormat.format(date)}</span>;
}

export default function PhotoDateEditor() {
	const [items, setItems] = useState<Item[]>([]);
	const [notice, setNotice] = useState<string>("");
	const [from, setFrom] = useState<Date | null>(yearsAgo(10));
	const [to, setTo] = useState<Date | null>(yearsAgo(1));
	const [roll, setRoll] = useState<number>(0);

	const hasFiles = items.length > 0;

	const patch = (id: string, changes: Partial<Item>) =>
		setItems((all) => all.map((item) => (item.id === id ? { ...item, ...changes } : item)));

	const readDate = async (id: string, file: File) => {
		patch(id, { captureDate: undefined, error: undefined });

		try {
			patch(id, { captureDate: await readCaptureDate(file) });
		} catch {
			patch(id, { error: "Couldn't read the date" });
		}
	};

	const process = (id: string) => {
		const item = items.find((i) => i.id === id);
		if (item) void readDate(id, item.file);
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<DropZone
				className="shrink-0"
				compact={hasFiles}
				accept=".jpg, .jpeg, .png, .heic"
				description={
					hasFiles ? "Drop more photos here" : "Drop photos here or click to select"
				}
				title={hasFiles ? "Add more photos" : "Select photos"}
				onFiles={(took, refused) => {
					const added = took.map((file) => ({ id: crypto.randomUUID(), file }));

					setItems((all) => [...all, ...added]);

					void runPool(added, 3, (item) => readDate(item.id, item.file));

					setNotice(
						refused.length
							? `${refused.length} files skipped: only JPG, JPEG, PNG, and HEIC files are supported.`
							: "",
					);
				}}
			/>

			{notice && <p className="shrink-0 text-sm opacity-70">{notice}</p>}

			{hasFiles && (
				<YearRangeCard
					from={from}
					to={to}
					onFromChange={setFrom}
					onToChange={setTo}
					onReroll={() => setRoll((r) => r + 1)}
				>
					<table className="w-full min-w-lg table-fixed border-separate border-spacing-y-2">
						<colgroup>
							<col />
							<col className="w-36" />
							<col className="w-36" />
						</colgroup>

						<thead>
							<tr className="text-left text-xs opacity-70">
								<th scope="col" className="px-1 font-normal">
									Photo
								</th>
								<th scope="col" className="px-3 font-normal">
									Capture date
								</th>
								<th scope="col" className="px-3 font-normal">
									New date
								</th>
							</tr>
						</thead>

						<tbody>
							{items.map(({ id, file, error, captureDate }) => (
								<tr key={id}>
									<td className="min-w-0 p-0 align-middle">
										<Attachment
											name={file.name}
											size={file.size}
											error={error}
											onRetry={() => process(id)}
											className="[--mu-r-attachment-remove-glyph:18px]"
											onRemove={() =>
												setItems((all) =>
													all.filter((item) => item.id !== id),
												)
											}
										/>
									</td>
									<td className="px-3 align-middle text-sm opacity-70">
										<CaptureDate date={captureDate} failed={!!error} />
									</td>
									<td className="px-3 align-middle text-sm opacity-70">-</td>
								</tr>
							))}
						</tbody>
					</table>
				</YearRangeCard>
			)}
		</div>
	);
}
