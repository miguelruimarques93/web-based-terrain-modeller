import JSZip from 'jszip';
import * as image_utils from '../utils/image_utils';
import {Enum} from 'enumify';
import { uint8ArrayToBase64 } from '../utils/utils';

/**
 *
 * @typedef {Object} PerlinNoiseParameters
 * @property {number} frequency
 * @property {number} octaves
 * @property {number} persistence
 * @property {number} lacunarity
 * @property {number} base
 */

/**
 *
 * @typedef {Object} SimplexNoiseParameters
 * @property {number} frequency
 * @property {number} octaves
 * @property {number} persistence
 * @property {number} lacunarity
 * @property {number} base
 */

/**
 *
 * @typedef {Object} FourierSynthesisParameters
 * @property {number} power
 */

/**
 *
 * @typedef {Object} BlendParameters
 * @property {Array<Array<number>>} mapping_points
 */

/**
 *
 * @typedef {Object} NormalMapParameters
 * @property {number} strength
 */

class RandomGenerationMethod extends Enum {
}
RandomGenerationMethod.initEnum({
  None: {
    description: 'None'
  },
  FourierSynthesis: {
    description: 'Fourier Synthesis'
  },
  PerlinNoise: {
    description: 'Perlin Noise'
  },
  SimplexNoise: {
    description: 'Simplex Noise'
  }
});


/**
 * Represents a Terrain File wich contains:
 *  - Original Heightmap
 *  - Result Heightmap
 *  - Normal Map generation Parameters
 *  - Random Matrix Parameters
 *  - Blending Parameters
 */
class TerrainFile {
  constructor() {
    this._original_image = null;
    this._result_image = null;
    this.data = {
      random_method: RandomGenerationMethod.None,
      random_parameters: {},
      normal_map_parameters: {strength: 0.01},
    };

  }

  /**
   *
   * @param {jsfeat.matrix_t} matrix
   */
  set original_matrix(matrix) {
    this._original_image = image_utils.convert_matrix_to_base64(matrix);
  }

  /**
   *
   * @returns {string|null}
   */
  get original_image() {
    return this._original_image;
  }

  /**
   *
   * @param {jsfeat.matrix_t} matrix
   */
  set result_matrix(matrix) {
    this._result_image = image_utils.convert_matrix_to_base64(matrix);
  }

  /**
   *
   * @returns {string|null}
   */
  get result_image() {
    return this._result_image;
  }

  /**
   *
   * @param {RandomGenerationMethod} method
   * @param {FourierSynthesisParameters|PerlinNoiseParameters|SimplexNoiseParameters} parameters
   */
  set_random_method(method, parameters = {}) {
    this.data.random_method = method;
    this.data.random_parameters = parameters;
  }

  set normal_map_strength(value) {
    this.data.normal_map_parameters.strength = value;
  }

  get_blob() {
    let zip = new JSZip();

    zip.file("original.png", this.original_image.slice(this.original_image.indexOf(',')), {base64: true});
    zip.file("result.png", this.result_image.slice(this.original_image.indexOf(',')), {base64: true});
    zip.file("data.json", JSON.stringify(this.data));

    return zip.generateAsync({type: "blob"});
  }

  static load_from_file(file) {
    return new Promise((resolve, reject) => {
      let fileLoadPromise = JSZip.loadAsync(file);
      fileLoadPromise.then(zip => {
        Promise.all([
          zip.file('data.json').async('string'),
          zip.file('original.png').async('uint8array'),
          zip.file('result.png').async('uint8array')])
          .then(
            values => {
              let t_file = new TerrainFile();

              let [data, orig, res] = values;
              t_file.data = JSON.parse(data);
              t_file._original_image = 'data:image/png;base64,' + uint8ArrayToBase64(orig);
              t_file._result_image = 'data:image/png;base64,' + uint8ArrayToBase64(res);

              resolve(t_file)
            }
          )
      }, err => {
        throw err;
      });
    });
  }
}

export { TerrainFile, RandomGenerationMethod };
