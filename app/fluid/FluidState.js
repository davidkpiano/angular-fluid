// Constructor for FluidState
function FluidState(id, rule, fluidInstance) {
    var self = this;

    this.meta = {};

    this.id = id;

    this.meta.id = this.parseId(this.id);

    this.name = this.meta.id.name;

    this.parallel = this.meta.id.params[0].parallel;

    this.instance = fluidInstance;

    this.parent = null;

    this.states = [];

    this.triggers = [];

    this.active = false;

    this.rules = [];

    this.deactivate = function() {
        if (!self.active) return true;

        self.active = false;
    }

    this.toggle = function() {
        self[self.active ? 'deactivate' : 'activate']();
    }

    var initialize = function() {
        self.rule('initial', rule);

        fluidInstance.getState(self.meta.id.parent).addState(self);
    }

    initialize();
}

FluidState.prototype.addTrigger = function(property) {
    console.log("Adding trigger for '%s'", property);
    this.instance.watchTrigger(this, property);
    this.triggers.push(property);
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

    console.log(idData.params);

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

    angular.forEach(rules, function(rule) {
        if (!(rule instanceof FluidRule)) {
            throw 'Invalid rule';
        }

        valid = valid && rule.validate();
    });

    console.log("%s valid: %s", this.id, valid);

    if (valid) {
        this.activate();
    } else {
        this.deactivate();
    }
    
    // Activate/Deactivate if rules true/false
}

FluidState.prototype.activate = function() {
    console.log("Activating state '%s'", this.id);
    console.log(this.active);
    // if (this.active) return true;
    console.log("here");

    this.active = true;

    _.each(this.states, function(state) {
        console.log("Validating child state '%s'", state.id);
        state.validate();
    });

    return this;
}

FluidState.prototype.getSiblings = function() {
    var self = this;

    return _.reject(this.parent.states, function(state) {
        return state == self;
    });
}

FluidState.prototype.rule = function(id, rule) {
    if (!rule) {
        return _.find(this.rules, {id: id});
    };

    var rule = new FluidRule(id, rule, this);

    this.rules.push(rule);

    return this;
}