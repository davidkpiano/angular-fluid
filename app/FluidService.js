

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
            return (function() {
                var fluidInstance = new FluidInstance(id, reference(id, data), $rootScope, $parse);

                var fluid = function(state, rule) {
                    return fluidInstance.createState(state, rule);
                };

                _.forIn(fluidInstance, function(value, key) {
                    fluid[key] = value;
                });

                return fluid;
            })();
        }

        var reference = function(id, data) {
            if (data) {
                $rootScope.fl[id] = data;
            }

            return data || null;
        }

        $rootScope.fl = {};

        // this.states = fl.states;
    }]);