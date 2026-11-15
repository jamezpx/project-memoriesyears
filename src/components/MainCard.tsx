import { Card } from "@unlocalhosted/metalui";

import PhotoDateEditor from "./PhotoDateEditor";

export default function MainCard({ children }: { children?: React.ReactNode }) {
	return (
		<Card className="max-w-md mx-auto">
			<Card.Title>ODA Tool for OTD</Card.Title>
			<PhotoDateEditor />
			{children}
		</Card>
	);
}
