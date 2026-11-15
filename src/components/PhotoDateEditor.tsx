import { useState } from "react";
import { Attachment, DropZone } from "@unlocalhosted/metalui";

type Item = { id: string; file: File };

export default function PhotoDateEditor() {
	const [items, setItems] = useState<Item[]>([]);
	const [notice, setNotice] = useState<string>("");

	return (
		<div className="grid gap-4">
			<p className="text-sm opacity-70">Here you can edit the date of your photos.</p>

			<DropZone
				accept=".jpg, .jpeg, .png, .heic"
				description="Drag and drop your photos here, or click to select files"
				title="Select Photos"
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
					{items.map(({ id, file }) => (
						<Attachment
							key={id}
							name={file.name}
							size={file.size}
							onRemove={() => setItems((all) => all.filter((item) => item.id !== id))}
						/>
					))}
				</div>
			)}
		</div>
	);
}
