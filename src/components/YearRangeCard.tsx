import type { ReactNode } from "react";
import { Button, Card, Select } from "@unlocalhosted/metalui";

const MIN_YEAR = 1970;
const THIS_YEAR = new Date().getFullYear();

function yearOptions(min: number, max: number) {
	return Array.from({ length: max - min + 1 }, (_, i) => {
		const year = String(max - i);
		return { value: year, label: year };
	});
}

type Props = {
	fromYear: number;
	toYear: number;
	onFromYearChange: (year: number) => void;
	onToYearChange: (year: number) => void;
	children: ReactNode;
	onReroll: () => void;
};

export default function YearRangeCard({
	fromYear,
	toYear,
	onFromYearChange,
	onToYearChange,
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
				<Select
					aria-label="From year"
					size="compact"
					value={String(fromYear)}
					options={yearOptions(MIN_YEAR, toYear)}
					onValueChange={(value) => onFromYearChange(Number(value))}
				/>
				<span className="text-sm opacity-70">To</span>
				<Select
					aria-label="To year"
					size="compact"
					value={String(toYear)}
					options={yearOptions(fromYear, THIS_YEAR)}
					onValueChange={(value) => onToYearChange(Number(value))}
				/>
				<Button size="compact" className="ml-auto" onClick={onReroll}>
					Re-roll
				</Button>
			</div>

			<div className="-mx-1 min-h-0 overflow-y-auto px-1 py-1">
				<div className="grid gap-2">{children}</div>
			</div>
		</Card>
	);
}
