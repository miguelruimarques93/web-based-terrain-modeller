import jsfeat from 'jsfeat';
import _ from 'underscore';

/**
 * Class gpu_matrix
 * @property {number} columns
 * @property {number} rows
 * @property {number} channels
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
   * @param {number} columns  
   * @param {number} rows
   * @param {number} channels 
   * @param {gpu_matrix~WebGLTextureOptions} options 
   */
  allocate(columns, rows, channels, options = {}) 
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    if (!_.has(this, "texture")) 
    {
      this.columns = columns;
      this.rows = rows;
      this.channels = channels;
      this._createTexture();
      this.setTextureParameters(options);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } 
    else 
    {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      if (this.columns != columns || this.rows != rows || this.channels != channels) 
      {
        // Data type has changed. Re-initialization needed
        this.columns = columns;
        this.rows = rows;
        this.channels = channels;
        gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.columns, this.rows, 0, this._get_gl_format(), gl.FLOAT, null);
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
    if (matrix.type != jsfeat.F32_t)
    {
      throw "gpu_matrix error: matrix with type different from F32 not implemented.";
    }
    
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    if (!_.has(this, "texture"))
    {
      this.columns = matrix.cols;
      this.rows = matrix.rows;
      this.channels = matrix.channel;
      this._createTexture(matrix.buffer.f32);
      this.setTextureParameters(options);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    else
    {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      if (this.columns != matrix.cols || this.rows != matrix.rows || this.channels != matrix.channel) 
      {
        // Data type has changed. Re-initialization needed
        this.columns = matrix.cols;
        this.rows = matrix.rows;
        this.channels = matrix.channel;
        gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.columns, this.rows, 0, this._get_gl_format(), gl.FLOAT, matrix.buffer.f32);
      }
      else
      {
        // Data type is the same. Just re-upload the data.
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.columns, this.rows, this._get_gl_format(), gl.FLOAT, matrix.buffer.f32);
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
    
    var result = new jsfeat.matrix_t(this.columns, this.rows, jsfeat.F32_t | this.channels);
    var pixels = result.buffer.f32;
    
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.readPixels(0, 0, this.columns, this.rows, this._get_gl_format(), gl.FLOAT, pixels);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    
    return result;
  }
  
  
  /**
   * @private
   * @return {number} The WebGL Format
   */
  _get_gl_format()
  {
    switch (this.channels)
    {
      case 1: return this.gl.RED;
      case 2: return this.gl.RG;
      case 3: return this.gl.RGB;
      case 4: return this.gl.RGBA;
    }
  }
  
  
  /**
   * @private
   * @return {number} The WebGL Internal Format
   */
  _get_gl_internal_format()
  {
    switch (this.channels)
    {
      case 1: return this.gl.R32F;
      case 2: return this.gl.RG32F;
      case 3: return this.gl.RGB32F;
      case 4: return this.gl.RGBA32F;
    }
  }
  
  
  /**
   * @private
   * @param {Float32Array} data 
   */
  _createTexture(data = null)
  {
    /** @type {WebGL2RenderingContext} */
    let gl = this.gl;
    
    gl.activeTexture(gl.TEXTURE31);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, this._get_gl_internal_format(), this.columns, this.rows, 0, this._get_gl_format(), gl.FLOAT, data);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

export default gpu_matrix;