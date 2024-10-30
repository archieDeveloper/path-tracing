export const vertexShaderSource = `
attribute vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

export const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

struct Sphere {
  vec3 center;
  float radius;
  vec3 color;
};

Sphere sphere = Sphere(vec3(0.0, 0.0, 1.0), 0.5, vec3(1.0, 0.0, 0.0));

vec3 lightPosition = vec3(0.0, 1000.0, 1.0);

float intersectSphere(vec3 rayOrigin, vec3 rayDir, Sphere sphere) {
  vec3 oc = rayOrigin - sphere.center;
  float a = dot(rayDir, rayDir);
  float b = 2.0 * dot(oc, rayDir);
  float c = dot(oc, oc) - sphere.radius * sphere.radius;
  float discriminant = b * b - 4.0 * a * c;
  if (discriminant < 0.0) {
    return -1.0;
  } else {
    return (-b - sqrt(discriminant)) / (2.0 * a);
  }
}

vec3 traceRay(vec3 rayOrigin, vec3 rayDir) {
  float t = intersectSphere(rayOrigin, rayDir, sphere);
  if (t > 0.0) {
    vec3 hitPoint = rayOrigin + t * rayDir;
    vec3 normal = normalize(hitPoint - sphere.center);

    // Освещение (модель Ламберта)
    vec3 lightDir = normalize(lightPosition - hitPoint);
    float lightIntensity = max(dot(normal, lightDir), 0.0);

    vec3 color = lightIntensity * sphere.color;
    return color;
  }
  return vec3(0.53, 0.81, 0.98); // Цвет неба (фон)
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;
  
  vec3 rayOrigin = vec3(0.0, 0.0, 0.0);
  vec3 rayDir = normalize(vec3(uv, 1.0));

  vec3 color = traceRay(rayOrigin, rayDir);
  gl_FragColor = vec4(color, 1.0);
}
`;
