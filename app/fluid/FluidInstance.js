
// Constructor for FluidInstance
function FluidInstance(id, data, $rootScope, $parse) {
    var self = this;

    self.settings = {
        regex: {
            TRIGGER: /@?[a-zA-Z_$][0-9a-zA-Z_$\.\:]*/g,
            TRIGGER_STATE: /@[a-zA-Z_$][0-9a-zA-Z_$\.\:]*/g,
            TRIGGER_PROPERTY: /[a-zA-Z_$][0-9a-zA-Z_$\.\:]*/g
        }
    }

    self.types = {
        triggers: [
            {
                name: 'state',
                regex: /^@[a-zA-Z_$][0-9a-zA-Z_$\.\:]*$/,
                link: function(trigger) {
                    var id = trigger.id.slice(1);

                    self.getState(id)
                        .setTrigger(trigger);
                }
            },
            {
                name: 'property',
                regex: /^[a-zA-Z_$][0-9a-zA-Z_$\.\:]*$/,
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
                name: 'default',
                regex: /^@?[a-zA-Z_$][0-9a-zA-Z_$\.]*$/
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

    self.getStates = function() {
        self.state[self.id] = simplifyState(self);

        return (self.state);

        function simplifyState(state) {
            var simpleStates = {};

            if ((state instanceof FluidState) && !state.active) return false;

            if (!state.states.length) return true;

            if (_.every(state.states, {active: false})) return state.active;

            _.forEach(state.states, function(state) {
                simpleStates[state.name] = simplifyState(state)
            });

            return simpleStates;
        }
    }

    self.createState = function(id, rule) {
        console.log("Creating state '%s'", id);

        var rule = rule || null;

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

        return $parse(rule)($rootScope.fl[self.id]);
    }

    self.isActive = function(id) {
        var state = self.getState(id);

        return state.active;
    }

    var initialize = function() {
        self.getStates();
    };

    initialize();
}