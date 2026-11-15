import { Button, Card, DatePicker } from "@unlocalhosted/metalui";

type Props = {
	from: Date | null;
	to: Date | null;
	onFromChange: (date: Date | null) => void;
	onToChange: (date: Date | null) => void;
	onReroll: () => void;
};

export default function YearRangeCard({ from, to, onFromChange, onToChange, onReroll }: Props) {
	return (
		<Card className="shrink-0 p-3!">
			<div className="flex flex-wrap items-center gap-3">
				<span className="text-sm opacity-70">From</span>
				<DatePicker aria-label="From date" value={from} onValueChange={onFromChange} max={to ?? undefined} />
				<span className="text-sm opacity-70">To</span>
				<DatePicker aria-label="To date" value={to} onValueChange={onToChange} min={from ?? undefined} />
			</div>
		</Card>
	);
}
