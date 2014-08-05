

angular.module('FluidApp')
    .service('FluidService', ['$rootScope', '$parse', function($rootScope, $parse) {
        var self = this;

        // this.toggle = function(state) {
        //     state.toggle();

        //     $rootScope.$apply(function() {
        //         this.states = fl.states;
        //     });
        // }

        this.register = function(id, data) {
            var fluidInstance = new FluidInstance(id, reference(id, data), $parse);

            var fluid = function(state, rule) {
                return fluidInstance.createState(state, rule);
            };

            _.forIn(fluidInstance, function(value, key) {
                fluid[key] = value;
            });

            return fluid;
        }

        var reference = function(id, data) {
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
                var UI = FluidService.register('dropdown');

                scope.ui = UI.state;

                UI('active', false);

                element.find('button').bind('click', function() {
                    UI.toggle('active');
                }).bind('blur', function() {
                    UI.toggle('active', false);
                });
            }
        }
    });