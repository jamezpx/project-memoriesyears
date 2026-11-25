// Dias en un mes, el 2024 fue el año bisiesto más reciente
export function daysInMonth(month: number) {
	return new Date(2024, month + 1, 0).getDate();
}

export const monthOptions = Array.from({ length: 12 }, (_, i) => ({
	value: String(i),
	label: new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2024, i, 1)),
}));

export function dayOptions(month: number) {
	return Array.from({ length: daysInMonth(month) }, (_, i) => ({
		value: String(i + 1),
		label: String(i + 1),
	}));
}

export function yearFromSeed(seed: number, from: number, to: number) {
	return from + Math.floor(seed * (to - from + 1));
}

export function buildDate(year: number, month: number, day: number) {
	const lastDay = new Date(year, month + 1, 0).getDate();
	return new Date(year, month, Math.min(day, lastDay));
}

// La fecha nueva de las fotos: año al azar y el día / mes escogido
export function newDateFor(
	seed: number,
	fromYear: number,
	toYear: number,
	month: number,
	day: number,
	captureDate?: Date | null,
) {
	const base = buildDate(yearFromSeed(seed, fromYear, toYear), month, day);
	return new Date(
		base.getFullYear(),
		base.getMonth(),
		base.getDate(),
		captureDate ? captureDate.getHours() : 12,
		captureDate ? captureDate.getMinutes() : 0,
		captureDate ? captureDate.getSeconds() : 0,
	);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Formato EXIF: "2019:07:14 10:22:31" */
export function toExifDate(d: Date) {
	return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
