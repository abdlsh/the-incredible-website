import { PhysicsEngine } from "../physics/PhysicsEngine.ts";
import { MaterialItem } from "./MaterialItem";

export const MaterialsPalette = () => {
	const materials = [
		{ id: 1, type: "PlankLeft", previewSrc: "/assets/PlankLeftPreview.png" },
		{ id: 2, type: "PlankRight", previewSrc: "/assets/PlankRightPreview.png" },
		{ id: 3, type: "Fan" },
		{ id: 4, type: "Bouncer" },
		{ id: 5, type: "Bumper" },
		{ id: 6, type: "Vortex" },
	];

	return (
		<div className="flex flex-col justify-between items-center w-1/4 ml-16">
			<div className="h-full w-full max-w-[300px] p-2 flex flex-col items-center justify-between">
				{materials.map((material) => <MaterialItem
					key={material.id}
					material={material}
				/>)}
			</div>
			<button
				className="w-full hover:bg-gray-200"
				style={{
					border: "12px solid",
					borderImage: "url(/assets/border.png) 30 / 1 / 0 stretch",
				}}
				onClick={() => PhysicsEngine.instance?.clear()}
			>
				clear
			</button>
			<p className="text-center text-sm mt-4">
				made by{" "}
				<a
					href="https://abdullahs.ca"
					className="text-[#F26E4C] underline hover:no-underline"
				>
					abdullah
				</a>{" "}
				:-)
			</p>
		</div>
	);
};
