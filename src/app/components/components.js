import angular from 'angular';
import 'angular-ui-router';

import Editor from './editor/editor';
import Benchmarks from './benchmarks/benchmarks';

let componentModule = angular.module('app.components', [
  'ui.router',
  Editor.name,
  Benchmarks.name
])
.config(($urlRouterProvider, $locationProvider) => {
  'ngInject';

  $locationProvider.html5Mode(true).hashPrefix('!');
  $urlRouterProvider.otherwise('/editor');
})
  ;

export default componentModule;