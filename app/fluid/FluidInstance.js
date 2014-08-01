// Constructor for FluidInstance
function FluidInstance(id, data, $rootScope, $parse) {
    var self = this;

    this.id = id;

    this.allStates = [];

    this.states = [];

    this.state = {};

    this.getStates = function() {
        var state = self.state;

        state[self.id] = simplifyState(self);

        return (state);

        function simplifyState(state) {
            var states = {};

            var allStatesInactive = true;

            if ((state instanceof FluidState) && !state.active) return false;

            if (!state.states.length) return true;

            _.forEach(state.states, function(state) {
                var simpleState = simplifyState(state);
                allStatesInactive = allStatesInactive && !simpleState;
                states[state.name] = simpleState;
            });

            return allStatesInactive ? false : states;
        }
    }

    this.createState = function(id, rule) {
        console.log("Creating state '%s'", id);

        var state = new FluidState(id, rule, self);

        self.allStates.push(state);

        return state;
    }

    this.addState = function(state) {
        this.states.push(state);

        state.parent = this;
    }

    this.getState = function(id) {
        if (id == null) return self;

        var stateResults = self.allStates.filter(function(state) {
            return state.id === id;
        });

        if (stateResults.length !== 1) {
            console.error("FluidState '%s' does not exist.", id);

            return null;
        }

        return stateResults[0];
    }

    this.watchTrigger = function(state, property) {
        if (!property.length) return;

        if (property == '&&' || property == '||') return;

        console.log("Adding trigger '%s' for state '%s'", property, state.id);

        $rootScope.$watch(['fl', self.id, property].join('.'), function(a, b) {
            console.log("old: %s, new: %s", a, b);
            state.validate();
            self.getStates();
        });
    }

    this.parse = function(rule) {
        console.log("Parsing rule '%s'", rule);
        return $parse(rule)($rootScope.fl[this.id]);
    }

    var initialize = function() {
        self.getStates();
    };

    initialize();
}