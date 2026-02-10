'use client';

import { useEffect, useRef } from "react";

export default function RadialNav({
    hoverAngle = 0,
    hoverStrength = 0,
  }: {
    hoverAngle?: number;
    hoverStrength?: number;
  }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverAngleRef = useRef(0);
  const hoverStrengthRef = useRef(0);

  useEffect(() => { 
    hoverAngleRef.current = hoverAngle; 
    }, [hoverAngle]
  );
  useEffect(() => { 
    hoverStrengthRef.current = hoverStrength; 
    }, [hoverStrength]
  );

  useEffect(() => {
    let device: GPUDevice;
    let context: GPUCanvasContext;
    let pipeline: GPURenderPipeline;
    let uniformBuffer: GPUBuffer;
    let bindGroup: GPUBindGroup;
    let format: GPUTextureFormat;
    let hoverA = 0; // smoothed angle
    let hoverS = 0; // smoothed strength

    let raf = 0;
    let msaaTexture: GPUTexture | null = null;
    let lastW = 0, lastH = 0;

    function hexToRGB01(hex: string) {
      const v = hex.replace("#", "").trim();
      return {
        r: parseInt(v.slice(0, 2), 16) / 255,
        g: parseInt(v.slice(2, 4), 16) / 255,
        b: parseInt(v.slice(4, 6), 16) / 255,
      };
    }

    async function init() {
      if (!navigator.gpu) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return;

      device = await adapter.requestDevice();

      context = canvas.getContext("webgpu")!;
      format = navigator.gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format,
        alphaMode: "premultiplied",
      });

      // Uniforms (64 bytes, aligned to 16):
      // resolution.xy, time, theme
      // color.rgba
      // params: radius, baseThickness, glow, spikeStrength
      // params2: noiseScale, noiseSpeed, wobble, _pad
    const shaderCode = /* wgsl */`
        struct Uniforms {
        resolution : vec2<f32>,
        time : f32,
        _pad0 : f32,
        color : vec4<f32>,
        params : vec4<f32>, // radius, thickness, spikeHeight, noiseAmount
        params2 : vec4<f32>,
        };

        @group(0) @binding(0)
        var<uniform> u : Uniforms;

        fn hash(p: vec2<f32>) -> f32 {
            return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
        }

        fn noise(p: vec2<f32>) -> f32 {
            let i = floor(p);
            let f = fract(p);

            let a = hash(i);
            let b = hash(i + vec2<f32>(1.0, 0.0));
            let c = hash(i + vec2<f32>(0.0, 1.0));
            let d = hash(i + vec2<f32>(1.0, 1.0));

            let u2 = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u2.x)
            + (c - a) * u2.y * (1.0 - u2.x)
            + (d - b) * u2.x * u2.y;
        }

        @vertex
        fn vs_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
            var p = array<vec2<f32>, 6>(
                vec2(-1.0, -1.0),
                vec2( 1.0, -1.0),
                vec2(-1.0,  1.0),
                vec2(-1.0,  1.0),
                vec2( 1.0, -1.0),
                vec2( 1.0,  1.0),
            );
        return vec4(p[i], 0.0, 1.0);
        }

        // A single “layer” of the ring (one band + spikes), returns alpha.
        // This is the reusable building block for stacked rings.
        fn ringLayer(r: f32, ang: f32, t: f32,
                    baseRadius: f32,
                    baseThickness: f32,
                    spikeHeight: f32,
                    noiseAmount: f32,
                    angScale: f32,
                    timeSpeed: f32,
                    spikeLo: f32,
                    spikeHi: f32,
                    layerOpacity: f32,
                    mask: f32) -> f32 {
                                
            //static angular structure
            let n_static = noise(vec2<f32>(ang * angScale, 0.0));
            
            //time agitation (no rotation: time is on Y axis only)
            let n_time = noise(vec2<f32>(ang * angScale, t * timeSpeed));
            let n = mix(n_static, n_time, 0.6);
            
            // Damp everything away from the hovered direction
            let spikeHeight2 = spikeHeight * (0.05 + 2.8 * mask);
            let noiseAmount2 = noiseAmount * (0.20 + 0.80 * mask);
            
            //rare spikes
            let spikes = smoothstep(spikeLo, spikeHi, n);
            
            //radius displacement (masked)
            let radius = baseRadius + n * noiseAmount2 + spikes * spikeHeight2;

            // Thickness jitter
            let thickness = baseThickness * (0.65 + 0.8 * n);

            // Band alpha
            let edge = abs(r - radius);
            let a = smoothstep(thickness, 0.0, edge);

          return a * layerOpacity;
        }

        @fragment
        fn fs_main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
            let uv = (p.xy - 0.5 * u.resolution) / min(u.resolution.x, u.resolution.y);
            let r   = length(uv);
            let ang = atan2(uv.y, uv.x);

            let baseRadius    = u.params.x;
            let baseThickness = u.params.y;
            let spikeHeight   = u.params.z;
            let noiseAmount   = u.params.w;
            let hoverAngle    = u.params2.x;

            let hoverStrength = u.params2.y;
            let hoverWidth    = u.params2.z;

            // wrapped angular distance (0..pi)
            let d = abs(atan2(sin(ang - hoverAngle), cos(ang - hoverAngle)));

            // gaussian-ish spotlight (1 near hoverAngle, 0 away)
            let focus = exp(-0.5 * (d / hoverWidth) * (d / hoverWidth));

            // when not hovering, mask = 1 everywhere (no damping)
            let mask = mix(1.0, focus, hoverStrength);

            let t = u.time;

            // ---- Stack multiple layers (overlap = darker) ----
            // Main rim: sharp + dominant
            var a = 0.0;
            a = a + ringLayer(
                r, ang, t,
                baseRadius,
                baseThickness,
                spikeHeight,
                noiseAmount,
                18.0, 0.8,
                0.82, 0.95,
                1.00,
                mask
            );

            // Under-rings: slightly offset outward, thicker, lower opacity
            // These create the “wide wave with smaller versions under it”.
            a = a + ringLayer(
                r, ang, t,
                baseRadius + 0.006,
                baseThickness * 2.2,
                spikeHeight * 0.55,
                noiseAmount * 0.75,
                10.0, 0.55,
                0.78, 0.92,
                0.35,
                mask
            );

            a = a + ringLayer(
                r, ang, t,
                baseRadius + 0.012,
                baseThickness * 3.2,
                spikeHeight * 0.40,
                noiseAmount * 0.60,
                7.0, 0.40,
                0.76, 0.90,
                0.22,
                mask
            );

            // Fine-grain “shading” scribble: high frequency, very low opacity
            a = a + ringLayer(
                r, ang, t,
                baseRadius + 0.010,
                baseThickness * 1.6,
                spikeHeight * 0.25,
                noiseAmount * 0.40,
                32.0, 1.20,
                0.84, 0.97,
                0.12,
                mask
            );

            // Clamp final alpha (alpha stacking creates overlap darkening)
            a = clamp(a, 0.0, 1.0);

          return vec4(u.color.rgb, a);
        }`;

      pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: device.createShaderModule({ code: shaderCode }),
          entryPoint: "vs_main",
        },
        fragment: {
          module: device.createShaderModule({ code: shaderCode }),
          entryPoint: "fs_main",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
        multisample: { count: 4 },
      });

      uniformBuffer = device.createBuffer({
        size: 96,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      });

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => { /* theme handled per-frame */ };
      media.addEventListener("change", onChange);

      const onResize = () => { /* size handled per-frame */ };
      window.addEventListener("resize", onResize);

      const frame = (ms: number) => {
        render(ms * 0.001);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      return () => {
        media.removeEventListener("change", onChange);
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
      };
    }

    function ensureSize() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (w === lastW && h === lastH) return;

      lastW = w; lastH = h;
      canvas.width = w;
      canvas.height = h;

      msaaTexture?.destroy();
      msaaTexture = device.createTexture({
        size: [w, h],
        sampleCount: 4,
        format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    function render(time: number) {
      const canvas = canvasRef.current;
      if (!canvas || !device) return;

      ensureSize();
      if (!msaaTexture) return;

      const css = getComputedStyle(document.documentElement);
      const bgHex = css.getPropertyValue("--background").trim();
      const fgHex = css.getPropertyValue("--foreground").trim();
      const bg = hexToRGB01(bgHex);
      const fg = hexToRGB01(fgHex);

      //shortest-angle lerp
      const a0 = hoverA;
      const a1 = hoverAngleRef.current;
      const da = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
      hoverA = a0 + da * 0.12; //smoothing factor

      hoverS += (hoverStrengthRef.current - hoverS) * 0.12;

      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([
            canvas.width,
            canvas.height,
            time,
            0.0,

            fg.r, fg.g, fg.b, 1.0,

            0.35, // radius
            0.0028, // thickness
            0.07, // spike height
            0.030, // noise amount

            hoverA, hoverS, 0.35, 0.0,
        ])
      );

      const encoder = device.createCommandEncoder();

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: msaaTexture.createView(),
          resolveTarget: context.getCurrentTexture().createView(),
          clearValue: { r: bg.r, g: bg.g, b: bg.b, a: 1 },
          loadOp: "clear",
          storeOp: "discard",
        }],
      });

      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);
      pass.end();

      device.queue.submit([encoder.finish()]);
    }

    let cleanup: void | (() => void);
    init().then((c) => { cleanup = c as any; });

    return () => {
      if (cleanup) cleanup();
      cancelAnimationFrame(raf);
      msaaTexture?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="radius-canvas"
      style={{ 
        width: "110%", 
        height: "110%",
        pointerEvents: "none" }}
    />
  );
}