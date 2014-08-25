
function FluidCycle(instance) {
    var self = this;

    self.currentCycle = 0;

    self.active = false;

    self.instance = instance;

    self.stateQueue = [];

    self.nextStateQueue = [];

    self.activationQueue = [];
}

FluidCycle.prototype.queue = function(fluidStates) {
    var self = this;

    // Add fluidStates to queue for cycling
    Array.prototype.push.apply(self.nextStateQueue, fluidStates);

    console.log(self.nextStateQueue, fluidStates);

    if (!self.active) {    
        self.stateQueue = _.unique(self.nextStateQueue);

        self.nextStateQueue = [];

        console.groupCollapsed("Queuing %s states and cycling...", self.stateQueue.length);

        self.execute();

        console.groupEnd();
    }

    return self;
}

FluidCycle.prototype.execute = function() {
    var self = this;

    if (!self.stateQueue.length) {
        self.active = false;

        self.activationQueue.length = 0;

        self.currentCycle = 0;

        self.instance.getStates();

        return self;
    }

    console.group("Starting cycle %s", ++self.currentCycle);
    console.log("State queue:", _.pluck(self.stateQueue, 'id').join(', '));

    _.each(self.stateQueue, function(fluidState) {
        fluidState.validate();
    });

    self.stateQueue =_.unique(self.nextStateQueue);

    self.nextStateQueue = [];

    console.log("Next state queue:", _.pluck(self.stateQueue, 'id').join(', '));
    console.groupEnd();

    return self.execute();
}