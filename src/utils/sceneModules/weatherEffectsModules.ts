import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';
import type { WeatherOptions, WeatherType } from '@/types/renderModelTypes';
import { WEATHER_TYPE } from '@/enums/enum';
import { toRaw } from 'vue';
const store = useSceneStore();

export default class WeatherEffects {
  private particles: THREE.Points | null = null;
  private animationId: number | null = null;
  private velocity: Float32Array | null = null;
  weatherConfig: WeatherOptions;
  constructor() {
    this.weatherConfig = {
      weather: WEATHER_TYPE.None,
      count: 2000,
      speed: 0.4,
      size: 0.5,
      opacity: 0.6,
      color: '#ffffff',
      area: 100,
      height: 50,
      planeGeometry: 'brick',
    };
  }
  // 创建天气效果
  createWeatherEffect(options: WeatherOptions = {}) {
    const type = options.weather as WeatherType;
    this.weatherConfig = {
      ...options,
    };
    const {
      count = 2000,
      speed = 0.4,
      size = 0.5,
      opacity = 0.6,
      color = '#ffffff',
      area = 100,
      height = 50,
    } = options;

    // 清除现有效果
    this.clearWeatherEffect();
    if (type === WEATHER_TYPE.None) {
      cancelAnimationFrame(this.animationId as number);
      return;
    }

    // 创建粒子几何体
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.velocity = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area; // x
      positions[i * 3 + 1] = Math.random() * height; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * area; // z

      // 修改速度初始化逻辑，限制在一个合理范围内
      this.velocity[i] = speed * (0.8 + Math.random() * 0.4); // 速度范围在 0.8~1.2 倍速之间
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 修改材质属性，解决透明度问题
    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // 添加混合模式
      alphaTest: 0.1, // 添加 alpha 测试
      sizeAttenuation: true, // 启用大小衰减，使远处的粒子更小
    });
    const loadMap = new THREE.TextureLoader();

    // 根据类型设置不同的材质贴图
    switch (type) {
      case 'rain':
        // 可以添加雨滴形状的贴图
        material.map = loadMap.load(
          new URL('../../assets/image/rain.png', import.meta.url).href
        );
        break;
      case 'snow':
        material.color.set('#ffffff');
        material.map = loadMap.load(
          new URL('../../assets/image/snowflake.png', import.meta.url).href,
          (texture) => {
            // 设置纹理参数
            texture.premultiplyAlpha = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            material.needsUpdate = true;
          }
        );
        break;
    }

    // 创建粒子系统
    this.particles = new THREE.Points(geometry, material);
    store.sceneApi?.scene?.add(this.particles);

    // 开始动画
    this.animate(type, height, speed);
  }

  private animate(type: WeatherType, height: number, speed: number) {
    if (!this.particles || !this.velocity) return;

    const positions = this.particles.geometry.attributes.position;
    const array = toRaw(positions.array) as Float32Array;
    const deltaTime = 1 / 60; // 假设 60fps
    this.animationId = requestAnimationFrame(() =>
      this.animate(type, height, speed)
    );

    for (let i = 0; i < array.length; i += 3) {
      // 使用 deltaTime 使动画更平滑
      array[i + 1] -= this.velocity[i / 3] * speed * deltaTime * 60;

      if (array[i + 1] < 0) {
        array[i + 1] = height;

        switch (type) {
          case 'snow':
            // 优化雪花运动
            array[i] += (Math.random() - 0.5) * 0.2 * deltaTime * 60;
            array[i + 2] += (Math.random() - 0.5) * 0.2 * deltaTime * 60;
            // 重置时轻微随机化水平位置
            array[i] = (Math.random() - 0.5) * (height * 2);
            array[i + 2] = (Math.random() - 0.5) * (height * 2);
            break;
          case 'rain':
            // 雨滴保持直线下落
            break;
        }
      }
    }

    positions.needsUpdate = true;
  }

  // 清除天气效果
  clearWeatherEffect() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.particles) {
      store.sceneApi?.scene?.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
    }

    this.velocity = null;
  }

  // 更新参数
  updateWeatherParams(options: WeatherOptions) {
    if (!this.particles) return;

    const material = this.particles.material as THREE.PointsMaterial;

    if (options.opacity !== undefined) {
      material.opacity = options.opacity;
    }
    if (options.size !== undefined) {
      material.size = options.size;
    }
    if (options.color !== undefined) {
      material.color.set(options.color);
    }
    if (options.speed !== undefined && this.velocity) {
      for (let i = 0; i < this.velocity.length; i++) {
        this.velocity[i] *= options.speed;
      }
    }
  }
}
