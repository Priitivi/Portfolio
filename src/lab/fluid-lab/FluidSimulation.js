import { FLUID_PALETTES, FLUID_QUALITY_PRESETS, fluidColourForSplat, resolveFluidDimensions } from "./fluidConfig";
import {
  advectionShader,
  clearShader,
  curlShader,
  displayShader,
  divergenceShader,
  fullscreenVertexShader,
  gradientSubtractShader,
  pressureShader,
  splatShader,
  vorticityShader,
} from "./shaders";

const PROGRAM_SOURCES = {
  clear: clearShader,
  splat: splatShader,
  advection: advectionShader,
  divergence: divergenceShader,
  curl: curlShader,
  vorticity: vorticityShader,
  pressure: pressureShader,
  gradient: gradientSubtractShader,
  display: displayShader,
};

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation failure";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, fullscreenVertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const handle = gl.createProgram();
  gl.attachShader(handle, vertex);
  gl.attachShader(handle, fragment);
  gl.linkProgram(handle);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(handle) || "Unknown shader linking failure";
    gl.deleteProgram(handle);
    throw new Error(message);
  }

  const uniforms = {};
  const total = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < total; index += 1) {
    const info = gl.getActiveUniform(handle, index);
    if (info) uniforms[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(handle, info.name);
  }
  return { handle, uniforms };
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export default class FluidSimulation {
  constructor(canvas, { settings, quality = "balanced", reducedMotion = false, onPerformance, onContextState } = {}) {
    this.canvas = canvas;
    this.settings = { ...settings };
    this.quality = FLUID_QUALITY_PRESETS[quality] ? quality : "balanced";
    this.reducedMotion = reducedMotion;
    this.onPerformance = onPerformance;
    this.onContextState = onContextState;
    this.programs = {};
    this.splatQueue = [];
    this.targets = null;
    this.running = false;
    this.paused = false;
    this.hidden = document.hidden;
    this.sequence = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.lastAmbient = 0;
    this.performanceWindow = { elapsed: 0, frames: 0 };
    this.allocationKey = "";
    this.contextLost = false;

    this.handleVisibility = () => {
      this.hidden = document.hidden;
      this.lastTime = 0;
    };
    this.handleResize = () => this.resize();
    this.handleContextLost = (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.onContextState?.("lost");
    };
    this.handleContextRestored = () => {
      this.onContextState?.("restored");
    };
  }

  initialise() {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WEBGL2_UNAVAILABLE");
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("FLOAT_FRAMEBUFFER_UNAVAILABLE");

    this.gl = gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    Object.entries(PROGRAM_SOURCES).forEach(([name, source]) => {
      this.programs[name] = createProgram(gl, source);
    });

    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
    document.addEventListener("visibilitychange", this.handleVisibility);
    window.addEventListener("resize", this.handleResize);
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.canvas);
    }

    this.resize(true);
    this.clear();
    this.randomBurst(this.reducedMotion ? 5 : 10, true);
    this.running = true;
    this.frameHandle = window.requestAnimationFrame((time) => this.frame(time));
    return this;
  }

  createTarget(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      throw new Error("FLOAT_FRAMEBUFFER_INCOMPLETE");
    }
    return { texture, framebuffer, width, height, texel: [1 / width, 1 / height] };
  }

  createDoubleTarget(width, height) {
    const target = {
      read: this.createTarget(width, height),
      write: this.createTarget(width, height),
      swap() { [this.read, this.write] = [this.write, this.read]; },
    };
    return target;
  }

  deleteTarget(target) {
    if (!target || !this.gl) return;
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
  }

  deleteTargets() {
    if (!this.targets) return;
    this.deleteTarget(this.targets.velocity.read);
    this.deleteTarget(this.targets.velocity.write);
    this.deleteTarget(this.targets.dye.read);
    this.deleteTarget(this.targets.dye.write);
    this.deleteTarget(this.targets.pressure.read);
    this.deleteTarget(this.targets.pressure.write);
    this.deleteTarget(this.targets.divergence);
    this.deleteTarget(this.targets.curl);
    this.targets = null;
  }

  allocateTargets(aspect) {
    const preset = FLUID_QUALITY_PRESETS[this.quality];
    const simulation = resolveFluidDimensions(preset.simulationResolution, aspect);
    const dye = resolveFluidDimensions(preset.dyeResolution, aspect);
    const key = `${simulation.width}x${simulation.height}/${dye.width}x${dye.height}`;
    if (key === this.allocationKey && this.targets) return;

    this.deleteTargets();
    this.targets = {
      velocity: this.createDoubleTarget(simulation.width, simulation.height),
      dye: this.createDoubleTarget(dye.width, dye.height),
      pressure: this.createDoubleTarget(simulation.width, simulation.height),
      divergence: this.createTarget(simulation.width, simulation.height),
      curl: this.createTarget(simulation.width, simulation.height),
    };
    this.allocationKey = key;
    this.clear();
    this.randomBurst(this.reducedMotion ? 4 : 8, true);
  }

  resize(force = false) {
    if (!this.gl || this.contextLost) return;
    const preset = FLUID_QUALITY_PRESETS[this.quality];
    const dpr = Math.min(window.devicePixelRatio || 1, preset.dpr);
    const width = Math.max(1, Math.round((this.canvas.clientWidth || window.innerWidth) * dpr));
    const height = Math.max(1, Math.round((this.canvas.clientHeight || window.innerHeight) * dpr));
    if (force || this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.allocateTargets(width / height);
  }

  use(programName) {
    const program = this.programs[programName];
    this.gl.useProgram(program.handle);
    return program;
  }

  uniform1f(program, name, value) {
    const location = program.uniforms[name];
    if (location !== null && location !== undefined) this.gl.uniform1f(location, value);
  }

  uniform2f(program, name, value) {
    const location = program.uniforms[name];
    if (location !== null && location !== undefined) this.gl.uniform2f(location, value[0], value[1]);
  }

  uniform3f(program, name, value) {
    const location = program.uniforms[name];
    if (location !== null && location !== undefined) this.gl.uniform3f(location, value[0], value[1], value[2]);
  }

  texture(program, name, target, unit) {
    const location = program.uniforms[name];
    if (location === null || location === undefined) return;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, target.texture);
    this.gl.uniform1i(location, unit);
  }

  draw(target = null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer || null);
    gl.viewport(0, 0, target?.width || this.canvas.width, target?.height || this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  clearTarget(target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  clear() {
    if (!this.targets || this.contextLost) return;
    const { velocity, dye, pressure, divergence, curl } = this.targets;
    [velocity.read, velocity.write, dye.read, dye.write, pressure.read, pressure.write, divergence, curl].forEach((target) => this.clearTarget(target));
    this.splatQueue.length = 0;
    this.render();
  }

  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.lastTime = 0;
  }

  setQuality(quality) {
    if (!FLUID_QUALITY_PRESETS[quality] || quality === this.quality) return;
    this.quality = quality;
    this.allocationKey = "";
    this.resize(true);
  }

  queueSplat(x, y, deltaX = 0, deltaY = 0, colour = null, quiet = false) {
    const selectedColour = colour || fluidColourForSplat(this.settings.palette, this.sequence++);
    this.splatQueue.push({ x, y, deltaX, deltaY, colour: selectedColour, quiet });
    if (this.splatQueue.length > 64) this.splatQueue.splice(0, this.splatQueue.length - 64);
  }

  randomBurst(count = 7, quiet = false) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.015 + Math.random() * 0.035;
      this.queueSplat(
        0.16 + Math.random() * 0.68,
        0.16 + Math.random() * 0.68,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        null,
        quiet,
      );
    }
  }

  applySplat(target, point, colour, radius) {
    const program = this.use("splat");
    this.texture(program, "uTarget", target.read, 0);
    this.uniform1f(program, "uAspect", target.read.width / target.read.height);
    this.uniform2f(program, "uPoint", point);
    this.uniform3f(program, "uColour", colour);
    this.uniform1f(program, "uRadius", radius * radius);
    this.draw(target.write);
    target.swap();
  }

  flushSplats() {
    if (!this.targets || this.splatQueue.length === 0) return;
    const queue = this.splatQueue.splice(0, this.splatQueue.length);
    queue.forEach((splat) => {
      const force = this.settings.force * (splat.quiet ? 0.42 : 1);
      const dye = this.settings.dye * (splat.quiet ? 0.56 : 1);
      const velocity = [splat.deltaX * force * 1800, splat.deltaY * force * 1800, 0];
      const colour = splat.colour.map((channel) => channel * dye);
      this.applySplat(this.targets.velocity, [splat.x, splat.y], velocity, this.settings.brush * 0.72);
      this.applySplat(this.targets.dye, [splat.x, splat.y], colour, this.settings.brush);
    });
  }

  simulate(deltaTime) {
    const gl = this.gl;
    const { velocity, dye, pressure, divergence, curl } = this.targets;
    const velocityTexel = velocity.read.texel;

    let program = this.use("curl");
    this.texture(program, "uVelocity", velocity.read, 0);
    this.uniform2f(program, "uTexel", velocityTexel);
    this.draw(curl);

    program = this.use("vorticity");
    this.texture(program, "uVelocity", velocity.read, 0);
    this.texture(program, "uCurl", curl, 1);
    this.uniform2f(program, "uTexel", velocityTexel);
    this.uniform1f(program, "uCurlStrength", this.settings.vorticity);
    this.uniform1f(program, "uDeltaTime", deltaTime);
    this.draw(velocity.write);
    velocity.swap();

    program = this.use("divergence");
    this.texture(program, "uVelocity", velocity.read, 0);
    this.uniform2f(program, "uTexel", velocityTexel);
    this.draw(divergence);

    program = this.use("clear");
    this.texture(program, "uTexture", pressure.read, 0);
    this.uniform1f(program, "uValue", 0.78);
    this.draw(pressure.write);
    pressure.swap();

    program = this.use("pressure");
    this.texture(program, "uDivergence", divergence, 1);
    this.uniform2f(program, "uTexel", velocityTexel);
    const iterations = FLUID_QUALITY_PRESETS[this.quality].pressureIterations;
    for (let index = 0; index < iterations; index += 1) {
      this.texture(program, "uPressure", pressure.read, 0);
      this.draw(pressure.write);
      pressure.swap();
    }

    program = this.use("gradient");
    this.texture(program, "uPressure", pressure.read, 0);
    this.texture(program, "uVelocity", velocity.read, 1);
    this.uniform2f(program, "uTexel", velocityTexel);
    this.draw(velocity.write);
    velocity.swap();

    program = this.use("advection");
    this.texture(program, "uVelocity", velocity.read, 0);
    this.texture(program, "uSource", velocity.read, 1);
    this.uniform2f(program, "uVelocityTexel", velocityTexel);
    this.uniform2f(program, "uSourceTexel", velocityTexel);
    this.uniform1f(program, "uDeltaTime", deltaTime);
    this.uniform1f(program, "uDissipation", 0.18 + this.settings.dissipation * 1.4);
    this.draw(velocity.write);
    velocity.swap();

    program = this.use("advection");
    this.texture(program, "uVelocity", velocity.read, 0);
    this.texture(program, "uSource", dye.read, 1);
    this.uniform2f(program, "uVelocityTexel", velocityTexel);
    this.uniform2f(program, "uSourceTexel", dye.read.texel);
    this.uniform1f(program, "uDeltaTime", deltaTime);
    this.uniform1f(program, "uDissipation", this.settings.dissipation);
    this.draw(dye.write);
    dye.swap();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  render() {
    if (!this.gl || !this.targets || this.contextLost) return;
    const palette = FLUID_PALETTES[this.settings.palette] || FLUID_PALETTES.aurora;
    const program = this.use("display");
    this.texture(program, "uDye", this.targets.dye.read, 0);
    this.uniform3f(program, "uBackground", hexToRgb(palette.background));
    this.uniform2f(program, "uDyeTexel", this.targets.dye.read.texel);
    this.uniform1f(program, "uTime", this.elapsed * 1000);
    this.draw();
  }

  frame(time) {
    if (!this.running) return;
    this.frameHandle = window.requestAnimationFrame((nextTime) => this.frame(nextTime));
    if (this.contextLost || this.hidden || this.paused || !this.targets) {
      this.lastTime = time;
      return;
    }

    const rawDelta = this.lastTime ? (time - this.lastTime) / 1000 : 1 / 60;
    const deltaTime = Math.min(1 / 30, Math.max(1 / 120, rawDelta));
    this.lastTime = time;
    this.elapsed += deltaTime;

    if (!this.reducedMotion && this.elapsed - this.lastAmbient > 5.5) {
      this.randomBurst(2, true);
      this.lastAmbient = this.elapsed;
    }

    this.flushSplats();
    this.simulate(deltaTime);
    this.render();

    this.performanceWindow.elapsed += rawDelta;
    this.performanceWindow.frames += 1;
    if (this.performanceWindow.elapsed >= 1) {
      const fps = Math.round(this.performanceWindow.frames / this.performanceWindow.elapsed);
      this.onPerformance?.({ fps, quality: this.quality, resolution: this.allocationKey });
      this.performanceWindow.elapsed = 0;
      this.performanceWindow.frames = 0;
    }
  }

  destroy() {
    this.running = false;
    if (this.frameHandle) window.cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    if (!this.gl || this.contextLost) return;
    this.deleteTargets();
    Object.values(this.programs).forEach((program) => this.gl.deleteProgram(program.handle));
    this.gl.deleteVertexArray(this.vao);
    this.programs = {};
  }
}
