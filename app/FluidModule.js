angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';


        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state();

        self.login = function() {
            FL.state('user.valid').validate();

            FL.go('status.loading');

            var loginPromise = LoginService.login(self.user, self.pass)
                .then(function(data) {
                    FL.go('status.loaded');
                },

                function(data) {
                    FL.go('status.error');
                });
        }

        FL.state('user', 'user');

        FL.state('user.valid', function() {
            console.log('checking');
            return self.user && self.user.length >= 5;
        });

        FL.state('pass', 'pass');

        FL.state('pass.valid', function() {
            return self.pass && self.pass.length;
        });

        FL.state('status', true, true);
        FL.state('status.pending', true)
            .to('status.loaded')
            .initial();
        FL.state('status.loading', false)
            .to('status.loaded', 'status.error');
        FL.state('status.loaded', false)
            .to('status.loading');
        FL.state('status.error', false)
            .to('status.loading');

        FL.state('form', 'user && pass');
        FL.state('form.valid', '@user.valid && @pass.valid');
        FL.state('form.canLogin', '@form.valid && !@status.loading');

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
                go: {
                    _initial: true,
                    _to: 'light.wait'
                },
                wait: {
                    _to: 'light.stop'
                },
                stop: {
                    _to: 'light.go'
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