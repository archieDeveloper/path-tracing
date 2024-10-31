import '@/style.css'
import vertexShaderSource from '@/shaders/vertexShader.vert';
import fragmentShaderSource from '@/shaders/fragmentShader.frag';
import vertexShaderTextureSource from '@/shaders/vertexShaderTexture.vert';
import fragmentShaderTextureSource from '@/shaders/fragmentShaderTexture.frag';

import {
  createProgram,
  createBuffer,
  createTexture
} from '@/utils.ts'

// Инициализация WebGL и рендеринг аналогично предыдущему примеру
const canvas:HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl') as WebGLRenderingContext;

// Запрашиваем расширение для буфера цвета с плавающей точкой
const floatExtension = gl.getExtension('WEBGL_color_buffer_float');
if (!floatExtension) {
    console.error('Расширение WEBGL_color_buffer_float не поддерживается');
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource)
const programTexture = createProgram(gl, vertexShaderTextureSource, fragmentShaderTextureSource)

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);
createBuffer(gl)

// Получаем атрибуты и униформы
const positionAttributeLocationTexture = gl.getAttribLocation(programTexture, 'a_position');
const texUniformLocation = gl.getUniformLocation(programTexture, 'u_texture');

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
const sampleOffsetUniformLocation = gl.getUniformLocation(program, 'u_sampleOffset')
const totalSamplesUniformLocation = gl.getUniformLocation(program, 'u_totalSamples')
gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

let time = 0;

const totalSamples = 64*1000;
const samplesPerPass = 64;
let accumulatedSamples = 0;
let accumulatedImage = new Float32Array(canvas.width * canvas.height * 4); // Хранение итогового изображения
let passCount = 0;

// Создание текстуры
const texture = createTexture(gl);

function renderScene () {
  time += 0.01;
  gl.uniform1f(timeUniformLocation, time);
  gl.uniform1f(sampleOffsetUniformLocation, passCount * samplesPerPass);
  gl.uniform1i(totalSamplesUniformLocation, totalSamples);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Рендерим текущий проход
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function renderFinalImage () {
  const finalImage = new Uint8Array(canvas.width * canvas.height * 4);
  for (let i = 0; i < accumulatedImage.length; i++) {
    finalImage[i] = Math.min(Math.max(Math.round(accumulatedImage[i] * 255), 0), 255)
    //finalImage[i] = Math.min(255, accumulatedImage[i]); // Нормализация и преобразование к Uint8
  }
  // Используем программу
  gl.useProgram(programTexture);
  gl.bindTexture(gl.TEXTURE_2D, texture); // Отвязываем текстуру для финальной отрисовки
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height,
    0, gl.RGBA, gl.UNSIGNED_BYTE, finalImage
  );

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Устанавливаем атрибуты
  gl.enableVertexAttribArray(positionAttributeLocationTexture);
  //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocationTexture, 2, gl.FLOAT, false, 0, 0);

  // Устанавливаем текстуру
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(texUniformLocation, 0);

  // Отрисовываем
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.useProgram(program);
}

function renderPass() {
  renderScene()

  // Считываем пиксели после текущего прохода
  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Добавляем цвета пикселей к накопленному изображению
  for (let i = 0; i < pixels.length; i++) {
    accumulatedImage[i] = (accumulatedImage[i] + (pixels[i] / 255)) / 2;
  }

  accumulatedSamples += samplesPerPass;
  passCount++;

  // Если достигли нужного количества сэмплов, выводим результат
  if (accumulatedSamples >= totalSamples) {
    renderFinalImage()
    console.log('renderComplete!')
  } else {
    // Если еще не достигли, продолжаем рендеринг
    requestAnimationFrame(renderPass);
  }
}

renderPass()

const btnRunRender = document.getElementById('run-render') as HTMLButtonElement
btnRunRender.addEventListener('click', () => {
  renderPass()
})











/*
// Создаем WebGL контекст
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');

// Запрашиваем расширение для буфера цвета с плавающей точкой
const floatExtension = gl.getExtension('WEBGL_color_buffer_float');
if (!floatExtension) {
    console.error('Расширение WEBGL_color_buffer_float не поддерживается');
}

// Убедитесь, что поддерживаются текстуры с плавающей точкой
const floatTextureExtension = gl.getExtension('OES_texture_float');
if (!floatTextureExtension) {
    console.error('Плавающие текстуры не поддерживаются');
}

// Устанавливаем размеры текстуры
const width = 512; // Ширина текстуры
const height = 512; // Высота текстуры

// Создаем фреймбуфер
const framebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

// Создаем текстуру с плавающей точкой
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

// Привязываем текстуру к фреймбуферу
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

// Отрисовка изображения на текстуре
// Ваш код отрисовки здесь...

// Считывание пикселей
const floatPixels = new Float32Array(width * height * 4); // Для RGBA
gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, floatPixels);

// Теперь у вас есть floatPixels в формате Float32Array
console.log(floatPixels);
*/