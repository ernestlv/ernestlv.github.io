/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    bower: {
      install: {
         //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
      }
    },
    wiredep: {
        task: {
          src: [
            'index.html'
          ]
        }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-wiredep');

  // Default task.
  grunt.registerTask('default', ['bower', 'wiredep']);

};
