/**
 * Created by migul on 19/07/2016.
 */

import Benchmark from 'benchmark';
import {FFT, FrequencyFilter} from 'fft';
import jsfeat from 'jsfeat';
import {add, subtract, multiply, normalize, minMax} from '../../utils/math_matrix';

@Inject(
  '$element',
  'gpu',
  '$scope',
  'randomSurfaceGenerator'
)
class BenchmarksController {
  constructor() {
    this.$scope.results = [];
    this.$scope.repeat_times = 1;
    this.$scope.calculate = false;
    this.name_regex = /(\d+)#(.+)@(cpu|gpu)/;
    this.initialize_struct_results();
  }

  initialize_struct_results() {
    this.sizes = [16, 32, 64, 128, 256, 512, 1024];
    let tests = ["fft", "element_wise_add", "element_wise_subtract", "element_wise_multiply", "normalize", "minmax", "perlinNoise", "simplexNoise", "fourierFiltering"];
    let measures = ["frequency", "time"];
    let devices = ["gpu", "cpu"];
    this.$scope.struct_results = {};

    for (let d = 0; d < devices.length; ++d) {
      this.$scope.struct_results[devices[d]] = {};
      for (let t = 0; t < tests.length; ++t) {
        this.$scope.struct_results[devices[d]][tests[t]] = {};
        for (let s = 0; s < this.sizes.length; ++s) {
          this.$scope.struct_results[devices[d]][tests[t]][this.sizes[s]] = {};
          for (let m = 0; m < measures.length; ++m) {
            this.$scope.struct_results[devices[d]][tests[t]][this.sizes[s]][measures[m]] = {
              $elements: [],
              average: NaN,
              minimum: NaN,
              maximum: NaN
            };
          }

        }
      }
    }

    this.$scope.sizes = this.sizes;
    this.$scope.devices = devices;
    this.$scope.tests = tests;
    this.$scope.measures = measures;
    this.$scope.activeMeasure = "frequency";
  }

  average(arr) {
    if (arr.length == 0)
      return "";
    else if (arr.length == 1)
      return arr[0];

    let total = 0.0;
    for (let i = 0; i < arr.length; ++i)
      total += arr[i];

    return total / arr.length;
  }

  asString(value) {
    if (value)
      return value;
    else
      return " ";
  }

  set_calculate(value) {
    this.$scope.$evalAsync(() => {
      this.$scope.calculate = value;
    });
  }

  ui_log(msg) {
    console.log(msg);
    this.$scope.$evalAsync(() => {
      this.$scope.results.push(msg);
    });
  }

  add_result_frequency(size, test, device, value) {
    let obj = this.$scope.struct_results[device][test][size];

    obj["frequency"].$elements.push(value.hz);
    obj["frequency"].average = this.average(obj["frequency"].$elements);
    if (!obj["frequency"].maximum || value.hz > obj["frequency"].maximum)
      obj["frequency"].maximum = value.hz;
    if (!obj.minimum || value.hz < obj["frequency"].minimum)
      obj["frequency"].minimum = value.hz;
  }

  add_result_time(size, test, device, value) {
    let obj = this.$scope.struct_results[device][test][size];

    obj["time"].$elements.push(value.stats.mean);
    obj["time"].average = this.average(obj["time"].$elements);
    if (!obj["time"].maximum || value.stats.mean > obj["time"].maximum)
      obj["time"].maximum = value.stats.mean;
    if (!obj.minimum || value.stats.mean < obj["time"].minimum)
      obj["time"].minimum = value.stats.mean;
  }

  add_result(value) {
    let [name, size, test, device] = this.name_regex.exec(value.name);

    this.$scope.$evalAsync(() => {
      this.add_result_frequency(size, test, device, value);
      this.add_result_time(size, test, device, value);
    });

    console.log(value);
    this.ui_log(`${value.name} x ${value.hz} ops/sec`);
  }

  runSuite(size) {
    this.set_calculate(true);

    let p = new Promise((resolve, reject) => {
      resolve();
    });
    let nTimes = this.$scope.repeat_times;

    for (let t = 0; t < nTimes; ++t)
      p = p.then(() => this._runSuite(size));

    p.then(() => this.set_calculate(false));
  }

  _runSuite(size) {
    var self = this;

    return new Promise((resolve, reject) => {

      self.ui_log(`Starting benchmark with size ${size}...`);

      let matrix = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      let g_matrix = self.gpu.create_gpu_matrix(matrix);

      let suite = new Benchmark.Suite(`fft ${size}`, {
        onStart: () => {
          var begin = performance.now();
          this.gpu.force_load_shaders();
          FFT.init(size);
          FrequencyFilter.init(size);
        }
      });

      // add tests
      suite
      // .add(`${size}#fft@gpu`, function () {
      //   let g_ftt_matrix = self.gpu.compute_fft(g_matrix, true);
      //   // let g_iftt_matrix = self.gpu.compute_fft(g_ftt_matrix, false);
      //
      //   g_ftt_matrix.destroy();
      //   // g_iftt_matrix.destroy();
      // })
      // .add(`${size}#fft@cpu`, function () {
      //   let w = matrix.cols,
      //     h = matrix.rows, // w == h
      //     re = [],
      //     im = [];
      //
      //   let data = matrix.buffer;
      //
      //   for (var y = 0; y < h; y++) {
      //     let i = y * w;
      //     for (var x = 0; x < w; x++) {
      //       re[i + x] = data[(i << 2) + (x << 2)];
      //       im[i + x] = 0.0;
      //     }
      //   }
      //
      //   FFT.fft2d(re, im);
      //   FrequencyFilter.swap(re, im);
      //   //<FrequencyFilter.swap(re, im);
      //   // FFT.ifft2d(re, im);
      // })
      // .add(`${size}#element_wise_add@gpu`, function () {
      //
      //   let g_result = self.gpu.add(g_matrix, g_matrix);
      //   // self.gpu.subtract(g_matrix, g_matrix, g_result);
      //   // self.gpu.multiply(g_matrix, g_matrix, g_result);
      //
      //   g_result.destroy();
      // })
      // .add(`${size}#element_wise_add@cpu`, function () {
      //   let result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      //
      //   add(matrix, matrix, result);
      //   // subtract(matrix, matrix, result);
      //   // multiply(matrix, matrix, result);
      // })
      // .add(`${size}#element_wise_subtract@gpu`, function () {
      //
      //   let g_result = self.gpu.subtract(g_matrix, g_matrix);
      //
      //   g_result.destroy();
      // })
      // .add(`${size}#element_wise_subtract@cpu`, function () {
      //   let result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      //
      //   subtract(matrix, matrix, result);
      // })
      // .add(`${size}#element_wise_multiply@gpu`, function () {
      //
      //   let g_result = self.gpu.multiply(g_matrix, g_matrix);
      //
      //   g_result.destroy();
      // })
      // .add(`${size}#element_wise_multiply@cpu`, function () {
      //   let result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      //
      //   multiply(matrix, matrix, result);
      // })
      // .add(`${size}#normalize@gpu`, function () {
      //   let g_normalized = self.gpu.normalize(g_matrix);
      //
      //   g_normalized.destroy();
      // })
      // .add(`${size}#normalize@cpu`, function () {
      //   let result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      //
      //   normalize(matrix, result);
      // })
      // .add(`${size}#minmax@gpu`, function () {
      //   let minmax = self.gpu.minMax(g_matrix);
      //
      // })
      // .add(`${size}#minmax@cpu`, function () {
      //   let result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);
      //
      //   let minmax = minMax(matrix);
      // })
        .add(`${size}#perlinNoise@gpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_perlin_noise_gpu(size, size).then(() => deferred.resolve());
          }
        })
        .add(`${size}#perlinNoise@cpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_perlin_noise(size, size).then(() => deferred.resolve());
          }
        })
        .add(`${size}#simplexNoise@gpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_simplex_noise_gpu(size, size).then(() => deferred.resolve());
          }
        })
        .add(`${size}#simplexNoise@cpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_simplex_noise(size, size).then(() => deferred.resolve());
          }
        })
        .add(`${size}#fourierFiltering@gpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_fourier_synthesis_gpu(size, size).then(() => deferred.resolve());
          }
        })
        .add(`${size}#fourierFiltering@cpu`, {
          defer: true,
          fn: function (deferred) {
            let result = self.randomSurfaceGenerator.generate_surface_fourier_synthesis(size, size).then(() => deferred.resolve());
          }
        })
        .on('cycle', function (event) {
          self.add_result(event.target);
        })
        .on('error', function (err) {
          g_matrix.destroy();
          console.log(err.target.error);
          reject(err);
        })
        .on('complete', function () {
          g_matrix.destroy();
          console.log(self.$scope.struct_results);
          resolve();
        })
        // run async
        .run({'async': true});

    });
  }

  runAll() {
    this.set_calculate(true);

    let p = new Promise((resolve, reject) => {
      resolve();
    });
    let nTimes = this.$scope.repeat_times;

    for (let t = 0; t < nTimes; ++t)
      for (let s = 0; s < this.sizes.length; ++s)
        p = p.then(() => this._runSuite(this.sizes[s]));

    p.then(() => this.set_calculate(false));
  }
}

export default BenchmarksController;