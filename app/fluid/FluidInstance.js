
// Constructor for FluidInstance
function FluidInstance(id, scope, $parse) {
    var self = this;

    self.settings = {
        regex: {
            TRIGGER: /@?[a-zA-Z_\$][0-9a-zA-Z_$\.\:]*/g,
            TRIGGER_STATE: /@[a-zA-Z_\$][0-9a-zA-Z_\$\.\:]*/g,
            TRIGGER_PROPERTY: /[a-zA-Z_\$][0-9a-zA-Z_\$\.\:]*/g
        }
    }

    self.types = {
        triggers: [
            {
                name: 'state',
                regex: /^@[a-zA-Z_\$][0-9a-zA-Z_\$\.\:]*$/,
                link: function(trigger) {
                    var id = trigger.id.slice(1);

                    self.getState(id)
                        .setTrigger(trigger);
                }
            },
            {
                name: 'property',
                regex: /^[a-zA-Z_\$][0-9a-zA-Z\$\.\:]*$/,
                link: function(trigger) {
                    console.log("Adding $watch for trigger '%s'", id);

                    scope.$watch([self.id, trigger.id].join('.'), function(a, b) {
                        trigger.trigger();
                        self.getStates();
                    });
                }
            },
            {
                name: 'default',
                regex: /^@?[a-zA-Z_\$][0-9a-zA-Z_\$\.]*$/
            }
        ],
        trigger: function(trigger) {
            return _.find(self.types.triggers, function(triggerType) {
                return triggerType.regex.test(trigger.id);
            });
        }
    }

    self.id = id;

    self.allStates = [];

    self.states = [];

    self.state = {};

    self.triggers = [];

    self.rules = [];

    self.scope = scope;

    self.getStates = function() {
        self.state[self.id] = simplifyState(self);

        return (self.state);

        function simplifyState(state) {
            var simpleStates = {};

            if ((state instanceof FluidState) && !state.active) return false;

            if (_.every(state.states, {active: false})) {
                return state instanceof FluidState ? state.active : false;
            }

            _.forEach(state.states, function(state) {
                simpleStates[state.name] = simplifyState(state)
            });

            return simpleStates;
        }
    }

    self.createState = function(id, rule) {
        console.log("Creating state '%s'", id);

        var rule = rule || false;

        var state = new FluidState(id, rule, self);

        self.allStates.push(state);

        return state;
    }

    self.addState = function(state) {
        self.states.push(state);

        state.parent = self;
    }

    self.getState = function(id) {
        if (id == null) return self;

        var id = id.replace(/^@?/, '');

        var stateResults = self.allStates.filter(function(state) {
            return state.id === id;
        });

        if (stateResults.length !== 1) {
            console.error("FluidState '%s' does not exist.", id);

            return null;
        }

        return stateResults[0];
    }

    self.addTrigger = function(id, state) {
        if (!id.length) return;

        if (id == '&&' || id == '||') return;

        console.log("Adding trigger '%s' for state '%s'", id, state.id);

        var trigger = self.getTrigger(id);

        if (!trigger) {
            trigger = new FluidTrigger(id, self);

            self.triggers.push(trigger);
        }

        trigger.addState(state);

        return self;
    }

    self.addTriggers = function(ids, state) {
        _.each(ids, function(id) {
            self.addTrigger(id, state);
        });
    }

    self.getTrigger = function(id) {
        return _.find(self.triggers, function(trigger) {
            return trigger.id === id;
        });
    }

    self.trigger = function(id) {
        var self = this;

        var trigger = self.getTrigger(id);

        trigger && trigger.trigger();

        return self;
    }

    self.addRule = function(id, rule, state) {
        if (!id.length) return;

        var fluidRule;

        var ruleId = [state.id, id].join('|');

        if (!self.getRule(ruleId)) {
            fluidRule = new FluidRule(ruleId, rule, self);

            self.rules.push(fluidRule);
        } else {
            fluidRule = self.getRule(ruleId)
        }

        self.addTriggers(fluidRule.triggers, state);

        return fluidRule;
    }

    self.getRule = function(id) {
        return _.find(self.rules, function(rule) {
            return rule.id === id;
        });
    }

    self.parse = function(rule) {
        var rule = rule.replace(self.settings.regex.TRIGGER_STATE, function parseStateReplace(match) {
            return self.isActive(match);
        }, 'g');

        console.log("Parsing rule '%s'", rule);

        return $parse(rule)(scope[self.id]);
    }

    self.isActive = function(id) {
        var state = self.getState(id);

        return state.active;
    }

    self.toggle = function(stateId, value) {
        var state = self.getState(stateId);

        console.log("Toggling state '%s'", stateId);

        state && state.toggle(value);

        return self;
    }

    self.refresh = function() {
        // scope.$apply(self.getStates());
    }

    self.on = function(stateId, activeListener, inactiveListener) {
        var state = (stateId instanceof FluidState && stateId) || self.getState(stateId);

        var listener = new FluidListener(state, activeListener, inactiveListener);

        return self;
    }

    self.onRule = function(ruleString, activeListener, inactiveListener) {
        var state = self.createState(_.uniqueId('_.listener_'), ruleString);

        self.on(state, activeListener, inactiveListener);

        return self;
    }

    var initialize = function() {
        self.getStates();

        self.createState('_', true);
    };

    initialize();
}