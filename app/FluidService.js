

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
            return new FluidInstance(id, reference(id, data), $rootScope, $parse);
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