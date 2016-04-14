import 'angular';
import 'angular-ui-router';

import config from './config';
import templatesModule from './_templates';

var app = angular.module('app', [
  'ui.router',
  templatesModule.name
]);

app.config(config);

angular.element(document).ready(function() {
  angular.bootstrap(document, [app.name]);
});
