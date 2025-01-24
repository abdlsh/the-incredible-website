import Matter from "matter-js";
import { SpawnPointProps } from "../components/SpawnPoint";
import { TargetZoneProps } from "../components/TargetZone.tsx";

export class PhysicsEngine {
	private engine!: Matter.Engine;
	private world!: Matter.World;
	private render!: Matter.Render;
	private runner!: Matter.Runner;

	private ballSpawnInterval: any = null;
	public materials: Matter.Body[] = [];
	private scoreCallback: (() => void) | null = null;

	private fans: Matter.Body[] = [];
	private vortices: Matter.Body[] = [];
	private balls: Matter.Body[] = [];

	static instance: PhysicsEngine | null = null;

	constructor(
		private renderElement: HTMLElement,
		private spawnPoints: SpawnPointProps[],
		private targetZone: TargetZoneProps,
		private canvas?: HTMLCanvasElement,
	) {
		if (PhysicsEngine.instance) {
			return;
		}
		this.engine = Matter.Engine.create();
		this.world = this.engine.world;

		this.render = Matter.Render.create({
			element: this.renderElement,
			canvas: this.canvas,
			engine: this.engine,
			options: { width: 800, height: 600, wireframes: false, background: "transparent" },
		});

		this.canvas = this.render.canvas;

		Matter.Render.run(this.render);

		this.runner = Matter.Runner.create();
		Matter.Runner.run(this.runner, this.engine);

		this.createWalls();

		this.startSpawningBalls();

		this.addCollisionEvents();

		this.addMouseControl();

		this.createTargetZone(targetZone);

		Matter.Events.on(this.engine, "beforeUpdate", () => {
			this.applyFanForces();
			this.applyVortexForces();

			this.materials.forEach((body) => {
				if (body.plugin.isBeingDragged) {
					Matter.Body.setVelocity(body, { x: 0, y: 0 });
				}
			});
		});
	}

	private applyFanForces() {
		this.fans.forEach((fan) => {
			this.balls.forEach((ball) => {
				// Only apply if ball is in front of the fan
				const distanceX = ball.position.x - fan.position.x;
				const distanceY = ball.position.y - fan.position.y;

				if (distanceX > 0 && Math.abs(distanceY) < 50 && distanceX < 100) {
					// Apply force to the right
					Matter.Body.applyForce(ball, ball.position, { x: 0.00075, y: 0 });
				}
			});
		});
	}

	private applyVortexForces() {
		this.vortices.forEach((vortex) => {
			if (vortex.plugin.isBeingDragged) return;
			this.balls.forEach((ball) => {
				const dx = vortex.position.x - ball.position.x;
				const dy = vortex.position.y - ball.position.y;
				const distanceSquared = dx * dx + dy * dy;

				if (distanceSquared < 200 * 200) {
					const scale = (distanceSquared - 25 * 25) / (200 * 200 - 10 * 10);
					const forceMagnitude = 0.0005 * Math.max(0, scale);
					const angle = Math.atan2(dy, dx);
					const force = {
						x: forceMagnitude * Math.cos(angle),
						y: forceMagnitude * Math.sin(angle) * 2,
					};
					Matter.Body.applyForce(ball, ball.position, force);
				}
			});
		});
	}

	private createWalls() {
		const walls = [
			Matter.Bodies.rectangle(400, -20, 800, 50, { isStatic: true, render: { opacity: 0 } }), // Top
			Matter.Bodies.rectangle(400, 620, 800, 50, { isStatic: true, render: { opacity: 0 } }), // Bottom
			Matter.Bodies.rectangle(820, 300, 50, 600, { isStatic: true, render: { opacity: 0 } }), // Right
			Matter.Bodies.rectangle(-20, 300, 50, 600, { isStatic: true, render: { opacity: 0 } }), // Left
		];
		Matter.World.add(this.world, walls);
	}

	private startSpawningBalls() {
		const spawnBall = (spawnPoint: SpawnPointProps) => {
			const { x, y, direction } = spawnPoint;
			const ball = Matter.Bodies.circle(x, y, 10, {
				restitution: 0.5,
				label: "Ball",
				friction: 0.001,
				frictionAir: 0.0005,
				render: { fillStyle: "black" },
			});

			// Set initial velocity based on direction
			const speed = 5;
			let velocity = { x: 0, y: 0 };

			switch (direction) {
				case "up":
					velocity.y = -speed;
					break;
				case "down":
					velocity.y = speed;
					break;
				case "left":
					velocity.x = -speed;
					break;
				case "right":
					velocity.x = speed;
					break;
			}

			Matter.Body.setVelocity(ball, velocity);
			Matter.World.add(this.world, ball);
			this.balls.push(ball);

			// Remove the ball after 20 seconds
			setTimeout(() => {
				Matter.World.remove(this.world, ball);
				this.balls = this.balls.filter((ball) => ball.id !== ball.id);
			}, 15000);
		};

		this.spawnPoints.forEach(function queueSpawnBall(spawnPoint) {
			setTimeout(() => {
				spawnBall(spawnPoint);
				queueSpawnBall(spawnPoint);
			}, 1000 * (Math.random() * 0.75 + 0.5));
		});
	}

	private addCollisionEvents() {
		Matter.Events.on(this.engine, "collisionStart", (event) => {
			const pairs = event.pairs;
			pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;
				const [ball, other] = bodyA.label === "Ball" ? [bodyA, bodyB] : [bodyB, bodyA];
				if (pairEquals([bodyA.label, bodyB.label], ["Ball", "TargetZone"])) {
					this.incrementScore();
					Matter.World.remove(this.world, ball);
				} else if (pairEquals([bodyA.label, bodyB.label], ["Ball", "BouncerTop"])) {
					Matter.Body.setVelocity(ball, {
						x: ball.velocity.x,
						y: Math.max(Math.abs(ball.velocity.y) * 2, 30),
					});
				} else if (pairEquals([bodyA.label, bodyB.label], ["Ball", "BouncerBottom"])) {
					Matter.Body.setVelocity(ball, {
						x: ball.velocity.x,
						y: Math.min(Math.abs(ball.velocity.y) * -1.5, -10),
					});
				} else if (pairEquals([bodyA.label, bodyB.label], ["Ball", "Bumper"])) {
					if (ball.position.x < other.position.x || ball.position.y > other.position.y) {
						return;
					}

					Matter.Body.setVelocity(ball, {
						x: Math.max(Math.abs(ball.velocity.x) * 1.1, 10),
						y: Math.min(Math.abs(ball.velocity.y) * -1.1, -5),
					});
				}
			});
		});
	}

	private addMouseControl() {
		const mouse = Matter.Mouse.create(this.render.canvas);
		const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
			mouse: mouse,
			constraint: { stiffness: 0.2, render: { visible: false } },
		});

		// Ensure mouse interacts with all bodies, including static ones
		mouseConstraint.collisionFilter.mask = 0xFFFFFFFF;

		// Variables to track dragging
		let draggedBody: Matter.Body | null = null;
		let offset: Matter.Vector | null = null;

		Matter.Events.on(mouseConstraint, "mousedown", (event) => {
			const mousePosition = event.mouse.position;

			// Get all bodies under the mouse position
			const bodies = Matter.Composite.allBodies(this.engine.world);
			const possibleBodies = Matter.Query.point(bodies, mousePosition);

			// Find the topmost body that is draggable
			for (let i = possibleBodies.length - 1; i >= 0; i--) {
				const body = possibleBodies[i];
				if (this.isDraggable(body)) {
					draggedBody = body;
					offset = {
						x: body.position.x - mousePosition.x,
						y: body.position.y - mousePosition.y,
					};
					break;
				}
			}
		});

		Matter.Events.on(mouseConstraint, "mousemove", (event) => {
			if (draggedBody && offset) {
				const mousePosition = event.mouse.position;
				const newPosition = {
					x: mousePosition.x + offset.x,
					y: mousePosition.y + offset.y,
				};
				Matter.Body.setPosition(draggedBody, newPosition);
			}
		});

		Matter.Events.on(mouseConstraint, "mouseup", () => {
			draggedBody = null;
			offset = null;
		});

		Matter.World.add(this.world, mouseConstraint);
		this.render.mouse = mouse;
	}

	public addMaterial(material: any) {
		let body: Matter.Body;

		switch (material.type) {
			case "PlankLeft":
			case "PlankRight":
				const angleDegrees = material.type === "PlankLeft" ? -20 : 20;
				const angleRadians = degToRad(angleDegrees);
				body = Matter.Bodies.rectangle(material.x, material.y, 112.5, 12.21, {
					isStatic: true,
					angle: angleRadians,
					label: material.type,
					render: { sprite: { texture: "/assets/Plank.png", xScale: 1, yScale: 1 } },
				});
				break;

			case "Fan":
				body = Matter.Bodies.rectangle(material.x, material.y, 45, 72.14, {
					isStatic: true,
					isSensor: true,
					label: "Fan",
					render: { sprite: { texture: "/assets/Fan.png", xScale: 1, yScale: 1 } },
				});
				this.fans.push(body);
				break;

			case "Bouncer":
				const bouncerWidth = 74.31;
				const bouncerHeight = 35.57;
				const x = material.x;
				const y = material.y;

				// Main rendering body (no collision)
				const mainBody = Matter.Bodies.rectangle(x, y, bouncerWidth, bouncerHeight, {
					isStatic: true,
					label: "Bouncer",
					slop: 0.1,
					render: { sprite: { texture: "/assets/Bouncer.png", xScale: 1, yScale: 1 } },
					collisionFilter: {
						group: -1, // To prevent collision with its own parts
					},
				});

				// Collision bodies
				const top = Matter.Bodies.rectangle(
					x,
					y - bouncerHeight / 2 + 5,
					bouncerWidth - 10,
					10,
					{
						isStatic: true,
						label: "BouncerTop",
						render: { visible: false },
						collisionFilter: { group: -1 },
					},
				);

				const bottom = Matter.Bodies.rectangle(
					x,
					y + bouncerHeight / 2 - 5,
					bouncerWidth - 10,
					10,
					{
						isStatic: true,
						label: "BouncerBottom",
						render: { visible: false },
						collisionFilter: { group: -1 },
					},
				);

				const sidesOptions = {
					isStatic: true,
					label: "BouncerSide",
					restitution: 0, // No bounce
					render: { visible: false },
					collisionFilter: { group: -1 },
				};

				const leftSide = Matter.Bodies.rectangle(
					x - bouncerWidth / 2 + 5,
					y,
					10,
					bouncerHeight - 20,
					sidesOptions,
				);
				const rightSide = Matter.Bodies.rectangle(
					x + bouncerWidth / 2 - 5,
					y,
					10,
					bouncerHeight - 20,
					sidesOptions,
				);

				body = Matter.Body.create({
					parts: [mainBody, top, bottom, leftSide, rightSide],
					isStatic: true,
					label: "BouncerComposite",
				});

				break;

			case "Bumper":
				const width = 41.19;
				const height = 69.62;

				// Define the triangle's vertices relative to its center
				const vertices = [
					{ x: 0, y: -height / 2 }, // Top vertex
					{ x: -width / 2, y: height / 2 }, // Bottom-left vertex
					{ x: width / 2, y: height / 2 }, // Bottom-right vertex
				];

				body = Matter.Bodies.fromVertices(
					material.x,
					material.y,
					[vertices],
					{
						isStatic: true,
						label: "Bumper",
						restitution: 3,
						render: { sprite: { texture: "/assets/Bumper.png", xScale: 1, yScale: 1 } },
					},
					true, // Automatically compute convex hulls for concave polygons
				);

				break;

			case "Vortex":
				body = Matter.Bodies.circle(material.x, material.y, 70.31 / 2, {
					isStatic: true,
					isSensor: true,
					label: "Vortex",
					render: { sprite: { texture: "/assets/Vortex.png", xScale: 1, yScale: 1 } },
				});
				this.vortices.push(body);
				break;

			default:
				return;
		}

		this.materials.push(body);
		Matter.World.add(this.world, body);
	}

	public createTargetZone({ x, y, width, height }: TargetZoneProps) {
		const targetZone = Matter.Bodies.rectangle(x, y, width, height, {
			isStatic: true,
			isSensor: true,
			label: "TargetZone",
			render: { fillStyle: "green" },
		});
		Matter.World.add(this.world, targetZone);
	}

	public setScoreCallback(callback: () => void) {
		this.scoreCallback = callback;
	}

	private incrementScore() {
		this.scoreCallback?.();
	}

	private isDraggable(body: Matter.Body): boolean {
		return ["PlankLeft", "PlankRight", "Fan", "BouncerComposite", "Bumper", "Wheel", "Vortex"]
			.includes(body.label);
	}

	public clear() {
		if (this.ballSpawnInterval) {
			clearInterval(this.ballSpawnInterval);
		}
		Matter.World.clear(this.world, false);
		Matter.Engine.clear(this.engine);
		if (this.render && this.render.canvas) {
			this.render.context = null!;
			this.render.textures = {};
		}
		if (this.runner) {
			Matter.Runner.stop(this.runner);
		}
		PhysicsEngine.instance = null;
		PhysicsEngine.instance = new PhysicsEngine(
			this.renderElement,
			this.spawnPoints,
			this.targetZone,
			this.canvas,
		);
		if (this.scoreCallback) PhysicsEngine.instance.setScoreCallback(this.scoreCallback);
	}
}

const degToRad = (deg: number) => deg * (Math.PI / 180);

function pairEquals<T>(a: [T, T], b: [T, T]): boolean {
	return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}
