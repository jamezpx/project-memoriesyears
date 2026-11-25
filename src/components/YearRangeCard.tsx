import type { ReactNode } from "react";
import { Button, Card, Select } from "@unlocalhosted/metalui";
import { dayOptions, monthOptions } from "../lib/DateParts";
import { DownloadIcon, TrashIcon } from "@unlocalhosted/metalui/icons";
import { LifeSubscriptionIcon, LifeDeadlineIcon } from "@unlocalhosted/metalui/icons/life";

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
	onReroll: () => void;
	onClear: () => void;
	canDownload: boolean;
	busy: { done: number; total: number; mode: "zip" | "each" } | null;
	onDownload: () => void;
	onDownloadEach: () => void;
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
	onClear,
	onReroll,
	canDownload,
	busy,
	onDownload,
	onDownloadEach,
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

				<div className="mr-auto flex flex-wrap items-center gap-2">
					<Button size="compact" onClick={onClear}>
						<TrashIcon size={20} />
						Clear selection
					</Button>

					<Button size="compact" onClick={onReroll}>
						<LifeSubscriptionIcon size={12} />
						Re-roll
					</Button>

					<Button
						size="compact"
						disabled={!canDownload || busy !== null}
						onClick={onDownload}
					>
						{busy?.mode === "zip"
							? `Writing ${busy.done}/${busy.total}…`
							: "Download ZIP"}
					</Button>

					<Button
						size="compact"
						disabled={!canDownload || busy !== null}
						onClick={onDownloadEach}
					>
						{busy?.mode === "each"
							? `Saving ${busy.done}/${busy.total}…`
							: "Download each"}
					</Button>
				</div>
			</div>

			<div className="-mx-1 min-h-0 overflow-y-auto px-1 py-1">
				<div className="grid gap-2">{children}</div>
			</div>
		</Card>
	);
}
