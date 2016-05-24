import controller from './app.controller';
import template from './app.tpl.html!text';

let appComponent = () => {
  return {
    template,
    controller,
    restrict: 'E',
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
};

export default appComponent;