import * as THREE from "three/webgpu";
import {exp, mx_noise_float, positionLocal, time, uniform, vec3 } from "three/tsl";
export type SceneMode = | "idle" | "hover" | "listening";

type SurfaceProfile = {// Geometry
                      radius: number;
                      pointsAround: number;
                      depthLayers: number;
                      depth: number;
                      radialThickness: number;
                      radialJitter: number;

                      // Idle surface
                      noiseSpeed: number;

                      largeNoiseScale: number;
                      largeNoiseAmplitude: number;
                      largeNoiseSpeed: number;

                      mediumNoiseScale: number;
                      mediumNoiseAmplitude: number;
                      mediumNoiseSpeed: number;

                      fineNoiseScale: number;
                      fineNoiseAmplitude: number;
                      fineNoiseSpeed: number;

                      // Surface dispersal
                      scatterNoiseScale: number;
                      scatterAmplitude: number;

                      scatterSpeedX: number;
                      scatterSpeedY: number;
                      scatterSpeedZ: number;

                      depthNoiseScale: number;
                      depthScatterAmplitude: number;

                      depthSpeedX: number;
                      depthSpeedY: number;
                      depthSpeedZ: number;
                    };

type FocusProfile = {width: number;
                     amplitude: number;
                     noiseScale: number;
                     noiseSpeed: number;
                     noiseStrength: number;
                   };

type RadialWaveEvent = {active: boolean;
                        direction: number;

                        coverage: number;
                        amplitude: number;

                        rampElapsed: number;
                        holdElapsed: number;
                        decayElapsed: number;

                        phase: | "initial" | "ramp" | "spread" | "hold" | "decay";
                      };


// IDLE PRESET
const IDLE: SurfaceProfile = {// --- Geometry ---
                              radius: 1.0,
                              pointsAround: 800,
                              depthLayers: 80,
                              depth: 1,

                              radialThickness: 0.001,
                              radialJitter: 0.006,

                              // --- Idle surface ---
                              noiseSpeed: 1,

                              largeNoiseScale: 1.0,
                              largeNoiseAmplitude: 0.08,
                              largeNoiseSpeed: 0.08,

                              mediumNoiseScale: 1.5,
                              mediumNoiseAmplitude: 0.03,
                              mediumNoiseSpeed: 0.8,

                              fineNoiseScale: 2.0,
                              fineNoiseAmplitude: 0.03,
                              fineNoiseSpeed: 0.8,

                              // --- Surface dispersal ---
                              scatterNoiseScale: 6.0,
                              scatterAmplitude: 0.065,

                              scatterSpeedX: 0.35,
                              scatterSpeedY: 0.55,
                              scatterSpeedZ: 0.25,

                              depthNoiseScale: 9.0,
                              depthScatterAmplitude: 0.5,

                              depthSpeedX: 0.20,
                              depthSpeedY: 0.30,
                              depthSpeedZ: 0.60};


// HOVER / FOCUS PRESET
const HOVER: SurfaceProfile = {// --- Geometry ---
                              radius: 1.0,
                              pointsAround: 800,
                              depthLayers: 80,
                              depth: 1,

                              radialThickness: 0.001,
                              radialJitter: 0.01,

                              // --- Idle surface ---
                              noiseSpeed: 0.65,

                              largeNoiseScale: 20.0,
                              largeNoiseAmplitude: 0.010,
                              largeNoiseSpeed: 1.0,

                              mediumNoiseScale: 12.0,
                              mediumNoiseAmplitude: 0.012,
                              mediumNoiseSpeed: 1.0,

                              fineNoiseScale: 5.0,
                              fineNoiseAmplitude: 0.06,
                              fineNoiseSpeed: 1.8,

                              // --- Surface dispersal ---
                              scatterNoiseScale: 6.0,
                              scatterAmplitude: 0.065,

                              scatterSpeedX: 0.35,
                              scatterSpeedY: 0.55,
                              scatterSpeedZ: 0.25,

                              depthNoiseScale: 9.0,
                              depthScatterAmplitude: 0.5,

                              depthSpeedX: 0.20,
                              depthSpeedY: 0.30,
                              depthSpeedZ: 0.60};

const FOCUS: FocusProfile = {width: 0.055,
                             amplitude: 0.15,

                             noiseScale: 2.0,
                             noiseSpeed: 0.65,
                             noiseStrength: 5.0};

// LISTENING PRESET
const LISTENING: SurfaceProfile = {// --- Geometry ---
                                    radius: 1.0,
                                    pointsAround: 800,
                                    depthLayers: 80,
                                    depth: 1,

                                    radialThickness: 0.015,
                                    radialJitter: 0.01,

                                    // --- Idle surface ---
                                    noiseSpeed: 1,

                                    largeNoiseScale: 1.0,
                                    largeNoiseAmplitude: 0.2,
                                    largeNoiseSpeed: 0.8,

                                    mediumNoiseScale: 1.0,
                                    mediumNoiseAmplitude: 0.012,
                                    mediumNoiseSpeed: 1.0,

                                    fineNoiseScale: 3.0,
                                    fineNoiseAmplitude: 0.06,
                                    fineNoiseSpeed: 0.08,

                                    // --- Surface dispersal ---
                                    scatterNoiseScale: 6.0,
                                    scatterAmplitude: 0.065,

                                    scatterSpeedX: 0.35,
                                    scatterSpeedY: 0.55,
                                    scatterSpeedZ: 0.25,

                                    depthNoiseScale: 9.0,
                                    depthScatterAmplitude: 0.5,

                                    depthSpeedX: 0.20,
                                    depthSpeedY: 0.30,
                                    depthSpeedZ: 0.60};

// RANDOM RADIAL WAVES
const RADIAL_WAVE = {// Number of independent events allowed at once.
                    maxEvents: 2,

                    // Random delay between spawn attempts.
                    spawnMinDelay: 53.0,
                    spawnMaxDelay: 300.0,

                    // Normalized circumference coverage.
                    //
                    // 0.00 = just born
                    // 0.05 = small localized disturbance
                    // 0.50 = half circumference reached
                    // 1.00 = entire cylinder engulfed
                    startCoverage: 0.001,
                    rampCoverage: 0.05,
                    maxCoverage: 1.0,

                    // Slow initial movement intended to catch attention.
                    initialGrowthSpeed: 0.012,

                    // Transition time from slow movement to normal spread.
                    rampDuration: 1.25,

                    // Constant speed after the ramp completes.
                    spreadGrowthSpeed: 0.18,

                    // Radial displacement.
                    startAmplitude: 0.0,
                    maxAmplitude: 0.20,
                    amplitudeRiseDuration: 2.5,

                    // Once the cylinder is completely engulfed,
                    // remain fully active briefly before global decay.
                    holdDuration: 0.35,

                    // Entire affected cylinder settles together.
                    decayDuration: 2.0,

                    // Softness of the two advancing boundaries.
                    edgeSoftness: 0.025,

                    // Surface variation inside the affected region.
                    noiseScale: 2.0,
                    noiseSpeed: 0.65,
                    noiseStrength: 5.0};

// Scene
export class Scene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  private idlePoints:THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;
  private hoverPoints:THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;
  private listeningPoints:THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;
  private allPoints:THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>[];

  private mode: SceneMode = "idle";

  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  private themeQuery: MediaQueryList;
  private onThemeChange: () => void;

  // Focus uniforms
  private focusDirection = uniform(new THREE.Vector2(-1, 0));
  private focusStrength = uniform(0);

  // Radial wave uniforms
  private radialWaveDirections = Array.from({length: RADIAL_WAVE.maxEvents }, 
                                            () => uniform(new THREE.Vector2(1, 0)));

  private radialWaveThresholds = Array.from({ length: RADIAL_WAVE.maxEvents }, () => uniform(1));
  private radialWaveAmplitudes = Array.from({ length: RADIAL_WAVE.maxEvents }, () => uniform(0));

  private radialWaveEvents:RadialWaveEvent[] = Array.from({ length: RADIAL_WAVE.maxEvents },
                                                          () => this.createEmptyWaveEvent());

  private nextWaveSpawnAt = 0;
  private lastFrameTime = 0;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-2.125, 2.125, 2.125, -2.125, 0.1, 10);

    this.camera.position.z = 3;

    this.renderer = new THREE.WebGPURenderer({antialias: true, alpha: true});

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    container.appendChild(this.renderer.domElement);

    this.container = container;

    // Build all three persistent fields once
    this.idlePoints = this.createCylinder(IDLE, "idle");
    this.hoverPoints = this.createCylinder(HOVER, "hover");

    this.listeningPoints = this.createCylinder(LISTENING, "listening");
    this.allPoints = [this.idlePoints, this.hoverPoints, this.listeningPoints];
    this.scene.add(this.idlePoints, this.hoverPoints, this.listeningPoints);
    this.setVisibleMode("idle");

    // Resize
    this.resizeObserver = new ResizeObserver(() => { this.resize(); });
    this.resizeObserver.observe(container);

    // Theme
    this.themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.onThemeChange = () => {
      const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

      for (const points of this.allPoints) {
        points.material.color.set(foreground);
      }
    };

    this.themeQuery.addEventListener("change", this.onThemeChange);

    void this.start();
  }

  // Public visual state
  setState(mode: SceneMode, hoverAngle = 0): void {
    if (mode === "hover") {
      // SVG Y increases downward.
      // Three.js world Y increases upward.
      //
      // Negating sin() makes the Three.js spike
      // point at the same screen-space direction
      // as the SVG navigation label.
      this.focusDirection.value.set(Math.cos(hoverAngle), -Math.sin(hoverAngle));

      this.focusStrength.value = 1;
    } else {
      this.focusStrength.value = 0;
    }

    if (mode !== this.mode) {
      const now = performance.now() / 1000;

      // Radial waves are an idle-only behavior.
      if (this.mode === "idle" && mode !== "idle") {
        this.resetRadialWaves(now);
      }

      if (this.mode !== "idle" && mode === "idle") {
        this.resetRadialWaves(now);
      }

      this.mode = mode;
      this.setVisibleMode(mode);
    }
  }

  // Cylinder
  private createCylinder(profile: SurfaceProfile, behavior: | "idle" | "hover" | "listening"): 
                                  THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial> {
    // Base geometry
    const count = profile.pointsAround * profile.depthLayers;
    const positions = new Float32Array(count * 3);

    let index = 0;

    for (let layer = 0; layer < profile.depthLayers; layer++) {
      const layerT = layer / (profile.depthLayers - 1);
      const z = (layerT - 0.5) * profile.depth;

      for (let i = 0; i < profile.pointsAround; i++) {
        const angle = (i / profile.pointsAround) * Math.PI * 2;

        const radialOffset = (Math.random() - 0.5) * profile.radialThickness;
        const jitter = (Math.random() - 0.5) * profile.radialJitter;
        const pointRadius = profile.radius + radialOffset + jitter;

        const x = Math.cos(angle) * pointRadius;
        const y = Math.sin(angle) * pointRadius;

        positions[index] = x;
        positions[index + 1] = y;
        positions[index + 2] = z;

        index += 3;
      }
    }

    // Geometry + material
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();

    const material = new THREE.PointsNodeMaterial({color: foreground});

    // Common directions
    const radialDirection = vec3(positionLocal.x, positionLocal.y, 0).normalize();
    const tangentDirection = vec3(positionLocal.y.negate(), positionLocal.x, 0).normalize();
    const depthDirection = vec3(0, 0, 1);
    const timeOffset = vec3(0, 0, time.mul(profile.noiseSpeed));

    // Surface
    const largeNoise =mx_noise_float(positionLocal.mul(profile.largeNoiseScale)
                                                  .add(timeOffset.mul(profile.largeNoiseSpeed)));

    const mediumNoise = mx_noise_float(positionLocal.mul(profile.mediumNoiseScale)
                                                    .add(timeOffset.mul(profile.mediumNoiseSpeed)));

    const fineNoise = mx_noise_float(positionLocal.mul(profile.fineNoiseScale)
                                                  .add(timeOffset.mul(profile.fineNoiseSpeed)));

    const surfaceNoise = largeNoise.mul(profile.largeNoiseAmplitude)
                                   .add(mediumNoise.mul(profile.mediumNoiseAmplitude))
                                   .add(fineNoise.mul(profile.fineNoiseAmplitude));

    const idleDisplacement = radialDirection.mul(surfaceNoise);

    // Surface dispersal
    const scatterNoise = mx_noise_float(positionLocal.mul(profile.scatterNoiseScale)
                                                     .add(vec3(time.mul(profile.scatterSpeedX),
                                                               time.mul(profile.scatterSpeedY),
                                                               time.mul(profile.scatterSpeedZ))));

    const depthNoise = mx_noise_float(positionLocal.mul(profile.depthNoiseScale)
                                                   .add(vec3(time.mul(profile.depthSpeedX),
                                                             time.mul(profile.depthSpeedY),
                                                             time.mul(profile.depthSpeedZ))));

    const tangentialScatter = tangentDirection.mul(scatterNoise.mul(profile.scatterAmplitude));

    const depthScatter = depthDirection.mul(depthNoise.mul(profile.depthScatterAmplitude));
    const scatterDisplacement = tangentialScatter.add(depthScatter);

    // Base final position
    let finalPosition =positionLocal.add(idleDisplacement).add(scatterDisplacement);

    // Hover focus divergence
    if (behavior === "hover") {
      const alignment = radialDirection.x.mul(this.focusDirection.x)
                                          .add(radialDirection.y.mul(this.focusDirection.y));

      // 1 - cos(width) converts the old narrow
      // angular width into a dot-product Gaussian.
      const focusWidthScale = 1 - Math.cos(FOCUS.width);

      const focusMask = exp(alignment.sub(1).div(focusWidthScale)).mul(this.focusStrength);

      const focusNoise = mx_noise_float(positionLocal.mul(FOCUS.noiseScale)
                                                     .add(vec3(0, 0, time.mul(FOCUS.noiseSpeed))));

      const focusVariation = focusNoise.mul(FOCUS.noiseStrength).add(1.0);
      const focusDisplacement = radialDirection.mul(focusMask.mul(focusVariation).mul(FOCUS.amplitude));

      finalPosition = finalPosition.add(focusDisplacement);
    }

    // Idle random radial waves
    if (behavior === "idle") {
      const waveNoise = mx_noise_float(positionLocal.mul(RADIAL_WAVE.noiseScale)
                                                    .add(vec3(0, 0, time.mul(RADIAL_WAVE.noiseSpeed))));

      const waveVariation = waveNoise.mul(RADIAL_WAVE.noiseStrength).add(1.0);

      // Event 0
      const alignment0 = radialDirection.x.mul(this.radialWaveDirections[0].x)
                                          .add(radialDirection.y.mul(this.radialWaveDirections[0].y));

      const mask0 = alignment0.sub(this.radialWaveThresholds[0])
                              .div(RADIAL_WAVE.edgeSoftness,)
                              .add(1)
                              .max(0)
                              .min(1);

      let waveStrength = mask0.mul(this.radialWaveAmplitudes[0]);

      // Remaining independent events.
      for (let i = 1; i < RADIAL_WAVE.maxEvents; i++) {
        const alignment = radialDirection.x.mul(this.radialWaveDirections[i].x)
                                           .add(radialDirection.y
                                              .mul(this.radialWaveDirections[i].y));

        const mask = alignment.sub(this.radialWaveThresholds[i])
                              .div(RADIAL_WAVE.edgeSoftness)
                              .add(1)
                              .max(0)
                              .min(1);

        const strength = mask.mul(this.radialWaveAmplitudes[i]);

        // Use the strongest event rather than summing.
        // Overlapping waves therefore never turn into an
        // accidental 0.4 / 0.6 amplitude explosion.
        waveStrength = waveStrength.max(strength);
      }

      const radialWaveDisplacement = radialDirection.mul(waveStrength.mul(waveVariation));

      finalPosition = finalPosition.add(radialWaveDisplacement);
    }

    material.positionNode = finalPosition;

    return new THREE.Points(geometry, material);
  }

  private setVisibleMode(mode: SceneMode, ): void {
    this.idlePoints.visible = mode === "idle";

    this.hoverPoints.visible = mode === "hover";

    this.listeningPoints.visible = mode === "listening";
  }

  private createEmptyWaveEvent():
    RadialWaveEvent {
    return {
      active: false,
      direction: 0,

      coverage: RADIAL_WAVE.startCoverage,

      amplitude: RADIAL_WAVE.startAmplitude,

      rampElapsed: 0,
      holdElapsed: 0,
      decayElapsed: 0,

      phase: "initial",
    };
  }

  private updateRadialWaves(now: number, deltaTime: number ): void {
    if (this.mode !== "idle") return;

    if (now >= this.nextWaveSpawnAt) this.spawnRadialWave(now);

    for (let i = 0; i < this.radialWaveEvents.length; i++) {
      const event = this.radialWaveEvents[i];

      if (!event.active) continue;

      if (event.phase !== "decay" && event.amplitude < RADIAL_WAVE.maxAmplitude) {
        const amplitudeSpeed = RADIAL_WAVE.maxAmplitude / RADIAL_WAVE.amplitudeRiseDuration;

        event.amplitude = Math.min(RADIAL_WAVE.maxAmplitude, event.amplitude + amplitudeSpeed * deltaTime);
      }

      switch (event.phase) {
        case "initial": {
          event.coverage += RADIAL_WAVE.initialGrowthSpeed * deltaTime;

          if (event.coverage >= RADIAL_WAVE.rampCoverage) {
            event.coverage = RADIAL_WAVE.rampCoverage;

            event.phase = "ramp";
            event.rampElapsed = 0;
          }

          break;
        }


        case "ramp": {
          event.rampElapsed += deltaTime;
          const t = Math.min(event.rampElapsed / RADIAL_WAVE.rampDuration, 1);

          // Smooth acceleration only during the ramp.
          const smoothT = t * t * (3 - 2 * t);
          const growthSpeed = THREE.MathUtils.lerp(RADIAL_WAVE.initialGrowthSpeed, 
                                                  RADIAL_WAVE.spreadGrowthSpeed, 
                                                  smoothT);

          event.coverage += growthSpeed * deltaTime;

          if (t >= 1) event.phase = "spread";

          break;
        }


        case "spread": {
          // Plateau: no more acceleration.
          event.coverage += RADIAL_WAVE.spreadGrowthSpeed * deltaTime;

          if (event.coverage >= RADIAL_WAVE.maxCoverage) {
            event.coverage = RADIAL_WAVE.maxCoverage;

            event.phase = "hold";
            event.holdElapsed = 0;
          }

          break;
        }


        case "hold": {event.holdElapsed += deltaTime;

          if (event.holdElapsed >= RADIAL_WAVE.holdDuration) {
            event.phase = "decay";
            event.decayElapsed = 0;
          }

          break;
        }


        case "decay": {
          event.decayElapsed += deltaTime;
          const t =Math.min(event.decayElapsed / RADIAL_WAVE.decayDuration, 1);

          // Coverage remains at 100%.
          // The entire cylinder settles together.
          event.amplitude =RADIAL_WAVE.maxAmplitude * (1 - t);

          if (t >= 1) {
            this.deactivateWave(i);
            continue;
          }

          break;
        }
      }


      const threshold = event.coverage >= 1 ? -1 : Math.cos(Math.PI * event.coverage);

      this.radialWaveThresholds[i].value = threshold;
      this.radialWaveAmplitudes[i].value = event.amplitude;
    }
  }


  private spawnRadialWave(now: number, ): void {
    const slot = this.radialWaveEvents.findIndex((event) => !event.active, );

    // Schedule the next attempt regardless of whether
    // all three slots are currently occupied.
    this.scheduleNextWave(now);

    if (slot === -1) return;

    const angle = Math.random() * Math.PI * 2;

    const event = this.radialWaveEvents[slot];

    event.active = true; 
    event.direction = angle;
    event.coverage = RADIAL_WAVE.startCoverage;
    event.amplitude = RADIAL_WAVE.startAmplitude;

    event.rampElapsed = 0;
    event.holdElapsed = 0;
    event.decayElapsed = 0;

    event.phase = "initial";

    this.radialWaveDirections[slot].value.set(Math.cos(angle), Math.sin(angle), );
    this.radialWaveThresholds[slot].value = Math.cos(Math.PI * RADIAL_WAVE.startCoverage, );
    this.radialWaveAmplitudes[slot].value = RADIAL_WAVE.startAmplitude;
  }


  private deactivateWave(index: number, ): void {
    this.radialWaveEvents[index] = this.createEmptyWaveEvent();

    this.radialWaveAmplitudes[index].value = 0;
    this.radialWaveThresholds[index].value = 1;
  }


  private resetRadialWaves( now: number, ): void {
    for (let i = 0; i < RADIAL_WAVE.maxEvents; i++ ) {
      this.deactivateWave(i);
    }

    this.scheduleNextWave(now);
  }


  private scheduleNextWave( now: number, ): void {
    const delay =THREE.MathUtils.lerp(RADIAL_WAVE.spawnMinDelay, RADIAL_WAVE.spawnMaxDelay, Math.random(), );

    this.nextWaveSpawnAt = now + delay;
  }

  private resize(): void {
    const width =this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height, false, );
  }

  private async start(): Promise<void> {
    await this.renderer.init();

    const now = performance.now() / 1000;

    this.lastFrameTime = now;
    this.scheduleNextWave(now);

    this.renderer.setAnimationLoop(() => {
        const currentTime = performance.now() / 1000;

        // Prevent a huge jump after tab suspension.
        const deltaTime = Math.min( currentTime - this.lastFrameTime, 0.1, );

        this.lastFrameTime = currentTime;

        this.updateRadialWaves( currentTime, deltaTime, );

        this.renderer.render( this.scene, this.camera, );
      },
    );
  }


  dispose(): void {
    this.renderer.setAnimationLoop(null, );

    this.resizeObserver.disconnect();

    this.themeQuery.removeEventListener("change", this.onThemeChange, );

    for (const points of this.allPoints) {
      points.geometry.dispose();
      points.material.dispose();
    }

    this.renderer.dispose();

    this.renderer.domElement.remove();
  }
}