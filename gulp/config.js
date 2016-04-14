/**
 * Gulp configuration
 */

'use strict'

exports.paths = {};
exports.paths.root = __dirname + '/..';
exports.paths.app = exports.paths.root + '/src/app';
exports.paths.app_build = exports.paths.root + '/src/app/build';
exports.paths.tests = exports.paths.root + '/src/tests';

exports.sass = {
  watch_src: exports.paths.app + '/scss/**/*.scss',
  src: exports.paths.app + '/scss/app.scss',
  dest: exports.paths.app_build
};

exports.compileScripts = {
  src: exports.paths.app + '/js/app.js',
  dest: exports.paths.app_build + '/build.js'
};

exports.templates = {
  src: [
    exports.paths.app + '/**/*.html', '!/**/jspm_packages/**/',
    '!' + exports.paths.app_build + '/**',
    '!' + exports.paths.app + '/index.html'
  ],
  options: {
    filename: '_templates.js',
    standalone: true
  },
  dest: exports.paths.app + '/js'
};