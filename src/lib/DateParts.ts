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
