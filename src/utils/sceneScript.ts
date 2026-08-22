/**
 * three.js-editor-style script runner.
 * Persistent play scripts stay on Forge — this is the viewport scratch pad.
 */
import * as THREE from 'three';

export interface SceneScriptCtx {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer | null;
  selected: THREE.Object3D | null;
}

export function runAttachedPlayScripts(ctx: SceneScriptCtx): {
  ran: number;
  errors: string[];
} {
  const errors: string[] = [];
  let ran = 0;
  ctx.scene.traverse((o) => {
    const src = o.userData?.playScript;
    if (typeof src !== 'string' || !src.trim()) return;
    try {
      runSceneScript(src, { ...ctx, selected: o });
      ran += 1;
    } catch (err) {
      errors.push(
        `${o.name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });
  return { ran, errors };
}

export function runSceneScript(source: string, ctx: SceneScriptCtx): unknown {
  const body = source.trim();
  if (!body) return 'empty';
  if (/\b(import|require|process|fetch)\b/.test(body)) {
    throw new Error('import / require / process / fetch are blocked here');
  }
  const logs: string[] = [];
  const boxed = {
    log: (...args: unknown[]) => {
      logs.push(args.map(stringify).join(' '));
      console.log('[scene-script]', ...args);
    },
    warn: (...args: unknown[]) => {
      logs.push('warn ' + args.map(stringify).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push('error ' + args.map(stringify).join(' '));
    },
  };
  const fn = new Function(
    'THREE',
    'scene',
    'camera',
    'renderer',
    'selected',
    'console',
    `"use strict";\n${body}`
  );
  const value = fn(
    THREE,
    ctx.scene,
    ctx.camera,
    ctx.renderer,
    ctx.selected,
    boxed
  );
  return { value, logs };
}

function stringify(v: unknown): string {
  if (v == null) return String(v);
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
