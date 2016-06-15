import assert from '../utils/assert';
import { randomUInt } from '../utils/math_utils';
import { setProperty } from '../utils/utils';
import _ from 'underscore';

import jsfeat from 'jsfeat';

import gpu_matrix from './gpu_matrix';

import vs_pass from './_shaders/pass_through.vs!text';
import fs_fft from './_shaders/fft.fs!text';
import fs_swap from './_shaders/swap.fs!text';
import fs_gaussian_blur from './_shaders/gaussian_blur.fs!text';
import fs_f_power_minus_beta from './_shaders/f_power_minus_beta.fs!text';
import fs_magnitude from './_shaders/magnitude.fs!text';
import fs_real from './_shaders/real.fs!text';
import fs_white_noise from './_shaders/white_noise.fs!text';
import fs_simplex_noise from './_shaders/simplex_noise.fs!text';
import fs_perlin_noise from './_shaders/perlin_noise.fs!text';
import fs_min_max_reduce_rows from './_shaders/min_max_reduce_rows.fs!text';
import fs_min_max_reduce_columns from './_shaders/min_max_reduce_column.fs!text';
import fs_normalize from './_shaders/normalize.fs!text';
import fs_add from './_shaders/add.fs!text';
import fs_subtract from './_shaders/subtract.fs!text';
import fs_multiply from './_shaders/multiply.fs!text';
import fs_multiply_im from './_shaders/multiply_im.fs!text';
import fs_divide_im from './_shaders/divide_im.fs!text';
import fs_normal_map from './_shaders/normal_map.fs!text';
import fs_type_conversion from './_shaders/type_conversions.fs!text';

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
    this._init_buffers();
  }

  /**
   * Creates a gpu_matrix in the current GPU.
   * @param {jsfeat.matrix_t} Optional cpu matrix to upload.
   * @return {gpu_matrix} The created matrix.
   */
  create_gpu_matrix(matrix)
  {
    let g_mat = new gpu_matrix(this.gl);

    if (matrix !== undefined)
    {
      g_mat.upload(matrix);
    }

    return g_mat;
  }
  
  /**
   * Compute FFT
   * @param {gpu_matrix} matrix
   * @param {Boolean} forward
   * @param {gpu_matrix} result
   * @return {gpu_matrix} If forward: complex matrix with DFT values. If !forward: real matrix.
   */
  compute_fft(matrix, forward = true, result = undefined)
  {
    let innerMatrix = matrix;
    let destroyInnerMatrix = false;

    if (!forward) 
      assert(matrix.type == jsfeat.F32_t && matrix.channel == 2, "IFFT: matrix must contain complex numbers.");
    else {
      assert(matrix.channel <= 2, "FFT: matrix must not have more than 2 channel.");
      if (matrix.type != jsfeat.F32_t) {
        console.warn("compute_fft: Given matrix is not of type f32. Converting...");
        // Convert matrix to F32_t
        innerMatrix = this.convert_to(matrix, jsfeat.F32_t);
        destroyInnerMatrix = true;
      }
    }

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    let width = innerMatrix.cols;
    let height = innerMatrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    let pingTransform = this.create_gpu_matrix();
    let pongTransform = this.create_gpu_matrix();
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }

    pingTransform.allocate(width, height, 2);
    pongTransform.allocate(width, height, 2);
    result.allocate(width, height, forward ? 2 : 1);

    innerMatrix.setTextureParameters({ filter: gl.NEAREST, wrap: gl.REAPEAT});
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, innerMatrix.texture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pingTransform.texture);
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, pongTransform.texture);
    
    let horizontalIterations = Math.log2(width);
    let verticalIterations = Math.log2(height);
    let iterations = horizontalIterations + verticalIterations;
    
    gl.bindVertexArray(this.vertexArray);
      
    const textureNumbers = [2, 1];
    // const fbNames = ["ping(1)", "pong(2)"];
    const pingPongMatrix = [pingTransform, pongTransform];

    let subtransformSize = 1;
    let framebuffer;
    let inputTextureNumber;
    
    if (!forward) // Swapping Quadrants
    {
      inputTextureNumber = 0;
      framebuffer = pingPongMatrix[0].framebuffer;
      
      gl.useProgram(this.swapShaderProgram);
      gl.uniform1i(this.swapShaderProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform2f(this.swapShaderProgram.uniformLocations.u_transformSize, width, height);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      textureNumbers.reverse();
      pingPongMatrix.reverse();     
    }

    let subtransformProgram = this.horizontalFFTShaderProgram;
    gl.useProgram(subtransformProgram);
    
    gl.uniform1f(subtransformProgram.uniformLocations.u_transformSize, width);
    gl.uniform1i(subtransformProgram.uniformLocations.u_forward, forward);

    for ( let i = 0; i < iterations; ++i)
    {
      if (i === horizontalIterations)
      {
        subtransformProgram = this.verticalFFTShaderProgram;
        subtransformSize = 1;
        
        gl.useProgram(subtransformProgram);
        gl.uniform1f(subtransformProgram.uniformLocations.u_transformSize, height);
        gl.uniform1i(subtransformProgram.uniformLocations.u_forward, forward);
      }

      inputTextureNumber = forward && i === 0 ? 0 : textureNumbers[i % 2];
      framebuffer = pingPongMatrix[i % 2].framebuffer;

      subtransformSize *= 2; // subtransformSize <<= 1;
            
      gl.uniform1i(subtransformProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform1f(subtransformProgram.uniformLocations.u_subtransformSize, subtransformSize);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    if (!forward && height * width !== 1) 
    {
      // divide matrix by height
      this.divide(pingPongMatrix[(iterations - 1) % 2], height * width, pingPongMatrix[iterations % 2]);

      gl.bindVertexArray(this.vertexArray);

      textureNumbers.reverse();
      pingPongMatrix.reverse();      
    }

    if (!forward)
    {
      // Return only the real channel
      inputTextureNumber = textureNumbers[iterations % 2];
      framebuffer = result.framebuffer;

      gl.useProgram(this.realShaderProgram);
      gl.uniform1i(this.realShaderProgram.uniformLocations.u_input, inputTextureNumber);
      gl.uniform2f(this.realShaderProgram.uniformLocations.u_transformSize, width, height);
      
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    } 
    else 
    {
      // Swaping quadrants from FFT
      
      inputTextureNumber = textureNumbers[iterations % 2];
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
    if (destroyInnerMatrix)
      innerMatrix.destroy();
    
    return result;
  }
  
  /**
   * @param {gpu_matrix} matrix - Matrix to transpose in frequency domain.
   * @param {number} stdDev
   * @param {gpu_matrix} result
   * @return {gpu_matrix} Blurred matrix in frequency domain.
   */
  blur(matrix, stdDev = 0.25, result = undefined)
  {
    assert(matrix.channel == 2 && matrix.type == jsfeat.F32_t, "Gaussian Blur needs a matrix in frequency domain.");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix.cols;
    let height = matrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }
    
    result.allocate(width, height, 2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.gaussianBlurShaderProgram);
    
    gl.uniform2f(this.gaussianBlurShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.gaussianBlurShaderProgram.uniformLocations.u_input, 0);
    gl.uniform1f(this.gaussianBlurShaderProgram.uniformLocations.u_stdDev, 0.5 / stdDev);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param {gpu_matrix} matrix - Matrix to filter in frequency domain.
   * @param {number} beta
   * @param {gpu_matrix} result
   * @return {gpu_matrix} Filtered matrix in frequency domain.
   */
  fPowerMinusBeta(matrix, beta = 1.8, result = undefined)
  {
    assert(matrix.channel == 2 && matrix.type == jsfeat.F32_t, "fPowerMinusBeta needs a matrix in frequency domain.");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix.cols;
    let height = matrix.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
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
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }

  /**
   * @param {gpu_matrix} matrix
   * @return {{min: number, max: number}}
   */
  minMax(matrix)
  {
    assert(matrix.channel == 1, "minMax: Matrix can only have 1 channel.");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix.cols;
    let height = matrix.rows;
    
    gl.viewport(0, 0, 1, height);
    
    /** @type {gpu_matrix} */
    let minMax = this.create_gpu_matrix();
    minMax.allocate(1, height, 2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.minMaxReduceRowsShaderProgram);
    
    gl.uniform2f(this.minMaxReduceRowsShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.minMaxReduceRowsShaderProgram.uniformLocations.u_input, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, minMax.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0); // FIXME: There's no need to render the entire square. The first column should be enough.
    
    gl.viewport(0, 0, 1, 1);
    
    let minMax2 = this.create_gpu_matrix();
    minMax2.allocate(1, 1, 2);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, minMax.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.minMaxReduceColumnsShaderProgram);
    
    gl.uniform2f(this.minMaxReduceColumnsShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.minMaxReduceColumnsShaderProgram.uniformLocations.u_input, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, minMax2.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0); // FIXME: There's no need to render the entire square. The first vertex should be enough.
        
    let result = minMax2.download();
    
    minMax.destroy();
    minMax2.destroy();

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    
    return { min: result.data[0], max: result.data[1] };
  }

  /**
   * @param {gpu_matrix} matrix - Matrix to normalize
   * @param {gpu_matrix} result
   * @return {gpu_matrix} Normalized matrix
   */
  normalize(matrix, result = undefined)
  {
    assert(matrix.channel == 1, "normalize: matrix can only have 1 channel.");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix.cols;
    let height = matrix.rows;
        
    let minMax = this.minMax(matrix);

    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, 1);

    gl.viewport(0, 0, width, height);

    matrix.setTextureParameters({ wrap: gl.CLAMP_TO_EDGE });

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.normalizeShaderProgram);
    
    gl.uniform2f(this.normalizeShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.normalizeShaderProgram.uniformLocations.u_input, 0);
    gl.uniform2f(this.normalizeShaderProgram.uniformLocations.u_minMax, minMax.min, minMax.max);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }

  /**
   * @param {number} cols
   * @param {number} rows
   * @param {number} seed
   * @param {gpu_matrix} result
   * @return {gpu_matrix} White noise matrix.
   */
  white_noise(cols, rows, seed = randomUInt(), result = undefined)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }
    
    result.allocate(width, height, 2);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.whiteNoiseShaderProgram);
    
    gl.uniform2f(this.whiteNoiseShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1ui(this.whiteNoiseShaderProgram.uniformLocations.u_seed, seed);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param {number} cols
   * @param {number} rows
   * @param {number} frequency
   * @param {number} octaves
   * @param {number} persistence
   * @param {number} lacunarity
   * @param {number} base
   * @param {gpu_matrix} result
   * @return {gpu_matrix} Simplex noise matrix
   */
  simplex_noise(cols, rows, frequency, octaves, persistence, lacunarity, base, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl  = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }
    
    result.allocate(width, height, 1);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.snoise2ShaderProgram);
    
    gl.uniform1ui(this.snoise2ShaderProgram.uniformLocations.u_octaves, octaves);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_frequency, frequency);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_persistence, persistence);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_lacunarity, lacunarity);
    gl.uniform1f(this.snoise2ShaderProgram.uniformLocations.u_base, base);
    gl.uniform2f(this.snoise2ShaderProgram.uniformLocations.u_transformSize, width, height);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param {number} cols
   * @param {number} rows
   * @param {number} frequency
   * @param {number} octaves
   * @param {number} persistence
   * @param {number} lacunarity
   * @param {number} base
   * @param {gpu_matrix} result
   * @return {gpu_matrix} Perlin noise matrix
   */
  perlin_noise(cols, rows, frequency, octaves, persistence, lacunarity, base, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = cols;
    let height = rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }
    
    result.allocate(width, height, 1);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.pnoise2ShaderProgram);
    
    gl.uniform1ui(this.pnoise2ShaderProgram.uniformLocations.u_octaves, octaves);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_frequency, frequency);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_persistence, persistence);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_lacunarity, lacunarity);
    gl.uniform1f(this.pnoise2ShaderProgram.uniformLocations.u_base, base);
    gl.uniform2f(this.pnoise2ShaderProgram.uniformLocations.u_transformSize, width, height);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  _init_webgl()
  {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl2');
    
    if (this.gl === null)
    {
      throw new Error("WebGL 2 not supported!");
    }
    // TODO: Add verifications for webgl version.
    
    this.gl.getExtension('EXT_color_buffer_float');
    
    // TODO: Add verification for extension.
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  add(matrix_a, matrix_b, result = undefined)
  {
    assert(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot add matrices of different shapes.");
    
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix_a.cols;
    let height = matrix_a.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, matrix_a.channel);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matrix_b.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.addShaderProgram);
    
    gl.uniform2f(this.addShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.addShaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1i(this.addShaderProgram.uniformLocations.u_input_2, 1);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  subtract(matrix_a, matrix_b, result = undefined)
  {
    assert(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot subtract matrices of different shapes.");
    
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix_a.cols;
    let height = matrix_a.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, matrix_a.channel);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matrix_b.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.subtractShaderProgram);
    
    gl.uniform2f(this.subtractShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.subtractShaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1i(this.subtractShaderProgram.uniformLocations.u_input_2, 1);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  multiply_(matrix_a, matrix_b, result = undefined)
  {
    assert(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot multiply matrices of different shapes.");
    
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix_a.cols;
    let height = matrix_a.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, matrix_a.channel);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matrix_b.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.multiplyShaderProgram);
    
    gl.uniform2f(this.multiplyShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.multiplyShaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1i(this.multiplyShaderProgram.uniformLocations.u_input_2, 1);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param value {number}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  multiply_im_(matrix_a, value, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix_a.cols;
    let height = matrix_a.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, matrix_a.channel);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.multiplyImShaderProgram);
    
    gl.uniform2f(this.multiplyImShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.multiplyImShaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1f(this.multiplyImShaderProgram.uniformLocations.u_input_2, value);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param op_b {gpu_matrix | number}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  multiply(matrix_a, op_b, result = undefined)
  {
    if (op_b instanceof gpu_matrix)
    {
      return this.multiply_(matrix_a, op_b, result);
    }
    else
    {
      return this.multiply_im_(matrix_a, op_b, result);
    }
  }

  /**
   * @param matrix_a {gpu_matrix}
   * @param value {number}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  divide(matrix_a, value, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = matrix_a.cols;
    let height = matrix_a.rows;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, matrix_a.channel);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.divideImShaderProgram);
    
    gl.uniform2f(this.divideImShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.divideImShaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1f(this.divideImShaderProgram.uniformLocations.u_input_2, value);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }

  /**
   * @param matrix {gpu_matrix}
   * @param value {number}
   * @param alpha {number}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  normalMap(matrix, alpha = 0.01, result = undefined)
  {
    let innerMatrix = matrix;
    let destroyInnerMatrix = false;
    if (matrix.type != jsfeat.U8_t) {
      innerMatrix = this.convert_to(matrix, jsfeat.U8_t);
      destroyInnerMatrix = true;
    }

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    
    let width = innerMatrix.cols * 2;
    let height = innerMatrix.rows * 2;
    
    gl.viewport(0, 0, width, height);
    
    if (result === undefined)
    {
      result = this.create_gpu_matrix();  
    }
    
    result.allocate(width, height, 4, jsfeat.U8_t);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, innerMatrix.texture);
    
    gl.bindVertexArray(this.vertexArray);
    
    gl.useProgram(this.normalMapShaderProgram);
    
    gl.uniform2f(this.normalMapShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.normalMapShaderProgram.uniformLocations.u_input, 0);
    gl.uniform1f(this.normalMapShaderProgram.uniformLocations.u_alpha, alpha);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    if (destroyInnerMatrix)
      innerMatrix.destroy();

    return result;
  }

  /**
   * @private
   * @param from {jsfeat.DataType}
   * @param to {jsfeat.DataType}
   * @returns {WebGLProgram}
   */
  _get_convertion_shader(from, to)
  {
    switch (from)
    {
      case jsfeat.U8_t:
        switch (to)
        {
          case jsfeat.F32_t:
            return this.u8ToF32ShaderProgram;
          case jsfeat.S32_t:
            return this.u8ToI32ShaderProgram;
        }
        break;
      case jsfeat.F32_t:
        switch (to)
        {
          case jsfeat.U8_t:
            return this.f32ToU8ShaderProgram;
          case jsfeat.S32_t:
            return this.f32ToI32ShaderProgram;
        }
        break;
      case jsfeat.S32_t:
        switch (to)
        {
          case jsfeat.U8_t:
            return this.i32ToU8ShaderProgram;
          case jsfeat.F32_t:
            return this.i32ToF32ShaderProgram;
        }
        break;
    }

    assert(false, "Invalid conversion src or target.");
  }

  /**
   * @param matrix {gpu_matrix}
   * @param result {gpu_matrix}
   * @param type {jsfeat.DataType}
   * @returns {gpu_matrix}
   */
  convert_to(matrix, type, result = undefined)
  {
    assert(matrix.type != type, "convert_to: Cannot convert matrix to original type.");

    let shaderProgram = this._get_convertion_shader(matrix.type, type);

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;

    let width = matrix.cols;
    let height = matrix.rows;

    gl.viewport(0, 0, width, height);

    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }

    result.allocate(width, height, matrix.channel, type);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);

    gl.bindVertexArray(this.vertexArray);

    gl.useProgram(shaderProgram);

    gl.uniform2f(shaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(shaderProgram.uniformLocations.u_input, 0);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, result.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    return result;
  }
  
  get vertexShader()
  {
    //DEBUG console.log("Initializing vertexShader");
    this._vertexShader = this._compile_shader(vs_pass, this.gl.VERTEX_SHADER);
    Object.defineProperty(this, "vertexShader", { value: this._vertexShader, configurable: true });
    return this._vertexShader;
  }
  
  get horizontalFFTShaderProgram()
  {
    //DEBUG console.log("Initializing horizontalFFTShaderProgram");
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['HORIZONTAL'], fs_fft), gl.FRAGMENT_SHADER);
    this._horizontalFFTShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "horizontalFFTShaderProgram", { value: this._horizontalFFTShaderProgram, configurable: true });
    return this._horizontalFFTShaderProgram;
  }
  
  get verticalFFTShaderProgram()
  {
    //DEBUG console.log("Initializing verticalFFTShaderProgram");
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_fft, gl.FRAGMENT_SHADER);
    this._verticalFFTShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "verticalFFTShaderProgram", { value: this._verticalFFTShaderProgram, configurable: true });
    return this._verticalFFTShaderProgram;
  }
  
  get swapShaderProgram()
  {
    //DEBUG console.log("Initializing swapShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_swap, gl.FRAGMENT_SHADER);
    this._swapShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "swapShaderProgram", { value: this._swapShaderProgram, configurable: true });
    return this._swapShaderProgram;
  }
  
  get gaussianBlurShaderProgram()
  {
    //DEBUG console.log("Initializing gaussianBlurShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_gaussian_blur, gl.FRAGMENT_SHADER);
    this._gaussianBlurShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "gaussianBlurShaderProgram", { value: this._gaussianBlurShaderProgram, configurable: true });
    return this._gaussianBlurShaderProgram;
  }
  
  get fPowerMinusBetaShaderProgram()
  {
    //DEBUG console.log("Initializing fPowerMinusBetaShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_f_power_minus_beta, gl.FRAGMENT_SHADER);
    this._fPowerMinusBetaShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "fPowerMinusBetaShaderProgram", { value: this._fPowerMinusBetaShaderProgram, configurable: true });
    return this._fPowerMinusBetaShaderProgram;
  }
  
  get magnitudeShaderProgram()
  {
    //DEBUG console.log("Initializing magnitudeShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_magnitude, gl.FRAGMENT_SHADER);
    this._magnitudeShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "magnitudeShaderProgram", { value: this._magnitudeShaderProgram, configurable: true });
    return this._magnitudeShaderProgram;
  }  

  get realShaderProgram()
  {
    //DEBUG console.log("Initializing magnitudeShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_real, gl.FRAGMENT_SHADER);
    this._realShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "realShaderProgram", { value: this._realShaderProgram, configurable: true });
    return this._realShaderProgram;
  }
  
  get whiteNoiseShaderProgram()
  {
    //DEBUG console.log("Initializing whiteNoiseShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_white_noise, gl.FRAGMENT_SHADER);
    this._whiteNoiseShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "whiteNoiseShaderProgram", { value: this._whiteNoiseShaderProgram, configurable: true });
    return this._whiteNoiseShaderProgram;
  }
  
  get snoise2ShaderProgram()
  {
    //DEBUG console.log("Initializing snoise2ShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_simplex_noise, gl.FRAGMENT_SHADER);
    this._snoise2ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "snoise2ShaderProgram", { value: this._snoise2ShaderProgram, configurable: true });
    return this._snoise2ShaderProgram;
  }
  
  get pnoise2ShaderProgram()
  {
    //DEBUG console.log("Initializing pnoise2ShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_perlin_noise, gl.FRAGMENT_SHADER);
    this._pnoise2ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "pnoise2ShaderProgram", { value: this._pnoise2ShaderProgram, configurable: true });
    return this._pnoise2ShaderProgram;
  }
  
  get minMaxReduceColumnsShaderProgram()
  {
    //DEBUG console.log("Initializing minMaxReduceColumnsShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_min_max_reduce_columns, gl.FRAGMENT_SHADER);
    this._minMaxReduceColumnsShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "minMaxReduceColumnsShaderProgram", { value: this._minMaxReduceColumnsShaderProgram, configurable: true });
    return this._minMaxReduceColumnsShaderProgram;
  }
  
  get minMaxReduceRowsShaderProgram()
  {
    //DEBUG console.log("Initializing minMaxReduceRowsShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_min_max_reduce_rows, gl.FRAGMENT_SHADER);
    this._minMaxReduceRowsShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "minMaxReduceRowsShaderProgram", { value: this._minMaxReduceRowsShaderProgram, configurable: true });
    return this._minMaxReduceRowsShaderProgram;
  }
  
  get normalizeShaderProgram()
  {
    //DEBUG console.log("Initializing normalizeShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_normalize, gl.FRAGMENT_SHADER);
    this._normalizeShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "normalizeShaderProgram", { value: this._normalizeShaderProgram, configurable: true });
    return this._normalizeShaderProgram;
  }
  
  get addShaderProgram()
  {
    //DEBUG console.log("Initializing addShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_add, gl.FRAGMENT_SHADER);
    this._addShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "addShaderProgram", { value: this._addShaderProgram, configurable: true });
    return this._addShaderProgram;
  }
  
  get subtractShaderProgram()
  {
    //DEBUG console.log("Initializing subtractShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_subtract, gl.FRAGMENT_SHADER);
    this._subtractShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "subtractShaderProgram", { value: this._subtractShaderProgram, configurable: true });
    return this._subtractShaderProgram;
  }
  
  get multiplyShaderProgram()
  {
    //DEBUG console.log("Initializing multiplyShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_multiply, gl.FRAGMENT_SHADER);
    this._multiplyShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "multiplyShaderProgram", { value: this._multiplyShaderProgram, configurable: true });
    return this._multiplyShaderProgram;
  }
  
  get multiplyImShaderProgram()
  {
    //DEBUG console.log("Initializing multiplyImShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_multiply_im, gl.FRAGMENT_SHADER);
    this._multiplyImShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "multiplyImShaderProgram", { value: this._multiplyImShaderProgram, configurable: true });
    return this._multiplyImShaderProgram;
  }

  get divideImShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_divide_im, gl.FRAGMENT_SHADER);
    this._divideImShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "divideImShaderProgram", { value: this._divideImShaderProgram, configurable: true });
    return this._divideImShaderProgram;
  }
  
  get normalMapShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;
    let fShader = this._compile_shader(fs_normal_map, gl.FRAGMENT_SHADER);
    this._normalMapShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);
 
    Object.defineProperty(this, "normalMapShaderProgram", { value: this._normalMapShaderProgram, configurable: true });
    return this._normalMapShaderProgram;
  }

  get f32ToU8ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_F32', 'O_U8'], fs_type_conversion), gl.FRAGMENT_SHADER);
    //let fShader = this._compile_shader(fs_type_conversion, gl.FRAGMENT_SHADER);
    this._f32ToU8ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "f32ToU8ShaderProgram", { value: this._f32ToU8ShaderProgram, configurable: true });
    return this._f32ToU8ShaderProgram;
  }

  get f32ToI32ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_F32', 'O_I32'], fs_type_conversion), gl.FRAGMENT_SHADER);
    this._f32ToI32ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "f32ToI32ShaderProgram", { value: this._f32ToI32ShaderProgram, configurable: true });
    return this._f32ToI32ShaderProgram;
  }

  get u8ToF32ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_U8', 'O_F32'], fs_type_conversion), gl.FRAGMENT_SHADER);
    this._u8ToF32ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "u8ToF32ShaderProgram", { value: this._u8ToF32ShaderProgram, configurable: true });
    return this._u8ToF32ShaderProgram;
  }

  get u8ToI32ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_U8', 'O_I32'], fs_type_conversion), gl.FRAGMENT_SHADER);
    this._u8ToI32ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "u8ToI32ShaderProgram", { value: this._u8ToI32ShaderProgram, configurable: true });
    return this._u8ToI32ShaderProgram;
  }

  get i32ToF32ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_I32', 'O_F32'], fs_type_conversion), gl.FRAGMENT_SHADER);
    this._i32ToF32ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "i32ToF32ShaderProgram", { value: this._i32ToF32ShaderProgram, configurable: true });
    return this._i32ToF32ShaderProgram;
  }

  get i32ToU8ShaderProgram()
  {
    //DEBUG console.log("Initializing divideImShaderProgram");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    let fShader = this._compile_shader(this._shader_inject_definition(['I_I32', 'O_U8'], fs_type_conversion), gl.FRAGMENT_SHADER);
    this._i32ToU8ShaderProgram = this._create_shader_program(this.vertexShader, fShader);
    gl.deleteShader(fShader);

    Object.defineProperty(this, "i32ToU8ShaderProgram", { value: this._i32ToU8ShaderProgram, configurable: true });
    return this._i32ToU8ShaderProgram;
  }

  /**
   * @private
   * @param definitions {Array<string>}
   * @param shaderSource {string}
   * @return {string}
   */
  _shader_inject_definition(definitions, shaderSource)
  {
    const placeholder = '/* inject:defines */';
    let replacement = _.reduce(_.map(definitions, definition => `#define ${definition}`), (ac, elem) => `${ac}\n${elem}`);
    return shaderSource.replace(placeholder, replacement);
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

    assert(success, "WebGL Shader Compilation Error: \n" + log);

    if (log.length > 0)
    {
      console.warn("WebGL Shader Compilation Warning: \n" + log);
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
    assert(success, "WebGL Program Linking Error: \n" + log);
    
    if (log.length > 0)
    {
      console.warn("WebGL Program Linking Warning: \n" + log);
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