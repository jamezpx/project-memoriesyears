import { useState } from "react";
import { Attachment, Button, Dialog, DropZone, Table } from "@unlocalhosted/metalui";
import YearRangeCard from "./YearRangeCard";
import { readCaptureDate } from "../lib/ReadDate";
import { daysInMonth, buildDate, yearFromSeed, newDateFor } from "../lib/DateParts";
import { writeCaptureDate } from "../lib/WriteDate";
import { saveFile, saveZip, type ZipEntry } from "../lib/Zip";
import PhotoToolbar from "./PhotoToolbar";

const newDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
type Item = { id: string; file: File; seed: number; captureDate?: Date | null; error?: string };
const THIS_YEAR = new Date().getFullYear();
const dateFormat = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
});

function yearsAgo(n: number) {
	const now = new Date();
	const year = now.getFullYear() - n;
	const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
	return new Date(year, now.getMonth(), Math.min(now.getDate(), lastDay));
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
	const [fromYear, setFromYear] = useState(THIS_YEAR - 10);
	const [toYear, setToYear] = useState(THIS_YEAR - 1);
	const [month, setMonth] = useState(() => new Date().getMonth());
	const [day, setDay] = useState(() => new Date().getDate());
	const [roll, setRoll] = useState<number>(0);
	const [busy, setBusy] = useState<{ done: number; total: number; mode: "zip" | "each" } | null>(
		null,
	);
	const [helpModalOpened, setHelpModalOpened] = useState<boolean>(true);

	const canDownload =
		items.length > 0 && !items.some((i) => i.captureDate === undefined && !i.error);

	const run = async (mode: "zip" | "each") => {
		const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
		const ZIP_LIMIT = (memory <= 4 ? 12 : 100) * 1024 * 1024;

		const total = items.length;
		const failed: string[] = [];
		let group: ZipEntry[] = [];
		let groupBytes = 0;
		let part = 0;
		setBusy({ done: 0, total, mode });

		try {
			for (const [index, item] of items.entries()) {
				const date = newDateFor(item.seed, fromYear, toYear, month, day, item.captureDate);

				try {
					const data = await writeCaptureDate(item.file, date);
					if (mode === "each") {
						void saveFile(
							new Blob([data as BlobPart], { type: item.file.type }),
							item.file.name,
							5_000,
						);
						await new Promise((resolve) => setTimeout(resolve, 400));
					} else {
						group.push({ name: item.file.name, date, data });
						groupBytes += data.byteLength;
					}
				} catch (e) {
					console.error("writeCaptureDate failed", item.file.name, e);
					failed.push(item.file.name);
				}
				setBusy({ done: index + 1, total, mode });
				await new Promise((resolve) => setTimeout(resolve, 0));

				if (mode === "zip" && groupBytes >= ZIP_LIMIT) {
					part++;
					await saveZip(group, `photos-${part}.zip`);
					group = [];
					groupBytes = 0;
				}
			}

			if (mode === "zip" && group.length) {
				await saveZip(group, part === 0 ? "photos.zip" : `photos-${part + 1}.zip`);
			}

			const messages: string[] = [];
			if (part > 0) messages.push(`Downloaded as ${part + 1} ZIP files.`);
			if (failed.length) {
				messages.push(
					`${failed.length} photo(s) couldn't be updated: ${failed.join(", ")}`,
				);
			}
			setNotice(messages.join(" "));
		} catch (e) {
			console.error("download failed", e);
			const reason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
			setNotice(`Couldn't finish the download (${reason}).`);
		} finally {
			setBusy(null);
		}
	};
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

	const changeMonth = (next: number) => {
		setMonth(next);
		setDay((d) => Math.min(d, daysInMonth(next)));
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
					const added = took.map((file) => ({
						id: crypto.randomUUID(),
						file,
						seed: Math.random(),
					}));

					setItems((all) => [...all, ...added]);

					added.forEach(({ id, file }) => void readDate(id, file));

					setNotice(
						refused.length
							? `${refused.length} files skipped: only JPG, JPEG, PNG, and HEIC files are supported.`
							: "",
					);
				}}
			/>

			{notice && <p className="shrink-0 text-sm opacity-70">{notice}</p>}

			<Dialog open={helpModalOpened} onOpenChange={setHelpModalOpened}>
				<Dialog.Popup>
					<Dialog.Title>How the Photo Date Editor works</Dialog.Title>

					<p className="test-sm opacity-80">
						Upload some photos here, the tool will allow you to change the captured date
						of the photo, this way it is easier to generate OTDs (On This Day) from
						previous years.
					</p>

					<p className="test-sm opacity-80">
						If you're on iOS, select <Button>Download ZIP</Button>
					</p>

					<p className="test-sm opacity-80">
						If you're on Android, select <Button>Download Each</Button>
					</p>

					<p className="test-sm opacity-80 font-bold">
						Use this tool preferably on a desktop computer
					</p>

					<p className="test-sm opacity-80">
						Upload the downloaded files to the account you're using.
					</p>

					<p className="text-xs opacity-60">
						All the photos are processed on the client-side. No photos are uploaded or
						transferred to this or other server. This tool is open source
					</p>

					<Dialog.Actions>
						<Button
							nativeButton={false}
							render={
								<a
									href="https://github.com/jamezpx/project-memoriesyears"
									target="_blank"
									rel="noopener noreferrer"
								/>
							}
						>
							View source code
						</Button>
						<Button onClick={() => setHelpModalOpened(false)}>Close</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog>

			{hasFiles && (
				<>
					<YearRangeCard
						fromYear={fromYear}
						toYear={toYear}
						month={month}
						day={day}
						onFromYearChange={setFromYear}
						onToYearChange={setToYear}
						onMonthChange={changeMonth}
						onDayChange={setDay}
					>
						<Table
							caption="Photos"
							captionHidden
							className="min-w-136 table-fixed [&_th:nth-child(2)]:w-44 [&_th:nth-child(3)]:w-36"
							rows={items}
							rowKey={(item) => item.id}
							columns={[
								{
									key: "photo",
									header: "Photo",
									sortBy: (item) => item.file.name.toLowerCase(),
									cell: (item) => (
										<Attachment
											name={item.file.name}
											size={item.file.size}
											error={item.error}
											onRetry={() => process(item.id)}
											className="[--mu-r-attachment-remove-glyph:18px] m-1"
											onRemove={() =>
												setItems((all) =>
													all.filter((i) => i.id !== item.id),
												)
											}
										/>
									),
								},
								{
									key: "captured",
									header: "Capture date",
									sortBy: (item) => item.captureDate?.getTime() ?? 0,
									cell: (item) => (
										<CaptureDate
											date={item.captureDate}
											failed={!!item.error}
										/>
									),
								},
								{
									key: "new",
									header: "New date",
									sortBy: (item) =>
										newDateFor(
											item.seed,
											fromYear,
											toYear,
											month,
											day,
											item.captureDate,
										).getTime(),
									cell: (item) =>
										dateFormat.format(
											newDateFor(
												item.seed,
												fromYear,
												toYear,
												month,
												day,
												item.captureDate,
											),
										),
								},
							]}
						/>
					</YearRangeCard>

					<PhotoToolbar
						canDownload={canDownload}
						busy={busy}
						onClear={() => {
							setItems([]);
							setNotice("");
						}}
						onReroll={() =>
							setItems((all) => all.map((item) => ({ ...item, seed: Math.random() })))
						}
						onDownload={() => run("zip")}
						onDownloadEach={() => run("each")}
						onHelpClicked={() => setHelpModalOpened(true)}
					/>
				</>
			)}
		</div>
	);
}
