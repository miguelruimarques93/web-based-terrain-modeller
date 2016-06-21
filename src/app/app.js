import angular from 'angular';
import appComponent from './app.component';
import 'angular-ui-router';

import Components from './components/components';
import Common from './common/common';
import ImgProc from './imgproc/index';

let appModule = angular.module('app', [
  'ui.router',
  Components.name,
  Common.name,
  ImgProc.name
])
.config(($urlRouterProvider, $locationProvider) => {
  'ngInject';
  $locationProvider.html5Mode(true).hashPrefix('!');
  $urlRouterProvider.otherwise('/editor');  
})
.directive('app', appComponent);

export default appModule.name;
