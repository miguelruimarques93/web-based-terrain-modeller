import jsfeat from 'jsfeat';
import gpu from '../imgproc/gpu';
import gpu_matrix from '../imgproc/gpu_matrix';
import { require, assert } from '../utils/assert';
import { flatten, deepCopy } from '../utils/utils';

class BlendingPipeline {

    /**
     * Function that given a width and a height generates a random surface.
     * @callback BlendingPipeline~RandomSurfaceGenerator
     * @param {number} width
     * @param {number} height
     * @returns {jsfeat.matrix_t}
     */

    /**
     * @typedef {Object} HermiteMappingData
     * @property {Array<Array<number>>} points
     * @property {Array<number>} tangents
     */

    /**
     * @typedef {Object} BlendingPipeline~HermiteMappingData_Internal
     * @property {Array<number>} points
     * @property {Array<number>} tangents
     */

    // /** @type {gpu} */ _gpu;
    //
    // /** @type {jsfeat.matrix_t} */ _base_matrix;
    // /** @type {jsfeat.matrix_t} */ _random_matrix;
    // /** @type {jsfeat.matrix_t} */ _result_matrix;
    // /** @type {jsfeat.matrix_t} **/ _normal_map;
    //
    // /** @type {gpu_matrix} */ _base_matrix_gpu;
    // /** @type {gpu_matrix} */ _base_matrix_normalized_gpu;
    // /** @type {gpu_matrix} */ _base_matrix_normalized_mapped_gpu;
    //
    // /** @type {gpu_matrix} */ _random_matrix_gpu;
    // /** @type {gpu_matrix} */ _random_matrix_fft_gpu;
    // /** @type {gpu_matrix} */ _random_matrix_fft_blur_gpu;
    // /** @type {gpu_matrix} */ _random_blur_gpu;
    // /** @type {gpu_matrix} */ _random_details_gpu;
    //
    // /** @type {gpu_matrix} **/ _scaled_random_details_gpu;
    // /** @type {gpu_matrix} */ _result_normalized_gpu;
    // /** @type {gpu_matrix} */ _result_matrix_temp_gpu;
    // /** @type {gpu_matrix} */ _result_matrix_gpu;
    //
    //
    // /** @type {gpu_matrix} **/ _result_matrix_u8_gpu;
    // /** @type {gpu_matrix} **/ _normal_map_gpu;
    //
    // /** @type {BlendingPipeline~RandomSurfaceGenerator} **/ _random_matrix_generator;
    //
    // /** @type{number} */ _blend_strength;
    //
    // /** @type {BlendingPipeline~HermiteMappingData_Internal} */ _mapping_data;
    //
    // /** @type{number} */ _minimum;
    // /** @type{number} */ _maximum;
    //
    // /** @type{number} */ _normal_map_strength;

    /**
     * @param {gpu} gpu
     */
    constructor(gpu) {
        this._gpu = gpu;

        this._base_matrix = null;
        this._random_matrix = null;
        this._result_matrix = null;
        this._normal_map = null;

        this._minimum = 0;
        this._maximum = 255;

        this._normal_map_strength = 0.01;
    }

    /**
     * @returns {jsfeat.matrix_t}
     */
    get base_matrix() {
        return this._base_matrix;
    }

    /**
     * @returns {jsfeat.matrix_t}
     */
    get random_matrix() {
        return this._random_matrix;
    }

    /**
     * @returns {jsfeat.matrix_t}
     */
    get result_matrix() {
        return this._result_matrix;
    }

    /**
     * @returns {jsfeat.matrix_t}
     */
    get normal_matrix() {
        return this._normal_map;
    }

    /**
     * @param {jsfeat.matrix_t} value
     */
    set base_matrix(value) {
        require(value.type == jsfeat.F32_t && value.channel == jsfeat.C1_t, "Base matrix needs to be F32C1_t.");

        this._base_matrix = value;

        if (!this._base_matrix_gpu) {
            this._base_matrix_gpu = this._gpu.create_gpu_matrix(this._base_matrix);
        } else {
            this._base_matrix_gpu.upload(this._base_matrix);
        }

        if (this._random_matrix_generator) {
            if (!this._random_matrix || (this._random_matrix.cols != this._base_matrix.cols || this._random_matrix.rows != this._base_matrix.rows)){
                this._normalize_base_matrix(false);
                this._generate_random_matrix();
            } else {
                this._normalize_base_matrix();
            }
        } else {
            this._normalize_base_matrix(false);
        }
    }

    /**
     * @param {BlendingPipeline~RandomSurfaceGenerator} value
     */
    set random_matrix_generator(value) {
        this._random_matrix_generator = value;

        if (this._base_matrix) {
            this._generate_random_matrix();
        }
    }

    trigger_random_matrix_generation() {
        this._generate_random_matrix();
    }

    /**
     *
     * @param {number} value
     */
    set blend_strength(value) {
        if (this._blend_strength !== value) {
            this._blend_strength = value;
            this._calculate_random_details();
        }
    }

    /**
     * @param {HermiteMappingData} value
     */
    set hermite_mapping_data(value) {
        this._mapping_data = {
            points: flatten(value.points),
            tangents: deepCopy(value.tangents)
        };

        this._map_normalized_base_matrix();
    }

    /**
     * @param {Array<number>} value
     */
    set result_bounds(value) {
        let [minimum, maximum] = value;

        if (minimum === undefined || maximum === undefined)
            return;

        if (minimum == this._minimum && maximum == this._maximum)
            return;

        if (!(minimum <= maximum))
            debugger;

        if (minimum > maximum || minimum < 0 || maximum > 255) {
            debugger;
            return;
        }

        assert(minimum <= maximum, "Minimum must be less than maximum.");
        assert(minimum >= 0, "Minimum must greater or equal to 0.");
        assert(maximum <= 255, "Maximum must be less or equal to 255.");

        this._minimum = minimum;
        this._maximum = maximum;

        this._compute_result();
    }

    _normalize_base_matrix(should_continue = true) {
        if (!this._base_matrix_gpu)
            return;

        console.log('_normalize_base_matrix');

        this._base_matrix_normalized_gpu = this._gpu.normalize(this._base_matrix_gpu, this._base_matrix_normalized_gpu);

        this._map_normalized_base_matrix(should_continue);
    }

    _map_normalized_base_matrix(should_continue = true) {
        if (!this._base_matrix_normalized_gpu || !this._mapping_data)
            return;

        console.log('_map_normalized_base_matrix');

        this._base_matrix_normalized_mapped_gpu = this._gpu.map_hermite_spline(
            this._base_matrix_normalized_gpu,
            this._mapping_data.points,
            this._mapping_data.tangents);

        if (should_continue)
            this._compute_normalized_result();
    }

    _generate_random_matrix() {
        if (!this._random_matrix_generator || !this._base_matrix)
            return;

        console.log('_generate_random_matrix');

        this._random_matrix_generator(this._base_matrix.cols, this._base_matrix.rows).then(random_mat => {
            this._random_matrix = random_mat;

            if (!this._random_matrix_gpu) {
                this._random_matrix_gpu = this._gpu.create_gpu_matrix(this._random_matrix);
            } else {
                this._random_matrix_gpu.upload(this._random_matrix);
            }

            this._random_matrix_fft_gpu = this._gpu.compute_fft(this._random_matrix_gpu, true, this._random_matrix_fft_gpu);

            this._calculate_random_details();
        });
    }

    _calculate_random_details() {
        if (!this._random_matrix_fft_gpu || !this._blend_strength)
            return;

        console.log('_calculate_random_details');

        this._random_matrix_fft_blur_gpu = this._gpu.blur(this._random_matrix_fft_gpu, this._blend_strength, this._random_matrix_fft_blur_gpu);
        this._random_blur_gpu = this._gpu.compute_fft(this._random_matrix_fft_blur_gpu, false, this._random_blur_gpu);
        this._random_details_gpu = this._gpu.subtract(this._random_matrix_gpu, this._random_blur_gpu, this._random_details_gpu);

        this._compute_normalized_result();
    }

    _compute_normalized_result() {
        if (!this._random_details_gpu || !this._base_matrix_normalized_mapped_gpu)
            return;

        console.log('_compute_normalized_result');

        this._scaled_random_details_gpu = this._gpu.multiply(this._random_details_gpu, this._base_matrix_normalized_mapped_gpu, this._scaled_random_details_gpu);
        this._result_non_normalized_gpu = this._gpu.add(this._base_matrix_gpu, this._scaled_random_details_gpu, this._result_non_normalized_gpu);
        this._result_normalized_gpu = this._gpu.normalize(this._result_non_normalized_gpu, this._result_normalized_gpu);

        this._compute_result();
    }

    _compute_result() {
        if (!this._result_normalized_gpu)
            return;

        console.log('_compute_result');

        if (this._minimum == 0) {
            this._result_matrix_gpu = this._gpu.multiply(this._result_normalized_gpu, this._maximum, this._result_matrix_gpu);
        } else {
            this._result_matrix_temp_gpu = this._gpu.multiply(this._result_normalized_gpu, this._maximum - this._minimum, this._result_matrix_temp_gpu);
            this._result_matrix_gpu = this._gpu.add(this._result_matrix_temp_gpu, this._minimum, this._result_matrix_gpu);
        }

        this._result_matrix_u8_gpu = this._gpu.convert_to(this._result_matrix_gpu, jsfeat.U8_t, this._result_matrix_u8_gpu);
        this._result_matrix = this._result_matrix_gpu.download();

        this._compute_normal_map();
    }

    _compute_normal_map() {
        if (!this._result_matrix_u8_gpu)
            return;

        console.log('_compute_normal_map');

        this._normal_map_gpu = this._gpu.normalMap(this._result_matrix_u8_gpu, this._normal_map_strength, this._normal_map_gpu);
        this._normal_map = this._normal_map_gpu.download();

        if (this.update_callback) {
            this.update_callback();
        }
    }

}

export default BlendingPipeline;
