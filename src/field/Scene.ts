import * as THREE from "three/webgpu";

export class Scene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private points: THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;
  private themeQuery: MediaQueryList;
  private onThemeChange: () => void;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

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
    this.container = container;

    this.points = this.createCylinder();
    this.scene.add(this.points);

    this.resizeObserver = new ResizeObserver(() => { this.resize(); });
    this.resizeObserver.observe(container);

    this.themeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.onThemeChange = () => {
      const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

      this.points.material.color.set(foreground);
      this.renderer.render(this.scene, this.camera);
    };

    this.themeQuery.addEventListener("change", this.onThemeChange);

    void this.start();
  }

  private createCylinder(): THREE.Points {
    const radius = 1;

    const pointsAround = 300;
    const depthLayers = 100;
    const depth = .2;

    const count = pointsAround * depthLayers;
    const positions = new Float32Array(count * 3);

    let index = 0;

    for (let layer = 0; layer < depthLayers; layer++) {
      const z =
        (layer / (depthLayers - 1) - 0.5) * depth;

      for (let i = 0; i < pointsAround; i++) {
        const angle = (i / pointsAround) * Math.PI * 2;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        positions[index] = x;
        positions[index + 1] = y;
        positions[index + 2] = z;

        index += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3), );

    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

    const material = new THREE.PointsNodeMaterial({ color: foreground, });

    return new THREE.Points(geometry, material);
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.camera);
  }

  private async start(): Promise<void> {
    await this.renderer.init();

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.resizeObserver.disconnect();
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