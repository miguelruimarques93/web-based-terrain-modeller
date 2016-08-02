import angular from 'angular';
import $ from 'jquery';

import appComponent from './app';

/**
 * Manually bootstrap the application when AngularJS and
 * the application classes have been loaded.
 */
angular
  .element( document )
  .ready( () => {
    let body = document.getElementsByTagName("body");

    /*
    let app = angular
      .module(appName, 
      [
        ngAnimate, 
        ngAria, 
        ngMaterial, 
        ngFileUpload,
        'leaflet-directive', 
        'filereader',
        appComponent
      ])
      .config($mdThemingProvider => {
        'ngInject';
        $mdThemingProvider.theme('default').primaryPalette('teal');
      });
      */
      
    angular.bootstrap( body, [appComponent], { strictDi: false });
  });