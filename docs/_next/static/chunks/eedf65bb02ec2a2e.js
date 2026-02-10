(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67585,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"BailoutToCSR",{enumerable:!0,get:function(){return a}});let n=e.r(32061);function a({reason:e,children:t}){if("u"<typeof window)throw Object.defineProperty(new n.BailoutToCSRError(e),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return t}},9885,(e,t,r)=>{"use strict";function n(e){return e.split("/").map(e=>encodeURIComponent(e)).join("/")}Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"encodeURIPath",{enumerable:!0,get:function(){return n}})},52157,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"PreloadChunks",{enumerable:!0,get:function(){return l}});let n=e.r(43476),a=e.r(74080),i=e.r(63599),s=e.r(9885),o=e.r(43369);function l({moduleIds:e}){if("u">typeof window)return null;let t=i.workAsyncStorage.getStore();if(void 0===t)return null;let r=[];if(t.reactLoadableManifest&&e){let n=t.reactLoadableManifest;for(let t of e){if(!n[t])continue;let e=n[t].files;r.push(...e)}}if(0===r.length)return null;let l=(0,o.getDeploymentIdQueryOrEmptyString)();return(0,n.jsx)(n.Fragment,{children:r.map(e=>{let r=`${t.assetPrefix}/_next/${(0,s.encodeURIPath)(e)}${l}`;return e.endsWith(".css")?(0,n.jsx)("link",{precedence:"dynamic",href:r,rel:"stylesheet",as:"style",nonce:t.nonce},e):((0,a.preload)(r,{as:"script",fetchPriority:"low",nonce:t.nonce}),null)})})}},69093,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"default",{enumerable:!0,get:function(){return u}});let n=e.r(43476),a=e.r(71645),i=e.r(67585),s=e.r(52157);function o(e){return{default:e&&"default"in e?e.default:e}}let l={loader:()=>Promise.resolve(o(()=>null)),loading:null,ssr:!0},u=function(e){let t={...l,...e},r=(0,a.lazy)(()=>t.loader().then(o)),u=t.loading;function c(e){let o=u?(0,n.jsx)(u,{isLoading:!0,pastDelay:!0,error:null}):null,l=!t.ssr||!!t.loading,c=l?a.Suspense:a.Fragment,d=t.ssr?(0,n.jsxs)(n.Fragment,{children:["u"<typeof window?(0,n.jsx)(s.PreloadChunks,{moduleIds:t.modules}):null,(0,n.jsx)(r,{...e})]}):(0,n.jsx)(i.BailoutToCSR,{reason:"next/dynamic",children:(0,n.jsx)(r,{...e})});return(0,n.jsx)(c,{...l?{fallback:o}:{},children:d})}return c.displayName="LoadableComponent",c}},70703,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"default",{enumerable:!0,get:function(){return a}});let n=e.r(55682)._(e.r(69093));function a(e,t){let r={};"function"==typeof e&&(r.loader=e);let a={...r,...t};return(0,n.default)({...a,modules:a.loadableGenerated?.modules})}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},39317,e=>{"use strict";var t=e.i(43476),r=e.i(71645);function n({hoverAngle:e=0,hoverStrength:n=0}){let a=(0,r.useRef)(null),i=(0,r.useRef)(0),s=(0,r.useRef)(0);return(0,r.useEffect)(()=>{i.current=e},[e]),(0,r.useEffect)(()=>{s.current=n},[n]),(0,r.useEffect)(()=>{let e,t,r,n,o,l,u,c=0,d=0,f=0,p=null,h=0,g=0;function m(e){let t=e.replace("#","").trim();return{r:parseInt(t.slice(0,2),16)/255,g:parseInt(t.slice(2,4),16)/255,b:parseInt(t.slice(4,6),16)/255}}return(async function u(){if(!navigator.gpu)return;let u=a.current;if(!u)return;let v=await navigator.gpu.requestAdapter();if(!v)return;e=await v.requestDevice(),t=u.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat(),t.configure({device:e,format:l,alphaMode:"premultiplied"});let b=`
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
        }`;r=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:b}),entryPoint:"vs_main"},fragment:{module:e.createShaderModule({code:b}),entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"},multisample:{count:4}}),n=e.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o=e.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}}]});let y=window.matchMedia("(prefers-color-scheme: dark)"),k=()=>{};y.addEventListener("change",k);let w=()=>{};window.addEventListener("resize",w);let x=u=>{(function(u){let f=a.current;if(!f||!e||(!function(){let t=a.current;if(!t)return;let r=t.getBoundingClientRect(),n=window.devicePixelRatio||1,i=Math.max(1,Math.floor(r.width*n)),s=Math.max(1,Math.floor(r.height*n));(i!==h||s!==g)&&(h=i,g=s,t.width=i,t.height=s,p?.destroy(),p=e.createTexture({size:[i,s],sampleCount:4,format:l,usage:GPUTextureUsage.RENDER_ATTACHMENT}))}(),!p))return;let v=getComputedStyle(document.documentElement),b=v.getPropertyValue("--background").trim(),y=v.getPropertyValue("--foreground").trim(),k=m(b),w=m(y),x=c,P=i.current,j=Math.atan2(Math.sin(P-x),Math.cos(P-x));c=x+.12*j,d+=(s.current-d)*.12,e.queue.writeBuffer(n,0,new Float32Array([f.width,f.height,u,0,w.r,w.g,w.b,1,.35,.0028,.07,.03,c,d,.35,0]));let _=e.createCommandEncoder(),A=_.beginRenderPass({colorAttachments:[{view:p.createView(),resolveTarget:t.getCurrentTexture().createView(),clearValue:{r:k.r,g:k.g,b:k.b,a:1},loadOp:"clear",storeOp:"discard"}]});A.setPipeline(r),A.setBindGroup(0,o),A.draw(6),A.end(),e.queue.submit([_.finish()])})(.001*u),f=requestAnimationFrame(x)};return f=requestAnimationFrame(x),()=>{y.removeEventListener("change",k),window.removeEventListener("resize",w),cancelAnimationFrame(f)}})().then(e=>{u=e}),()=>{u&&u(),cancelAnimationFrame(f),p?.destroy()}},[]),(0,t.jsx)("canvas",{ref:a,className:"radius-canvas",style:{width:"110%",height:"110%",pointerEvents:"none"}})}var a=e.i(70703);let i=[{label:"ABOUT",href:"/",angle:-1.1},{label:"PROJECTS",href:"/projects",angle:-2},{label:"POSTS",href:"/posts",angle:2.4}],s=(0,a.default)(()=>e.A(74353).then(e=>e.RadialNavOverlay),{loadableGenerated:{modules:[67941]},ssr:!1});function o(){let[e,a]=(0,r.useState)(0),[o,l]=(0,r.useState)(0);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n,{hoverAngle:e,hoverStrength:o}),(0,t.jsx)(s,{nav:i,onHover:e=>{a(e),l(1)},onLeave:()=>l(0)})]})}e.s(["default",()=>o],39317)},74353,e=>{e.v(t=>Promise.all(["static/chunks/9bfa2d12b1affa71.js"].map(t=>e.l(t))).then(()=>t(67941)))}]);