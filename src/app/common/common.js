import angular from 'angular';
import heightmap_reader from './heightmap_reader.service';
import random_surface_generator from './random_surface_generator.service';
import mousepoint_menu from './mousepoint_menu.directive';

export default angular.module('app.common', [])
  .service(heightmap_reader.service_name, heightmap_reader)
  .service(random_surface_generator.service_name, random_surface_generator)
  .directive(mousepoint_menu.directive_name, mousepoint_menu);
  