// Constructor for FluidState
function FluidState(id, rule, deterministic, instance) {
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
        from: [],
        to: []
    };

    self.rules = [];

    self.listeners = [];

    self.initialized = false;

    // Pre-Initialization Steps
    self.addRule(rule);
}

FluidState.prototype.initialize = function() {
    var self = this;

    // Add parent state
    // self.getParent();
    self.instance.getState(self.meta.id.parent).addState(self);

    self.initializeTransitions();

    if (self.transitions.initial) self.activate();

    self.initialized = true;
}

// Transitions
FluidState.prototype.initial = function(value) {
    var self = this;

    value = (value || !arguments.length) ? true : false;

    self.transitions.initial = value;

    return self;
}

FluidState.prototype.accepting = function(value) {
    var self = this;

    value = (value || !arguments.length) ? true : false;

    self.transitions.accepting = value;

    return self;
}

FluidState.prototype.transition = function(direction, states) {
    var self = this;

    console.log("Adding states '%s' as transition %s '%s'", states.join(', '), direction, self.id);

    self.transitions[direction] = _.union(self.transitions[direction], states);

    return self;
}

FluidState.prototype.from = function(states) {
    var self = this;

    var states = Array.prototype.concat.apply([], arguments);

    return self.transition('from', states);
}

FluidState.prototype.to = function(states) {
    var self = this;

    var states = Array.prototype.concat.apply([], arguments);

    return self.transition('to', states);
}

FluidState.prototype.hasTransition = function(direction, state) {
    var self = this;

    var transitionState;

    if (!self.transitions[direction].length) {
        return true;
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

    if (self.deterministic && self.states.length) {
        return self.determine();
    }

    var valid = true;

    if (!self.rules.length) {
        valid = _.some(self.states, {active: true});
    } else {
        valid = self.isValid();
    }

    if (valid) {
        this.activate();
    } else {
        this.deactivate();
    }
}

FluidState.prototype.isValid = function() {
    var self = this;

    var valid = true;

    _.forEach(self.rules, function(rule) {
        valid = valid && rule.validate();
    });

    return valid;
}

FluidState.prototype.activateTrigger = function() {
    var self = this;

    if (self.trigger) {
        self.trigger.activate();
    }

    return self;
}

FluidState.prototype.activate = function(active) {
    var self = this;

    active = arguments.length ? !!active : true;

    if (self.active !== active) {    
        console.log("%sctivating state '%s'", active ? 'A' : 'Dea', self.id);

        self.active = active;

        self.instance.getStates();

        self.activateTrigger();
        self.notifyListeners();
        self.instance.refresh();
    }

    if (!self.deterministic) {    
        _.each(self.states, function(state) {
            console.log("Validating child state '%s'", state.id);
            state.validate();
        });
    }

    return self;
}

FluidState.prototype.deactivate = function() {
    var self = this;

    self.activate(false);

    return self;
}

FluidState.prototype.determine = function(targetState) {
    var self = this;

    var activeState = _.find(self.states, {active: true});

    var nextState;

    if (arguments.length && targetState instanceof FluidState) {
        nextState = targetState;
    } else {
        nextState = _.find(self.states, function(fluidState) {
            return fluidState.isValid()
                && fluidState.hasTransitionFrom(activeState);
            });
    }

    if (!activeState) {
        console.error("Deterministic parent state '%s' has no initial state.", self.id);
        return false;
    }

    if (!nextState) {
        console.error("Unable to transition from state '%s'; transitions may be incomplete.", activeState.id);
        return false;
    }

    activeState.deactivate();

    nextState.activate();

    nextState.transitions.accepting ? self.activate() : self.deactivate();

    return self;
}

FluidState.prototype.go = function() {
    var self = this;

    self.parent.determine(self);

    return self;
}

FluidState.prototype.addRule = function(rule) {
    var self = this;

    var fluidRule;

    if (rule === undefined) return self;

    if (rule instanceof FluidRule) {
        fluidRule = self.instance.addRule(rule.validate, self);
    } else if (_.isString(rule) || _.isFunction(rule)) {
        fluidRule = self.instance.addRule(rule, self);
    } else {
        return (self.toggle(rule), self);
    }

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