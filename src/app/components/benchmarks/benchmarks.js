import angular from 'angular';
import benchmarksComponent from './benchmarks.component';

let benchmarksModule = angular.module('app.benchmarks', [])

  .config($stateProvider => {
    'ngInject';

    $stateProvider
      .state('benchmarks', {
        url: '/benchmarks',
        template: '<benchmarks></benchmarks>'
      });
  })
  .directive('benchmarks', benchmarksComponent);

export default benchmarksModule;