module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
          all: ["src/*.js","src/*/**/*.js"],
          options: {
            jshintrc: ".jshintrc"
          }
        },
        concat: {
            options: {
              stripBanners: true,
              banner: '/**\n' + 
                ' *\n' +
                ' * <%= pkg.name %> - <%= pkg.description %>\n' + 
                ' * version: <%= pkg.version %>\n' +
                ' * @author <%= pkg.author %>/Copyright <%= pkg.copyright %>\n' +
                ' *\n' +
                ' */\n\n' +
                '(function(){\n\n' +
                '"use strict";\n\n' +
                'var glimp = (function() {\n' +
                '   return {\n' +
                '       version: "<%= pkg.version %>"\n' +
                '   };\n' +
                '})();\n\n',
              footer:'\n})();'
            },
            dist: {
              src: ['src/*.js', 'src/bgfg/*.js', 'src/filters/*.js', 'src/converters/*.js'],  
              dest: 'build/<%= pkg.name %>-<%= pkg.version %>.js',
            }
        },
        uglify : {
          dist : {
            files: {
              "build/<%= pkg.name %>-<%= pkg.version %>.min.js" : [
                "build/<%= pkg.name %>-<%= pkg.version %>.js"]
            }
          }
        }
    });

    // Require needed grunt-modules
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Define tasks
    grunt.registerTask('default', ['jshint','concat','uglify']);

};
