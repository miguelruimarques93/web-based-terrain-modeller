import { assert, require } from '../utils/assert';
import { isPowerOf2 } from '../utils/math_utils';

import jsfeat from 'jsfeat';
import _ from 'underscore';

/**
 * Class gpu_matrix
 * @property {number} cols
 * @property {number} rows
 * @property {number} channel
 * @property {WebGLTexture} texture
 * @property {WebGLFramebuffer} framebuffer
 * @property {WebGL2RenderingContext} gl
 */
class gpu_matrix {
  
  
  /**
   * Create a gpu_matrix.
   * @param {WebGL2RenderingContext} gl 
   */ 
  constructor(gl) 
  {
    this.gl = gl;
    this.framebuffer = gl.createFramebuffer();
  }
  
  
  /**
   * Object that contains options for a WebGLTexture.
   * @typedef {Object} gpu_matrix~WebGLTextureOptions
   * @property {number} filter
   * @property {number} minFilter
   * @property {number} magFilter
   * @property {number} wrap
   * @property {number} wrapS
   * @property {number} wrapT
   */
  
  
  /**
   * Allocate an empty gpu_matrix.
   * @param {number} cols  
   * @param {number} rows
   * @param {number} channel 
   * @param {jsfeat.DataType} type
   * @param {gpu_matrix~WebGLTextureOptions} options 
   */
  allocate(cols, rows, channel, type = jsfeat.F32_t, options = {}) 
  {
    type = jsfeat.get_data_type(type);

    this._throw_if_now_allowed(cols, rows, channel, type);

    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    if (!_.has(this, "texture")) 
    {
      this.cols = cols;
      this.rows = rows;
      this.channel = channel;
      this.type = type;
      this._createTexture();
      this.setTextureParameters(options);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } 
    else 
    {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      if (this.cols != cols || this.rows != rows || this.channel != channel || this.type != type) 
      {
        // Data type has changed. Re-initialization needed
        this.cols = cols;
        this.rows = rows;
        this.channel = channel;
        this.type = type;
        gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.cols, this.rows, 0, this._get_gl_format(), this._get_gl_type(), null);
      }
      
      gl.bindTexture(gl.TEXTURE_2D, null);
      
      this.setTextureParameters(options);
    }
  }
  
  /**
   * Destroys gpu_matrix
   */
  destroy()
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    if (_.has(this, "texture")) 
    {
      gl.deleteTexture(this.texture);
    }
    
    gl.deleteFramebuffer(this.framebuffer);
  }
  
  
  /**
   * Set WebGL texture parameters
   * @param options {gpu_matrix~WebGLTextureOptions}
   */
  setTextureParameters(options)
  {
    /** @type {WebGL2RenderingContext} */ 
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE31);

    if (!_.has(this, "options"))
      this.options = { filter: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE };

    this.options = _.extend(this.options, options);

    this.options.minFilter = this.options.minFilter !== undefined ? this.options.minFilter : this.options.filter;
    this.options.magFilter = this.options.magFilter !== undefined ? this.options.magFilter : this.options.filter;
    this.options.wrapS = this.options.wrapS !== undefined ? this.options.wrapS : this.options.wrap;
    this.options.wrapT = this.options.wrapT !== undefined ? this.options.wrapT : this.options.wrap;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.options.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.options.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.options.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.options.wrapT);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  
  /**
   * Upload matrix to the GPU.
   * @param {jsfeat.matrix_t} matrix
   * @param {gpu_matrix~WebGLTextureOptions} options
   */
  upload(matrix, options = {})
  {
    this._throw_if_now_allowed(matrix.cols, matrix.rows, matrix.channel, matrix.type);
    
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    if (!_.has(this, "texture"))
    {
      this.cols = matrix.cols;
      this.rows = matrix.rows;
      this.channel = matrix.channel;
      this.type = matrix.type;
      this._createTexture(matrix.data);
      this.setTextureParameters(options);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    else
    {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      if (this.cols != matrix.cols || this.rows != matrix.rows || this.channel != matrix.channel || this.type != matrix.type) 
      {
        // Data type has changed. Re-initialization needed
        this.cols = matrix.cols;
        this.rows = matrix.rows;
        this.channel = matrix.channel;
        gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.cols, this.rows, 0, this._get_gl_format(), this._get_gl_type(), matrix.data);
      }
      else
      {
        // Data type is the same. Just re-upload the data.
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.cols, this.rows, this._get_gl_format(), this._get_gl_type(), matrix.data);
      }
      
      gl.bindTexture(gl.TEXTURE_2D, null);
      
      this.setTextureParameters(options);
    }
  }
  
  
  /**
   * Downloads the matrix from the GPU.
   * @return {jsfeat.matrix_t} The matrix.
   */
  download()
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    let result = new jsfeat.matrix_t(this.cols, this.rows, this.type | this.channel);
    
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.readPixels(0, 0, this.cols, this.rows, this._get_gl_format(), this._get_gl_type(), result.data);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    
    return result;
  }
  
  /**
   * @private
   * @param {number} width
   * @param {number} height
   * @param {number} channel
   * @param {DataType} type
   * @throws
   */
  _throw_if_now_allowed(width, height, channel, type)
  {
    assert(this._is_allowed_size(width, height), "gpu_matrix: invalid size.");
    assert(this._is_allowed_type(type), "gpu_matrix: invalid type.");
    assert(this._is_allowed_channel(channel), "gpu_matrix: invalid number of channel.");
  }

  /**
   * @private
   * @return {number} The WebGL Format
   */
  _get_gl_format()
  {
    switch (this.type)
    {
      case jsfeat.U8_t:
      case jsfeat.S32_t:
        switch (this.channel)
          {
            case 1: return this.gl.RED_INTEGER;
            case 2: return this.gl.RG_INTEGER;
            case 4: return this.gl.RGBA_INTEGER;
          }
          break;
      case jsfeat.F32_t:
        switch (this.channel)
        {
          case 1: return this.gl.RED;
          case 2: return this.gl.RG;
          case 4: return this.gl.RGBA;
        }
        break;
    }
    throw "Invalid gpu_matrix format.";
  }
  
  
  /**
   * @private
   * @return {number} The WebGL Internal Format
   */
  _get_gl_internal_format()
  {
    switch (this.type)
    {
      case jsfeat.U8_t:
        switch (this.channel)
        {
          case 1: return this.gl.R8UI;
          case 2: return this.gl.RG8UI;
          case 4: return this.gl.RGBA8UI;
        }
        break;
      case jsfeat.S32_t:
        switch (this.channel)
        {
          case 1: return this.gl.R32I;
          case 2: return this.gl.RG32I;
          case 4: return this.gl.RGBA32I;
        }
        break;
      case jsfeat.F32_t:
        switch (this.channel)
        {
          case 1: return this.gl.R32F;
          case 2: return this.gl.RG32F;
          case 4: return this.gl.RGBA32F;
        }
        break;
    }

    throw "Invalid gpu_matrix format.";
  }
  
  /**
   * @private
   * @return {number} The WebGL Type
   */
  _get_gl_type()
  {
    switch (this.type)
    {
      case jsfeat.U8_t: return this.gl.UNSIGNED_BYTE;
      case jsfeat.S32_t: return this.gl.INT;
      case jsfeat.F32_t: return this.gl.FLOAT;
    }

    throw "Invalid gpu_matrix type.";
  }
  
  /**
   * @private
   * @param {jsfeat.DataType} type
   * @return {Boolean} True if type is allowed, False otherwise
   */
  _is_allowed_type(type)
  {
    type = jsfeat.get_data_type(type);
    return type == jsfeat.U8_t || type == jsfeat.S32_t || type == jsfeat.F32_t;
  }

  /**
   * @private
   * @param {number} channel
   * @return {Boolean} True if type is allowed, False otherwise
   */
  _is_allowed_channel(channel)
  {
    return channel == 1 || channel == 2 || channel == 4;
  }

  /**
   * @private
   * @param {number} width
   * @param {number} height
   * @return {Boolean} True if type is allowed, False otherwise
   */
  _is_allowed_size(width, height)
  {
    return isPowerOf2(width)  && width  <= 4096 &&
           isPowerOf2(height) && height <= 4096;
  }

  /**
   * @private
   * @param {Uint8Array | Int32Array | Float32Array} data 
   */
  _createTexture(data = null)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.cols, this.rows, 0, this._get_gl_format(), this._get_gl_type(), data);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

export default gpu_matrix;