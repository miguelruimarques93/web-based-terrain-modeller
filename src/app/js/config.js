export default /* @ngInject */ ($stateProvider, $urlRouterProvider) => {
  
  $urlRouterProvider.otherwise('/');
  
  $stateProvider
    .state('home', {
      url : '/',
      views: {
        content: {
          templateUrl: '../templates/home-view.tpl.html',
          controller: /* @ngInject */ ($scope) => {
            $scope.greeting = 'Ahoy';
          }
        }
      }
    });
  
};