import angular from 'angular';
import heightmap_reader from './heightmap_reader.service';
import normalmap_generator from './normalmap_generator.service';
import random_surface_generator from './random_surface_generator.service';
import spline_editor from './spline_editor';
import terrain_viewer from './terrain_viewer';

export default angular.module('app.common', [])
  .service(heightmap_reader.service_name, heightmap_reader)
  .service(normalmap_generator.service_name, normalmap_generator)
  .service(random_surface_generator.service_name, random_surface_generator)
  .directive(spline_editor.directive_name, spline_editor.factory)
  .directive(terrain_viewer.directive_name, terrain_viewer.factory)
  .factory('$exceptionHandler', function ($log, $injector) {
    'ngInject';
    var $mdDialog;

    return function myExceptionHandler(exception, cause) {
      $mdDialog = $mdDialog || $injector.get('$mdDialog');

      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.getElementsByTagName('body')))
          .clickOutsideToClose(false)
          .title('Development Error')
          .textContent(exception.message)
          .ok('Got it!')
      );
      $log.error(exception, cause);
    };
  })
  ;
  