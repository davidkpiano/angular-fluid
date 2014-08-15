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
        initial: null,
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

    self.transitions.initial = !!value;

    return self;
}

FluidState.prototype.transition = function(direction, states) {
    var self = this;

    console.log("Adding states '%s' as transition %s '%s'", states.join(', '), direction, self.id);

    self.transitions[direction] = _.union(self.transitions[direction], states);

    console.log(self.transitions);

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

FluidState.prototype.initializeTransitions = function() {
    var self = this;

    self.transitions.from = _.map(self.transitions.from, function(fromState) {
        var fluidState = self.instance.getState(fromState);

        fluidState.to(self);

        return fluidState;
    });

    self.transitions.to = _.map(self.transitions.to, function(toState) {
        var fluidState = self.instance.getState(toState);

        fluidState.from(self);

        return fluidState;
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
    this.states.push(state);

    state.parent = this;
}

FluidState.prototype.validate = function() {
    var self = this;

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

FluidState.prototype.activate = function(active) {
    var self = this;

    active = (active === false) ? false : true;

    var stateChanged = (self.active !== active);

    if (!stateChanged) return self;

    console.log("%sctivating state '%s'", active ? 'A' : 'Dea', self.id);

    self.active = active;

    stateChanged && self.instance.getStates();

    if (stateChanged) {
        self.trigger && self.trigger.trigger();
        self.notifyListeners();
        self.instance.refresh();
    }

    _.each(self.states, function(state) {
        console.log("Validating child state '%s'", state.id);
        state.validate();
    });

    return self;
}

FluidState.prototype.deactivate = function() {
    var self = this;

    self.activate(false);

    return self;
}

FluidState.prototype.determine = function() {
    var self = this;

    var activeState = _.find(self.states, {active: true});

    var nextState = _.find(self.states, function(fluidState) {
        return fluidState.isValid()
            && _.find(fluidState.transitions.from, function(fromState) {
                return fromState === activeState;
            });
    });

    activeState.deactivate();

    nextState.activate();

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

FluidState.prototype.toggle = function(value) {
    var self = this;

    if (value === undefined) {
        self[self.active ? 'deactivate' : 'activate']();
    } else {
        self[!!value ? 'activate' : 'deactivate']();
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

    if (_.every(self.states, {active: false})) return self.active;

    _.forEach(self.states, function(state) {
        self.state[state.name] = state.simplify();
    });

    return self.state;
}