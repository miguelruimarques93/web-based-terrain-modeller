import jsfeat from 'jsfeat';
import _ from 'underscore';
import imageTemplate from './image_dialog.tpl.html!text';
import {flatten, deepCopy } from 'web_based_terrain_modeller/utils/utils';
import Terrain from '../../common/terrain';
import { TerrainFile, RandomGenerationMethod } from '../../common/terrain_file';
import * as image_utils from '../../utils/image_utils';
import { saveAs } from 'file-saver';
import { assert } from '../../utils/assert';
import { convert_base64_to_matrix } from '../../utils/image_utils';
import ue4Exporter from 'ue4-exporter';
import BlendingPipeline from '../../common/blending_pipeline';
import { Enum } from 'enumify';

class State extends Enum { }
State.initEnum(['Initial', 'Ready', 'AddingDetail']);

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
    this.blending_pipeline = new BlendingPipeline(this.gpu);
    this.blending_pipeline.update_callback = this.result_updated.bind(this);
    this.images = [];
    this.history = [];

    this.selected_history_entry = null;
    this.selected_history_entry_index = -1;

    this.terrain_file_sidebar_open = true;

    this.state = State.Initial;

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

  is_adding_detail_state() {
    return this.state.ordinal == State.AddingDetail.ordinal;
  }

  init_scope() {
    this.$scope.surface_size = 256;

    this.$scope.random_methods = _.filter(RandomGenerationMethod.enumValues, elem => elem.ordinal != RandomGenerationMethod.None.ordinal);
    this.$scope.random_method = RandomGenerationMethod.FourierSynthesis.ordinal;

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

  set_terrain_file(t_file) {
    convert_base64_to_matrix(t_file.original_image).then( data_mat => {
      let data_mat_f32 = new jsfeat.matrix_t(data_mat.cols, data_mat.rows, data_mat.channel | jsfeat.F32_t);
      data_mat.copy_to(data_mat_f32);

      this.blending_pipeline.base_matrix = data_mat_f32;
    });

    convert_base64_to_matrix(t_file.result_image).then( data_mat => {
      this.set_surface(data_mat);
    });

    this.$scope.random_method = t_file.data.random_method.ordinal;
    switch (this.$scope.random_method) {
      case (RandomGenerationMethod.FourierSynthesis.ordinal):
        this.$scope.fourier_synthesis = deepCopy(t_file.data.random_parameters);
        this.blending_pipeline.random_matrix_generator = this.generate_random_fourier_surface.bind(this);
        break;
      case (RandomGenerationMethod.PerlinNoise.ordinal):
        this.$scope.perlin_noise = deepCopy(t_file.data.random_parameters);
        this.blending_pipeline.random_matrix_generator = this.generate_random_perlin_surface.bind(this);
        break;
      case (RandomGenerationMethod.SimplexNoise.ordinal):
        this.$scope.simplex_noise = deepCopy(t_file.data.random_parameters);
        this.blending_pipeline.random_matrix_generator = this.generate_random_simplex_surface.bind(this);
        break;
    }

    this.$scope.blend = deepCopy(t_file.data.blend_parameters); // FIXME: Some values may be erased

    this.blending_pipeline.blend_strength = this.$scope.blend.strength;
    this.blending_pipeline.mapping_data = this.$scope.blend.mapping_data;
  }

  /**
   * @param {jsfeat.matrix_t} data_mat
   * @param {jsfeat.matrix_t} normal_map
   */
  set_surface(data_mat, normal_map = undefined) {
    this.terrain.height_map = data_mat;

    // this.images.push(image_utils.convert_matrix_to_base64(data_mat));

    if (normal_map === undefined) {
      this.normalmapGenerator.from_heightmap_gpu(data_mat, 0.01).then(((nmap) => {
        this.terrain.normal_map = nmap;
        // this.images.push(image_utils.convert_matrix_to_base64(nmap));
      }).bind(this), () => {
      });
    }
    else {
      this.terrain.normal_map = normal_map;
      // this.images.push(image_utils.convert_matrix_to_base64(normal_map));
    }
  }

  openFile(file) {
    if (file !== null) {
      this.heightmapReader.from_file(file, this.$scope).then(data_mat => {
        let data_mat_f32 = new jsfeat.matrix_t(data_mat.cols, data_mat.rows, data_mat.channel | jsfeat.F32_t);
        data_mat.copy_to(data_mat_f32);

        this.blending_pipeline.base_matrix = data_mat_f32;
        this.set_surface(this.blending_pipeline.base_matrix);

        this.state = State.Ready;
      });
    }
  }

  openZip(file) {
    if (file !== null) {
      TerrainFile.load_from_file(file).then(t_file => {
        this.set_terrain_file(t_file);
        this.history.push(t_file);
        this.state = State.Ready;
      });
    }
  }

  canSave() {
    return this.blending_pipeline.has_base_matrix();
  }

  saveCurrent() {
    assert(this.canSave(), 'saveCurrent called even though there is nothing to save.');

    let file = new TerrainFile();

    file.original_matrix = this.blending_pipeline.base_matrix;

    if (this.blending_pipeline.has_result_matrix()) {
      file.result_matrix = this.blending_pipeline.result_matrix;

      file.data.random_method = RandomGenerationMethod.enumValues[this.$scope.random_method];

      switch (this.$scope.random_method) {
        case (RandomGenerationMethod.FourierSynthesis.ordinal):
          file.data.random_parameters = deepCopy(this.$scope.fourier_synthesis);
          break;
        case (RandomGenerationMethod.PerlinNoise.ordinal):
          file.data.random_parameters = deepCopy(this.$scope.perlin_noise);
          break;
        case (RandomGenerationMethod.SimplexNoise.ordinal):
          file.data.random_parameters = deepCopy(this.$scope.simplex_noise);
          break;
      }

      file.data.blend_parameters = deepCopy(this.$scope.blend);
    }

    file.get_blob().then(glob => {
      saveAs(glob, 'project.zip');
    });
  }

  save(ev, terrain_file) {
    terrain_file.get_blob().then(glob => {
      saveAs(glob, 'project.zip');
    });
  }

  select_history_entry(index) {
    this.selected_history_entry = this.history[index];
    this.selected_history_entry_index = index;
    this.terrain_file_sidebar_open = true;
  }

  toggle_history_details() {
    this.terrain_file_sidebar_open = !this.terrain_file_sidebar_open;
  }

  save_image(ev, image) {
    image_utils.convert_base64_to_blob(image).then(glob => {
      saveAs(glob, 'result.png')
    });
  }

  export_image_ue4(ev, image) {
    image_utils.convert_base64_to_matrix(image).then(data_mat => {
      let width = data_mat.cols;
      let height = data_mat.rows;

      var data = new Uint16Array(width * height);
      let buffer = data_mat.buffer.u8;

      for (var i = 0; i < width; ++i)
        for (var j = 0; j < height; ++j)
          data[i * width + j] = buffer[i * width + j];

      var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
      var dataPtr = Module._malloc(nDataBytes);
      var dataHeap = new Uint16Array(Module.HEAPU16.buffer, dataPtr, nDataBytes);
      dataHeap.set(data);
      let dataurl = Module.WritePngToMemory(width, height, dataPtr);
      Module._free(dataPtr);

      let arr = dataurl.split(',');
      let mime = arr[0].match(/:(.*?);/)[1];
      let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }

      let blob = new Blob([u8arr], {type:mime});
      saveAs(blob, 'terrain.png');

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

  generate_surface() {

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
    return this.state == State.Ready
        && this.blending_pipeline.has_base_matrix()  // TODO: Isn't this redundant?
        ;
  }

  random_method_changed() {
    switch (parseInt(this.$scope.random_method)) {
      case RandomGenerationMethod.FourierSynthesis.ordinal:
        this.blending_pipeline.random_matrix_generator = this.generate_random_fourier_surface.bind(this);
        break;
      case RandomGenerationMethod.PerlinNoise.ordinal:
        this.blending_pipeline.random_matrix_generator = this.generate_random_perlin_surface.bind(this);
        break;
      case RandomGenerationMethod.SimplexNoise.ordinal:
        this.blending_pipeline.random_matrix_generator = this.generate_random_simplex_surface.bind(this);
        break;
      case RandomGenerationMethod.None.ordinal:
        this.blending_pipeline.random_matrix_generator = undefined;
        break;
    }
  }

  random_parameter_changed() {
    if (this.$scope.settingsForm.$invalid)
      return;

    this.blending_pipeline.trigger_random_matrix_generation();
  }

  spline_changed() {
    this.blending_pipeline.hermite_mapping_data = this.$scope.blend.mapping_data;
  }

  blend_strength_changed() {
    this.blending_pipeline.blend_strength = this.$scope.blend.strength;
  }

  result_bounds_changed() {
    this.blending_pipeline.result_bounds = [this.$scope.blend.minimum, this.$scope.blend.maximum];
  }

  result_updated() {
    console.log('result_updated');
    if (this.state == State.AddingDetail && this.blending_pipeline.result_matrix && this.blending_pipeline.normal_matrix)
      this.set_surface(this.blending_pipeline.result_matrix, this.blending_pipeline.normal_matrix);
  }

  start_adding_detail() {
    assert(this.can_add_detail(), "State should be ready.");

    this.random_method_changed();
    this.random_parameter_changed();
    this.spline_changed();
    this.blend_strength_changed();
    this.result_bounds_changed();

    this.state = State.AddingDetail;
  }

  can_finish_adding_detail() {
    return this.state == State.AddingDetail;
  }

  /**
   *
   * @param {string} b64_image
   * @param {number} width_orig
   * @param {number} height_orig
   * @returns {string}
   */
  make_square(b64_image) { // TODO: FIXME
    return new Promise( (resolve, reject) => {
      let image = document.createElement('img');

      image.addEventListener('load', (event) => {
        let width_orig = event.target.width;
        let height_orig = event.target.height;

        let canvas = document.createElement('canvas');
        canvas.width = width_orig;
        canvas.height = height_orig;

        let context = canvas.getContext('2d');

        context.drawImage(event.target, 0, 0);

        let imgd = context.getImageData(0, 0, width_orig, height_orig);
        let pix = imgd.data;

        let width = width_orig;
        let height = height_orig;

        let width_offset = 0;
        let height_offset = 0;

        if (width_orig > height_orig) {
          width = height_orig;
          width_offset = (width_orig - height_orig) / 2;
        } else if (width_orig < height_orig) {
          height = width_orig;
          height_offset = (height_orig - width_orig) / 2;
        }

        let data_mat = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
        let data = data_mat.buffer.u8;

        for (let r = 0; r < height; ++r) {
          let rr_orig = (r + height_offset) * width;
          let rr = r * width;
          for (let c = 0; c < width; ++c) {
            let index_orig = (rr_orig + c + width_offset) * 4;
            let index = (rr + c) * 4;

            for (let ch = 0; ch < 4; ++ch)
              data[index + ch] = pix[index_orig + ch];
          }
        }

        debugger;
        resolve(image_utils.convert_matrix_to_base64(data_mat));
      });

      image.src = b64_image;
    });
  }

  finish_adding_detail() {
    assert(this.can_finish_adding_detail(), "State should be AddingDetail.");

    let file = new TerrainFile();

    this.make_square(this.$element.find('canvas')[0].toDataURL()).then(img => {
      file.snapshot_image = this.$element.find('canvas')[0].toDataURL();
      // file.snapshot_image = img;

      file.original_matrix = this.blending_pipeline.base_matrix;

      if (this.blending_pipeline.has_result_matrix()) {
        file.result_matrix = this.blending_pipeline.result_matrix;

        file.data.random_method = RandomGenerationMethod.enumValues[this.$scope.random_method];

        switch (this.$scope.random_method) {
          case (RandomGenerationMethod.FourierSynthesis.ordinal):
            file.data.random_parameters = deepCopy(this.$scope.fourier_synthesis);
            break;
          case (RandomGenerationMethod.PerlinNoise.ordinal):
            file.data.random_parameters = deepCopy(this.$scope.perlin_noise);
            break;
          case (RandomGenerationMethod.SimplexNoise.ordinal):
            file.data.random_parameters = deepCopy(this.$scope.simplex_noise);
            break;
        }

        file.data.blend_parameters = deepCopy(this.$scope.blend);
      }

      this.history.push(file);

      this.state = State.Ready;
    });
  }

  cancel_adding_detail() {
    assert(this.can_finish_adding_detail(), "State should be AddingDetail");

    if (this.history.length > 0) {
      let file = this.history[this.history.length - 1];
      this.set_terrain_file(file);
    }
    this.state = State.Ready;
  }

}

export default EditorController;