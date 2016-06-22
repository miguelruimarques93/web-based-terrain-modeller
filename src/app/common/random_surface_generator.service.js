import jsfeat from 'jsfeat';
import noise from 'noisejs';
import gpu_matrix from 'web_based_terrain_modeller/imgproc/gpu_matrix';

import { FFT, FrequencyFilter } from 'fft';

function noise2(noise_func) {
  return (x, y, octaves, persistence, lacunarity, base) => {
    // Commented for performance reasons
    // if (typeof octaves === 'undefined') { octaves = 1; }
    // if (typeof persistence === 'undefined') { persistence = 0.5; }
    // if (typeof lacunarity === 'undefined') { lacunarity = 2.0; }
    // if (typeof base === 'undefined') { base = 0.0; }

    if (octaves >= 1) {
      var freq = 1.0;
      var amp = 1.0;
      var max = 1.0;
      var total = noise_func(x * freq + base, y * freq + base) * amp;

      for (var i = 0; i < octaves; ++i) {
        freq *= lacunarity;
        amp *= persistence;
        max += amp;
        total += noise_func(x * freq + base, y * freq + base) * amp;
      }

      return total / max;
    } else {
      throw "octaves needs to be >= 1";
    }
  };
}

let pnoise2 = noise2(noise.perlin2);
let snoise2 = noise2(noise.simplex2);

@Inject('$q', 'gpu')
class RandomSurfaceGeneratorService {
  constructor() {
    console.log( `Initializing RandomSurfaceGeneratorService`);
  }

  generate_surface_perlin_noise(width, height, frequency = 160, octaves = 10, persistence = 0.5, lacunarity = 2.0, base = 0.0, seed = Math.random()) {
    console.log(`Generating perlin surface with seed: ${seed}`);

    return this.$q((resolve, reject) => {
      noise.seed(seed);

      var mat = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);

      for (var i = 0; i < width; ++i) {
        for (var j = 0; j < height; ++j) {
          mat.buffer.u8[i * width + j] = pnoise2(i / frequency, j / frequency, octaves, persistence, lacunarity, base) * 127.0 + 128.0;
        }
      }

      resolve(mat);
    });
  }

  generate_surface_perlin_noise_gpu(width, height, frequency = 160, octaves = 10, persistence = 0.5, lacunarity = 2.0, base = 0.0, seed = Math.random()) {
    console.log(`Generating perlin surface with seed: ${seed}`);

    return this.$q((resolve, reject) => {
      /** @type {gpu} */
      let gpu = this.gpu;

      let gpu_mat = gpu.perlin_noise(width, height, frequency, octaves, persistence, lacunarity, base);
      let g_normalized = gpu.normalize(gpu_mat);
      gpu.multiply(g_normalized, 255, gpu_mat);

      let result = gpu_mat.download();

      gpu_mat.destroy();
      g_normalized.destroy();

      resolve(result);
    });
  }

  generate_surface_simplex_noise(width, height, frequency = 160, octaves = 10, persistence = 0.5, lacunarity = 2.0, base = 0.0, seed = Math.random()) {
    console.log(`Generating simplex surface with seed: ${seed}`);

    return this.$q((resolve, reject) => {
      noise.seed(seed);

      var mat = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);

      for (var i = 0; i < width; ++i) {
        for (var j = 0; j < height; ++j) {
          mat.buffer.u8[i * width + j] = snoise2(i / frequency, j / frequency, octaves, persistence, lacunarity, base) * 127.0 + 128.0;
        }
      }

      resolve(mat);
    });
  }

  generate_surface_simplex_noise_gpu(width, height, frequency = 160, octaves = 10, persistence = 0.5, lacunarity = 2.0, base = 0.0, seed = Math.random()) {
    console.log(`Generating simplex surface with seed: ${seed}`);

    return this.$q((resolve, reject) => {
      /** @type {gpu} */
      let gpu = this.gpu;

      let gpu_mat = gpu.simplex_noise(width, height, frequency, octaves, persistence, lacunarity, base);
      let g_normalized = gpu.normalize(gpu_mat);
      gpu.multiply(g_normalized, 255, gpu_mat);

      let result = gpu_mat.download();

      gpu_mat.destroy();
      g_normalized.destroy();

      resolve(result);
    });
  }

  generate_surface_fourier_synthesis_gpu(width, height, power = 2.4) {
    return this.$q((resolve, reject) => {
      /** @type {gpu} */
      let gpu = this.gpu;

      let gpu_mat_1 = gpu.white_noise(width, height);
      var gpu_mat_2 = gpu.compute_fft(gpu_mat_1);

      gpu.fPowerMinusBeta(gpu_mat_2, power, gpu_mat_1);
      gpu.compute_fft(gpu_mat_1, false, gpu_mat_2);

      gpu.normalize(gpu_mat_2, gpu_mat_1);
      gpu.multiply(gpu_mat_1, 255, gpu_mat_2);

      var result = gpu_mat_2.download();

      gpu_mat_1.destroy();
      gpu_mat_2.destroy();

      resolve(result);
    });
  }

  generate_surface_fourier_synthesis(width, height, power = 2.4) {
    return this.$q((resolve, reject) => {
      var size = width * height;
      var re = [], im = [];

      FFT.init(width);
      FrequencyFilter.init(width);
      for (var i = 0; i < size; ++i) {
        re[i] = Math.random();
        im[i] = 0.0;
      }

      FFT.fft2d(re, im);
      FrequencyFilter.swap(re, im);

      var width_over_2 = width / 2;
      var height_over_2 = height / 2;
      var one_over_width = 1.0 / width;

      var filter = [];
      for (var y = 0; y < height; ++y) {
        var i = y * width;
        for (var x = 0; x < width; ++x) {
          var f = Math.sqrt(Math.pow((x - width_over_2) / width, 2) + Math.pow((y - height_over_2) / height, 2));
          f = f < one_over_width ? one_over_width : f;
          filter[i + x] = 1.0 / Math.pow(f, power);
        }
      }

      for (var i = 0; i < size; ++i) {
        re[i] *= filter[i];
        im[i] *= filter[i];
      }

      FrequencyFilter.swap(re, im);
      FFT.ifft2d(re, im);

      var mat = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
      var buffer = mat.buffer.u8;
      var max = re[0];
      var min = re[0];

      for (var i = 0; i < re.length; ++i) {
        max = Math.max(max, re[i]);
        min = Math.min(min, re[i]);
      }

      for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = ((re[i] - min) / (max - min)) * 255;
      }

      resolve(mat);
    });
  }
}

RandomSurfaceGeneratorService.service_name = "randomSurfaceGenerator";

export default RandomSurfaceGeneratorService;