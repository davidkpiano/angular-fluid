
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

    self._state = {};

    self.triggers = [];

    self.rules = [];

    self.scope = scope;

    self.$parse = $parse;

    var initialize = function() {
        self.getStates();

        self.createState('_');
    };

    initialize();
}

FluidInstance.prototype.initialize = function() {

}

FluidInstance.prototype.getStates = function() {
    var self = this;

    _.forEach(self.states, function(state) {
        self._state[state.id] = state.simplify();
    });

    return self._state;
}

FluidInstance.prototype.state = function(id, rule) {
    var self = this;

    if (id === undefined) {
        return self._state;
    }

    if (rule === undefined) {
        return self.getState(id);
    }
        
    return self.createState(id, rule);
}

FluidInstance.prototype.createState = function(id, rule) {
    var self = this;

    console.log("Creating state '%s'", id);

    var rule = rule || false;

    var fluidState = new FluidState(id, rule, self);

    self.allStates.push(fluidState);

    return fluidState;
}

FluidInstance.prototype.addState = function(state) {
    var self = this;

    self.states.push(state);

    state.parent = self;
}

FluidInstance.prototype.getState = function(id) {
    var self = this;

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

FluidInstance.prototype.addTrigger = function(id, state) {
    var self = this;

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

FluidInstance.prototype.addTriggers = function(ids, state) {
    var self = this;

    _.each(ids, function(id) {
        self.addTrigger(id, state);
    });

    return self;
}

FluidInstance.prototype.getTrigger = function(id) {
    var self = this;

    return _.find(self.triggers, function(trigger) {
        return trigger.id === id;
    });
}

FluidInstance.prototype.trigger = function(id) {
    var self = this;

    var trigger = self.getTrigger(id);

    trigger && trigger.trigger();

    return self;
}

FluidInstance.prototype.addRule = function(id, rule, state) {
    var self = this;

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

FluidInstance.prototype.getRule = function(id) {
    var self = this;

    return _.find(self.rules, function(rule) {
        return rule.id === id;
    });
}

FluidInstance.prototype.parse = function(rule) {
    var self = this;

    var rule = rule.replace(self.settings.regex.TRIGGER_STATE, function parseStateReplace(match) {
        return self.isActive(match);
    }, 'g');

    console.log("Parsing rule '%s'", rule);

    return self.$parse(rule)(self.scope[self.id]);
}

FluidInstance.prototype.isActive = function(id) {
    var self = this;

    var state = self.getState(id);

    return state.active;
}

FluidInstance.prototype.toggle = function(stateId, value) {
    var self = this;

    var state = self.getState(stateId);

    console.log("Toggling state '%s'", stateId);

    state && state.toggle(value);

    return self;
}

FluidInstance.prototype.refresh = function() {
    // scope.$apply(self.getStates());
}

FluidInstance.prototype.on = function(stateId, activeListener, inactiveListener) {
    var self = this;

    var state = (stateId instanceof FluidState && stateId) || self.getState(stateId);

    var listener = new FluidListener(state, activeListener, inactiveListener);

    return self;
}

FluidInstance.prototype.onRule = function(ruleString, activeListener, inactiveListener) {
    var self = this;

    var state = self.createState(_.uniqueId('_.listener_'), ruleString);

    self.on(state, activeListener, inactiveListener);

    return self;
}