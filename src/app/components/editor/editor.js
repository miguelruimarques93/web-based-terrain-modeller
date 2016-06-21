import angular from 'angular';
import editorComponent from './editor.component';

let editorModule = angular.module('app.editor', [])

.config($stateProvider => {
  'ngInject';
  
  $stateProvider
    .state('editor', {
      url: '/editor',
      template: '<editor></editor>'
    });
})
.directive('editor', editorComponent)
.filter('keyboardShortcut', $window => {
    return function(str) {
      if (!str) return;
      var keys = str.split('-');
      var isOSX = /Mac OS X/.test($window.navigator.userAgent);
      var seperator = (!isOSX || keys.length > 2) ? '+' : '';
      var abbreviations = {
        M: isOSX ? '⌘' : 'Ctrl',
        A: isOSX ? 'Option' : 'Alt',
        S: 'Shift'
      };
      return keys.map(function(key, index) {
        var last = index == keys.length - 1;
        return last ? key : abbreviations[key];
      }).join(seperator);
    };
  })

export default editorModule;