
angular.module('FluidApp')
    .directive('flState', [function() {
        return {
            restrict: 'A',
            replace: false,
            controller: ['$scope', function($scope) {
                $scope.foo = 'bar';

                $scope.a = {b: false};
            }],
            controllerAs: 'fl'
        }
    }]);

