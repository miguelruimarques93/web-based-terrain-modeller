import jsfeat from 'jsfeat';
import { require } from '../utils/assert';
import { isPowerOf2 } from '../utils/math_utils';

class Terrain {
  constructor() {
    this._deterministic_matrix_updates = 0;
    this._normal_matrix_updates = 0;

    this.$deterministic_matrix = null;
    this.$normal_matrix = null;

    this.normal_map_strength = 0.01;
  }

  /**
   * @param {jsfeat.matrix_t} val
   */
  set deterministic_matrix(val) {
    console.log("set deterministic_matrix");
    require(val.cols == val.rows && isPowerOf2(val.cols), "deterministic matrix needs to be square and the side needs to be a power of 2.");
    this.$deterministic_matrix = val;
    this._deterministic_matrix_updates++;
  }

  /**
   * @returns {jsfeat.matrix_t}
   */
  get deterministic_matrix() { return this.$deterministic_matrix; }

  /**
   * @param {jsfeat.matrix_t} val
   */
  set normal_matrix(val) {
    this.$normal_matrix = val;
    this._normal_matrix_updates++;
  }

  /**
   * @returns {jsfeat.matrix_t}
   */
  get normal_matrix() { return this.$normal_matrix; }

}

export default Terrain;