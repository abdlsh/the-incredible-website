import React, { createContext, useState } from "react";

export interface Material {
	id: number;
	type: keyof typeof import("../components/materials");
	x: number;
	y: number;
}

interface GameContextProps {
	materials: Material[];
	setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
	points: number;
	setPoints: React.Dispatch<React.SetStateAction<number>>;
}

export const GameContext = createContext<GameContextProps>({} as GameContextProps);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
	const [materials, setMaterials] = useState<Material[]>([]);
	const [points, setPoints] = useState(0);

	return (
		<GameContext.Provider value={{ materials, setMaterials, points, setPoints }}>
			{children}
		</GameContext.Provider>
	);
};
