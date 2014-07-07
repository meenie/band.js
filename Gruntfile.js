module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            options: {
                bundleOptions: {
                    standalone: '<%= pkg.name %>'
                }
            },
            build: {
                src: 'src/main.js',
                dest: 'dist/band.js'
            }
        },
        uglify: {
            options: {
                compress: true,
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'dist/band.js',
                dest: 'dist/band.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');

    // Default task(s).
    grunt.registerTask('default', ['browserify', 'uglify']);
};
