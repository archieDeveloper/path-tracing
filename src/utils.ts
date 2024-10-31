// Создание шейдера
export function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Создание программы
export function createProgram (gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource) as WebGLShader;
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource) as WebGLShader;

  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

export function createBuffer (gl: WebGLRenderingContext) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [
    -1, -1,
     1, -1,
    -1,  1,
     1, -1,
     1,  1,
    -1,  1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

export function createTexture (gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}
