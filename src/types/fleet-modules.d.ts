declare module 'three-pathfinding' {
  import type { BufferGeometry, Object3D, Vector3 } from 'three';
  export class Pathfinding {
    static createZone(geometry: BufferGeometry, tolerance?: number): unknown;
    setZoneData(zoneID: string, zone: unknown): void;
    getGroup(zoneID: string, position: Vector3, checkPolygon?: boolean): number;
    findPath(
      start: Vector3,
      end: Vector3,
      zoneID: string,
      groupID: number
    ): Vector3[] | null;
  }
  export class PathfindingHelper extends Object3D {
    setPath(path: Vector3[]): this;
    setPlayerPosition(p: Vector3): this;
    setTargetPosition(p: Vector3): this;
    reset(): this;
  }
}

declare module 'yuka' {
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    copy(v: Vector3): this;
  }
  export class Vehicle {
    position: Vector3;
    maxSpeed: number;
    steering: { add(b: unknown): void; clear(): void };
    update(delta: number): this;
  }
  export class WanderBehavior {
    constructor(radius?: number, distance?: number, jitter?: number);
  }
  export class SeekBehavior {
    constructor(target?: Vector3);
    target: Vector3;
  }
}
