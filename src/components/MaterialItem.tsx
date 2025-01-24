import { useMultiDrag as useDrag } from "react-dnd-multi-backend";

interface MaterialItemProps {
	material: { id: number; type: string; previewSrc?: string };
}

export const MaterialItem = ({ material }: MaterialItemProps) => {
	const [[{ isDragging }, drag]] = useDrag({
		type: "MATERIAL",
		item: { type: material.type },
		collect: (monitor) => ({ isDragging: monitor.isDragging() }),
	});

	const imageSrc = material.previewSrc
		?? `/assets/${material.type.replace(/(Left|Right)/, "")}.png`;

	return (
		<div
			ref={drag}
			className="my-2 p-2 cursor-move mx-auto text-center flex items-center justify-center"
			style={{ opacity: isDragging ? 0.5 : 1 }}
		>
			<img src={imageSrc} alt={material.type} style={{ maxWidth: "100%" }} />
		</div>
	);
};
