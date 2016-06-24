import jsfeat from 'jsfeat';

/**
 * Converts the matrix to base64 png
 * @param {jsfeat.matrix_t} matrix
 * @return {string}
 */
function convert_matrix_to_base64(matrix) {
  let canvas = document.createElement('canvas');

  canvas.width = matrix.cols;
  canvas.height = matrix.rows;

  canvas.style.width = `${matrix.cols}px`;
  canvas.style.height = `${matrix.rows}px`;

  let context = canvas.getContext('2d');
  let image_data = context.getImageData(0, 0, matrix.cols, matrix.rows);
  let data = image_data.data;
  let mat_data = matrix.data;
  let ch = matrix.channel;

  for (let i = 0, j = 0; i < data.length; i += 4, j += ch) {
    data[i] = mat_data[j];

    if (ch >= 3) {
      data[i + 1] = mat_data[j + 1];
      data[i + 2] = mat_data[j + 2];
    } else {
      data[i + 1] = data[i + 2] = mat_data[j];
    }

    data[i + 3] = 255;
  }

  context.putImageData(image_data, 0, 0);

  return canvas.toDataURL();
}

/**
 *
 * @param {string} data_url
 * @return {Promise}
 */
function convert_base64_to_matrix(data_url) {
  return new Promise( (resolve, reject) => {
    // debugger;
    let image = document.createElement('img');

    image.addEventListener('load', (event) => {
      let width = event.target.width;
      let height = event.target.height;

      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      let context = canvas.getContext('2d');

      let size = width * height;

      context.drawImage(event.target, 0, 0);

      let imgd = context.getImageData(0, 0, width, height);
      let pix = imgd.data;

      let data_mat = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
      let data = data_mat.buffer.u8;

      let j = 0;
      for (let i = 0, n = pix.length; i < n; i += (4)) {
        let all = pix[i] + pix[i + 1] + pix[i + 2];
        data[j++] = all / 3;
      }

      resolve(data_mat);
    });

    image.src = data_url;
  });
}

export { convert_matrix_to_base64, convert_base64_to_matrix };