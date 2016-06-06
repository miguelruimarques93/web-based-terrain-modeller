import angular from 'angular';
import gpu from './gpu';

export default angular.module('app.imgproc', [])
  .service('gpu', gpu);
  