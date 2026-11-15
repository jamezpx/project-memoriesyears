import Grainient from "./reactbits/Grainient";

const layer = {
	position: "fixed",
	inset: 0,
	zIndex: -1,
	pointerEvents: "none",
} as const;

export default function Background() {
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (reduceMotion) {
		return <div style={{ ...layer, background: "#18181b" }} />;
	}

	return (
		<div style={layer}>
			<Grainient
				colors={["#0c0c0f", "#3f3f46", "#a1a1aa", "#fafafa"]}
				angle={0}
				flow={0.8}
				silk={1}
				grainAmount={0.08}
				speed={0.5}
				interactive={false}
				clickSwirl={false}
				intro={false}
			/>
		</div>
	);
}
