/**
 * Created by migul on 19/07/2016.
 */

import Benchmark from 'benchmark';
import { FFT, FrequencyFilter } from 'fft';
import jsfeat from 'jsfeat';
import { add, subtract, multiply, normalize } from '../../utils/math_matrix';

@Inject(
  '$element',
  'gpu',
  '$scope'
)
class BenchmarksController {
  constructor() {
    this.$scope.results = [];
    this.$scope.calculate = false;
  }

  set_calculate(value) {
    this.$scope.$evalAsync(() => {
      this.$scope.calculate = value;
    });
  }

  add_result(value) {
    this.$scope.$evalAsync(() => {
      this.$scope.results.push(value);
    });
  }

  runSuite(size) {
    var self = this;

    self.set_calculate(true);

    self.add_result(`Starting benchmark with size ${size}...`);

    var matrix = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);

    var suite = new Benchmark.Suite(`fft ${size}`, {
      onStart: () => {
        var begin = performance.now();
        this.gpu.force_load_shaders();
        FFT.init(size);
        FrequencyFilter.init(size);
      }
    });

    // add tests
    suite
      .add('fft@gpu', function() {
        let g_matrix = self.gpu.create_gpu_matrix(matrix);

        let g_ftt_matrix = self.gpu.compute_fft(g_matrix, true);
        let g_iftt_matrix = self.gpu.compute_fft(g_ftt_matrix, false);
        let ifft_matrix = g_iftt_matrix.download();

        g_matrix.destroy();
        g_ftt_matrix.destroy();
        g_iftt_matrix.destroy();
      })
      .add('fft@cpu', function() {
        var w = matrix.cols,
          h = matrix.rows, // w == h
          re = [],
          im = [];

        let data = matrix.buffer;

        for(var y=0; y<h; y++) {
          let i = y*w;
          for(var x=0; x<w; x++) {
            re[i + x] = data[(i << 2) + (x << 2)];
            im[i + x] = 0.0;
          }
        }

        FFT.fft2d(re, im);
        FrequencyFilter.swap(re, im);
        FrequencyFilter.swap(re, im);
        FFT.ifft2d(re, im);
      })
      .add('element_wise@gpu', function () {
      let g_matrix = self.gpu.create_gpu_matrix(matrix);

      let g_result = self.gpu.add(g_matrix, g_matrix);
      self.gpu.subtract(g_matrix, g_matrix, g_result);
      self.gpu.multiply(g_matrix, g_matrix, g_result);

      g_matrix.destroy();
      g_result.destroy();
    })
      .add('element_wise@cpu', function () {
        var result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);

        add(matrix, matrix, result);
        subtract(matrix, matrix, result);
        multiply(matrix, matrix, result);
      })
      .add('normalize@gpu', function () {
        let g_matrix = self.gpu.create_gpu_matrix(matrix);

        let g_normalized = self.gpu.normalize(g_matrix);

        g_matrix.destroy();
        g_normalized.destroy();
      })
      .add('normalize@cpu', function () {
        var result = new jsfeat.matrix_t(size, size, jsfeat.F32C1_t);

        normalize(matrix, result);
      })
      .on('cycle', function(event) {
        console.log(event);
        self.add_result(String(event.target));
        // self.$element.append('<div>' + String(event.target) + '</div>');
      })
      .on('error', function (err) {
        console.log(err.target.error);
      })
      .on('complete', function() {
        // self.$element.append('<div>' + 'Fastest is ' + this.filter('fastest').map('name') + '</div>');
        self.set_calculate(false);
      })
      // run async
      .run({ 'async': true });
  }
}

export default BenchmarksController;