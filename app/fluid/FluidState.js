// Constructor for FluidState
function FluidState(id, triggers, deterministic, instance) {
    var self = this;

    self.meta = {};

    self.id = id;

    self.meta.id = self.parseId(self.id);

    self.name = self.meta.id.name;

    self.instance = instance;

    self.parent = null;

    self.state = {};

    self.states = [];

    self.triggers = [];

    self.trigger = null;

    self.active = false;

    self.deterministic = deterministic || false;

    self.transitions = {
        initial: false,
        accepting: false,
        acceptAny: false,
        from: [],
        to: []
    };

    self.rules = [];

    self.listeners = [];

    self.initialized = false;

    // Pre-Initialization Steps
    self.addTrigger(triggers);
}

FluidState.prototype.initialize = function() {
    var self = this;

    // Add parent state
    // self.getParent();
    self.instance.getState(self.meta.id.parent).addState(self);

    self.initializeTransitions();

    self.initializeAutomaton();

    self.initialized = true;
}

FluidState.prototype.initializeAutomaton = function() {
    var self = this;

    var initialFluidState = self.transitions.initial

    if (self.deterministic) {
        if (self.transitions.acceptAny) {
            _.each(self.states, function(fluidState) {
                fluidState.accepting();
            });
        }
    }

    if (!(initialFluidState instanceof FluidState)) {
        initialFluidState = _.find(self.states, function(fluidState) {
            return fluidState.isValid();
        });

        console.log(initialFluidState);
    }

    initialFluidState.activate();

    return self;
}

// Transitions
FluidState.prototype.initial = function(state) {
    var self = this;

    self.transitions.initial = state;

    return self;
}

FluidState.prototype.accepting = function(value) {
    var self = this;

    value = (value || !arguments.length) ? true : false;

    self.transitions.accepting = value;

    return self;
}

FluidState.prototype.acceptAny = function(value) {
    var self = this;

    value = (value || !arguments.length) ? true : false;

    self.transitions.acceptAny = value;

    return self;
}

FluidState.prototype.transition = function(direction, state) {
    var self = this;

    console.log("Adding state '%s' as transition %s '%s'", state.id, direction, self.id);

    self.transitions[direction].push(state);
    self.transitions[direction] = _.unique(self.transitions[direction]);

    return self;
}

FluidState.prototype.from = function(fromState, rule) {
    var self = this;

    if (rule) {
        self.instance.addRule(rule, self, fromState);
    }

    return self.transition('from', fromState);
}

FluidState.prototype.to = function(toState, rule) {
    var self = this;

    if (rule) {
        self.instance.addRule(rule, toState, self);
    }

    return self.transition('to', toState);
}

FluidState.prototype.hasTransition = function(direction, state) {
    var self = this;

    var transitionState;

    if (!(self.transitions.from.length || self.transitions.to.length)) {
        return true;
    }

    if (!self.transitions[direction].length) {
        return false;
    }

    transitionState = _.find(self.transitions[direction], function(currentState) {
        return currentState === state;
    });

    console.log("State '%s' does%s have a transition %s state '%s'", self.id, !!transitionState ? '' : ' NOT', direction, state.id);

    return !!transitionState;
}

FluidState.prototype.hasTransitionFrom = function(state) {
    var self = this;

    return self.hasTransition('from', state);
}

FluidState.prototype.hasTransitionTo = function(state) {
    var self = this;

    return self.hasTransition('to', state);
}

FluidState.prototype.initializeTransitions = function() {
    var self = this;

    var reverseDirection = {
        'from': 'to',
        'to': 'from'
    };

    _.each(reverseDirection, function(direction) {
        self.transitions[direction] = _.map(self.transitions[direction], function(currentState) {
            var fluidState = self.instance.getState(currentState);

            fluidState[reverseDirection[direction]](self);

            return fluidState;
        });
    });

    if (self.transitions.initial) {
        self.transitions.initial = self.instance.getState(self.transitions.initial);
    }

    return self;
}

FluidState.prototype.getParent = function() {
    var self = this;

    if (!self.parent instanceof FluidState) {
        self.instance
            .getState(self.meta.id.parent)
            .addState(self);
    }

    return self.parent;
}

FluidState.prototype.addTrigger = function(property) {
    var self = this;

    if (_.isArray(property)) {
        _.each(property, function(currentProperty) {
            self.addTrigger(property);
        });
    } else {
        self.instance.addTrigger(property, self);
    }

    return self;
}

FluidState.prototype.parseId = function(id) {
    var idData = {
        id: id,
        parent: null,
        name: null,
        params: id.match(/([\.]?\w+)/g)
    };

    var tagMap = [
        {
            tag: '.',
            parent: false
        },
        {
            tag: '',
            parent: true
        }
    ];

    idData.parent = idData.params
        .splice(0, idData.params.length - 1)
        .join('') || null;

    idData.params = idData.params.map(function(idParam) {
        console.log(idParam);
        var tag = /[\:\.]?/.exec(idParam)[0];
        var param = /\w+/.exec(idParam)[0];

        var tagMapItem = tagMap.filter(function(tagMapItem) {
            return tagMapItem.tag == tag;
        })[0];

        return angular.extend({ param: param }, tagMapItem);
    });

    idData.name = idData.params.slice(-1)[0].param;

    return idData;
}

FluidState.prototype.addState = function(state) {
    var self = this;

    self.states.push(state);

    state.parent = this;

    return self;
}

FluidState.prototype.validate = function() {
    var self = this;

    console.log("Validating state '%s'", self.id);

    if (self.deterministic) {
        return self.determine();
    }

    if (self.parent.deterministic) {
        return self.parent.determine(self);
    }

    var valid = true;

    if (!self.rules.length) {
        valid = _.some(self.states, {active: true});
    } else {
        valid = self.isValid();
    }

    if (valid) {
        self.activate();
    } else {
        self.deactivate();
    }

    return self;
}

FluidState.prototype.isValid = function(fromState) {
    var self = this;

    var valid = true;

    var fluidRules;

    if (self.states.length) {
        return _.any(self.states, function(fluidState) {
            return fluidState.isValid();
        });
    }

    if (!fromState) {
        fluidRules = _.filter(self.rules, {fromState: self.instance});
    } else {
        fluidRules = _.filter(self.rules, function(fluidRule) {
            return fluidRule.fromState === self.instance
                || fluidRule.fromState === fromState;
        });
    }

    _.forEach(fluidRules, function(fluidRule) {
        valid = valid && fluidRule.validate();
    });

    return valid;
}

FluidState.prototype.siblings = function() {
    var self = this;

    return _.filter(self.parent.states, function(fluidState) {
        return fluidState !== self;
    });
}

FluidState.prototype.notify = function() {
    var self = this;

    if (self.trigger) {
        self.trigger.activate();
    }

    self.notifyListeners();

    return self;
}

FluidState.prototype.activate = function(active) {
    var self = this;

    active = arguments.length ? !!active : true;

    if (self.active !== active) {    
        console.log("%sctivating state '%s'", active ? 'A' : 'Dea', self.id);

        self.active = active;

        self.notify();
    }

    // if (!self.deterministic) {    
    //     _.each(self.states, function(state) {
    //         console.log("Validating child state '%s'", state.id);
    //         state.validate();
    //     });
    // }

    return self;
}

FluidState.prototype.deactivate = function() {
    var self = this;

    self.activate(false);

    return self;
}

FluidState.prototype.determine = function(targetState) {
    var self = this;

    console.log("Determining state '%s'", self.id);

    var activeState = _.find(self.states, {active: true});

    var nextState;

    if (!activeState) {
        console.error("Deterministic parent state '%s' has no initial state.", self.id);
        return false;
    }

    if (arguments.length && targetState instanceof FluidState) {
        nextState = targetState;
    } else {
        nextState = _.find(self.states, function(fluidState) {
            return fluidState.isValid(activeState)
                && fluidState.hasTransitionFrom(activeState);
            });
    }

    if (!nextState) {
        if (activeState.isValid()) {
            return self;
        } else {        
            console.error("Unable to transition from state '%s'; transitions may be incomplete.", activeState.id);

            return false;
        }
    } else if (!activeState.hasTransitionTo(targetState)) {
        console.error("Active state '%s' has no transition to target state '%s'", activeState.id, targetState.id);

        return false;
    } else {
        activeState.deactivate();

        nextState.activate();

        (nextState.transitions.accepting || self.transitions.acceptAny)
            ? self.activate()
            : self.deactivate();
    }

    return self;
}

FluidState.prototype.go = function() {
    var self = this;

    self.parent.determine(self);

    return self;
}

FluidState.prototype.addRule = function(rule, fromState) {
    var self = this;

    if (rule === undefined) return self;

    if (rule instanceof FluidRule) {
        self.instance.addRule(rule.validate, self, fromState);
    } else if (_.isString(rule) || _.isFunction(rule)) {
        self.instance.addRule(rule, self, fromState);
    } else {
        return (self.toggle(rule), self);
    }

    return self;
}

FluidState.prototype.pushRule = function(fluidRule) {
    var self = this;

    self.rules.push(fluidRule);

    return self;
}

FluidState.prototype.setTrigger = function(trigger) {
    var self = this;

    if (trigger instanceof FluidTrigger) {
        self.trigger = trigger;
    }

    return self;
}

FluidState.prototype.toggle = function(active) {
    var self = this;

    active = !!active;

    if (!arguments.length) {
        self[self.active ? 'deactivate' : 'activate']();
    } else {
        self[active ? 'activate' : 'deactivate']();
    }

    self.instance.refresh();

    return self;
}

FluidState.prototype.addListener = function(listener) {
    var self = this;

    self.listeners.push(listener);

    return self;
}

FluidState.prototype.notifyListeners = function() {
    var self = this;

    _.forEach(self.listeners, function(listener) {
        listener.notify(self.active);
    });

    return self;
}

FluidState.prototype.simplify = function() {
    var self = this;

    if (!self.states.length) return self.active;

    if (self.deterministic) {
        if (!self.active) {
            self.state = [];
        } else {
            self.state = {};
        }
    }

    if (_.every(self.states, {active: false})) return self.active;

    _.forEach(self.states, function(state) {
        self.state[state.name] = state.simplify();
    });

    return self.state;
}