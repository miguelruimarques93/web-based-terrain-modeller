import jsfeat from 'jsfeat';
import _ from 'underscore';
import imageTemplate from './image_dialog.tpl.html!text';
import fourierSynthesisDialogTemplate from './fourier_synthesis_dialog.tpl.html!text';
import perlinNoiseDialogTemplate from './perlin_noise_dialog.tpl.html!text';
import simplexNoiseDialogTemplate from './simplex_noise_dialog.tpl.html!text';
import {flatten} from 'web_based_terrain_modeller/utils/utils';
import Terrain from '../../common/terrain';
/**
 * @param src {jsfeat.matrix_t}
 * @return {HTMLCanvasElement}
 */
function create_canvas_from_matrix(src, mult = 1.0) {
  var canvas = document.createElement('canvas');

  canvas.width = src.cols;
  canvas.height = src.rows;

  canvas.style.width = src.cols + 'px';
  canvas.style.height = src.rows + 'px';

  var context = canvas.getContext('2d');
  var imageData = context.getImageData(0, 0, src.cols, src.rows);
  var data = imageData.data;
  var src_buffer = src.data;
  var incr = src.channel;

  for (var i = 0, j = 0; i < data.length; i += 4, j += incr) {
    data[i] = src_buffer[j] * mult;

    if (incr >= 3) {
      data[i + 1] = src_buffer[j + 1] * mult;
      data[i + 2] = src_buffer[j + 2] * mult;
    } else {
      data[i + 1] = src_buffer[j] * mult;
      data[i + 2] = src_buffer[j] * mult;
    }

    data[i + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

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

  init_scope() {
    this.blend_data = {
      points: [[0.0, 0.0], [0.25, 0.25], [0.75, 0.75], [1.0, 1.0]]
    };

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
      strength: 100
    };

    this.terrain = new Terrain();

  }

  /**
   * @param {jsfeat.matrix_t} data_mat
   * @param {jsfeat.matrix_t} normal_map
   */
  set_surface(data_mat, normal_map = undefined) {
    this.terrain.height_map = data_mat;

    this.images.push(create_canvas_from_matrix(data_mat));

    if (normal_map === undefined) {
      this.normalmapGenerator.from_heightmap_gpu(data_mat).then(((nmap) => {
        this.terrain.normal_map = nmap;
        this.images.push(create_canvas_from_matrix(nmap));
      }).bind(this), () => {
      });
    }
    else {
      this.terrain.normal_map = normal_map;
      this.images.push(create_canvas_from_matrix(normal_map));
    }
  }

  openFile(file) {
    if (file !== null) {
      this.heightmapReader.from_file(file, this.$scope).then((data_mat => {
        this.deterministic_mat = data_mat;
        this.set_surface(this.deterministic_mat);

      }).bind(this));
    }
  }

  random_perlin_surface_(ev, width = 256, height = 256) {
    return this.$q(((resolve, reject) => {
      this.$mdDialog.show({
        template: perlinNoiseDialogTemplate,
        targetEvent: ev,
        scope: this.$scope,
        preserveScope: true,
        controller: ($scope) => {
          $scope.cancel = (() => {
            this.$mdDialog.cancel();
          }).bind(this);
          $scope.confirm = (() => {
            this.$mdDialog.hide();
          }).bind(this);
        },
        clickOutsideToClose: false
      }).then(
        (() => {
          let start = performance.now();
          this.randomSurfaceGenerator.generate_surface_perlin_noise_gpu(
            width, height,
            this.$scope.perlin_noise.frequency,
            this.$scope.perlin_noise.octaves,
            this.$scope.perlin_noise.persistence,
            this.$scope.perlin_noise.lacunarity,
            this.$scope.perlin_noise.base
          ).then((data_mat) => {
            console.log(`Perlin noise synthesis done in ${performance.now() - start} ms`);
            resolve(data_mat);
          });
        }).bind(this),
        () => reject()
      );
    }).bind(this));
  }

  random_perlin_surface(ev) {
    this.random_perlin_surface_(ev).then(this.set_surface.bind(this));
  }

  random_simplex_surface_(ev, width = 256, height = 256) {
    return this.$q(((resolve, reject) => {
      this.$mdDialog.show({
        template: simplexNoiseDialogTemplate,
        targetEvent: ev,
        scope: this.$scope,
        preserveScope: true,
        controller: ($scope) => {
          $scope.cancel = (() => {
            this.$mdDialog.cancel();
          }).bind(this);
          $scope.confirm = (() => {
            this.$mdDialog.hide();
          }).bind(this);
        },
        clickOutsideToClose: false
      }).then(
        (() => {
          let start = performance.now();
          this.randomSurfaceGenerator.generate_surface_simplex_noise_gpu(
            width, height,
            this.$scope.simplex_noise.frequency,
            this.$scope.simplex_noise.octaves,
            this.$scope.simplex_noise.persistence,
            this.$scope.simplex_noise.lacunarity,
            this.$scope.simplex_noise.base
          ).then((data_mat) => {
            console.log(`Simplex noise synthesis done in ${performance.now() - start} ms`);
            resolve(data_mat);
          });
        }).bind(this),
        () => reject()
      );
    }).bind(this));
  }

  random_simplex_surface(ev) {
    this.random_simplex_surface_(ev).then(this.set_surface.bind(this));
  }

  random_fourier_surface_(ev, width = 256, height = 256) {

    return this.$q(((resolve, reject) => {
      this.$mdDialog.show({
        template: fourierSynthesisDialogTemplate,
        targetEvent: ev,
        scope: this.$scope,
        preserveScope: true,
        controller: ($scope) => {
          $scope.cancel = (() => {
            this.$mdDialog.cancel();
          }).bind(this);
          $scope.confirm = (() => {
            this.$mdDialog.hide();
          }).bind(this);
        },
        clickOutsideToClose: false
      }).then(
        (() => {
          let start = performance.now();
          this.randomSurfaceGenerator.generate_surface_fourier_synthesis_gpu(width, height, this.$scope.fourier_synthesis.power)
            .then((data_mat) => {
              console.log(`Fourier Synthesis done in ${performance.now() - start} ms`);
              resolve(data_mat);
            });
        }).bind(this),
        () => reject()
      );
    }).bind(this));
  }

  random_fourier_surface(ev) {
    this.random_fourier_surface_(ev).then(this.set_surface.bind(this));
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

    let g_mapped_norm_deterministic = gpu.map_hermite_spline(g_norm_deterministic, flatten(this.blend_data.points), this.blend_data.tangents);

    let g_scaled_random_details = gpu.multiply(g_random_details, g_mapped_norm_deterministic);

    let g_detailed = gpu.add(g_deterministic, g_scaled_random_details);
    let g_normalized_detailed = gpu.normalize(g_detailed);
    let g_result = gpu.multiply(g_normalized_detailed, 255);
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
    g_result.destroy();
    g_u8_result.destroy();
    g_normal_map.destroy();

    console.log(`Blending done in ${performance.now() - start} ms`);

    this.set_surface(random_mat, normal_map);
  }

  add_perlin_detail(ev) {
    if (!_.has(this, 'deterministic_mat')) {
      this.$mdDialog.show(this.$mdDialog.alert()
        .title("Error")
        .textContent('Cannot add detail without deterministic surface.')
        .ok('Ok')
        .targetEvent(ev)
      );
      return;
    }

    this.random_perlin_surface_(ev, this.deterministic_mat.cols, this.deterministic_mat.rows).then(this.blend_.bind(this));
  }

  add_simplex_detail(ev) {
    if (!_.has(this, 'deterministic_mat')) {
      this.$mdDialog.show(this.$mdDialog.alert()
        .title("Error")
        .textContent('Cannot add detail without deterministic surface.')
        .ok('Ok')
        .targetEvent(ev)
      );
      return;
    }

    this.random_simplex_surface_(ev, this.deterministic_mat.cols, this.deterministic_mat.rows).then(this.blend_.bind(this));
  }

  add_fourier_detail(ev) {
    if (!_.has(this, 'deterministic_mat')) {
      this.$mdDialog.show(this.$mdDialog.alert()
        .title("Error")
        .textContent('Cannot add detail without deterministic surface.')
        .ok('Ok')
        .targetEvent(ev)
      );
      return;
    }

    this.random_fourier_surface_(ev, this.deterministic_mat.cols, this.deterministic_mat.rows).then(this.blend_.bind(this));
  }

  closeAllMenus() {
    /*this.$mdMenu.hide(null, {closeAll: true});
    var toolbar = this.$element.find('md-toolbar');
    toolbar.get(0).style.cssText = toolbar.data('md-restore-style') || '';*/
  }
}

export default EditorController;