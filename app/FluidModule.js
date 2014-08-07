angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';

        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state();

        self.login = function() {
            FL.state('user.valid').validate();

            FL.state('status').activate();
            FL.state('status.loading').activate();

            LoginService.login(self.user, self.pass)
                .then(function(data) {
                    FL.state('status.loaded').activate();
                },

                function(data) {
                    FL.state('status.error').activate();
                });
        }

        FL.state('user', 'user');

        FL.state('user.valid', function() {
            return self.user && self.user.length >= 5;
        });

        FL.state('passValid', 'pass && @user.valid')
            .addRule('length', function() {
                return self.pass && self.pass.length;
            });

        FL.state('status', true);
        FL.state('status.loading', false);
        FL.state('status.loaded', false);
        FL.state('status.error', false);

        FL.state('form', 'user && pass');
        FL.state('form:valid', '@user.valid && @passValid');
        FL.state('form:canLogin', '@form:valid && !@status.loading');

        FL.onRule('@form:canLogin', function() {});
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