module.exports = function(grunt) {

    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'app.js']
        },
        jasmine: {
            src: ['assets/js/*.js', 'app/*.js', 'app/fluid/*.js'],
            options: {
                specs: 'spec/*Spec.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.registerTask('default', 'jshint');
};