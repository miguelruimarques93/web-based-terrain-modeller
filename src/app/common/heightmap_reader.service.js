import jsfeat from 'jsfeat';

@Inject('$q', 'FileReader')
class HeightmapReaderService {  
  constructor() {
    console.log( `Initializing HeightmapReaderService`);
  }
  
  from_file(file, scope) {
    let deferred = this.$q.defer();
    
    this.FileReader.readAsDataURL(file, scope)
      .then((resp) => {
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
          
          var data_mat = new jsfeat.matrix_t(width, height, jsfeat.U8C1_t);
          var data = data_mat.buffer.u8;
          
          var j=0;
          for (var i = 0, n = pix.length; i < n; i += (4)) {
              var all = pix[i]+pix[i+1]+pix[i+2];
              data[j++] = all/3;
          }
          
          scope.$apply(() => {
            deferred.resolve(data_mat);
          });
        });
        
        image.src = resp;
      });
    
    return deferred.promise;
  }
  
  
}

HeightmapReaderService.service_name = 'heightmapReader';

export default HeightmapReaderService;