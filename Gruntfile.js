module.exports = function(grunt) {
	// Initializes the Grunt tasks with the following settings
	grunt.initConfig({
		// A list of files, which will be syntax-checked by JSHint
		jshint: {
			files: ['Gruntfile.js', 'models/*.js', 'handlers/*.js', './*.js', 'test/*.js', 'infrastructure/*.js', 'utils/*.js' ]
		},
		// Files to be concatenated … (source and destination files)
		concat: {
			js: {
				src: ['lib/module1.js', 'lib/module2.js', 'lib/plugin.js'],
				dest: 'dist/script.js'
			},
			css: {
				src: ['style/normalize.css', 'style/base.css', 'style/theme.css'],
				dest: 'dist/screen.css'
			}
		},
		// … and minified (source and destination files)
		uglify: {
			dist: {
				src: ['<%= concat.js.dest %>'],
				dest: 'dist/script.min.js'
			}
		},
		// Tasks being executed with 'grunt watch'
		watch: {
			files: '<%= jshint.files %>',
			tasks: 'jshint'
		},
		cafemocha: {
			testApi: {
				src: 'test/*.js',
				options: {
					ui: 'bdd',
					require: [
						'should'
					],
					reporter: 'spec'
				}
			},
            testSingleModule: {
                src: 'test/ApiAccessToken.js',
                options: {
                    ui: 'bdd',
                    require: [
                        'should'
                    ],
                    reporter: 'spec'
                }
            }
		}
	});

	// Load the plugins that provide the tasks we specified in package.json.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	//grunt.loadNpmTasks('grunt-contrib-concat');
	//grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-cafe-mocha');

	// This is the default task being executed if Grunt
	// is called without any further parameter.
	grunt.registerTask('default', ['jshint', 'cafemocha']);
    grunt.registerTask('singletest', ['jshint', 'cafemocha:testSingleModule']);
	grunt.registerTask('lint', ['jshint']);
	grunt.registerTask('production', ['jshint', 'cafemocha'/*, 'concat', 'uglify'*/]);
};
