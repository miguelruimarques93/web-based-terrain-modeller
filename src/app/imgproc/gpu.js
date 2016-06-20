import { assert, require } from '../utils/assert';
import { randomUInt, isPowerOf2 } from '../utils/math_utils';
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
import fs_hermite_spline from './_shaders/hermite_spline.fs!text';

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
    this._init_properties();
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
   * Computes the FFT transform of matrix.
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
      require(matrix.type == jsfeat.F32_t && matrix.channel == 2, "IFFT -> matrix must contain complex numbers.");
    else {
      require(matrix.channel <= 2, "FFT -> matrix must not have more than 2 channel.");
      if (matrix.type != jsfeat.F32_t) {
        console.warn("compute_fft: Given matrix is not of type f32. Converting...");
        // Convert matrix to F32_t
        innerMatrix = this.convert_to(matrix, jsfeat.F32_t);
        destroyInnerMatrix = true;
      }
    }

    // TODO: Should a square matrix constraint be added?

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
    require(matrix.channel == 2 && matrix.type == jsfeat.F32_t, "Gaussian Blur needs a matrix in frequency domain.");

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
    require(matrix.channel == 2 && matrix.type == jsfeat.F32_t, "fPowerMinusBeta needs a matrix in frequency domain.");

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
    require(matrix.channel == 1, "minMax operation matrix can only have 1 channel.");
    require(matrix.type == jsfeat.F32_t, "minMax operation requires a float matrix.");
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
    require(matrix.channel == 1, "normalize operation matrix can only have 1 channel.");
    require(matrix.type == jsfeat.F32_t, "normalize operation requires a float matrix.");

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
   *
   * @param {gpu_matrix} matrix
   * @param {Array<float>} control_points
   * @param {Array<float>} tangents
   * @param {gpu_matrix} result
   */
  map_hermite_spline(matrix, control_points, tangents, result = undefined)
  {
    require(matrix.channel == 1, "normalize operation matrix can only have 1 channel.");
    require(matrix.type == jsfeat.F32_t, "normalize operation requires a float matrix.");

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;

    let width = matrix.cols;
    let height = matrix.rows;

    gl.viewport(0, 0, width, height);

    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }

    result.allocate(width, height, 1, jsfeat.F32_t);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix.texture);

    gl.bindVertexArray(this.vertexArray);

    gl.useProgram(this.hermiteSplineShaderProgram);

    gl.uniform2f(this.hermiteSplineShaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(this.hermiteSplineShaderProgram.uniformLocations.u_input, 0);
    gl.uniform2fv(this.hermiteSplineShaderProgram.uniformLocations.u_points[0], new Float32Array(control_points));
    gl.uniform1fv(this.hermiteSplineShaderProgram.uniformLocations.u_tangents[0], new Float32Array(tangents));

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

    assert(this.gl !== null, "WebGL 2 not supported");
    
    let color_buffer_float_ext = this.gl.getExtension('EXT_color_buffer_float');
    assert(color_buffer_float_ext !== null, "EXT_color_buffer_float extension not supported.");
  }

  /**
   * Executes shaderProgram on the two matrices. Assumes the matrices are well defined for the required operation.
   * @private
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param shaderProgram {WebGLProgram}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  _element_wise_operation(matrix_a, matrix_b, shaderProgram, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;

    let width = matrix_a.cols;
    let height = matrix_a.rows;
    let type = matrix_a.type;

    gl.viewport(0, 0, width, height);

    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }

    result.allocate(width, height, matrix_a.channel, type);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matrix_b.texture);

    gl.bindVertexArray(this.vertexArray);

    gl.useProgram(shaderProgram);

    gl.uniform2f(shaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(shaderProgram.uniformLocations.u_input_1, 0);
    gl.uniform1i(shaderProgram.uniformLocations.u_input_2, 1);

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
  add(matrix_a, matrix_b, result = undefined)
  {
    require(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot add matrices of different shapes.");
    require(matrix_a.type == matrix_b.type, "Cannot add matrices of different types.");

    let shaderProgram = undefined;
    switch (matrix_a.type)
    {
      case jsfeat.U8_t: shaderProgram = this.u8AddShaderProgram; break;
      case jsfeat.F32_t: shaderProgram = this.f32AddShaderProgram; break;
      case jsfeat.S32_t: shaderProgram = this.i32AddShaderProgram; break;
    }

    assert(shaderProgram != undefined, "Invalid matrix type.");

    return this._element_wise_operation(matrix_a, matrix_b, shaderProgram, result);
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  subtract(matrix_a, matrix_b, result = undefined)
  {
    require(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot subtract matrices of different shapes.");
    require(matrix_a.type == matrix_b.type, "Cannot subtract matrices of different types.");

    let shaderProgram = undefined;
    switch (matrix_a.type)
    {
      case jsfeat.U8_t: shaderProgram = this.u8SubtractShaderProgram; break;
      case jsfeat.F32_t: shaderProgram = this.f32SubtractShaderProgram; break;
      case jsfeat.S32_t: shaderProgram = this.i32SubtractShaderProgram; break;
    }

    assert(shaderProgram != undefined, "Invalid matrix type.");

    return this._element_wise_operation(matrix_a, matrix_b, shaderProgram, result);
  }
  
  /**
   * @param matrix_a {gpu_matrix}
   * @param matrix_b {gpu_matrix}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  multiply_(matrix_a, matrix_b, result = undefined)
  {
    require(matrix_a.cols == matrix_b.cols || matrix_a.rows == matrix_b.rows || matrix_a.channel == matrix_b.channel, "Cannot multiply matrices of different shapes.");
    require(matrix_a.type == matrix_b.type, "Cannot multiply matrices of different types.");

    let shaderProgram = undefined;
    switch (matrix_a.type)
    {
      case jsfeat.U8_t: shaderProgram = this.u8MultiplyShaderProgram; break;
      case jsfeat.F32_t: shaderProgram = this.f32MultiplyShaderProgram; break;
      case jsfeat.S32_t: shaderProgram = this.i32MultiplyShaderProgram; break;
    }

    assert(shaderProgram != undefined, "Invalid matrix type.");

    return this._element_wise_operation(matrix_a, matrix_b, shaderProgram, result);
  }

  /**
   * Executes shaderProgram on the two matrices. Assumes the matrices are well defined for the required operation.
   * @private
   * @param matrix_a {gpu_matrix}
   * @param value {number}
   * @param shaderProgram {WebGLProgram}
   * @param result {gpu_matrix}
   * @returns {gpu_matrix}
   */
  _element_wise_operation_im(matrix_a, value, shaderProgram, result = undefined)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;

    let width = matrix_a.cols;
    let height = matrix_a.rows;
    let type = matrix_a.type;

    gl.viewport(0, 0, width, height);

    if (result === undefined)
    {
      result = this.create_gpu_matrix();
    }

    result.allocate(width, height, matrix_a.channel, type);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, matrix_a.texture);

    gl.bindVertexArray(this.vertexArray);

    gl.useProgram(shaderProgram);

    gl.uniform2f(shaderProgram.uniformLocations.u_transformSize, width, height);
    gl.uniform1i(shaderProgram.uniformLocations.u_input_1, 0);

    switch (matrix_a.type)
    {
      case jsfeat.U8_t: gl.uniform1ui(shaderProgram.uniformLocations.u_input_2, value); break;
      case jsfeat.F32_t: gl.uniform1f(shaderProgram.uniformLocations.u_input_2, value); break;
      case jsfeat.S32_t: gl.uniform1i(shaderProgram.uniformLocations.u_input_2, value); break;
    }

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
    let shaderProgram = undefined;
    switch (matrix_a.type)
    {
      case jsfeat.U8_t: shaderProgram = this.u8MultiplyImShaderProgram; break;
      case jsfeat.F32_t: shaderProgram = this.f32MultiplyImShaderProgram; break;
      case jsfeat.S32_t: shaderProgram = this.i32MultiplyImShaderProgram; break;
    }

    assert(shaderProgram != undefined, "Invalid matrix type.");

    return this._element_wise_operation_im(matrix_a, value, shaderProgram, result);
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
    let shaderProgram = undefined;
    switch (matrix_a.type)
    {
      case jsfeat.U8_t: shaderProgram = this.u8DivideImShaderProgram; break;
      case jsfeat.F32_t: shaderProgram = this.f32DivideImShaderProgram; break;
      case jsfeat.S32_t: shaderProgram = this.i32DivideImShaderProgram; break;
    }

    assert(shaderProgram != undefined, "Invalid matrix type.");

    return this._element_wise_operation_im(matrix_a, value, shaderProgram, result);
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
    require(matrix.type == jsfeat.U8_t, "normalMap operation requires an unsigned byte matrix.");
    require(matrix.channel == 1, "normalMap operation requires a matrix with only one channel.");

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
    require(matrix.type != type, "convert_to: Cannot convert matrix to same type.");

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

  /**
   *
   * @param name {String}
   * @param definitions {Array<String>}
   * @param fragmentSource {String}
   */
  _define_shader_program_property(name, definitions, fragmentSource) {
    let src = definitions.length > 0 ? this._shader_inject_definition(definitions, fragmentSource) : fragmentSource;

    Object.defineProperty(this, name, {
      configurable: true,
      get: () => {
        let gl = this.gl;
        let fShader = this._compile_shader(src, gl.FRAGMENT_SHADER);
        let program = this._create_shader_program(this.vertexShader, fShader);
        gl.deleteShader(fShader);

        Object.defineProperty(this, name, {value: program, configurable: true});
        return program;
      }
    });
  }

  _init_properties() {
    let properties = [
      ["horizontalFFTShaderProgram", ['HORIZONTAL'], fs_fft],
      ["verticalFFTShaderProgram", [], fs_fft],
      ["swapShaderProgram", [], fs_swap],
      ["gaussianBlurShaderProgram", [], fs_gaussian_blur],
      ["fPowerMinusBetaShaderProgram", [], fs_f_power_minus_beta],
      ["magnitudeShaderProgram", [], fs_magnitude],
      ["realShaderProgram", [], fs_real],
      ["whiteNoiseShaderProgram", [], fs_white_noise],
      ["snoise2ShaderProgram", [], fs_simplex_noise],
      ["pnoise2ShaderProgram", [], fs_perlin_noise],
      ["minMaxReduceColumnsShaderProgram", [], fs_min_max_reduce_columns],
      ["minMaxReduceRowsShaderProgram", [], fs_min_max_reduce_rows],
      ["normalizeShaderProgram", [], fs_normalize],
      ["normalMapShaderProgram", [], fs_normal_map],
      ["hermiteSplineShaderProgram", [], fs_hermite_spline],

      ["f32ToU8ShaderProgram", ['I_F32', 'O_U8'], fs_type_conversion],
      ["f32ToI32ShaderProgram", ['I_F32', 'O_I32'], fs_type_conversion],
      ["u8ToF32ShaderProgram", ['I_U8', 'O_F32'], fs_type_conversion],
      ["u8ToI32ShaderProgram", ['I_U8', 'O_I32'], fs_type_conversion],
      ["i32ToF32ShaderProgram", ['I_I32', 'O_F32'], fs_type_conversion],
      ["i32ToU8ShaderProgram", ['I_I32', 'O_U8'], fs_type_conversion],

      ['u8AddShaderProgram', ['U8'], fs_add],
      ['f32AddShaderProgram', ['F32'], fs_add],
      ['i32AddShaderProgram', ['I32'], fs_add],

      ['u8SubtractShaderProgram', ['U8'], fs_subtract],
      ['f32SubtractShaderProgram', ['F32'], fs_subtract],
      ['i32SubtractShaderProgram', ['I32'], fs_subtract],

      ['u8MultiplyShaderProgram', ['U8'], fs_multiply],
      ['f32MultiplyShaderProgram', ['F32'], fs_multiply],
      ['i32MultiplyShaderProgram', ['I32'], fs_multiply],

      ['u8MultiplyImShaderProgram', ['U8'], fs_multiply_im],
      ['f32MultiplyImShaderProgram', ['F32'], fs_multiply_im],
      ['i32MultiplyImShaderProgram', ['I32'], fs_multiply_im],

      ['u8DivideImShaderProgram', ['U8'], fs_divide_im],
      ['f32DivideImShaderProgram', ['F32'], fs_divide_im],
      ['i32DivideImShaderProgram', ['I32'], fs_divide_im],
    ];

    for (let i = 0; i < properties.length; ++i) {
      this._define_shader_program_property(properties[i][0], properties[i][1], properties[i][2]);
    }
  }

  get vertexShader()
  {
    //DEBUG console.log("Initializing vertexShader");
    this._vertexShader = this._compile_shader(vs_pass, this.gl.VERTEX_SHADER);
    Object.defineProperty(this, "vertexShader", { value: this._vertexShader, configurable: true });
    return this._vertexShader;
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