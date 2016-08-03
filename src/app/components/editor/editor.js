import angular from 'angular';
import editorComponent from './editor.component';

let editorModule = angular.module('app.components.editor', [])

  .config($stateProvider => {
    'ngInject';

    $stateProvider
      .state('editor', {
        url: '/editor',
        template: '<editor></editor>'
      });
  })
  .directive('editor', editorComponent)
  ;

export default editorModule;