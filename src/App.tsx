import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { DndProvider } from "react-dnd-multi-backend";
import { GameProvider } from "./context/GameContext";

import { ControlPanel } from "./components/ControlPanel.tsx";
import { GameArea } from "./components/GameArea";
import { MaterialsPalette } from "./components/MaterialsPalette";

export default function App() {
	return (
		<GameProvider>
			<DndProvider options={HTML5toTouch}>
				<div className="w-full h-screen flex items-center justify-center">
					<div className="flex flex-col">
						<ControlPanel />
						<div className="flex h-full max-h-[600px]">
							<GameArea />
							<MaterialsPalette />
						</div>
					</div>
				</div>
			</DndProvider>
		</GameProvider>
	);
}
