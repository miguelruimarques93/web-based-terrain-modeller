import jsfeat from 'jsfeat';
import _ from 'underscore';
import imageTemplate from './image_dialog.tpl.html!text';
import {flatten} from 'web_based_terrain_modeller/utils/utils';
import Terrain from '../../common/terrain';
import { TerrainFile, RandomGenerationMethod } from '../../common/terrain_file';
import * as image_utils from '../../utils/image_utils';
import { saveAs } from 'file-saver';
import { assert } from '../../utils/assert';
import { convert_base64_to_matrix } from '../../utils/image_utils';

@Inject(
  '$mdDialog',
  '$element',
  '$timeout',
  'FileReader',
  '$scope',
  '$mdMenu',
  '$q',
  'heightmapReader',
  'normalmapGenerator',
  'randomSurfaceGenerator',
  'gpu')
class EditorController {

  constructor() {
    this.images = [];

    this.init_scope();
  }

  is_random_method_fourier() {
    return this.$scope.random_method == RandomGenerationMethod.FourierSynthesis.ordinal;
  }

  is_random_method_perlin_noise() {
    return this.$scope.random_method == RandomGenerationMethod.PerlinNoise.ordinal;
  }

  is_random_method_simplex_noise() {
    return this.$scope.random_method == RandomGenerationMethod.SimplexNoise.ordinal;
  }

  init_scope() {
    this.$scope.surface_size = 256;

    this.$scope.random_methods = RandomGenerationMethod.enumValues;
    this.$scope.random_method = RandomGenerationMethod.None.ordinal;

    this.$scope.fourier_synthesis = {
      power: 2.4
    };

    this.$scope.perlin_noise = {
      frequency: 160,
      octaves: 10,
      persistence: 0.5,
      lacunarity: 2.0,
      base: 0.0
    };

    this.$scope.simplex_noise = {
      frequency: 160,
      octaves: 10,
      persistence: 0.5,
      lacunarity: 2.0,
      base: 0.0
    };

    this.$scope.blend = {
      strength: 100,
      mapping_data: {
        points: [[0.0, 0.0], [0.25, 0.25], [0.75, 0.75], [1.0, 1.0]]
      },
      minimum: 0,
      maximum: 255
    };

    this.terrain = new Terrain();

  }

  /**
   * @param {jsfeat.matrix_t} data_mat
   * @param {jsfeat.matrix_t} normal_map
   */
  set_surface(data_mat, normal_map = undefined) {
    this.terrain.height_map = data_mat;

    this.images.push(image_utils.convert_matrix_to_base64(data_mat));

    if (normal_map === undefined) {
      this.normalmapGenerator.from_heightmap_gpu(data_mat).then(((nmap) => {
        this.terrain.normal_map = nmap;
        this.images.push(image_utils.convert_matrix_to_base64(nmap));
      }).bind(this), () => {
      });
    }
    else {
      this.terrain.normal_map = normal_map;
      this.images.push(image_utils.convert_matrix_to_base64(normal_map));
    }
  }

  openFile(file) {
    if (file !== null) {
      this.heightmapReader.from_file(file, this.$scope).then(data_mat => {
        this.deterministic_mat = data_mat;
        this.set_surface(this.deterministic_mat);

      });
    }
  }

  openZip(file) {
    if (file !== null) {
      TerrainFile.load_from_file(file).then(t_file => {
        convert_base64_to_matrix(t_file.result_image).then( data_mat => {
          // debugger;
          this.set_surface(data_mat);
        });
      });
    }
  }

  canSave() {
    return _.has(this, 'deterministic_mat');
  }

  saveCurrent() {
    assert(this.canSave(), 'saveCurrent called even though there is nothing to save.');

    let orig = this.deterministic_mat;
    let result = orig;

    if (_.has(this, 'result_matrix')) {
      result = this.result_matrix;
    }

    let file = new TerrainFile();
    file.original_matrix = orig;
    file.result_matrix = result;

    file.get_blob().then(glob => {
      saveAs(glob, 'project.zip');
    });
  }

  remove_image(index) {
    this.images.splice(index, 1);
  }

  remove_all_images() {
    this.images = [];
  }

  show_image(ev, image_url) {
    this.$mdDialog.show({
      template: imageTemplate,
      targetEvent: ev,
      locals: {
        image: image_url
      },
      controller: ($scope, image) => {
        $scope.image = image;
      },
      clickOutsideToClose: true
    });
  }

  blend_(random_mat) {
    if (_.has(this, 'plane')) {
      this.scene.remove(this.plane);
    }

    let start = performance.now();

    /** @type {gpu} */
    let gpu = this.gpu;

    let g_random = gpu.create_gpu_matrix(random_mat);

    let g_random_fft = gpu.compute_fft(g_random, true);
    let g_random_fft_blur = gpu.blur(g_random_fft, this.$scope.blend.strength);
    let g_random_blur = gpu.compute_fft(g_random_fft_blur, false);

    let g_random_details = gpu.subtract(g_random, g_random_blur);

    let deterministic_mat_f32 = new jsfeat.matrix_t(this.deterministic_mat.cols, this.deterministic_mat.rows, this.deterministic_mat.channel | jsfeat.F32_t);
    this.deterministic_mat.copy_to(deterministic_mat_f32);

    let g_deterministic = gpu.create_gpu_matrix(deterministic_mat_f32);
    let g_norm_deterministic = gpu.normalize(g_deterministic);

    // TODO: Check blend_data

    let g_mapped_norm_deterministic = gpu.map_hermite_spline(g_norm_deterministic, flatten(this.$scope.blend.mapping_data.points), this.$scope.blend.mapping_data.tangents);

    let g_scaled_random_details = gpu.multiply(g_random_details, g_mapped_norm_deterministic);

    let g_detailed = gpu.add(g_deterministic, g_scaled_random_details);
    let g_normalized_detailed = gpu.normalize(g_detailed);

    let g_result_1 = gpu.multiply(g_normalized_detailed, this.$scope.blend.maximum - this.$scope.blend.minimum);
    let g_result = gpu.add(g_result_1, this.$scope.blend.minimum);


    let g_u8_result = gpu.convert_to(g_result, jsfeat.U8_t);
    let g_normal_map = gpu.normalMap(g_u8_result);

    random_mat = g_result.download();
    let normal_map = g_normal_map.download();

    g_random.destroy();
    g_random_fft.destroy();
    g_random_fft_blur.destroy();
    g_random_blur.destroy();
    g_random_details.destroy();
    g_deterministic.destroy();
    g_norm_deterministic.destroy();
    g_mapped_norm_deterministic.destroy();
    g_scaled_random_details.destroy();
    g_detailed.destroy();
    g_normalized_detailed.destroy();
    g_result_1.destroy();
    g_result.destroy();
    g_u8_result.destroy();
    g_normal_map.destroy();

    console.log(`Blending done in ${performance.now() - start} ms`);

    this.result_matrix = random_mat;
    this.set_surface(random_mat, normal_map);
  }

  generate_random_fourier_surface(width, height) {
    return this.randomSurfaceGenerator.generate_surface_fourier_synthesis_gpu(width, height, this.$scope.fourier_synthesis.power);
  }

  generate_random_perlin_surface(width, height) {
    return this.randomSurfaceGenerator.generate_surface_perlin_noise_gpu(
      width, height,
      this.$scope.perlin_noise.frequency,
      this.$scope.perlin_noise.octaves,
      this.$scope.perlin_noise.persistence,
      this.$scope.perlin_noise.lacunarity,
      this.$scope.perlin_noise.base
    );
  }

  generate_random_simplex_surface(width, height) {
    return this.randomSurfaceGenerator.generate_surface_simplex_noise_gpu(
      width, height,
      this.$scope.simplex_noise.frequency,
      this.$scope.simplex_noise.octaves,
      this.$scope.simplex_noise.persistence,
      this.$scope.simplex_noise.lacunarity,
      this.$scope.simplex_noise.base
    );
  }

  generate_random_surface(width, height) {
    switch (parseInt(this.$scope.random_method)) {
      case RandomGenerationMethod.FourierSynthesis.ordinal:
        return this.generate_random_fourier_surface(width, height);
      case RandomGenerationMethod.PerlinNoise.ordinal:
        return this.generate_random_perlin_surface(width, height);
      case RandomGenerationMethod.SimplexNoise.ordinal:
        return this.generate_random_simplex_surface(width, height);
    }
  }

  can_generate() {
    return this.$scope.random_method != RandomGenerationMethod.None.ordinal;
  }

  generate_surface(ev) {
    // TODO: Make Dimensions available in the interface
    let width = parseInt(this.$scope.surface_size);
    let height = width;

    let start = performance.now();
    this.generate_random_surface(width, height)
      .then(data_mat => {
        console.log(`${RandomGenerationMethod.enumValues[this.$scope.random_method].name} done in ${performance.now() - start} ms`);
        return data_mat;
      })
      .then(this.set_surface.bind(this));
  }

  can_add_detail() {
    return _.has(this, 'deterministic_mat') && this.$scope.random_method != RandomGenerationMethod.None.ordinal;
  }

  add_detail() {
    if (!this.detail_watch)
      return;

    if (this.$scope.settingsForm.$invalid)
      return;

    let width = this.deterministic_mat.cols;
    let height = this.deterministic_mat.rows;

    debugger;

    let start = performance.now();
    this.generate_random_surface(width, height)
      .then(data_mat => {
        console.log(`${RandomGenerationMethod.enumValues[this.$scope.random_method].name} done in ${performance.now() - start} ms`);
        return data_mat;
      })
      .then(this.blend_.bind(this));
  }

  enable_detail() {
    this.detail_watch = true;
    this.add_detail();
  }

}

export default EditorController;