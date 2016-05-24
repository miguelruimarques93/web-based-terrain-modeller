import controller from './editor.controller';
import template from './editor.tpl.html!text';

let editorComponent = () => {
  return {
    template,
    controller,
    restrict: 'E',
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
};

export default editorComponent;