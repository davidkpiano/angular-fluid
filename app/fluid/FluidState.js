// Constructor for FluidState
function FluidState(id, rule, instance) {
    var self = this;

    self.meta = {};

    self.id = id;

    self.meta.id = self.parseId(self.id);

    self.name = self.meta.id.name;

    self.parallel = self.meta.id.params[0].parallel;

    self.instance = instance;

    self.parent = null;

    self.states = [];

    self.triggers = [];

    self.trigger = null;

    self.active = false;

    self.rules = [];

    self.listeners = [];

    // self.element = null;

    var initialize = function() {
        instance.getState(self.meta.id.parent).addState(self);

        self.addRule('initial', rule);
    }

    initialize();
}

FluidState.prototype.addTrigger = function(property) {
    console.log("Adding trigger for '%s'", property);

    this.instance.addTrigger(property, this);
}

FluidState.prototype.parseId = function(id) {
    var idData = {
        id: id,
        parent: null,
        name: null,
        params: id.match(/([\:\.]?\w+)/g)
    };

    var tagMap = [
        {
            tag: ':',
            parallel: true
        },
        {
            tag: '.',
            parallel: false
        },
        {
            tag: '',
            parallel: true,
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

FluidState.prototype.validateSiblings = function() {
    var siblings = this.getSiblings();

    if (this.parallel) {
        _.each(_.where(siblings, {parallel: false, active: true}), function(siblingState) {
            siblingState.deactivate();
        });
    } else {
        _.each(_.where(siblings, {active: true}), function(siblingState) {
            siblingState.deactivate();
        });
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

    active && self.validateSiblings();

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

FluidState.prototype.getSiblings = function() {
    var self = this;

    return _.reject(this.parent.states, function(state) {
        return state == self;
    });
}

FluidState.prototype.addRule = function(id, rule) {
    var self = this;

    var fluidRule;

    if (rule === undefined) return self;

    if (rule instanceof FluidRule) {
        fluidRule = rule;
    } else if (_.isString(rule) || _.isFunction(rule)) {
        fluidRule = self.instance.addRule(id, rule, self);
    } else if (angular.isElement(rule)) {
        return (self.addElement(rule), self);
    } else {
        return (self.toggle(rule), self);
    }

    console.log("Adding rule '%s' to state '%s'", fluidRule.id, self.id);

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