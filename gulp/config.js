/**
 * Gulp configuration
 */

var path = require('path');

exports.paths = {};
exports.paths.root = __dirname + '/..';
exports.paths.app = exports.paths.root + '/src';
exports.paths.app_build = exports.paths.root + '/src/build';
exports.paths.tests = exports.paths.root + '/src/app/**/*.spec.js';
exports.paths.blankTemplates = __dirname + '/generators';
exports.paths.shadersFolder = exports.paths.app + '/app/imgproc/shaders';
exports.paths.karmaConfigFile = exports.paths.root + '/karma.conf.js';

exports.sass = {
  watch_src: exports.paths.app + '/**/*.scss',
  src: exports.paths.app + '/app/app.scss',
  routes_src: [
    exports.paths.app + '/**/*.scss',
    '!' + exports.paths.app + '/app/app.scss',
  ],
  dest: exports.paths.app_build
};

exports.js = {
  watch_src: exports.paths.app + '/**/*.js',
  src: exports.paths.app + '/app/app.js',
  dest: exports.paths.app_build + '/build.js'
};

exports.shaders = {
  src: [ exports.paths.shadersFolder + '/*.fs', exports.paths.shadersFolder + '/*.vs' ],
  watch_src: [ exports.paths.shadersFolder + '/*.fs', exports.paths.shadersFolder + '/*.vs', exports.paths.shadersFolder + '/*.glsl' ],
  dest: exports.paths.app + '/app/imgproc'
};

exports.html = {
  watch_src: exports.paths.app + '/**/*.html'
};

exports.resolveTo = function (resolvePath) {
  return function (glob) {
    glob = glob || '';
    return path.resolve(path.join(exports.paths.root, resolvePath, glob));
  };
};

exports.doc = {
  jsdoc : {
    opts: {
      destination: exports.paths.root + "/docs"
    }
  },
  src : [
    'README.md',
    exports.paths.app + '/app/**/*.js',
    '!' + exports.paths.app + '/app/vendor/**/*.*',
  ]
};

exports.resolveToComponents = exports.resolveTo('src/app/components');
