
angular.module('FluidApp')
    .directive('flId', [function() {
        return {
            restrict: 'A',
            replace: false,
            controller: ['$scope', function($scope) {
                $scope.foo = 'bar';

                $scope.a = {b: false};
            }]
        }
    }]);

