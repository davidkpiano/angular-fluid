// Constructor for FluidInstance
function FluidInstance(id, data, $rootScope, $parse) {
    var self = this;

    this.settings = {
        regex: {
            TRIGGER: /^@?[a-zA-Z_$][0-9a-zA-Z_$\.]*$/,
            TRIGGER_STATE: /^@[a-zA-Z_$][0-9a-zA-Z_$\.]*$/,
            TRIGGER_PROPERTY: /^[a-zA-Z_$][0-9a-zA-Z_$\.]*$/
        }
    }

    this.components = {
        triggers: [
            {
                type: 'state',
                regex: /^@[a-zA-Z_$][0-9a-zA-Z_$\.]*$/,
                link: function(trigger) {
                    var id = trigger.id.slice(1);

                    self.getState(id)
                        .setTrigger(trigger);
                }
            },
            {
                type: 'property',
                regex: /^[a-zA-Z_$][0-9a-zA-Z_$\.]*$/,
                link: function(trigger) {
                    var id = trigger.id;

                    console.log("Adding $watch for trigger '%s'", id);

                    $rootScope.$watch(['fl', self.id, id].join('.'), function(a, b) {
                        console.log("old: %s, new: %s", a, b);
                        trigger.trigger();
                        self.getStates();
                    });
                }
            },
            {
                type: 'default',
                regex: /^@?[a-zA-Z_$][0-9a-zA-Z_$\.]*$/
            }
        ],
        trigger: function(trigger) {
            return _.find(self.components.triggers, function(triggerComponent) {
                return triggerComponent.regex.test(trigger.id);
            });
        }
    }

    this.id = id;

    this.allStates = [];

    this.states = [];

    this.state = {};

    this.triggers = [];

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

    this.addTrigger = function(id, state) {
        if (!id.length) return;

        if (id == '&&' || id == '||') return;

        console.log("Adding trigger '%s' for state '%s'", id, state.id);

        var trigger = this.getTrigger(id);

        if (!trigger) {
            trigger = new FluidTrigger(id, self);

            self.triggers.push(trigger);
        }

        trigger.addState(state);

        return self;
    }

    this.getTrigger = function(id) {
        return _.find(self.triggers, function(trigger) {
            return trigger.id === id;
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