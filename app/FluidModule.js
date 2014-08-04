angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';

        var FL = window.FL = FluidService.register('login', self);

        self.ui = FL.state;

        self.login = function() {
            FL.getState('user.valid').validate();

            FL.getState('status').activate();
            FL.getState('status.loading').activate();

            LoginService.login(self.user, self.pass)
                .then(function(data) {
                    FL.getState('status.loaded').activate();
                },

                function(data) {
                    FL.getState('status.error').activate();
                });
        }

        FL('user', 'user');

        FL('user.valid', function() {
            return self.user && self.user.length >= 5;
        });

        FL('passValid', 'pass && @user.valid')
            .addRule('length', function() {
                return self.pass && self.pass.length;
            });

        FL('status');
        FL('status.loading');
        FL('status.loaded');
        FL('status.error');

        FL('form', 'user && pass');
        FL('form:valid', '@user.valid && @passValid');
        FL('form:canLogin', '@form:valid && !@status.loading');
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