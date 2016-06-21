import angular from 'angular';
import ngAria from 'angular-aria';
import ngAnimate from 'angular-animate';
import ngMaterial from 'angular-material';
import ngFileUpload from 'ng-file-upload';
import 'angular-filereader';

import $ from 'jquery';
import 'leaflet';
import leafletDirective from 'angular-leaflet-directive';

import appComponent from './app';

/**
 * Manually bootstrap the application when AngularJS and
 * the application classes have been loaded.
 */
angular
  .element( document )
  .ready( () => {
    
    let appName = 'web-based-terrain-modeller';
    console.log( `Initializing ${appName}`);
    
    let body = document.getElementsByTagName("body");
    
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
      
    angular.bootstrap( body, [app.name], { strictDi: true });
  });