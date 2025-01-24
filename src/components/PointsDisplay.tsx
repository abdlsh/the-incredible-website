import { useContext } from "react";
import { GameContext } from "../context/GameContext";

export const PointsDisplay = () => {
	const { points } = useContext(GameContext);

	return (
		<div className="absolute bottom-0 right-0 pointer-events-none bg-white p-4">
			<p className="font-handwritten">points: {points.toFixed(0)}</p>
		</div>
	);
};
