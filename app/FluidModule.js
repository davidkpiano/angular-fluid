angular.module('FluidApp', []);

angular.module('FluidApp')
    .controller('LoginController', ['FluidService', 'LoginService', function(FluidService, LoginService) {
        var self = this;

        self.foo = 'bar';

        self.ui = FluidService.register('login', self);

        self.login = function() {
            self.ui.getState('userValid').validate();

            LoginService.login(self.user, self.pass)
                .then(function(data) {
                    alert('logged in!');
                },

                function(data) {
                    alert('Incorrect credentials!');
                });
        }

        self.ui.addState('userValid', 'user')
            .rule('length', function() {
                return self.user && self.user.length > 6;
            });

        self.ui.addState('passValid', 'pass')
            .rule('length', function() {
                return self.pass && self.pass.length;
            });

        self.ui.addState('formValid', 'user pass')
            .rule('valid', function() {
                return self.ui.getState('userValid').active && self.ui.getState('passValid').active;
            });

        console.log(self.ui.getState('userValid'));
    }]);


angular.module('FluidApp')
    .service('LoginService', ['$timeout', '$q', function($timeout, $q) {
        var self = this;

        var credentials = {
            user: 'foo',
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