import * as THREE from "three/webgpu";
import {acos, exp, mx_noise_float, positionLocal, time, uniform, vec3} from "three/tsl";


type GeometryProfile = {radius: number;
                        pointsAround: number;
                        depthLayers: number;
                        depth: number;

                        radialThickness: number;
                        radialJitter: number;
                      };

type SurfaceProfile = {noiseSpeed: number;

                       largeNoiseScale: number;
                       largeNoiseAmplitude: number;
                       largeNoiseSpeed: number;

                       mediumNoiseScale: number;
                       mediumNoiseAmplitude: number;
                       mediumNoiseSpeed: number;

                       fineNoiseScale: number;
                       fineNoiseAmplitude: number;
                       fineNoiseSpeed: number;

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
                        settling: boolean;

                        angle: number;
                        progress: number;

                        strength: number;
                        strengthVelocity: number;
                      };


// GEOMETRY
const GEOMETRY: GeometryProfile = {// --- Geometry ---
                                   radius: 1.0,
                                   pointsAround: 800,
                                   depthLayers: 80,
                                   depth: 1,

                                   radialThickness: 0.006,
                                   radialJitter: 0.006};


// IDLE PRESET
const IDLE: SurfaceProfile = {// --- Idle surface ---
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


// LISTENING PRESET
const LISTENING: SurfaceProfile = {// --- Listening surface ---
                                   noiseSpeed: 0.2,

                                   largeNoiseScale: 1.0,
                                   largeNoiseAmplitude: 0.2,
                                   largeNoiseSpeed: 0.8,

                                   mediumNoiseScale: 1.0,
                                   mediumNoiseAmplitude: 0.012,
                                   mediumNoiseSpeed: 0.7,

                                   fineNoiseScale: 1.0,
                                   fineNoiseAmplitude: 0.06,
                                   fineNoiseSpeed: 0.08,

                                   // --- Surface dispersal ---
                                   scatterNoiseScale: 0.8,
                                   scatterAmplitude: 0.65,

                                   scatterSpeedX: 0.35,
                                   scatterSpeedY: 0.55,
                                   scatterSpeedZ: 0.25,

                                   depthNoiseScale: 2.0,
                                   depthScatterAmplitude: 0.05,

                                   depthSpeedX: 0.20,
                                   depthSpeedY: 0.30,
                                   depthSpeedZ: 0.60};


// HOVER / FOCUS
const FOCUS: FocusProfile = {width: 0.5,
                             amplitude: 0.2,

                             noiseScale: 2.0,
                             noiseSpeed: 0.75,
                             noiseStrength: 0.45};


// RANDOM RADIAL WAVE / PLUME
const RADIAL_WAVE = {// Independent events.
                    maxEvents: 2,

                    // Production spawn timing.
                    spawnMinDelay: 20.0,
                    spawnMaxDelay: 70.0,

                    // Propagation.
                    startProgress: -0.12,
                    rampStartProgress: 0.015,
                    rampEndProgress: 0.08,

                    initialGrowthSpeed: 0.012,
                    travelGrowthSpeed: 0.18,

                    // Event envelope.
                    frontSoftness: 0.15,
                    trailLength: 1,

                    // Event strength.
                    maxAmplitude: 0.08,
                    attackSmoothTime: 0.45,
                    decaySmoothTime: 1.8,

                    // Turbulence.
                    noiseScale: 2.0,
                    noiseSpeed: 0.65,
                    noiseStrength: 2.45,
                    noiseSeedScale: 2.0,

                    tangentialAmplitude: 0.035,
                    depthAmplitude: 0.15,

                    // Event cleanup.
                    settleThreshold: 0.002};

// MOTION
const MOTION = {// Hover grows out more quickly than it retracts.
                hoverAttackSmoothTime: 0.28,
                hoverReleaseSmoothTime: 0.45,
                
                hoverDirectionSmoothTime: 0.22,

                // Listening should breathe in and settle more slowly.
                listeningAttackSmoothTime: 0.42,
                listeningReleaseSmoothTime: 0.75,

                // Hover and random radial displacement share this
                // bounded influence range.
                maxRadialExtra: 0.20};


export class Scene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private points: THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial>;

  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  private themeQuery: MediaQueryList;
  private onThemeChange: () => void;


  // Hover GPU state
  private focusDirection = uniform(new THREE.Vector2(1, 0));
  private focusAmount = uniform(0);


  // Listening GPU state
  private listeningAmount = uniform(0);

  // Radial wave GPU state
  private radialWaveDirections = Array.from({length: RADIAL_WAVE.maxEvents}, () => uniform(new THREE.Vector2(1, 0)));
  private radialWaveProgress = Array.from({length: RADIAL_WAVE.maxEvents}, () => uniform(0));
  private radialWaveStrength = Array.from({length: RADIAL_WAVE.maxEvents}, () => uniform(0));


  // Hover CPU motion
  private hoverTarget = 0;

  private focusValue = 0;
  private focusVelocity = 0;

  private focusAngle = 0;
  private focusAngleTarget = 0;
  private focusAngleVelocity = 0;

  // Listening CPU motion
  private listeningTarget = 0;

  private listeningValue = 0;
  private listeningVelocity = 0;

  // Radial wave CPU motion
  private radialWaveEvents: RadialWaveEvent[] = Array.from({length: RADIAL_WAVE.maxEvents}, () => this.createEmptyWaveEvent());

  private nextWaveSpawnAt = 0;
  private lastFrameTime = 0;


  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-2.125, 2.125,
                                                2.125, -2.125,
                                                0.1, 10);

    this.camera.position.z = 3;

    this.renderer = new THREE.WebGPURenderer({antialias: true, alpha: true});
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);

    container.appendChild(this.renderer.domElement);

    this.container = container;

    this.points = this.createCylinder();
    this.scene.add(this.points);

    // Resize
    this.resizeObserver = new ResizeObserver(() => {this.resize();});
    this.resizeObserver.observe(container);

    // Theme
    this.themeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.onThemeChange = () => {
      const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
      this.points.material.color.set(foreground);
    };

    this.themeQuery.addEventListener("change", this.onThemeChange);

    void this.start();
  }


  // Public interaction
  setHover(angle: number, active: boolean): void {
    if (active) {
      // SVG Y increases downward while Three.js Y increases upward.
      this.focusAngleTarget = -angle;
    }

    this.hoverTarget = active ? 1 : 0;
  }

  setListening(active: boolean): void {
    this.listeningTarget = active ? 1 : 0;
  }


  // Cylinder
  private createCylinder(): THREE.Points<THREE.BufferGeometry, THREE.PointsNodeMaterial> {
    // Base geometry
    const count = GEOMETRY.pointsAround * GEOMETRY.depthLayers;
    const positions = new Float32Array(count * 3);

    let index = 0;

    for (let layer = 0; layer < GEOMETRY.depthLayers; layer++) {
      const layerT = layer / (GEOMETRY.depthLayers - 1);
      const z = (layerT - 0.5) * GEOMETRY.depth;

      for (let i = 0; i < GEOMETRY.pointsAround; i++) {
        const angle = (i / GEOMETRY.pointsAround) * Math.PI * 2;

        const radialOffset = (Math.random() - 0.5) * GEOMETRY.radialThickness;
        const jitter = (Math.random() - 0.5) * GEOMETRY.radialJitter;
        const pointRadius = GEOMETRY.radius + radialOffset + jitter;

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


    // Continuous idle -> listening interpolation
    const blend = (idle: number, listening: number) => this.listeningAmount.mul(listening - idle).add(idle);

    const noiseSpeed = blend(IDLE.noiseSpeed, LISTENING.noiseSpeed);

    const largeNoiseScale = blend(IDLE.largeNoiseScale, LISTENING.largeNoiseScale);
    const largeNoiseAmplitude = blend(IDLE.largeNoiseAmplitude, LISTENING.largeNoiseAmplitude);
    const largeNoiseSpeed = blend(IDLE.largeNoiseSpeed, LISTENING.largeNoiseSpeed);

    const mediumNoiseScale = blend(IDLE.mediumNoiseScale, LISTENING.mediumNoiseScale);
    const mediumNoiseAmplitude = blend(IDLE.mediumNoiseAmplitude, LISTENING.mediumNoiseAmplitude);
    const mediumNoiseSpeed = blend(IDLE.mediumNoiseSpeed, LISTENING.mediumNoiseSpeed);

    const fineNoiseScale = blend(IDLE.fineNoiseScale, LISTENING.fineNoiseScale);
    const fineNoiseAmplitude = blend(IDLE.fineNoiseAmplitude, LISTENING.fineNoiseAmplitude);
    const fineNoiseSpeed = blend(IDLE.fineNoiseSpeed, LISTENING.fineNoiseSpeed);

    const scatterNoiseScale = blend(IDLE.scatterNoiseScale, LISTENING.scatterNoiseScale);
    const scatterAmplitude = blend(IDLE.scatterAmplitude, LISTENING.scatterAmplitude);

    const scatterSpeedX = blend(IDLE.scatterSpeedX, LISTENING.scatterSpeedX);
    const scatterSpeedY = blend(IDLE.scatterSpeedY, LISTENING.scatterSpeedY);
    const scatterSpeedZ = blend(IDLE.scatterSpeedZ, LISTENING.scatterSpeedZ);

    const depthNoiseScale = blend(IDLE.depthNoiseScale, LISTENING.depthNoiseScale);
    const depthScatterAmplitude = blend(IDLE.depthScatterAmplitude, LISTENING.depthScatterAmplitude);

    const depthSpeedX = blend(IDLE.depthSpeedX, LISTENING.depthSpeedX);
    const depthSpeedY = blend(IDLE.depthSpeedY, LISTENING.depthSpeedY);
    const depthSpeedZ = blend(IDLE.depthSpeedZ, LISTENING.depthSpeedZ);

    const timeOffset = vec3(0, 0, time.mul(noiseSpeed));

    // Surface
    const largeNoise = mx_noise_float(positionLocal.mul(largeNoiseScale).add(timeOffset.mul(largeNoiseSpeed)));
    const mediumNoise = mx_noise_float(positionLocal.mul(mediumNoiseScale).add(timeOffset.mul(mediumNoiseSpeed)));
    const fineNoise = mx_noise_float(positionLocal.mul(fineNoiseScale).add(timeOffset.mul(fineNoiseSpeed)));

    const surfaceNoise = largeNoise.mul(largeNoiseAmplitude)
                                   .add(mediumNoise.mul(mediumNoiseAmplitude))
                                   .add(fineNoise.mul(fineNoiseAmplitude));

    const surfaceDisplacement = radialDirection.mul(surfaceNoise);

    // Surface dispersal
    const scatterNoise = mx_noise_float(positionLocal.mul(scatterNoiseScale)
                                                     .add(vec3(time.mul(scatterSpeedX),
                                                        time.mul(scatterSpeedY),
                                                        time.mul(scatterSpeedZ))));

    const depthNoise = mx_noise_float(positionLocal.mul(depthNoiseScale)
                                                   .add(vec3(time.mul(depthSpeedX),
                                                      time.mul(depthSpeedY),
                                                      time.mul(depthSpeedZ))));

    const tangentialScatter = tangentDirection.mul(scatterNoise.mul(scatterAmplitude));
    const depthScatter = depthDirection.mul(depthNoise.mul(depthScatterAmplitude));
    const scatterDisplacement = tangentialScatter.add(depthScatter);


    // Hover focus
    const focusAlignment = radialDirection.x.mul(this.focusDirection.x)
                                            .add(radialDirection.y.mul(this.focusDirection.y));

    const focusWidthScale = 1 - Math.cos(FOCUS.width);
    const focusMask = exp(focusAlignment.sub(1).div(focusWidthScale));

    const focusNoise = mx_noise_float(positionLocal.mul(FOCUS.noiseScale)
                                                   .add(vec3(0, 0, time.mul(FOCUS.noiseSpeed))));

    const focusVariation = focusNoise.mul(FOCUS.noiseStrength).add(1.0).max(0);
    const focusMagnitude = focusMask.mul(this.focusAmount).mul(FOCUS.amplitude).mul(focusVariation);
    let radialInfluence = focusMagnitude.div(MOTION.maxRadialExtra).max(0).min(1);

    // Random radial waves / plumes
    const plumeScatter = vec3(0, 0, 0).toVar();

    for (let i = 0; i < RADIAL_WAVE.maxEvents; i++) {
      const direction = this.radialWaveDirections[i];
      const progress = this.radialWaveProgress[i];
      const strength = this.radialWaveStrength[i];

      const alignment = radialDirection.x.mul(direction.x)
                                         .add(radialDirection.y.mul(direction.y))
                                         .max(-1)
                                         .min(1);

      // 0 = event origin.
      // 1 = opposite side of the cylinder.
      //
      // Because acos(dot()) returns unsigned angular distance,
      // this represents both clockwise and counter-clockwise heads
      // simultaneously.
      const angularDistance = acos(alignment).div(Math.PI);

      // The short front envelope gives the event a soft leading edge.
      //
      // The much longer trail envelope creates the smoke-like wake.
      // There is no binary reached / not-reached wall.
      const aheadDistance = angularDistance.sub(progress).max(0);
      const behindDistance = progress.sub(angularDistance).max(0);

      const frontEnvelope = exp(aheadDistance.div(RADIAL_WAVE.frontSoftness).pow(2).negate());
      const trailEnvelope = exp(behindDistance.div(RADIAL_WAVE.trailLength).pow(2).negate());

      const plumeMask = frontEnvelope.mul(trailEnvelope).mul(strength);

      const plumeNoise = mx_noise_float(positionLocal.mul(RADIAL_WAVE.noiseScale)
                                                     .add(vec3(direction.x.mul(RADIAL_WAVE.noiseSeedScale),
                                                        direction.y.mul(RADIAL_WAVE.noiseSeedScale),
                                                        time.mul(RADIAL_WAVE.noiseSpeed))));

      const plumeVariation = plumeNoise.mul(RADIAL_WAVE.noiseStrength).add(1.0).max(0);

      const plumeMagnitude = plumeMask.mul(RADIAL_WAVE.maxAmplitude).mul(plumeVariation);

      const plumeInfluence = plumeMagnitude.div(MOTION.maxRadialExtra).max(0).min(1);

      // Saturating union:
      //
      // A + B - AB
      //
      // Both influences remain represented while the result stays
      // inside the shared 0..1 radial influence range.
      radialInfluence = radialInfluence.add(plumeInfluence)
                                       .sub(radialInfluence
                                       .mul(plumeInfluence));

      // Small off-axis motion breaks the appearance of a clean
      // advancing ring and gives the plume a soft dragged wake.
      const plumeTangential = tangentDirection.mul(plumeMask)
                                              .mul(plumeNoise)
                                              .mul(RADIAL_WAVE.tangentialAmplitude);

      const plumeDepth = depthDirection.mul(plumeMask)
                                       .mul(plumeNoise)
                                       .mul(RADIAL_WAVE.depthAmplitude);

      plumeScatter.addAssign(plumeTangential);
      plumeScatter.addAssign(plumeDepth);
    }

    // Bounded radial interaction displacement
    const radialExtra = radialDirection.mul(radialInfluence)
                                       .mul(MOTION.maxRadialExtra);

    // Final position
    material.positionNode = positionLocal.add(surfaceDisplacement)
                                         .add(scatterDisplacement)
                                         .add(radialExtra)
                                         .add(plumeScatter);

    return new THREE.Points(geometry, material);
  }

  // Continuous interaction motion
  private updateMotion(deltaTime: number): void {
    const hoverSmoothTime = this.hoverTarget > this.focusValue ? MOTION.hoverAttackSmoothTime : MOTION.hoverReleaseSmoothTime;

    [this.focusValue, this.focusVelocity] = this.smoothDamp(this.focusValue,
                                                            this.hoverTarget,
                                                            this.focusVelocity,
                                                            hoverSmoothTime,
                                                            deltaTime);

    this.focusAmount.value = this.focusValue;

    // Follow the shortest direction around the circle when moving
    // between different navigation links.
    const angleDelta = Math.atan2(Math.sin(this.focusAngleTarget - this.focusAngle),
                       Math.cos(this.focusAngleTarget - this.focusAngle));

    const desiredAngle = this.focusAngle + angleDelta;

    [this.focusAngle, this.focusAngleVelocity] = this.smoothDamp(this.focusAngle,
                                                                 desiredAngle,
                                                                 this.focusAngleVelocity,
                                                                 MOTION.hoverDirectionSmoothTime,
                                                                 deltaTime);

    this.focusDirection.value.set(Math.cos(this.focusAngle), Math.sin(this.focusAngle));


    const listeningSmoothTime = this.listeningTarget > this.listeningValue ? MOTION.listeningAttackSmoothTime : MOTION.listeningReleaseSmoothTime;

    [this.listeningValue, this.listeningVelocity] = this.smoothDamp(this.listeningValue,
                                                                    this.listeningTarget,
                                                                    this.listeningVelocity,
                                                                    listeningSmoothTime,
                                                                    deltaTime);

    this.listeningAmount.value = this.listeningValue;
  }


  // Random wave lifecycle
  private updateRadialWaves(now: number, deltaTime: number): void {
    if (now >= this.nextWaveSpawnAt) {
      this.spawnRadialWave(now);
    }

    for (let i = 0; i < this.radialWaveEvents.length; i++) {
      const event = this.radialWaveEvents[i];

      if (!event.active) continue;

      // Strength grows and decays using the same critically damped
      // motion used by the interactive states.
      const strengthTarget = event.settling ? 0 : 1;
      const strengthSmoothTime = event.settling ? RADIAL_WAVE.decaySmoothTime : RADIAL_WAVE.attackSmoothTime;

      [event.strength, event.strengthVelocity] = this.smoothDamp(event.strength,
                                                                 strengthTarget,
                                                                 event.strengthVelocity,
                                                                 strengthSmoothTime,
                                                                 deltaTime);

      // Propagation does not use discrete phases.
      //
      // It begins very slowly, smoothly accelerates over the first
      // part of the circumference, then remains at constant speed.
      if (!event.settling) {
        const rampRange = RADIAL_WAVE.rampEndProgress - RADIAL_WAVE.rampStartProgress;

        const rampT = THREE.MathUtils.clamp((event.progress - RADIAL_WAVE.rampStartProgress) / rampRange, 0, 1);

        const smoothRamp = rampT * rampT * (3 - 2 * rampT);

        const growthSpeed = THREE.MathUtils.lerp(RADIAL_WAVE.initialGrowthSpeed,
                                                 RADIAL_WAVE.travelGrowthSpeed,
                                                 smoothRamp);

        event.progress = Math.min(1, event.progress + growthSpeed * deltaTime);

        if (event.progress >= 1) {
          event.progress = 1;
          event.settling = true;
        }
      }


      this.radialWaveProgress[i].value = event.progress;
      this.radialWaveStrength[i].value = event.strength;


      // Do not reuse the slot until both visible strength and
      // residual spring velocity have effectively disappeared.
      if (event.settling &&
          event.strength < RADIAL_WAVE.settleThreshold &&
          Math.abs(event.strengthVelocity) < RADIAL_WAVE.settleThreshold) {

        this.deactivateWave(i);
      }
    }
  }


  private spawnRadialWave(now: number): void {
    const slot = this.radialWaveEvents.findIndex((event) => !event.active);

    this.scheduleNextWave(now);

    if (slot === -1) return;

    const angle = Math.random() * Math.PI * 2;
    const event = this.radialWaveEvents[slot];

    event.active = true;
    event.settling = false;

    event.angle = angle;
    event.progress = RADIAL_WAVE.startProgress;

    event.strength = 0;
    event.strengthVelocity = 0;

    this.radialWaveDirections[slot].value.set(Math.cos(angle), Math.sin(angle));
    this.radialWaveProgress[slot].value = RADIAL_WAVE.startProgress;
    this.radialWaveStrength[slot].value = 0;
  }

  private createEmptyWaveEvent(): RadialWaveEvent {
    return {active: false,
            settling: false,

            angle: 0,
            progress: RADIAL_WAVE.startProgress,

            strength: 0,
            strengthVelocity: 0};
  }

  private deactivateWave(index: number): void {
    this.radialWaveEvents[index] = this.createEmptyWaveEvent();

    this.radialWaveProgress[index].value = RADIAL_WAVE.startProgress;
    this.radialWaveStrength[index].value = 0;
  }

  private scheduleNextWave(now: number): void {
    const delay = THREE.MathUtils.lerp(RADIAL_WAVE.spawnMinDelay,
                                       RADIAL_WAVE.spawnMaxDelay,
                                       Math.random());

    this.nextWaveSpawnAt = now + delay;
  }

  // Closed-form critically damped spring
  private smoothDamp(current: number, target: number, velocity: number, smoothTime: number, deltaTime: number): [number, number] {
    const safeSmoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / safeSmoothTime;

    const offset = current - target;
    const decay = Math.exp(-omega * deltaTime);

    const temp = (velocity + omega * offset) * deltaTime;
    const nextValue = target + (offset + temp) * decay;
    const nextVelocity = (velocity - omega * temp) * decay;

    return [nextValue, nextVelocity];
  }

  // Resize
  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height, false);
  }

  // Render loop
  private async start(): Promise<void> {
    await this.renderer.init();

    const now = performance.now() / 1000;

    this.lastFrameTime = now;
    this.scheduleNextWave(now);

    this.renderer.setAnimationLoop(() => {
      const currentTime = performance.now() / 1000;

      // A suspended tab should resume gracefully instead of advancing
      // the entire system several seconds in a single frame.
      const deltaTime = Math.min(currentTime - this.lastFrameTime, 0.1);

      this.lastFrameTime = currentTime;

      this.updateMotion(deltaTime);
      this.updateRadialWaves(currentTime, deltaTime);

      this.renderer.render(this.scene, this.camera);
    });
  }

  // Cleanup
  dispose(): void {
    this.renderer.setAnimationLoop(null);

    this.resizeObserver.disconnect();
    this.themeQuery.removeEventListener("change", this.onThemeChange);

    this.points.geometry.dispose();
    this.points.material.dispose();

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}