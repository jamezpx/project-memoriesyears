import { useState } from "react";
import { Attachment, DropZone } from "@unlocalhosted/metalui";

type Item = { id: string; file: File; error?: string };

export default function PhotoDateEditor() {
	const [items, setItems] = useState<Item[]>([]);
	const [notice, setNotice] = useState<string>("");
	const hasFiles = items.length > 0;

	const process = async (id: string) => {
		const item = items.find((i) => i.id === id);
		if (!item) return;
		try {
			//await readExifDate(item.file); // your existing logic
			setItems((all) => all.map((i) => (i.id === id ? { ...i, error: undefined } : i)));
		} catch {
			setItems((all) => all.map((i) => (i.id === id ? { ...i, error: "Couldn't read the date" } : i)));
		}
	};

	return (
		<div className="grid gap-4">
			{/* <p className="text-sm opacity-70">Here you can edit the date of your photos.</p> */}

			<DropZone
				compact={hasFiles}
				accept=".jpg, .jpeg, .png, .heic"
				description={hasFiles ? "Drop more photos here" : "Drop photos here or click to select"}
				title={hasFiles ? "Add more photos" : "Select photos"}
				onFiles={(took, refused) => {
					setItems((all) => [...all, ...took.map((file) => ({ id: crypto.randomUUID(), file }))]);
					setNotice(
						refused.length ? `${refused.length} files skipped: only JPG, JPEG, PNG, and HEIC files are supported.` : "",
					);
				}}
			/>

			{notice && <p className="text-sm opacity-70">{notice}</p>}

			{items.length > 0 && (
				<div className="grid gap-2">
					{items.map(({ id, file, error }) => (
						<Attachment
							key={id}
							name={file.name}
							size={file.size}
							error={error}
							onRetry={() => process(id)}
							className="[--mu-r-attachment-remove-glyph:18px]"
							onRemove={() => setItems((all) => all.filter((item) => item.id !== id))}
						/>
					))}
				</div>
			)}
		</div>
	);
}
