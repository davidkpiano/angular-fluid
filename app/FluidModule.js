angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';


        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state();

        self.login = function() {
            FL.go('status.loading');

            var loginPromise = LoginService.login(self.user, self.pass)
                .then(function(data) {
                    FL.go('status.loaded');
                },

                function(data) {
                    FL.go('status.error');
                });
        }

        FL.state('user', 'user', true)
            .acceptAny();

        FL.state('user.valid');

        FL.state('user.invalid');

        FL.state('user.invalid.length')
            .addRule(function() {
                return !self.user || self.user.length < 6;
            });
 
        FL.state('user.invalid.illegal')
            .addRule(function() {
                return /[0-9]/.test(self.user);
            });

        // FL.state('name', 'user', true).acceptAny();

        // FL.state('name.empty', function() {return !self.user.length})
        //     .initial();

        // FL.state('name.short', function() {return self.user.length < 6});
        // FL.state('name.medium', function() {return self.user.length >= 6 && self.user.length < 12});
        // FL.state('name.long', function() {return self.user.length >= 12});

        // FL.state('pass', 'pass');

        // FL.state('pass.valid', function() {
        //     return self.pass && self.pass.length;
        // });

        // FL.state('status', true, true)
        //     .acceptAny();
        // FL.state('status.pending', true)
        //     .to('status.loading')
        //     .initial();
        // FL.state('status.loading', false)
        //     .to('status.loaded')
        //     .to('status.error');
        // FL.state('status.loaded', false)
        //     .to('status.loading');
        // FL.state('status.error', false)
        //     .to('status.loading');

        // FL.state('form', 'user && pass');
        // FL.state('form.valid', '@user.valid && @pass.valid');
        // FL.state('form.canLogin', '@form.valid && !@status.loading');

        FL.initialize();
    }]);

angular.module('FluidApp')
    .controller('TrafficController', ['FluidService', '$interval', function(FluidService, $interval) {
        var self = this;
        var FL = window.traffic = FluidService.register('traffic', self);

        this.ui = FL.state();

        FL.state('light', 'foo', true);

        FL.state('light.go', false).to('light.wait').initial();

        FL.state('light.wait', false).to('light.stop');

        FL.state('light.stop', false).to('light.go');

        FL.initialize();

        var foo = {
            light: {
                states: {
                    go: {
                        to: 'light.wait'
                    }
                }
            }
        }

        self.touch = function() {
            $interval(function() {
                FL.state('light').determine();
            }, 1000);
        }
    }]);


angular.module('FluidApp')
    .service('LoginService', ['$timeout', '$q', function($timeout, $q) {
        var self = this;

        var credentials = {
            user: 'username',
            pass: 'password'
        };

        self.login = function(user, pass) {
            var deferred = $q.defer();

            $timeout(function() {
                if (credentials.user == user && credentials.pass == pass) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                };
            }, 2000);

            return deferred.promise;
        }
    }]);