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

        FL.createState('user', 'user');

        FL.createState('user.valid', function() {
            return self.user && self.user.length >= 5;
        });

        FL.createState('passValid', 'pass && @user.valid')
            .addRule('length', function() {
                return self.pass && self.pass.length;
            });

        FL.createState('formValid', '@user.valid && @passValid');

        FL.createState('status');
        FL.createState('status.loading');
        FL.createState('status.loaded');
        FL.createState('status.error');
    }]);


angular.module('FluidApp')
    .service('LoginService', ['$timeout', '$q', function($timeout, $q) {
        var self = this;

        var credentials = {
            user: 'foofoo',
            pass: 'bar'
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