import jsfeat from 'jsfeat';
import { require } from './assert';

function element_wise_operation(op) {
  return (A, B, C) => {
    require(A.cols == C.cols && A.rows == C.rows, "Cannot operate matrices with different sizes!");

    let a_buffer = A.data;
    let c_buffer = C.data;
    let size = A.cols * A.rows;

    if (typeof B === 'number') {
      for (let i = 0; i < size; ++i) {
        c_buffer[i] = op(a_buffer[i], B);
      }
    }
    else {
      require(A.cols == B.cols && A.rows == B.rows, "Cannot operate matrices with different sizes!");

      let b_buffer = B.data;
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
function normalize(src, dest) {
  require(src.cols == dest.cols && src.rows == dest.rows, "src and dest with different sizes.");
  require(src.channel == jsfeat.C1_t, "src needs to be C1_t");
  require(dest.type | dest.channel == jsfeat.F32C1_t, "dest needs to be F32C1_t");

  let src_buffer = src.data;

  let max = _.max(src_buffer);
  let min = _.min(src_buffer);

  let dest_buffer = dest.buffer.f32;

  let size = src.cols * src.rows;
  for (let i = 0; i < size; ++i) {
    dest_buffer[i] = (src_buffer[i] - min) / (max - min);
  }
}

export { add, subtract, multiply, normalize };