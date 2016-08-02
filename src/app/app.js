import angular from 'angular';
import appComponent from './app.component';

import ngAria from 'angular-aria';
import ngAnimate from 'angular-animate';
import ngMaterial from 'angular-material';
import ngFileUpload from 'ng-file-upload';
import 'angular-filereader';

import Components from './components/components';
import Common from './common/common';
import ImgProc from './imgproc/index';

let appModule = angular.module('app', [
  ngAnimate,
  ngAria,
  ngMaterial,
  ngFileUpload,
  'filereader',
  Components.name,
  Common.name,
  ImgProc.name
])
.config($mdThemingProvider => {
  'ngInject';
  $mdThemingProvider.theme('default').primaryPalette('teal');
})
.directive('app', appComponent);

export default appModule.name;
