import GPU from './gpu';
import gpu_matrix from './gpu_matrix';
import jsc from 'jsverify';
import _ from 'underscore';
import jsfeat from 'jsfeat';

// jsc.integer(1, 11) <-> (2, 2048)
// jsc.integer(1, 5)  <-> (2, 32)

var powerOf2SizedMatrix = jsc.integer(1, 5).smap(
  function (power) { 
    let width = Math.pow(2, power);
    let height = width;
    
    let mat = new jsfeat.matrix_t(width, height, jsfeat.F32C1_t);
    let buffer = mat.data;

    // console.log(`${width} * ${height} == ${buffer.length} (${typeof(buffer)})`);

    for (let i = 0; i < mat.cols * mat.rows * mat.channel; ++i)
    {
      buffer[i] = jsc.number.generator(100);
    }

    return mat; 
  },
  function (mat) {
    return [Math.log2(mat.cols), Math.log2(mat.rows)];
  });

describe('WebGL 2 support', function () {
  it('should return a WebGL 2 Context', function () {
    let canvas = document.createElement('canvas');
    expect(canvas.getContext('webgl2')).not.toBe(null);  
  });
});

describe('gpu', function () {
  beforeEach(function () {
    "use strict";
    jasmine.addMatchers({
      // Expects that property is synchronous
      toHold: function () {
        return {
          compare: function (actual) {

            /* global window */
            var quiet = window && !(/verbose=true/).test(window.location.search);

            var r = jsc.check(actual, { quiet: quiet });

            var pass = r === true;
            var message = "";

            if (pass) {
              message = "Expected property not to hold.";
            } else {
              message = "Expected property to hold. Counterexample found: " + r.counterexamplestr;
            }

            return {
              pass: pass,
              message: message,
            };
          },
        };
      },
    });
  });
  
  it('#create_gpu_matrix() should create an object of type gpu_matrix', function () {
    let gpu = new GPU();
    let g_mat = gpu.create_gpu_matrix();
    expect(g_mat).toEqual(jasmine.any(gpu_matrix));
    g_mat.destroy();
  });

  describe('#compute_fft()', () => {

    const TOLERANCE = 1e-1;

    it('should upload and download the same matrix', () => {
      expect(jsc.forall(powerOf2SizedMatrix, (mat) => {
        let gpu = new GPU();
        let g_mat = gpu.create_gpu_matrix(mat);
        let mat_2 = g_mat.download();

        g_mat.destroy();

        let sameSize = mat.cols == mat_2.cols && mat.rows == mat_2.rows && mat.channel == mat_2.channel;
        if (!sameSize) {
          return false;
        }

        let nElems = mat.rows * mat.cols * mat.channel;

        for (let i = 0; i < nElems; ++i) {
          let absVal = Math.abs(mat.data[i] - mat_2.data[i]);
          if (absVal > TOLERANCE) {
            return false;
          }
        }
        return true;
      })).toHold();
    });

    it('ifft(fft(mat)) === mat', () => {
      expect(jsc.forall(powerOf2SizedMatrix, (mat) => {
        let gpu = new GPU();
        let g_mat = gpu.create_gpu_matrix(mat);
        let fft_mat = gpu.compute_fft(g_mat, true);
        gpu.compute_fft(fft_mat, false, g_mat);

        let mat_2 = g_mat.download();

        g_mat.destroy();
        fft_mat.destroy();
        

        let sameSize = mat.cols == mat_2.cols && mat.rows == mat_2.rows && mat.channel == mat_2.channel;

        if (!sameSize) return false;

        let nElems = mat.rows * mat.cols * mat.channel;

        for (let i = 0; i < nElems; ++i) {
          let absVal = Math.abs(mat.data[i] - mat_2.data[i]);
          if (absVal > TOLERANCE) {
            return false;
          }
        }
        return true;
      })).toHold();
    });

  });
});