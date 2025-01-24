import Matter from "matter-js";
import { useContext, useEffect, useRef } from "react";
import { useMultiDrop as useDrop } from "react-dnd-multi-backend";
import { GameContext } from "../context/GameContext";
import { PhysicsEngine } from "../physics/PhysicsEngine.ts";
import { PointsDisplay } from "./PointsDisplay";
import { SpawnPoint, SpawnPointProps } from "./SpawnPoint.tsx";

export const GameArea = () => {
	const { materials, setMaterials, setPoints } = useContext(GameContext);
	const gameAreaRef = useRef<HTMLDivElement | null>(null);

	const spawnPoints: SpawnPointProps[] = [{ x: 160, y: 20, direction: "down" }, {
		x: 40,
		y: 460,
		direction: "right",
	}];

	const targetZone = { x: 750, y: 50, width: 50, height: 50 };

	// Initialize physics engine on mount
	useEffect(() => {
		setPoints(0);
		let countingPointsTimeout: number | null = null,
			ballsCleared = 0,
			lastMaterials = stringifyMaterials(PhysicsEngine.instance?.materials);

		if (gameAreaRef.current) {
			if (!PhysicsEngine.instance) {
				PhysicsEngine.instance = new PhysicsEngine(
					gameAreaRef.current,
					spawnPoints,
					targetZone,
				);
			}
			PhysicsEngine.instance.setScoreCallback(() => {
				if (countingPointsTimeout) ballsCleared++;
				else {
					ballsCleared = 1;
					countingPointsTimeout = window.setTimeout(() => {
						const maxBalls = (5000 / 500) * 2;
						const minBalls = Math.floor((5000 / 1250) * 2);
						const maxBallClearRatio = ballsCleared / maxBalls;
						const minBallClearRatio = ballsCleared / minBalls;

						if (minBallClearRatio < 0.5) {
							console.log("too low");
							setPoints(0);
							countingPointsTimeout = null;
							ballsCleared = 0;
							return;
						}
						if (maxBallClearRatio > 3) {
							console.log("too high");
							return;
						}

						const materialPenalty = Math.max(materials.length - 6, 0);
						const pointsBase = (minBallClearRatio > 1)
							? 500 * (1 + Math.log(minBallClearRatio))
							: Math.pow(500, minBallClearRatio);
						const points = pointsBase - (materialPenalty * 50);

						setPoints((prev) => {
							if (
								points < prev
								&& lastMaterials
									=== stringifyMaterials(PhysicsEngine.instance?.materials)
							) {
								console.log("less than before; ", prev, points);
								return prev;
							}
							lastMaterials = stringifyMaterials(PhysicsEngine.instance?.materials);
							return Math.max(points, 0);
						});
						countingPointsTimeout = null;
						ballsCleared = 0;
					}, 5000);
				}
			});
		}

		return () => {
			PhysicsEngine.instance?.clear();
		};
	}, [setPoints]);

	// Handle dropping materials onto the game area
	const [[, drop]] = useDrop({
		accept: "MATERIAL",
		drop: (item: any, monitor) => {
			const offset = monitor.getClientOffset();
			const area = gameAreaRef.current?.getBoundingClientRect();
			if (offset && area) {
				const x = offset.x - area.left;
				const y = offset.y - area.top;

				const newMaterial = { id: Date.now(), type: item.type, x, y };
				setMaterials((prevMaterials) => [...prevMaterials, newMaterial]);
				PhysicsEngine.instance?.addMaterial(newMaterial);
			}
		},
		collect: (monitor) => ({ isOver: monitor.isOver() }),
	});

	return (
		<div
			ref={(node) => {
				drop(node);
				gameAreaRef.current = node;
			}}
			className="w-auto h-auto"
			style={{
				width: 824,
				height: 624,
				position: "relative",
				border: "12px solid",
				borderImage: "url(/assets/border.png) 30 / 1 / 0 stretch",
			}}
		>
			{/* Visual representation of spawn points */}
			{spawnPoints.map((spawnPoint) => (
				<SpawnPoint
					key={spawnPoint.x + spawnPoint.y + spawnPoint.direction}
					{...spawnPoint}
				/>
			))}

			{/* Points Display */}
			<PointsDisplay />
		</div>
	);
};

function stringifyMaterials(materials: Matter.Body[] | undefined) {
	if (!materials) {
		console.log("no materials");
		return null;
	}
	return JSON.stringify(
		materials.map((material) => ({
			id: material.id,
			type: material.label,
			x: material.position.x,
			y: material.position.y,
		})),
	);
}
