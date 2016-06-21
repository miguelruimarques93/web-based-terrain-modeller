import angular from 'angular';
import THREE from 'three';
import 'three-orbit-controls';
import 'three-trackball-controls';
import jsfeat from 'jsfeat';
import _ from 'underscore';
import imageTemplate from './image_dialog.tpl.html!text';
import fourierSynthesisDialogTemplate from './fourier_synthesis_dialog.tpl.html!text';
import perlinNoiseDialogTemplate from './perlin_noise_dialog.tpl.html!text';
import simplexNoiseDialogTemplate from './simplex_noise_dialog.tpl.html!text';
import {flatten} from '../../utils/utils';

/**
 * @param mat {jsfeat.matrix_t}
 */
function get_buffer(mat) {
  switch (jsfeat.get_data_type(mat.type)) {
    case jsfeat.U8_t:
      return mat.buffer.u8;
    case jsfeat.S32_t:
      return mat.buffer.i32;
    case jsfeat.F32_t:
      return mat.buffer.f32;
    case jsfeat.S64_t:
      throw "Invalid type.";
    case jsfeat.F64_t:
      return mat.buffer.f64;
  }
}

/**
 * @param mat {jsfeat.matrix_t}
 */
function get_channels_num(mat) {
  switch (jsfeat.get_channel(mat.channel)) {
    case jsfeat.C1_t:
      return 1;
    case jsfeat.C2_t:
      return 2;
    case jsfeat.C3_t:
      return 3;
    case jsfeat.C4_t:
      return 4;
  }
}

function element_wise_operation(op) {
  return (A, B, C) => {
    if (A.cols != C.cols || A.rows != C.cols) {
      throw "Cannot operate matrices with different sizes!";
    }

    var a_buffer = get_buffer(A);
    var c_buffer = get_buffer(C);
    var size = A.cols * A.rows;

    if (typeof B === 'number') {
      for (let i = 0; i < size; ++i) {
        c_buffer[i] = op(a_buffer[i], B);
      }
    }
    else {
      if (A.cols != B.cols || A.rows != B.rows) {
        throw "Cannot operate matrices with different sizes!";
      }

      var b_buffer = get_buffer(B);
      for (let i = 0; i < b_buffer.length; ++i) {
        c_buffer[i] = op(a_buffer[i], b_buffer[i]);
      }
    }
  };
}

let add = element_wise_operation((x, y) => Math.max(0, Math.min(x + y, 255)));
let subtract = element_wise_operation((x, y) => Math.abs(x - y));
let multiply = element_wise_operation((x, y) => x * y);

/**
 * @param src {jsfeat.matrix_t}
 * @param dest {jsfeat.matrix_t}
 */
function normalize(src, dest, mult) {
  if (src.cols != dest.cols || src.rows != dest.rows) {
    throw "dest and src with different sizes.";
  }

  if (src.channel != jsfeat.C1_t) {
    throw "src needs to be C1_t";
  }

  if ((dest.type | dest.channel) != jsfeat.F32C1_t) {
    throw "dest needs to be F32C1_t";
  }

  var src_buffer = get_buffer(src);

  var max = _.max(src_buffer);
  var min = _.min(src_buffer);

  var dest_buffer = dest.buffer.f32;

  var size = src.cols * src.rows;
  for (var i = 0; i < size; ++i) {
    dest_buffer[i] = (src_buffer[i] - min) / (max - min);
  }
}

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
  var src_buffer = get_buffer(src);
  var incr = get_channels_num(src);

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

/**
 * @param src {jsfeat.matrix_t}
 * @return {HTMLCanvasElement}
 */
function create_canvas_from_matrix_normal(src) {
  var canvas = document.createElement('canvas');

  canvas.width = src.cols;
  canvas.height = src.rows;

  canvas.style.width = src.cols + 'px';
  canvas.style.height = src.rows + 'px';

  var context = canvas.getContext('2d');
  var imageData = context.getImageData(0, 0, src.cols, src.rows);
  var data = imageData.data;
  var src_buffer = get_buffer(src);
  var incr = get_channels_num(src);

  for (var i = 0, j = 0; i < data.length; i += 4, j += incr) {
    data[i] = 255 * (src_buffer[j] + 1) / 2;

    if (incr >= 3) {
      data[i + 1] = 255 * (src_buffer[j + 1] + 1) / 2;
      data[i + 2] = 255 * (src_buffer[j + 2] + 1) / 2;
    } else {
      data[i + 1] = 255 * (src_buffer[j] + 1) / 2;
      data[i + 2] = 255 * (src_buffer[j] + 1) / 2;
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

  /**
   *
   */
  constructor() {
    this.images = [];

    this.init_scope();

    this.$timeout(() => {
      this.canvas = angular.element($element).find('canvas');
      this.init();
      this.animate();
    });

    this.controls = null;
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

  }

  init() {
    this.width = this.canvas.innerWidth();
    this.height = this.canvas.innerHeight();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas.get(0),
      antialias: true,
      preserveDrawingBuffer: true
    });

    this.camera = new THREE.PerspectiveCamera(
      45, this.width / this.height, 0.1, 10000.0
    );

    this.scene = new THREE.Scene();

    this.scene.add(this.camera);

    this.camera.position.x = 50;
    this.camera.position.y = 50;
    this.camera.position.z = 50;

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.surface_material = new THREE.MeshPhongMaterial({
      color: 0x2194ce,
      emissive: 0x000000,
      specular: 0x111111,
      shininess: 30,
      side: THREE.DoubleSide
    });

    // this.controls = new THREE.OrbitControls(this.camera, this.canvas.get(0));
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

    this.hemisphereLight = new THREE.HemisphereLight(0xFFFFBB, 0x080800, 1);

    this.scene.add(this.hemisphereLight);

    this.resize();

    angular.element(window).resize(this.resize.bind(this));
  }

  animate() {
    this.animation = requestAnimationFrame(this.animate.bind(this));
    this.update();
    if (this.width !== this.canvas.innerWidth() || this.height !== this.canvas.innerHeight())
      this.resize();
    this.render();
  }

  resize() {
    this.canvas.height(0);
    this.width = angular.element(this.canvas).width();
    this.height = angular.element(this.canvas).height();
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  update() {
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera, null, true);
  }

  /**
   * @param {jsfeat.matrix_t} data_mat
   * @param {jsfeat.matrix_t} normal_map
   */
  set_surface(data_mat, normal_map = undefined) {

    if (_.has(this, 'plane')) {
      this.scene.remove(this.plane);
    }

    this.images.push(create_canvas_from_matrix(data_mat));

    if (normal_map === undefined) {
      this.normalmapGenerator.from_heightmap_gpu(data_mat).then(((nmap) => {
        this.surface_material.normalMap = new THREE.Texture(new THREE.DataTexture(nmap, nmap.cols, nmap.rows, THREE.RGBAFormat));
        this.images.push(create_canvas_from_matrix(nmap));
      }).bind(this), () => {
      });
    }
    else {
      this.images.push(create_canvas_from_matrix(normal_map));
      this.surface_material.normalMap = new THREE.Texture(new THREE.DataTexture(normal_map.data, normal_map.cols, normal_map.rows, THREE.RGBAFormat));
    }

    var data = data_mat.data;
    var geometry = new THREE.PlaneBufferGeometry(data_mat.cols, data_mat.rows, data_mat.cols - 1, data_mat.rows - 1);
    var vertices = geometry.attributes.position.array;
    for (var i = 0, j = 0; i < vertices.length; ++i, j += 3) {
      vertices[j + 2] = vertices[j + 1];
      vertices[j + 1] = data[i];
    }

    this.camera.lookAt(new THREE.Vector3(128, 128, 0));

    this.plane = new THREE.Mesh(geometry, this.surface_material);

    this.scene.add(this.plane);
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

  sampleAction(name, ev) {
    this.$mdDialog.show(this.$mdDialog.alert()
      .title(name)
      .textContent('You triggered the "' + name + '" action')
      .ok('Great')
      .targetEvent(ev)
    );
  }

  closeAllMenus() {
    this.$mdMenu.hide(null, {closeAll: true});
    var toolbar = this.$element.find('md-toolbar');
    toolbar.get(0).style.cssText = toolbar.data('md-restore-style') || '';
  }
}

export default EditorController;