// Constructor for FluidState
function FluidState(id, rule, instance) {
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

    self.initialized = true;
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
    // Check rules
    var rules = this.rules;

    var valid = true;

    if (!rules.length) {
        valid = _.some(self.states, {active: true});
    }

    _.forEach(rules, function(rule) {
        valid = valid && rule.validate();
    });

    if (valid) {
        this.activate();
    } else {
        this.deactivate();
    }
}

FluidState.prototype.activate = function(active) {
    var self = this;

    var active = active === false ? false : true;

    console.log("%sctivating state '%s'", active ? 'A' : 'Dea', self.id);

    var stateChanged = active ? !self.active : self.active;

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