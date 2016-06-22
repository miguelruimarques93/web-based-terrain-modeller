import jsfeat from 'jsfeat';
import { require } from '../utils/assert';
import { isPowerOf2 } from '../utils/math_utils';

class Terrain {
  constructor() {
    this._height_map_updates = 0;
    this._normal_map_updates = 0;

    this.$height_map = null;
    this.$normal_map = null;
  }

  /**
   * @param {jsfeat.matrix_t} val
   */
  set height_map(val) {
    console.log("set height_map");
    require(val.cols == val.rows && isPowerOf2(val.cols), "deterministic matrix needs to be square and the side needs to be a power of 2.");
    this.$height_map = val;
    this._height_map_updates++;
  }

  /**
   * @returns {jsfeat.matrix_t}
   */
  get height_map() { return this.$height_map; }

  /**
   * @param {jsfeat.matrix_t} val
   */
  set normal_map(val) {
    this.$normal_map = val;
    this._normal_map_updates++;
  }

  /**
   * @returns {jsfeat.matrix_t}
   */
  get normal_map() { return this.$normal_map; }

}

export default Terrain;