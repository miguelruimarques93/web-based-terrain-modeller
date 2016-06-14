import jsfeat from 'jsfeat';

class NormalmapGeneratorService {  
  constructor($q, gpu) {
    this.$q = $q;
    this.gpu = gpu;
    
    console.log( `Initializing NormalmapGeneratorService`);
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
      
      var height_buffer = heightmap_mat.data;
      var size_height = height_buffer.length;
      
      var normal_buffer = normalmap.data;
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
    });
  } 

  from_heightmap_gpu(heightmap_mat, strength) {
    if (heightmap_mat.channel != jsfeat.C1_t) {
      throw "Heightmap needs to be only one channel.";
    }
    
    return this.$q(((resolve, reject) => {
      
      /** @type {gpu}  */
      let gpu = this.gpu;

      let g_heightmap = gpu.create_gpu_matrix(heightmap_mat);
      let g_normalmap = gpu.normalMap(g_heightmap, strength);

      let result = g_normalmap.download();

      g_heightmap.destroy();
      g_normalmap.destroy();

      resolve(result);
    }).bind(this));
  } 
  
}

NormalmapGeneratorService.service_name = 'normalmapGenerator';

export default NormalmapGeneratorService;