let mousepointMenu = () => {
  return {
    restrict: 'A',
    require: 'mdMenu',
    link: ($scope, $elements, $attr, mdMenuCtrl) => {
      var MousePointMenuCtrl = mdMenuCtrl;
      
      $scope.$mdOpenMousepointMenu = ($event) => {
        MousePointMenuCtrl.offsets = () => { 
          return {
            left: $event.offsetX,
            right: $event.offsetY
          };
        };
        MousePointMenuCtrl.open($event);
      };
    }
  };
};

mousepointMenu.directive_name = 'mousepointMenu';

export default mousepointMenu;