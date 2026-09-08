import * as THREE from "three/webgpu";

export class Scene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private points: THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;
  private themeQuery: MediaQueryList;
  private onThemeChange: () => void;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1.25,
                                                1.25,
                                                1.25,
                                               -1.25,
                                                0.1,
                                                10);

    this.camera.position.z = 3;

    this.renderer = new THREE.WebGPURenderer({antialias: true, alpha: true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false );

    container.appendChild(this.renderer.domElement);

    this.points = this.createCircle();
    this.scene.add(this.points);

    this.themeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.onThemeChange = () => {
      const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

      this.points.material.color.set(foreground);
      this.renderer.render(this.scene, this.camera);
    };

    this.themeQuery.addEventListener("change", this.onThemeChange);

    void this.start();
  }

  private createCircle(): THREE.Points {
    const count = 1000;
    const radius = 1;

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 0;

      const index = i * 3;

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3), );

    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
    const material = new THREE.PointsNodeMaterial({color: foreground,});

    return new THREE.Points(geometry, material);
  }

  private async start(): Promise<void> {
    await this.renderer.init();

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.themeQuery.removeEventListener("change", this.onThemeChange);

    if (Array.isArray(this.points.material)) {
      for (const material of this.points.material) {
        material.dispose();
      }
    } else {
      this.points.material.dispose();
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}