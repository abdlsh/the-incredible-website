export interface TargetZoneProps {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const TargetZone = ({ x, y, width, height }: TargetZoneProps) => {
	return (
		<div
			className="absolute bg-green-500 border border-black"
			style={{ left: x, top: y, width, height }}
		>
		</div>
	);
};
