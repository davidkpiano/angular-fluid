

angular.module('FluidApp')
    .service('FluidService', ['$rootScope', '$parse', function($rootScope, $parse) {
        var self = this;

        this.register = function(id, data) {
            var fluidInstance = new FluidInstance(id, reference(id, data), $parse);

            return fluidInstance;
        }

        var reference = function(id, data) {
            if (!data) return null;

            var scope = $rootScope.$new();

            scope[id] = data;

            return scope;
        }
    }]);


angular.module('FluidApp')
    .directive('dropdownContainer', function(FluidService) {
        return {
            restrict: 'C',
            replace: false,
            scope: true,
            link: function(scope, element, attrs) {
                var UI = window.UI = FluidService.register('dropdown', scope);

                scope.ui = UI.state();

                UI.state('active', false);

                console.log('-----');
                console.log(UI.state('active'));

                element.on('click', function() {
                    UI.state('active').toggle();
                    UI.getStates();
                });
            }
        }
    });