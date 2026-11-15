import { useState } from "react";
import { DropZone } from "@unlocalhosted/metalui";

export default function PhotoDateEditor() {
	const [files, setFiles] = useState<File[]>([]);
	const [notice, setNotice] = useState<string>("");

	return (
		<div className="grid gap-4">
			<p className="text-sm opacity-70">Here you can edit the date of your photos.</p>

			<DropZone
				accept=".jpg, .jpeg, .png, .heic"
				description="Drag and drop your photos here, or click to select files"
				title="Select Photos"
				onFiles={(took, refused) => {
					setFiles((all) => [...all, ...took]);
					setNotice(
						refused.length ? `${refused.length} files skipped: only JPG, JPEG, PNG, and HEIC files are supported.` : "",
					);
				}}
			/>

			{notice && <p className="text-sm opacity-70">{notice}</p>}
		</div>
	);
}
