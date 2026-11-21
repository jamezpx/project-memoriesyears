import type { ReactNode } from "react";
import { Button, Card, DatePicker } from "@unlocalhosted/metalui";

type Props = {
	from: Date | null;
	to: Date | null;
	children: ReactNode;
	onFromChange: (date: Date | null) => void;
	onToChange: (date: Date | null) => void;
	onReroll: () => void;
};

export default function YearRangeCard({
	from,
	to,
	onFromChange,
	onToChange,
	onReroll,
	children,
}: Props) {
	return (
		<Card
			aria-label="Year range and photos"
			className="min-h-0 grid-rows-[auto_minmax(0,1fr)] p-3!"
		>
			<div className="flex flex-wrap items-center gap-3">
				<span className="text-sm opacity-70">From</span>
				<DatePicker
					aria-label="From date"
					value={from}
					onValueChange={onFromChange}
					max={to ?? undefined}
				/>
				<span className="text-sm opacity-70">To</span>
				<div>
					<p>Hola mundo Prueb</p>
				</div>
				<DatePicker
					aria-label="To date"
					value={to}
					onValueChange={onToChange}
					min={from ?? undefined}
				/>
				<Button size="compact" className="ml-auto" disabled={!from || !to} onClick={onReroll}>
					Re-roll
				</Button>
			</div>

			<div className="-mx-1 min-h-0 overflow-y-auto px-1 py-1">
				<div className="grid gap-2">{children}</div>
			</div>
		</Card>
	);
}
