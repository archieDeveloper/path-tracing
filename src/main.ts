import '@/style.css'
import vertexShaderSource from '@/shaders/vertexShader.vert';
import fragmentShaderSource from '@/shaders/fragmentShader.frag';
import vertexShaderTextureSource from '@/shaders/vertexShaderTexture.vert';
import fragmentShaderTextureSource from '@/shaders/fragmentShaderTexture.frag';

// Инициализация WebGL и рендеринг аналогично предыдущему примеру
const canvas:HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl') as WebGLRenderingContext;

// Создание шейдера
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
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

function createProgram (vertexShaderSource: string, fragmentShaderSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource) as WebGLShader;
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource) as WebGLShader;

  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

const program = createProgram(vertexShaderSource, fragmentShaderSource)
const programTexture = createProgram(vertexShaderTextureSource, fragmentShaderTextureSource)

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Установка атрибутов и uniform


// Получаем атрибуты и униформы
const positionAttributeLocationTexture = gl.getAttribLocation(programTexture, 'a_position');
const texUniformLocation = gl.getUniformLocation(programTexture, 'u_texture');


const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
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

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
const sampleOffsetUniformLocation = gl.getUniformLocation(program, 'u_sampleOffset')
const totalSamplesUniformLocation = gl.getUniformLocation(program, 'u_totalSamples')
gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);


// Инициализация WebGL и шейдера...
// После загрузки шейдера установите uniform `u_totalSamples`
// gl.uniform1f(totalSamplesUniformLocation, totalSamples);



let time = 0;
let lastTime = performance.now();  // Время последнего кадра
let fps = 0;
function render() {
  renderOnce()
  requestAnimationFrame(render);
}

function renderOnce() {
  // Рассчитываем время между кадрами
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Рассчитываем FPS
  fps = 1000 / deltaTime;

  // Обновляем информацию о FPS на экране
  document.getElementById('fps-display').textContent = `FPS: ${fps.toFixed(0)}`;

  time += 0.01;
  gl.uniform1f(timeUniformLocation, time);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const totalSamples = 1024;
const samplesPerPass = 64;
let accumulatedSamples = 0;
let accumulatedImage = new Uint8Array(canvas.width * canvas.height * 4); // Хранение итогового изображения
let passCount = 0;

// Создание текстуры
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

function renderPass() {
  time += 0.01;
  gl.uniform1f(timeUniformLocation, time);
  gl.uniform1f(sampleOffsetUniformLocation, passCount * samplesPerPass);
  gl.uniform1i(totalSamplesUniformLocation, totalSamples);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Рендерим текущий проход
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Считываем пиксели после текущего прохода
  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Добавляем цвета пикселей к накопленному изображению
  for (let i = 0; i < pixels.length; i++) {
    accumulatedImage[i] += pixels[i];
  }

  accumulatedSamples += samplesPerPass;
  passCount++;

  // Если достигли нужного количества сэмплов, выводим результат
  if (accumulatedSamples >= totalSamples) {
    const finalImage = new Uint8Array(canvas.width * canvas.height * 4);
    for (let i = 0; i < accumulatedImage.length; i++) {
      finalImage[i] = Math.min(255, (accumulatedImage[i] / totalSamples) * 255); // Нормализация и преобразование к Uint8
    }
    // Используем программу
    gl.useProgram(programTexture);
    gl.bindTexture(gl.TEXTURE_2D, texture); // Отвязываем текстуру для финальной отрисовки
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height,
      0, gl.RGBA, gl.UNSIGNED_BYTE, accumulatedImage
    );

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Устанавливаем атрибуты
    gl.enableVertexAttribArray(positionAttributeLocationTexture);
    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocationTexture, 2, gl.FLOAT, false, 0, 0);

    // Устанавливаем текстуру
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(texUniformLocation, 0);

    // Отрисовываем
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  } else {
    // Если еще не достигли, продолжаем рендеринг
    requestAnimationFrame(renderPass);
  }
}

renderPass()

// Вызываем renderOnce() один раз после инициализации canvas и шейдера
//renderOnce();
const btnRunRender = document.getElementById('run-render') as HTMLButtonElement
btnRunRender.addEventListener('click', () => {
  renderOnce()
})

//render();
