import { useState } from "react";
import { Card, Switcher } from "@unlocalhosted/metalui";

import PhotoDateEditor from "./PhotoDateEditor";
import PlacesGenerator from "./PlacesGenerator";
import MomentsDownloads from "./MomentsDownloads";

const SECTIONS = [
	{ value: "dates", label: "Photo Date Editor" },
	{ value: "places", label: "Places Generator", disabled: true },
	{ value: "moments", label: "Moments Downloads", disabled: true },
];

type Section = "dates" | "places" | "moments";

export default function MainCard({ children }: { children?: React.ReactNode }) {
	const [section, setSection] = useState<Section>("dates");

	return (
		<Card className="max-h-full w-full max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)]">
			{/* <Card.Title>ODA Tool for OTD</Card.Title> */}

			<div className="max-w-full overflow-x-auto">
				<Switcher
					aria-label="Section"
					options={SECTIONS}
					value={section}
					onValueChange={(v) => setSection(v as Section)}
				/>
			</div>

			<div className={section === "dates" ? "flex min-h-0 flex-col" : "hidden"}>
				<PhotoDateEditor />
			</div>

			<div className={section === "places" ? "flex min-h-0 flex-col" : "hidden"}>
				<PlacesGenerator />
			</div>

			<div className={section === "moments" ? "flex min-h-0 flex-col" : "hidden"}>
				<MomentsDownloads />
			</div>
		</Card>
	);
}
