import gpu_matrix from './gpu_matrix';

import vs_pass from './_shaders/pass_through.vs!text';
import fs_fft from './_shaders/fft.fs!text';
import fs_swap from './_shaders/swap.fs!text';
import fs_gaussian_blur from './_shaders/gaussian_blur.fs!text';
import fs_f_power_minus_beta from './_shaders/f_power_minus_beta.fs!text';
import fs_magnitude from './_shaders/magnitude.fs!text';
import fs_white_noise from './_shaders/white_noise.fs!text';
import fs_simplex_noise from './_shaders/simplex_noise.fs!text';
import fs_perlin_noise from './_shaders/perlin_noise.fs!text';


function randomUInt()
{
  return Math.floor(Math.random() * (Math.ceil(2, 32) - 1));
}

function setProperty(object, prop, value) 
{
  var fields = prop.split(/[\.\[\]]/).filter(elem => elem.length > 0);
  var tempObj = object;
  for (var i = 0; i < fields.length - 1; ++i) 
  {
    if (tempObj[fields[i]] === undefined) 
    {
      tempObj[fields[i]] = {};
    }
    tempObj = tempObj[fields[i]];
  }
  tempObj[fields[fields.length - 1]] = value;
}

function normalize(matrix, mult = 255) {
    var buffer = matrix.buffer.f32; // FIXME
    var max = new Array(matrix.channel);
    var min = new Array(matrix.channel);
    
    for (var c = 0; c < matrix.channel; ++c)
    {
        max[c] = buffer[c];
        min[c] = buffer[c];
    }
    
    for (var i = 0; i < buffer.length; i += matrix.channel) 
    {
        for (var c = 0; c < matrix.channel; ++c)
        {
            max[c] = Math.max(max[c], buffer[i + c]);
            min[c] = Math.min(min[c], buffer[i + c]);
        }
    }
    
    for (var i = 0; i < buffer.length; i += matrix.channel) 
    {
        for (var c = 0; c < matrix.channel; ++c)
        {
            buffer[i + c] = (buffer[i + c] - min[c]) / (max[c] - min[c]) * mult;
        }
    }
}

/**
 * GPU class
 * @property {WebGL2RenderingContext} gl
 * @property {HTMLCanvasElement} canvas
 */
class gpu
{
  constructor()
  {
    this._init_webgl();
    this._load_shader_programs();
    this._init_buffers();
  }
  
  /**
   * Creates a gpu_matrix in the current GPU.
   * @return {gpu_matrix} The created matrix.
   */
  create_gpu_matrix()
  {
    return new gpu_matrix(this.gl);
  }
  
  /**
   * Compute FFT
   * @param {gpu_matrix} matrix
   * @param {Boolean} forward
   * @return {gpu_matrix} If forward: complex matrix with DFT values. If !forward: real matrix.
   */
  compute_fft(matrix, forward = true)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    var width = matrix.columns;
    var height = matrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    var pingTransform = this.create_gpu_matrix();
    var pongTransform = this.create_gpu_matrix();
    var result = new gpu_matrix(gl);
    
    pingTransform.allocate(width, height, 2);
    pongTransform.allocate(width, height, 2);
    result.allocate(width, height, forward ? 2 : 1);
    
    matrix.setTextureParameters({ filter: gl.NEAREST, wrap: gl.REAPEAT});
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pingTransform.texture);
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, pongTransform.texture);
    
    let horizontalIterations = Math.log2(width);
    let verticalIterations = Math.log2(height);
    let iterations = horizontalIterations + verticalIterations;
    
    gl.bindVertexArray(this.vertexArray);
    
    var subtransformProgram = this.horizontalFFTShaderProgram;
    gl.useProgram(subtransformProgram);
    
    gl.uniform1f(subtransformProgram.uniformLocations.u_transformSize, width);
    gl.uniform1i(subtransformProgram.uniformLocations.u_forward, forward);
    
    var subtransformSize = 1;
    var framebuffer;
    var inputTextureNumber;
    
    for ( var i = 0; i < iterations; ++i)
    {
      if (i === 0)
      {
        inputTextureNumber = 0;
        framebuffer = pingTransform.framebuffer;
      }
      // else if (!swap && i === iterations - 1)
      // {
      //   inputTextureNumber = (iterations % 2 === 0) ? 1 : 2;
      //   framebuffer = result.framebuffer;
      // }
      else if (i % 2 === 1)
      {
        inputTextureNumber = 1;
        framebuffer = pongTransform.framebuffer;
      }
      else
      {
        inputTextureNumber = 2;
        framebuffer = pingTransform.framebuffer;
      }
      
      if (i === horizontalIterations)
      {
        subtransformProgram = this.verticalFFTShaderProgram;
        subtransformSize = 1;
        
        gl.useProgram(subtransformProgram);
        gl.uniform1f(subtransformProgram.uniformLocations.u_transformSize, height);
        gl.uniform1i(subtransformProgram.uniformLocations.u_forward, forward);
      }
      
      subtransformSize *= 2; // subtransformSize <<= 1;
            
      gl.uniform1i(subtransformProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform1f(subtransformProgram.uniformLocations.u_subtransformSize, subtransformSize);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
        
    if (!forward && width <= 512 && height <= 512)
    {
      // Calculating IFFT magnitude
      
      inputTextureNumber = (iterations % 2 === 0) ? 2 : 1;
      framebuffer = result.framebuffer;
      
      gl.useProgram(this.magnitudeShaderProgram);
      gl.uniform1i(this.magnitudeShaderProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform2f(this.magnitudeShaderProgram.uniformLocations.u_transformSize, width, height);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    } 
    else if (!forward)
    {
      var complex_matrix = (iterations % 2 === 0)  ? pongTransform.download() : pingTransform.download();
      var magnitude_matrix = new jsfeat.matrix_t(complex_matrix.cols, complex_matrix.rows, jsfeat.F32C1_t);
      
      var complex_buffer = complex_matrix.buffer.f32;
      var magnitude_buffer = magnitude_matrix.buffer.f32;
      
      for (let i = 0, j = 0; i < complex_buffer.length; i += complex_matrix.channel, ++j)
      {
          magnitude_buffer[j] = Math.sqrt(complex_buffer[i] * complex_buffer[i] + complex_buffer[i+1] * complex_buffer[i+1]);
      }
      
      
      result.destroy();
      result = magnitude_matrix;
      
      /*normalize(magnitude_matrix, 1);
      
      
      
      result.upload(magnitude_matrix);*/
    }
    else 
    {
      // Swaping quadrants from FFT
      
      inputTextureNumber = (iterations % 2 === 0) ? 2 : 1;
      framebuffer = result.framebuffer;
      
      gl.useProgram(this.swapShaderProgram);
      gl.uniform1i(this.swapShaderProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform2f(this.swapShaderProgram.uniformLocations.u_transformSize, width, height);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    
    pingTransform.destroy();
    pongTransform.destroy();
    
    return result;
  }
  
  /**
   * @param {gpu_matrix} matrix - Matrix to transpose in frequency domain.
   * @param {number} stdDev
   * @return {gpu_matrix} Blurred matrix in frequency domain.
   */
  blur(matrix, stdDev = 0.25)
  {
    /** @type {WebGL2RenderingContext} */ 
    var gl; gl = this.gl;
    
    var width = matrix.columns;
    var height = matrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    var result = this.create_gpu_matrix();
    
    result.allocate(width, height, 2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.gaussianBlurShaderProgram);
    
    gl.uniform2f(this.gaussianBlurShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.gaussianBlurShaderProgram.uniformLocations.u_input, 0);
    gl.uniform1f(this.gaussianBlurShaderProgram.uniformLocations.u_stdDev, stdDev);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    return result;
  }
  
    /**
   * @param {gpu_matrix} matrix - Matrix to filter in frequency domain.
   * @param {number} beta
   * @return {gpu_matrix} Filtered matrix in frequency domain.
   */
  fPowerMinusBeta(matrix, beta = 1.8)
  {
    /** @type {WebGL2RenderingContext} */ 
    var gl; gl = this.gl;
    
    var width = matrix.columns;
    var height = matrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    var result = this.create_gpu_matrix();
    
    result.allocate(width, height, 2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.fPowerMinusBetaShaderProgram);
    
    gl.uniform2f(this.fPowerMinusBetaShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.fPowerMinusBetaShaderProgram.uniformLocations.u_input, 0);
    gl.uniform1f(this.fPowerMinusBetaShaderProgram.uniformLocations.u_power, beta);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    return result;
  }
  
  white_noise(cols, rows, seed = randomUInt())
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl  = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    var result = this.create_gpu_matrix();
    
    result.allocate(width, height, 2);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.whiteNoiseShaderProgram);
    
    gl.uniform2f(this.whiteNoiseShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1ui(this.whiteNoiseShaderProgram.uniformLocations.u_seed, seed);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    return result;
  }
  
  simplex_noise(cols, rows, frequency, octaves, persistence, lacunarity, base)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl  = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    var result = this.create_gpu_matrix();
    
    result.allocate(width, height, 1);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.snoise2ShaderProgram);
    
    gl.uniform1ui(this.snoise2ShaderProgram.uniformLocations.u_octaves, octaves);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_frequency, persistence);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_persistence, persistence);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_lacunarity, lacunarity);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_base, base);
    gl.uniform2f(this.snoise2ShaderProgram.uniformLocations.u_transformSize, width, height);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    return result;
  }
  
  perlin_noise(cols, rows, frequency, octaves, persistence, lacunarity, base)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl  = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    var result = this.create_gpu_matrix();
    
    result.allocate(width, height, 1);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.pnoise2ShaderProgram);
    
    gl.uniform1ui(this.pnoise2ShaderProgram.uniformLocations.u_octaves, octaves);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_frequency, persistence);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_persistence, persistence);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_lacunarity, lacunarity);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_base, base);
    gl.uniform2f(this.pnoise2ShaderProgram.uniformLocations.u_transformSize, width, height);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    return result;
  }
  
  _init_webgl()
  {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl2');
    
    // TODO: Add verifications for webgl version.
    
    this.gl.getExtension('EXT_color_buffer_float');
    
    // TODO: Add verification for extension.
  }
  
  /**
   * @private
   */
  _load_shader_programs()
  {    
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    var vertexShader = this._compile_shader(vs_pass, gl.VERTEX_SHADER);
    var horizontalFragmentShader = this._compile_shader(this._shader_inject_definition('HORIZONTAL', fs_fft), gl.FRAGMENT_SHADER);
    var verticalFragmentShader = this._compile_shader(fs_fft, gl.FRAGMENT_SHADER);
    var swapFragmentShader = this._compile_shader(fs_swap, gl.FRAGMENT_SHADER);
    var gaussianBlurFragmentShader = this._compile_shader(fs_gaussian_blur, gl.FRAGMENT_SHADER);
    var fPowerMinusBetaFragmentShader = this._compile_shader(fs_f_power_minus_beta, gl.FRAGMENT_SHADER);
    var magnitudeFragmentShader = this._compile_shader(fs_magnitude, gl.FRAGMENT_SHADER);
    var whiteNoiseFragmentShader = this._compile_shader(fs_white_noise, gl.FRAGMENT_SHADER);
    var snoise2FragmentShader = this._compile_shader(fs_simplex_noise, gl.FRAGMENT_SHADER);
    var pnoise2FragmentShader = this._compile_shader(fs_perlin_noise, gl.FRAGMENT_SHADER);      
    
    this.horizontalFFTShaderProgram = this._create_shader_program(vertexShader, horizontalFragmentShader);
    this.verticalFFTShaderProgram = this._create_shader_program(vertexShader, verticalFragmentShader);
    this.swapShaderProgram = this._create_shader_program(vertexShader, swapFragmentShader);
    this.gaussianBlurShaderProgram = this._create_shader_program(vertexShader, gaussianBlurFragmentShader);
    this.fPowerMinusBetaShaderProgram = this._create_shader_program(vertexShader, fPowerMinusBetaFragmentShader);
    this.magnitudeShaderProgram = this._create_shader_program(vertexShader, magnitudeFragmentShader);
    this.whiteNoiseShaderProgram = this._create_shader_program(vertexShader, whiteNoiseFragmentShader);
    this.snoise2ShaderProgram = this._create_shader_program(vertexShader, snoise2FragmentShader);
    this.pnoise2ShaderProgram = this._create_shader_program(vertexShader, pnoise2FragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(horizontalFragmentShader);
    gl.deleteShader(verticalFragmentShader);
    gl.deleteShader(swapFragmentShader);
    gl.deleteShader(gaussianBlurFragmentShader);
    gl.deleteShader(fPowerMinusBetaFragmentShader);
    gl.deleteShader(magnitudeFragmentShader);
    gl.deleteShader(whiteNoiseFragmentShader);
    gl.deleteShader(snoise2FragmentShader);
    gl.deleteShader(pnoise2FragmentShader);
  }
  
  /**
   * @private
   * @param definition {string}
   * @param shaderSource {string}
   * @return {string}
   */
  _shader_inject_definition(definition, shaderSource)
  {
    const placeholder = '/* inject:defines */';
    return shaderSource.replace(placeholder, `#define ${definition}`);
  }
  
  /**
   * @private
   * @param {string} shaderSource
   * @param {number} shaderType
   * @return {WebGLShader}
   */
  _compile_shader(shaderSource, shaderType)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    var shader = gl.createShader(shaderType);
    
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    
    var log = gl.getShaderInfoLog(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success)
    {
      throw "WebGL Shader Compilation Error: \n" + log;
    }
    else if (log.length > 0)
    {
      console.log("WebGL Shader Compilation Warning: \n" + log);
    }
    
    return shader;
  }
  
  /**
   * @private
   * @param {WebGLShader} vertexShader
   * @param {WebGLShader} fragmentShader
   */
  _create_shader_program(vertexShader, fragmentShader)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    var program = gl.createProgram();
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    gl.linkProgram(program);
    
    var log = gl.getProgramInfoLog(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success)
    {
      throw "WebGL Program Linking Error: \n" + log;
    }
    else if (log.length > 0)
    {
      console.log("WebGL Program Linking Warning: \n" + log);
    }
    
    program.uniformLocations = {};
    
    let numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < numUniforms; ++i)
    {
      var uniform = gl.getActiveUniform(program, i);
      var loc = gl.getUniformLocation(program, uniform.name);
      setProperty(program.uniformLocations, uniform.name, loc);
    }
    
    return program;
  }
  
  /**
   * @private
   */
  _init_buffers()
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    const positionAttributeLocation = 0;
    
    const vertices = new Float32Array([
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0
    ]);
    
    const indices = new Uint16Array([ 0, 2, 1, 2, 3, 1 ]);
    
    this.vertexArray = gl.createVertexArray();
    gl.bindVertexArray(this.vertexArray);
    
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindVertexArray(null);
  }
}

export default gpu;