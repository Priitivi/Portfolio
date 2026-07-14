export const fullscreenVertexShader = `#version 300 es
precision highp float;
out vec2 vUv;

void main () {
  vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = position;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

export const clearShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
out vec4 fragColor;
void main () { fragColor = texture(uTexture, vUv) * uValue; }`;

export const splatShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec3 uColour;
uniform float uRadius;
out vec4 fragColor;

void main () {
  vec2 offset = vUv - uPoint;
  offset.x *= uAspect;
  float influence = exp(-dot(offset, offset) / max(uRadius, 0.00001));
  vec3 base = texture(uTarget, vUv).rgb;
  fragColor = vec4(base + uColour * influence, 1.0);
}`;

export const advectionShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelocityTexel;
uniform vec2 uSourceTexel;
uniform float uDeltaTime;
uniform float uDissipation;
out vec4 fragColor;

vec4 bilerp (sampler2D textureSampler, vec2 uv, vec2 texel) {
  vec2 position = uv / texel - 0.5;
  vec2 index = floor(position);
  vec2 fraction = fract(position);
  vec2 a = (index + vec2(0.5)) * texel;
  vec4 bottom = mix(texture(textureSampler, a), texture(textureSampler, a + vec2(texel.x, 0.0)), fraction.x);
  vec4 top = mix(texture(textureSampler, a + vec2(0.0, texel.y)), texture(textureSampler, a + texel), fraction.x);
  return mix(bottom, top, fraction.y);
}

void main () {
  vec2 velocity = bilerp(uVelocity, vUv, uVelocityTexel).xy;
  vec2 coordinate = vUv - uDeltaTime * velocity * uVelocityTexel;
  float decay = 1.0 + uDissipation * uDeltaTime;
  fragColor = bilerp(uSource, coordinate, uSourceTexel) / decay;
}`;

export const divergenceShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 fragColor;

void main () {
  float left = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float right = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float bottom = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float top = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  vec2 centre = texture(uVelocity, vUv).xy;
  if (vUv.x < uTexel.x) left = -centre.x;
  if (vUv.x > 1.0 - uTexel.x) right = -centre.x;
  if (vUv.y < uTexel.y) bottom = -centre.y;
  if (vUv.y > 1.0 - uTexel.y) top = -centre.y;
  fragColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
}`;

export const curlShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 fragColor;

void main () {
  float left = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float right = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float bottom = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float top = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  fragColor = vec4(0.5 * (right - left - top + bottom), 0.0, 0.0, 1.0);
}`;

export const vorticityShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform float uDeltaTime;
out vec4 fragColor;

void main () {
  float left = abs(texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
  float right = abs(texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
  float bottom = abs(texture(uCurl, vUv - vec2(0.0, uTexel.y)).x);
  float top = abs(texture(uCurl, vUv + vec2(0.0, uTexel.y)).x);
  float centre = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(top - bottom, right - left);
  force /= length(force) + 0.0001;
  force *= uCurlStrength * centre;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * uDeltaTime;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

export const pressureShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
out vec4 fragColor;

void main () {
  float left = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (left + right + bottom + top - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

export const gradientSubtractShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 fragColor;

void main () {
  float left = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(right - left, top - bottom);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

export const displayShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uDye;
uniform vec3 uBackground;
uniform vec2 uDyeTexel;
uniform float uTime;
out vec4 fragColor;

float noise (vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main () {
  vec3 dye = max(texture(uDye, vUv).rgb, 0.0);
  float left = length(texture(uDye, vUv - vec2(uDyeTexel.x, 0.0)).rgb);
  float right = length(texture(uDye, vUv + vec2(uDyeTexel.x, 0.0)).rgb);
  float bottom = length(texture(uDye, vUv - vec2(0.0, uDyeTexel.y)).rgb);
  float top = length(texture(uDye, vUv + vec2(0.0, uDyeTexel.y)).rgb);
  vec3 normal = normalize(vec3(right - left, top - bottom, 0.18));
  float light = clamp(dot(normal, normalize(vec3(-0.4, 0.55, 0.7))) + 0.65, 0.35, 1.25);
  vec3 colour = (1.0 - exp(-dye * 1.45)) * light;
  float vignette = smoothstep(0.95, 0.28, distance(vUv, vec2(0.5)));
  colour = mix(uBackground, colour + uBackground * 0.35, clamp(length(dye) * 0.7, 0.0, 1.0));
  colour *= 0.7 + 0.3 * vignette;
  colour += (noise(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  fragColor = vec4(colour, 1.0);
}`;
