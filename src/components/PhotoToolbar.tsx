import { Button, Card } from "@unlocalhosted/metalui";
import { DownloadIcon, TrashIcon, GroupIcon } from "@unlocalhosted/metalui/icons";
import { LifeSubscriptionIcon, LifeDeadlineIcon } from "@unlocalhosted/metalui/icons/life";

type Props = {
	canDownload: boolean;
	busy: { done: number; total: number; mode: "zip" | "each" } | null;
	onClear: () => void;
	onReroll: () => void;
	onDownload: () => void;
	onDownloadEach: () => void;
};

export default function PhotoToolbar({
	canDownload,
	busy,
	onClear,
	onReroll,
	onDownload,
	onDownloadEach,
}: Props) {
	return (
		<Card.Footer className="justify-center">
			<Button size="compact" disabled={busy !== null} onClick={onClear}>
				<TrashIcon size={16} />
				Clear
			</Button>

			<Button size="compact" disabled={busy !== null} onClick={onReroll}>
				<LifeSubscriptionIcon size={16} />
				Reroll
			</Button>

			<Button size="compact" disabled={!canDownload || busy !== null} onClick={onDownload}>
				{busy?.mode === "zip" ? <LifeDeadlineIcon size={16} /> : <GroupIcon size={16} />}

				{busy?.mode === "zip" ? `Writing ${busy.done}/${busy.total}…` : "Download ZIP"}
			</Button>

			<Button
				size="compact"
				disabled={!canDownload || busy !== null}
				onClick={onDownloadEach}
			>
				{busy?.mode === "each" ? (
					<LifeDeadlineIcon size={16} />
				) : (
					<DownloadIcon size={16} />
				)}

				{busy?.mode === "each" ? `Saving ${busy.done}/${busy.total}…` : "Download each"}
			</Button>
		</Card.Footer>
	);
}
