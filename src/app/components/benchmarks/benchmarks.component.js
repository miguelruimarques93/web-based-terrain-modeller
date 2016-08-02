import controller from './benchmarks.controller';
import template from './benchmarks.tpl.html!text';

let benchmarksComponent = () => {
  return {
    template,
    controller,
    restrict: 'E',
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
};

export default benchmarksComponent;