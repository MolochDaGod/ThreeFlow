import * as THREE from 'three';
import type { WeatherOptions } from './renderModelTypes';

export interface IndexDbSceneData {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  weather: WeatherOptions;
  controls: {
    x: number;
    y: number;
    z: number;
  };
}
