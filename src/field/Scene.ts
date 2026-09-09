import * as THREE from "three/webgpu";
import { positionLocal, vec3, mx_noise_float, time, abs, exp,} from "three/tsl";

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

    this.camera = new THREE.OrthographicCamera(-2.125,
                                               2.125,
                                               2.125,
                                               -2.125,
                                               0.1,
                                               10,);

    this.camera.position.z = 3;
    
    this.renderer = new THREE.WebGPURenderer({antialias: true, alpha: true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false );
    
    container.appendChild(this.renderer.domElement);
    this.container = container;

    this.points = this.createCylinder();
    // this.points.rotation.x = Math.PI / 4;
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

  private createCylinder(): THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial> {
    // --- Geometry ---
    const radius = 1.0;
    const pointsAround = 800;
    const depthLayers = 80;
    const depth = 1;

    const radialThickness = 0.001;
    const radialJitter = 0.006;

    // --- Idle surface ---
    const noiseSpeed = 1;

    const largeNoiseScale = 1.0;
    const largeNoiseAmplitude = 0.08;
    const largeNoiseSpeed = .08;

    const mediumNoiseScale = 1.5;
    const mediumNoiseAmplitude = 0.03;
    const mediumNoiseSpeed = 0.8;

    const fineNoiseScale = 2.0;
    const fineNoiseAmplitude = 0.03;
    const fineNoiseSpeed = 0.8;

    // --- Surface dispersal ---
    const scatterNoiseScale = 6.0;
    const scatterAmplitude = 0.065;

    const scatterSpeedX = 0.35;
    const scatterSpeedY = 0.55;
    const scatterSpeedZ = 0.25;

    const depthNoiseScale = 9.0;
    const depthScatterAmplitude = 0.5;

    const depthSpeedX = 0.20;
    const depthSpeedY = 0.30;
    const depthSpeedZ = 0.60;

    // --- Divergence ---
    const divergenceWidth = 0;
    const divergenceAmplitude = 0.15;

    const divergenceNoiseScale = 2.0;
    const divergenceNoiseSpeed = 0.65;
    const divergenceNoiseStrength = 5.0;


    // ============================================================
    // Base geometry
    // ============================================================

    const count = pointsAround * depthLayers;
    const positions = new Float32Array(count * 3);

    let index = 0;

    for (let layer = 0; layer < depthLayers; layer++) {
      const layerT = layer / (depthLayers - 1);

      const z = (layerT - 0.5) * depth;

      for (let i = 0; i < pointsAround; i++) {
        const angle = (i / pointsAround) * Math.PI * 2;

        const radialOffset = (Math.random() - 0.5) * radialThickness;

        const jitter = (Math.random() - 0.5) * radialJitter;

        const pointRadius = radius + radialOffset + jitter;

        const x = Math.cos(angle) * pointRadius;
        const y = Math.sin(angle) * pointRadius;

        positions[index] = x;
        positions[index + 1] = y;
        positions[index + 2] = z;

        index += 3;
      }
    }

    // ============================================================
    // Geometry + material
    // ============================================================

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const foreground = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim();

    const material = new THREE.PointsNodeMaterial({
      color: foreground,
    });


    // ============================================================
    // Common directions
    // ============================================================

    const radialDirection = vec3(
      positionLocal.x,
      positionLocal.y,
      0,
    ).normalize();

    const tangentDirection = vec3(
      positionLocal.y.negate(),
      positionLocal.x,
      0,
    ).normalize();

    const depthDirection = vec3(0, 0, 1);

    const timeOffset = vec3(
      0,
      0,
      time.mul(noiseSpeed),
    );


    // ============================================================
    // Idle surface
    // ============================================================

    const largeNoise = mx_noise_float(
      positionLocal
        .mul(largeNoiseScale)
        .add(timeOffset.mul(largeNoiseSpeed)),
    );

    const mediumNoise = mx_noise_float(
      positionLocal
        .mul(mediumNoiseScale)
        .add(timeOffset.mul(mediumNoiseSpeed)),
    );

    const fineNoise = mx_noise_float(
      positionLocal
        .mul(fineNoiseScale)
        .add(timeOffset.mul(fineNoiseSpeed)),
    );

    const surfaceNoise = largeNoise
      .mul(largeNoiseAmplitude)
      .add(
        mediumNoise.mul(mediumNoiseAmplitude),
      )
      .add(
        fineNoise.mul(fineNoiseAmplitude),
      );

    const idleDisplacement =
      radialDirection.mul(surfaceNoise);


    // ============================================================
    // Surface dispersal
    // ============================================================

    const scatterNoise = mx_noise_float(
      positionLocal
        .mul(scatterNoiseScale)
        .add(
          vec3(
            time.mul(scatterSpeedX),
            time.mul(scatterSpeedY),
            time.mul(scatterSpeedZ),
          ),
        ),
    );

    const depthNoise = mx_noise_float(
      positionLocal
        .mul(depthNoiseScale)
        .add(
          vec3(
            time.mul(depthSpeedX),
            time.mul(depthSpeedY),
            time.mul(depthSpeedZ),
          ),
        ),
    );

    const tangentialScatter =
      tangentDirection.mul(
        scatterNoise.mul(scatterAmplitude),
      );

    const depthScatter =
      depthDirection.mul(
        depthNoise.mul(depthScatterAmplitude),
      );

    const scatterDisplacement =
      tangentialScatter.add(depthScatter);


    // ============================================================
    // Fixed divergence
    // ============================================================

    const verticalDistance =
      abs(positionLocal.y);

    const verticalMask = exp(
      verticalDistance
        .div(divergenceWidth)
        .pow(2)
        .negate(),
    );

    const leftMask =
      positionLocal.x.negate().max(0);

    const divergenceMask =
      verticalMask.mul(leftMask);

    const divergenceNoise = mx_noise_float(
      positionLocal
        .mul(divergenceNoiseScale)
        .add(
          vec3(
            0,
            0,
            time.mul(divergenceNoiseSpeed),
          ),
        ),
    );

    const divergenceVariation =
      divergenceNoise
        .mul(divergenceNoiseStrength)
        .add(1.0);

    const divergenceDisplacement =
      radialDirection.mul(
        divergenceMask
          .mul(divergenceVariation)
          .mul(divergenceAmplitude),
      );


    // ============================================================
    // Final position
    // ============================================================

    material.positionNode = positionLocal
      .add(idleDisplacement)
      .add(scatterDisplacement)
      .add(divergenceDisplacement);

    return new THREE.Points(
      geometry,
      material,
    );
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.camera);
  }

  private async start(): Promise<void> {
    await this.renderer.init();

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
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

    this.renderer.setAnimationLoop(null);

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}