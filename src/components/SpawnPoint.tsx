export interface SpawnPointProps {
	x: number;
	y: number;
	direction: "up" | "down" | "left" | "right";
}

export const SpawnPoint = ({ x, y, direction }: SpawnPointProps) => {
	let arrow;
	switch (direction) {
		case "up":
			arrow = "▲";
			break;
		case "down":
			arrow = "▼";
			break;
		case "left":
			arrow = "◀";
			break;
		case "right":
			arrow = "▶";
			break;
		default:
			arrow = "▼";
	}

	return (
		<div className="absolute text-blue-500 text-4xl" style={{ left: x - 15, top: y - 20 }}>
			{arrow}
		</div>
	);
};
