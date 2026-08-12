import { type CSSProperties, type ReactNode } from "react";
import { MOB_MODELS, type MobModelId } from "../data/mobModels";

type CombatAnimation = "idle" | "player-attack" | "monster-hurt" | "monster-attack" | "charging" | "teleporting" | "exploding" | "dying";
type Vec3 = readonly [number, number, number];
type CubeDefinition = { origin: Vec3; size: Vec3; uv: readonly [number, number]; inflate?: number; rotation?: Vec3; mirror?: boolean };
type BoneDefinition = { name: string; parent?: string; pivot?: Vec3; rotation?: Vec3; bind_pose_rotation?: Vec3; cubes?: readonly CubeDefinition[]; mirror?: boolean };
type ModelDefinition = { texturewidth: number; textureheight: number; bones: readonly BoneDefinition[] };

const VIEW: Record<MobModelId, { unit: number; pitch: number; yaw: number; roll?: number; y?: number }> = {
  zombie: { unit: 5.4, pitch: -7, yaw: 156, y: 7 },
  skeleton: { unit: 5.4, pitch: -7, yaw: 156, y: 7 },
  creeper: { unit: 6.1, pitch: -8, yaw: 157, y: 7 },
  enderman: { unit: 4.1, pitch: -6, yaw: 156, y: 5 },
  warden: { unit: 4.05, pitch: -7, yaw: 158, y: 5 },
  ender_dragon: { unit: 1.35, pitch: -18, yaw: 132, roll: -2, y: 7 },
};

const POSES: Partial<Record<MobModelId, Record<string, Vec3>>> = {
  zombie: { rightArm: [-72, 0, 0], leftArm: [-72, 0, 0], rightLeg: [8, 0, 0], leftLeg: [-8, 0, 0] },
  skeleton: { rightArm: [-68, 9, 22], leftArm: [-78, -12, -34], rightLeg: [5, 0, 0], leftLeg: [-5, 0, 0] },
  enderman: { rightArm: [4, 0, 2], leftArm: [-4, 0, -2], rightLeg: [-3, 0, 0], leftLeg: [3, 0, 0] },
  warden: { right_arm: [5, 0, 4], left_arm: [-5, 0, -4], right_leg: [-3, 0, 0], left_leg: [3, 0, 0] },
  ender_dragon: { wing: [0, 9, -10], wingtip: [0, 18, -9], wing1: [0, -9, 10], wingtip1: [0, -18, 9], jaw: [9, 0, 0] },
};

const FACE_DATA = {
  north: { size: (s: Vec3) => [s[0], s[1]], uv: (s: Vec3, uv: readonly [number, number]) => [uv[0] + s[2], uv[1] + s[2]] },
  south: { size: (s: Vec3) => [s[0], s[1]], uv: (s: Vec3, uv: readonly [number, number]) => [uv[0] + s[2] * 2 + s[0], uv[1] + s[2]] },
  east: { size: (s: Vec3) => [s[2], s[1]], uv: (_s: Vec3, uv: readonly [number, number]) => [uv[0], uv[1] + _s[2]] },
  west: { size: (s: Vec3) => [s[2], s[1]], uv: (s: Vec3, uv: readonly [number, number]) => [uv[0] + s[2] + s[0], uv[1] + s[2]] },
  up: { size: (s: Vec3) => [s[0], s[2]], uv: (s: Vec3, uv: readonly [number, number]) => [uv[0] + s[2], uv[1]] },
  down: { size: (s: Vec3) => [s[0], s[2]], uv: (s: Vec3, uv: readonly [number, number]) => [uv[0] + s[2] + s[0], uv[1]] },
} as const;

function mergeRotation(base: Vec3 | undefined, pose: Vec3 | undefined): Vec3 {
  return [
    (base?.[0] ?? 0) + (pose?.[0] ?? 0),
    (base?.[1] ?? 0) + (pose?.[1] ?? 0),
    (base?.[2] ?? 0) + (pose?.[2] ?? 0),
  ];
}

function VoxelCube({ cube, unit, texture, textureWidth, textureHeight, pivot, mirrored }: {
  cube: CubeDefinition; unit: number; texture: string; textureWidth: number; textureHeight: number; pivot: Vec3; mirrored?: boolean;
}) {
  const inflate = cube.inflate ?? 0;
  const rendered: Vec3 = [cube.size[0] + inflate * 2, cube.size[1] + inflate * 2, cube.size[2] + inflate * 2];
  const center: Vec3 = [cube.origin[0] + cube.size[0] / 2, cube.origin[1] + cube.size[1] / 2, cube.origin[2] + cube.size[2] / 2];
  const rotation = cube.rotation ?? [0, 0, 0];
  const cubeWidth = Math.max(rendered[0], .02) * unit;
  const cubeHeight = Math.max(rendered[1], .02) * unit;
  const cubeDepth = Math.max(rendered[2], .02) * unit;
  const cubeStyle = {
    "--cube-left": `${(center[0] - pivot[0]) * unit - cubeWidth / 2}px`,
    "--cube-top": `${-(center[1] - pivot[1]) * unit - cubeHeight / 2}px`,
    "--cube-z": `${(center[2] - pivot[2]) * unit}px`,
    "--cube-rx": `${-rotation[0]}deg`,
    "--cube-ry": `${-rotation[1]}deg`,
    "--cube-rz": `${rotation[2]}deg`,
    "--cube-w": `${cubeWidth}px`,
    "--cube-h": `${cubeHeight}px`,
    "--cube-d": `${cubeDepth}px`,
    "--cube-half-w": `${cubeWidth / 2}px`,
    "--cube-half-h": `${cubeHeight / 2}px`,
    "--cube-half-d": `${cubeDepth / 2}px`,
  } as CSSProperties;

  return <span className={`entity-cube ${mirrored || cube.mirror ? "mirrored" : ""}`} style={cubeStyle}>
    {(Object.keys(FACE_DATA) as Array<keyof typeof FACE_DATA>).map((face) => {
      const [width, height] = FACE_DATA[face].size(rendered);
      const [u, v] = FACE_DATA[face].uv(cube.size, cube.uv);
      const faceStyle = {
        "--face-w": `${Math.max(width, .02) * unit}px`,
        "--face-h": `${Math.max(height, .02) * unit}px`,
        "--face-ml": `${Math.max(width, .02) * unit / -2}px`,
        "--face-mt": `${Math.max(height, .02) * unit / -2}px`,
        "--atlas-w": `${textureWidth * unit}px`,
        "--atlas-h": `${textureHeight * unit}px`,
        "--uv-x": `${-u * unit}px`,
        "--uv-y": `${-v * unit}px`,
        "--mob-texture": `url(${texture})`,
      } as CSSProperties;
      return <i key={face} className={`cube-face face-${face}`} style={faceStyle} />;
    })}
  </span>;
}

function boneBounds(model: ModelDefinition) {
  const points = model.bones.flatMap((bone) => bone.cubes?.flatMap((cube) => [cube.origin, [cube.origin[0] + cube.size[0], cube.origin[1] + cube.size[1], cube.origin[2] + cube.size[2]] as Vec3]) ?? []);
  if (!points.length) return { center: [0, 0, 0] as Vec3 };
  const min: Vec3 = [Math.min(...points.map((p) => p[0])), Math.min(...points.map((p) => p[1])), Math.min(...points.map((p) => p[2]))];
  const max: Vec3 = [Math.max(...points.map((p) => p[0])), Math.max(...points.map((p) => p[1])), Math.max(...points.map((p) => p[2]))];
  return { center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] as Vec3 };
}

function BoneGroup({ id, bone, model, center, unit, texture, atlasHeight, children }: {
  id: MobModelId; bone: BoneDefinition; model: ModelDefinition; center: Vec3; unit: number; texture: string; atlasHeight: number; children?: ReactNode;
}) {
  const pivot = bone.pivot ?? [0, 0, 0];
  const rotation = mergeRotation(bone.bind_pose_rotation ?? bone.rotation, POSES[id]?.[bone.name]);
  const style = {
    "--bone-x": `${(pivot[0] - center[0]) * unit}px`,
    "--bone-y": `${-(pivot[1] - center[1]) * unit}px`,
    "--bone-z": `${(pivot[2] - center[2]) * unit}px`,
    "--bone-rx": `${-rotation[0]}deg`,
    "--bone-ry": `${-rotation[1]}deg`,
    "--bone-rz": `${rotation[2]}deg`,
  } as CSSProperties;
  return <span className={`entity-bone bone-${bone.name.replace(/[^a-z0-9_-]/gi, "-")}`} style={style}>
    {bone.cubes?.map((cube, index) => <VoxelCube key={index} cube={cube} unit={unit} texture={texture} textureWidth={model.texturewidth} textureHeight={atlasHeight} pivot={pivot} mirrored={bone.mirror} />)}
    {children}
  </span>;
}

export default function MobModel3D({ id, animation = "idle", compact = false }: { id: MobModelId; animation?: CombatAnimation; compact?: boolean }) {
  const model = MOB_MODELS[id] as unknown as ModelDefinition;
  const view = VIEW[id];
  const texture = `/mc/mobs/${id}.png`;
  const atlasHeight = model.textureheight === 32 ? 64 : model.textureheight;
  const { center } = boneBounds(model);
  // Vanilla pivots are expressed in global model coordinates. Keeping every bone
  // at that global pivot avoids double translations while still allowing each limb
  // to rotate around the same point used by the game renderer.
  const renderBone = (bone: BoneDefinition): ReactNode => <BoneGroup key={bone.name} id={id} bone={bone} model={model} center={center} unit={view.unit} texture={texture} atlasHeight={atlasHeight} />;
  const rootStyle = {
    "--entity-rx": `${view.pitch}deg`, "--entity-ry": `${view.yaw}deg`, "--entity-rz": `${view.roll ?? 0}deg`, "--entity-y": `${view.y ?? 0}px`,
  } as CSSProperties;

  return <div className={`vanilla-mob-model mob-${id} ${animation} ${compact ? "compact" : ""}`} aria-label={id.replace(/_/g, " ")}>
    <span className="monster-ground-shadow" />
    <span className="voxel-entity-root" style={rootStyle}>{model.bones.map(renderBone)}</span>
    {id === "skeleton" && <img className="skeleton-held-bow" src="/mc/items/bow.png?v=2" alt="" />}
    {id === "warden" && <span className="sonic-rings"><i /><i /><i /></span>}
    {id === "enderman" && <span className="ender-particles"><i /><i /><i /><i /><i /></span>}
    {id === "creeper" && <span className="fuse-flash" />}
  </div>;
}
