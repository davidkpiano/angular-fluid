angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('MainController', ['FluidService', function(FluidService) {

        this.states = FluidService.getStates();

        this.toggle = function(state) {
            state.toggle();
            this.states = FluidService.getStates();
        }
    }]);

angular.module('FluidApp')
    .directive('flState', [function() {
        return {
            restrict: 'A',
            replace: false,
            controller: ['$scope', function($scope) {
                $scope.foo = 'bar';

                $scope.a = {b: false};
            }]
        }
    }]);