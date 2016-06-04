import jsfeat from 'jsfeat';

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

class NormalmapGeneratorService {  
  constructor($q) {
    this.$q = $q;
  }
  
  /**
   * @param heightmap_mat {jsfeat.matrix_t}
   * @param strength {number}
   */
  from_heightmap(heightmap_mat, strength) {
    if (heightmap_mat.channel != jsfeat.C1_t) {
      throw "Heightmap needs to be only one channel.";
    }
    
    return this.$q((resolve, reject) => {
      
      var normalmap = new jsfeat.matrix_t(heightmap_mat.cols, heightmap_mat.rows, jsfeat.U8_t | jsfeat.C3_t);
      
      var width = heightmap_mat.cols;
      var height = heightmap_mat.rows;
      
      var height_buffer = get_buffer(heightmap_mat);
      var size_height = height_buffer.length;
      
      var normal_buffer = get_buffer(normalmap);
      var size_normal = normal_buffer.length;
      
      for (var i = 0, j = 0; i < size_normal && j < size_height; i += 3, ++j)
      {
        var x1, x2, y1, y2;
        if ( j % width === 0 ) {
          // left edge
          x1 = height_buffer[ j ];
          x2 = height_buffer[ j + 1 ];
        } else if ( j % width == ( width - 1 ) ) {
          // right edge
          x1 = height_buffer[ j - 1 ];
          x2 = height_buffer[ j ];
        } else {
          x1 = height_buffer[ j - 1 ];
          x2 = height_buffer[ j + 1 ];
        }
        if ( j < width ) {
          // top edge
          y1 = height_buffer[ j ];
          y2 = height_buffer[ j + width ];
        } else if ( j > width * ( height - 1 )) {
          // bottom edge
          y1 = height_buffer[ j - width ];
          y2 = height_buffer[ j ];
        } else {
          y1 = height_buffer[ j - width ];
          y2 = height_buffer[ j + width ];
        }
        
        normal_buffer[ i ] = ( x1 - x2 ) + 127;
        normal_buffer[ i + 1 ] = ( y1 - y2 ) + 127;
        normal_buffer[ i + 2 ] = 255;
      }
      
      resolve(normalmap);
      
      /*
      var gradient = new jsfeat.matrix_t(heightmap_mat.cols, heightmap_mat.rows, heightmap_mat.type | jsfeat.C2_t);
      jsfeat.imgproc.sobel_derivatives(heightmap_mat, gradient);
      
      
      
      var z = 1 / strength;
      
      var gradient_buffer = get_buffer(gradient);
      var size_gradient = gradient_buffer.length;
      
      var normal_buffer = get_buffer(normalmap);
      var size_normal = normal_buffer.length;
      
      for (var i = 0, j = 0; i < size_gradient && j < size_normal; i += 2, j += 3) {
        var magnitude = Math.sqrt(Math.pow(gradient_buffer[i], 2) + Math.pow(gradient_buffer[i+1], 2) + Math.pow(z, 2));
        normal_buffer[j] = gradient_buffer[i] / magnitude;
        normal_buffer[j+1] = gradient_buffer[i+1] / magnitude;
        normal_buffer[j+2] = z / magnitude;
      }
      
      resolve(normalmap);
      */
    });
  } 
  
}

NormalmapGeneratorService.service_name = 'normalmapGenerator';

export default NormalmapGeneratorService;