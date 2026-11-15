import { useState } from "react";
import { Card, Switcher } from "@unlocalhosted/metalui";

import PhotoDateEditor from "./PhotoDateEditor";
import PlacesGenerator from "./PlacesGenerator";
import MomentsDownloads from "./MomentsDownloads";

const SECTIONS = [
	{ value: "dates", label: "Photo Date Editor" },
	{ value: "places", label: "Places Generator" },
	{ value: "moments", label: "Moments Downloads" },
];

type Section = "dates" | "places" | "moments";

export default function MainCard({ children }: { children?: React.ReactNode }) {
	const [section, setSection] = useState<Section>("dates");

	return (
		<Card className="w-full max-w-2xl">
			{/* <Card.Title>ODA Tool for OTD</Card.Title> */}

			<div className="max-w-full overflow-x-auto">
				<Switcher
					aria-label="Section"
					options={SECTIONS}
					value={section}
					onValueChange={(v) => setSection(v as Section)}
				/>
			</div>
		</Card>
	);
}
