

angular.module('FluidApp')
    .service('FluidService', ['$rootScope', function($rootScope) {
        var self = this;

        // this.toggle = function(state) {
        //     state.toggle();

        //     $rootScope.$apply(function() {
        //         this.states = fl.states;
        //     });
        // }

        this.register = function(id, data) {
            return new FluidInstance(id, reference(id, data), $rootScope);
        }

        var reference = function(id, data) {
            if (data) {
                $rootScope.fl[id] = data;
            }

            return $rootScope.fl[id] || null;
        }

        $rootScope.fl = {};

        // this.states = fl.states;
    }]);

// Constructor for FluidState
function FluidState(id, rule, FluidInstance) {
    var self = this;

    this.meta = {};

    this.id = id;

    this.meta.id = this.parseId(this.id);

    this.parallel = this.meta.id.params[0].parallel;

    this.instance = FluidInstance;

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
        .join('') || id == FluidInstance.id ? null : FluidInstance.id;

    // console.log(idParams);

    idData.params = idData.params.map(function(idParam) {
        console.log(idParam);
        var tag = /[\:\.]?/.exec(idParam)[0];
        var param = /\w+/.exec(idParam)[0];

        var tagMapItem = tagMap.filter(function(tagMapItem) {
            return tagMapItem.tag == tag;
        })[0];

        return angular.extend({ param: param }, tagMapItem);
    });

    return idData;
}

FluidState.prototype.validate = function() {
    // Check rules
    var rules = this.rules;

    var valid = true;

    console.log(rules);

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
    console.log('activating');
    if (this.active) return true;

    if (this.parent) {        
        if (!this.parallel) {
            _.each(this.parent.states, function(state) {
                state.deactivate();
            });
        } else {
            _.each(this.parent.states, function(state) {
                if (!state.parallel) {    
                    state.deactivate();
                }
            });
        }

        // this.parent.validate();

        this.parent.activate();
    }

    this.active = true;

    return this;
}

FluidState.prototype.rule = function(id, rule) {
    if (!rule) {
        return _.find(this.rules, {id: id});
    };

    var rule = new FluidRule(id, rule, this);

    this.rules.push(rule);

    return this;
}

// Constructor for FluidRule
function FluidRule(id, rule, FluidState) {
    this.id = id;

    this.state = FluidState;

    this.validate = this.parseValidate(rule);
}

FluidRule.prototype.parseValidate = function(rule) {
    var self = this;

    if (angular.isString(rule)) {
        var properties = rule.split(/\s+/);

        _.each(properties, function(property) {
            self.state.addTrigger(property);
        });

        rule = function() {return true;}
    };

    return rule;
}

// Constructor for FluidInstance
function FluidInstance(id, data, $rootScope) {
    var self = this;

    this.id = id;

    this.states = [];

    this.state = {};

    this.getStates = function() {
        var state = {};

        state[self.id] = simplifyState(self.getState(self.id));

        return (self.state = state);

        function simplifyState(state) {
            var states = {};

            var allStatesInactive = true;

            console.log("Representing state '%s'", state.id);
            console.log(state);

            if (!state.active) return false;

            if (!state.states.length) return true;

            _.forEach(state.states, function(state) {
                var simpleState = simplifyState(state);
                allStatesInactive = allStatesInactive && !simpleState;
                states[state.id] = simpleState;
            });

            return allStatesInactive ? false : states;
        }
    }

    this.addState = function(id, rules) {
        // 1. Split the ID string
        var state = new FluidState(id, rules, self);

        // Add state's parent
        state.parent = this.getState(state.meta.id.parent || self.id == id ? null : self.id);

        if (state.parent) state.parent.states.push(state);

        self.states.push(state);

        return state;
    }

    this.getState = function(id) {
        if (id == null) return null;

        var stateResults = self.states.filter(function(state) {
            return state.id === id;
        });

        if (stateResults.length !== 1) {
            console.error("FluidState '%s' does not exist.", id);

            return null;
        }

        return stateResults[0];
    }

    this.watchTrigger = function(state, property) {
        if (!property.length) return;

        console.log("Adding trigger '%s' for state '%s'", property, state.id);

        $rootScope.$watch(['fl', self.id, property].join('.'), function(a, b) {
            console.log("old: %s, new: %s", a, b);
            state.validate();
            self.getStates();
        });
    }

    var initialize = function() {
        self.addState(self.id, 'user');

        self.getStates();
    };

    initialize();
}