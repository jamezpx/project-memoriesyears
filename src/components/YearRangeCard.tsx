import type { ReactNode } from "react";
import { Card, Select } from "@unlocalhosted/metalui";
import { dayOptions, monthOptions } from "../lib/DateParts";

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
	month: number;
	day: number;
	onFromYearChange: (year: number) => void;
	onToYearChange: (year: number) => void;
	onMonthChange: (month: number) => void;
	onDayChange: (day: number) => void;
	children: ReactNode;
};

export default function YearRangeCard({
	fromYear,
	toYear,
	month,
	day,
	onFromYearChange,
	onToYearChange,
	onMonthChange,
	onDayChange,
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
					className="w-fit! min-w-0!"
					value={String(fromYear)}
					options={yearOptions(MIN_YEAR, toYear)}
					onValueChange={(value) => onFromYearChange(Number(value))}
				/>

				<span className="text-sm opacity-70">To</span>
				<Select
					aria-label="To year"
					size="compact"
					className="w-fit! min-w-0!"
					value={String(toYear)}
					options={yearOptions(fromYear, THIS_YEAR)}
					onValueChange={(value) => onToYearChange(Number(value))}
				/>

				<span className="text-sm opacity-70">On</span>
				<Select
					aria-label="Day"
					size="compact"
					className="w-fit! min-w-0!"
					value={String(day)}
					options={dayOptions(month)}
					onValueChange={(value) => onDayChange(Number(value))}
				/>
				<Select
					aria-label="Month"
					size="compact"
					value={String(month)}
					options={monthOptions}
					onValueChange={(value) => onMonthChange(Number(value))}
				/>
			</div>

			<div className="-mx-1 min-h-0 overflow-y-auto px-1 py-1">
				<div className="grid gap-2">{children}</div>
			</div>
		</Card>
	);
}
