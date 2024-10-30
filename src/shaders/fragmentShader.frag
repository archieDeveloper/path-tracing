precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

struct Sphere {
  vec3 center;
  float radius;
  vec3 color;
};

struct Plane {
  vec3 normal; // Нормаль плоскости
  float d;     // Параметр плоскости (расстояние от начала координат)
};

Sphere sphere = Sphere(vec3(0.0, 0.0, 1.0), 0.5, vec3(1.0, 0.0, 0.0));
Plane plane = Plane(vec3(0.0, 1.0, 0.0), 0.5); // Плоскость Y = -0.5

vec3 lightPosition = vec3(0.0, 1000.0, 1.0);

float intersectPlane(vec3 rayOrigin, vec3 rayDir, Plane plane) {
  float denominator = dot(rayDir, plane.normal);
  if (abs(denominator) > 1e-6) {
    float t = -(dot(rayOrigin, plane.normal) + plane.d) / denominator;
    return t >= 0.0 ? t : -1.0; // Возвращаем -1.0, если пересечение за пределами луча
  }
  return -1.0; // Луч параллелен плоскости
}

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
  float tSphere = intersectSphere(rayOrigin, rayDir, sphere);
  float tPlane = intersectPlane(rayOrigin, rayDir, plane);
  
  if (tSphere > 0.0 && (tPlane < 0.0 || tSphere < tPlane)) {
    // Пересечение с сферой
    vec3 hitPoint = rayOrigin + tSphere * rayDir;
    vec3 normal = normalize(hitPoint - sphere.center);

    // Освещение (модель Ламберта)
    vec3 lightDir = normalize(lightPosition - hitPoint);
    float lightIntensity = max(dot(normal, lightDir), 0.0);

    vec3 color = lightIntensity * sphere.color;
    return color;
  } else if (tPlane > 0.0) {
    // Пересечение с плоскостью
    vec3 hitPoint = rayOrigin + tPlane * rayDir;
    vec3 normal = plane.normal; // Нормаль плоскости

    // Освещение (модель Ламберта)
    vec3 lightDir = normalize(lightPosition - hitPoint);
    float lightIntensity = max(dot(normal, lightDir), 0.0);

    vec3 color = lightIntensity * vec3(0.5, 0.5, 0.5); // Цвет плоскости
    return color;
  }
  
  return vec3(0.0, 0.0, 0.0); // Цвет неба (фон)
}

// Функция для генерации псевдослучайного числа
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;
  
  vec3 rayOrigin = vec3(0.0, 0.0, 0.0);
  
  // Supersampling
  const int samples = 4;
  vec3 color = vec3(0.0);
  float offset = 0.005; // Сила смещения
  
  for (int i = 0; i < samples; i++) {
    for (int j = 0; j < samples; j++) {
      // Генерируем случайные смещения для каждого луча
      vec2 randomOffset = vec2(
        (float(i) + random(uv + vec2(float(j)))) / float(samples),
        (float(j) + random(uv + vec2(float(i)))) / float(samples)
      ) * offset;
      
      vec3 rayDir = normalize(vec3(uv + randomOffset, 1.0));
      color += traceRay(rayOrigin, rayDir);
    }
  }

  color /= float(samples * samples); // Усредняем результаты
  gl_FragColor = vec4(color, 1.0);
}