SystemJS.config({
  paths: {
    "npm:": "app/vendor/jspm_packages/npm/",
    "github:": "app/vendor/jspm_packages/github/",
    "local:": "app/vendor/jspm_packages/local/"
  },
  browserConfig: {
    "paths": {
      "web-based-terrain-modeller/": "/app/"
    }
  },
  nodeConfig: {
    "paths": {
      "web-based-terrain-modeller/": "app/"
    }
  },
  devConfig: {
    "map": {
      "babel-runtime": "npm:babel-runtime@5.8.38",
      "core-js": "npm:core-js@1.2.6",
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.12",
      "es2015": "npm:babel-preset-es2015@6.9.0",
      "module": "github:jspm/nodelibs-module@0.2.0-alpha",
      "http": "github:jspm/nodelibs-http@0.2.0-alpha",
      "url": "github:jspm/nodelibs-url@0.2.0-alpha",
      "syntax-decorators": "npm:babel-plugin-syntax-decorators@6.8.0",
      "ng-annotate": "npm:babel-plugin-ng-annotate@0.3.2",
      "ng-inject": "npm:babel-plugin-ng-inject@1.0.0"
    },
    "packages": {
      "npm:babel-runtime@5.8.38": {
        "map": {}
      },
      "npm:core-js@1.2.6": {
        "map": {
          "systemjs-json": "github:systemjs/plugin-json@0.1.2"
        }
      },
      "npm:babel-preset-es2015@6.9.0": {
        "map": {
          "babel-plugin-transform-es2015-literals": "npm:babel-plugin-transform-es2015-literals@6.8.0",
          "babel-plugin-transform-es2015-function-name": "npm:babel-plugin-transform-es2015-function-name@6.9.0",
          "babel-plugin-transform-es2015-arrow-functions": "npm:babel-plugin-transform-es2015-arrow-functions@6.8.0",
          "babel-plugin-transform-es2015-block-scoped-functions": "npm:babel-plugin-transform-es2015-block-scoped-functions@6.8.0",
          "babel-plugin-transform-es2015-template-literals": "npm:babel-plugin-transform-es2015-template-literals@6.8.0",
          "babel-plugin-transform-es2015-duplicate-keys": "npm:babel-plugin-transform-es2015-duplicate-keys@6.8.0",
          "babel-plugin-transform-es2015-shorthand-properties": "npm:babel-plugin-transform-es2015-shorthand-properties@6.8.0",
          "babel-plugin-transform-es2015-computed-properties": "npm:babel-plugin-transform-es2015-computed-properties@6.8.0",
          "babel-plugin-transform-es2015-object-super": "npm:babel-plugin-transform-es2015-object-super@6.8.0",
          "babel-plugin-transform-es2015-for-of": "npm:babel-plugin-transform-es2015-for-of@6.8.0",
          "babel-plugin-transform-es2015-sticky-regex": "npm:babel-plugin-transform-es2015-sticky-regex@6.8.0",
          "babel-plugin-transform-es2015-spread": "npm:babel-plugin-transform-es2015-spread@6.8.0",
          "babel-plugin-transform-es2015-classes": "npm:babel-plugin-transform-es2015-classes@6.9.0",
          "babel-plugin-transform-es2015-destructuring": "npm:babel-plugin-transform-es2015-destructuring@6.9.0",
          "babel-plugin-transform-es2015-unicode-regex": "npm:babel-plugin-transform-es2015-unicode-regex@6.8.0",
          "babel-plugin-check-es2015-constants": "npm:babel-plugin-check-es2015-constants@6.8.0",
          "babel-plugin-transform-es2015-parameters": "npm:babel-plugin-transform-es2015-parameters@6.9.0",
          "babel-plugin-transform-es2015-typeof-symbol": "npm:babel-plugin-transform-es2015-typeof-symbol@6.8.0",
          "babel-plugin-transform-es2015-block-scoping": "npm:babel-plugin-transform-es2015-block-scoping@6.10.1",
          "babel-plugin-transform-es2015-modules-commonjs": "npm:babel-plugin-transform-es2015-modules-commonjs@6.10.3",
          "babel-plugin-transform-regenerator": "npm:babel-plugin-transform-regenerator@6.9.0"
        }
      },
      "npm:babel-plugin-transform-regenerator@6.9.0": {
        "map": {
          "babel-plugin-transform-es2015-block-scoping": "npm:babel-plugin-transform-es2015-block-scoping@6.10.1",
          "babel-plugin-transform-es2015-for-of": "npm:babel-plugin-transform-es2015-for-of@6.8.0",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "private": "npm:private@0.1.6",
          "babel-plugin-syntax-async-functions": "npm:babel-plugin-syntax-async-functions@6.8.0",
          "babylon": "npm:babylon@6.8.1",
          "babel-core": "npm:babel-core@6.9.1",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-function-name@6.9.0": {
        "map": {
          "babel-helper-function-name": "npm:babel-helper-function-name@6.8.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-classes@6.9.0": {
        "map": {
          "babel-helper-function-name": "npm:babel-helper-function-name@6.8.0",
          "babel-helper-replace-supers": "npm:babel-helper-replace-supers@6.8.0",
          "babel-helper-optimise-call-expression": "npm:babel-helper-optimise-call-expression@6.8.0",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-template": "npm:babel-template@6.9.0",
          "babel-helper-define-map": "npm:babel-helper-define-map@6.9.0",
          "babel-messages": "npm:babel-messages@6.8.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-object-super@6.8.0": {
        "map": {
          "babel-helper-replace-supers": "npm:babel-helper-replace-supers@6.8.0",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-unicode-regex@6.8.0": {
        "map": {
          "babel-helper-regex": "npm:babel-helper-regex@6.9.0",
          "regexpu-core": "npm:regexpu-core@1.0.0",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-sticky-regex@6.8.0": {
        "map": {
          "babel-helper-regex": "npm:babel-helper-regex@6.9.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-parameters@6.9.0": {
        "map": {
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-template": "npm:babel-template@6.9.0",
          "babel-helper-call-delegate": "npm:babel-helper-call-delegate@6.8.0",
          "babel-helper-get-function-arity": "npm:babel-helper-get-function-arity@6.8.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-block-scoping@6.10.1": {
        "map": {
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-template": "npm:babel-template@6.9.0",
          "lodash": "npm:lodash@4.13.1",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-computed-properties@6.8.0": {
        "map": {
          "babel-template": "npm:babel-template@6.9.0",
          "babel-helper-define-map": "npm:babel-helper-define-map@6.9.0",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-modules-commonjs@6.10.3": {
        "map": {
          "babel-template": "npm:babel-template@6.9.0",
          "babel-plugin-transform-strict-mode": "npm:babel-plugin-transform-strict-mode@6.8.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-duplicate-keys@6.8.0": {
        "map": {
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-shorthand-properties@6.8.0": {
        "map": {
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-helper-regex@6.9.0": {
        "map": {
          "lodash": "npm:lodash@4.13.1",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-helper-function-name@6.8.0": {
        "map": {
          "babel-types": "npm:babel-types@6.10.2",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-helper-get-function-arity": "npm:babel-helper-get-function-arity@6.8.0",
          "babel-template": "npm:babel-template@6.9.0",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-helper-optimise-call-expression@6.8.0": {
        "map": {
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-helper-replace-supers@6.8.0": {
        "map": {
          "babel-helper-optimise-call-expression": "npm:babel-helper-optimise-call-expression@6.8.0",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-messages": "npm:babel-messages@6.8.0",
          "babel-template": "npm:babel-template@6.9.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-traverse@6.9.0": {
        "map": {
          "babel-messages": "npm:babel-messages@6.8.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babylon": "npm:babylon@6.8.1",
          "lodash": "npm:lodash@4.13.1",
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-code-frame": "npm:babel-code-frame@6.8.0",
          "invariant": "npm:invariant@2.2.1",
          "debug": "npm:debug@2.2.0",
          "globals": "npm:globals@8.18.0"
        }
      },
      "npm:babel-template@6.9.0": {
        "map": {
          "babylon": "npm:babylon@6.8.1",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-types": "npm:babel-types@6.10.2",
          "lodash": "npm:lodash@4.13.1",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-literals@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-block-scoped-functions@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-arrow-functions@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-template-literals@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-destructuring@6.9.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-spread@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-for-of@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-check-es2015-constants@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-es2015-typeof-symbol@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-helper-call-delegate@6.8.0": {
        "map": {
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-helper-hoist-variables": "npm:babel-helper-hoist-variables@6.8.0"
        }
      },
      "npm:babel-helper-get-function-arity@6.8.0": {
        "map": {
          "babel-types": "npm:babel-types@6.10.2",
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-transform-strict-mode@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-types": "npm:babel-types@6.10.2"
        }
      },
      "npm:babel-plugin-syntax-async-functions@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-core@6.9.1": {
        "map": {
          "babel-messages": "npm:babel-messages@6.8.0",
          "babel-template": "npm:babel-template@6.9.0",
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "babel-types": "npm:babel-types@6.10.2",
          "babylon": "npm:babylon@6.8.1",
          "lodash": "npm:lodash@4.13.1",
          "private": "npm:private@0.1.6",
          "babel-code-frame": "npm:babel-code-frame@6.8.0",
          "debug": "npm:debug@2.2.0",
          "babel-register": "npm:babel-register@6.9.0",
          "convert-source-map": "npm:convert-source-map@1.2.0",
          "path-exists": "npm:path-exists@1.0.0",
          "babel-generator": "npm:babel-generator@6.10.2",
          "babel-helpers": "npm:babel-helpers@6.8.0",
          "path-is-absolute": "npm:path-is-absolute@1.0.0",
          "shebang-regex": "npm:shebang-regex@1.0.0",
          "source-map": "npm:source-map@0.5.6",
          "json5": "npm:json5@0.4.0",
          "slash": "npm:slash@1.0.0",
          "minimatch": "npm:minimatch@2.0.10"
        }
      },
      "npm:babylon@6.8.1": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:regexpu-core@1.0.0": {
        "map": {
          "regjsparser": "npm:regjsparser@0.1.5",
          "regjsgen": "npm:regjsgen@0.2.0",
          "regenerate": "npm:regenerate@1.3.1"
        }
      },
      "npm:babel-helper-define-map@6.9.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "lodash": "npm:lodash@4.13.1",
          "babel-types": "npm:babel-types@6.10.2",
          "babel-helper-function-name": "npm:babel-helper-function-name@6.8.0"
        }
      },
      "npm:babel-types@6.10.2": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-traverse": "npm:babel-traverse@6.9.0",
          "lodash": "npm:lodash@4.13.1",
          "esutils": "npm:esutils@2.0.2",
          "to-fast-properties": "npm:to-fast-properties@1.0.2"
        }
      },
      "npm:babel-messages@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-runtime@6.9.2": {
        "map": {
          "regenerator-runtime": "npm:regenerator-runtime@0.9.5",
          "core-js": "npm:core-js@2.4.0"
        }
      },
      "npm:babel-code-frame@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "esutils": "npm:esutils@2.0.2",
          "chalk": "npm:chalk@1.1.3",
          "js-tokens": "npm:js-tokens@1.0.3"
        }
      },
      "npm:babel-helper-hoist-variables@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-types": "npm:babel-types@6.10.2"
        }
      },
      "npm:babel-generator@6.10.2": {
        "map": {
          "babel-messages": "npm:babel-messages@6.8.0",
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-types": "npm:babel-types@6.10.2",
          "source-map": "npm:source-map@0.5.6",
          "lodash": "npm:lodash@4.13.1",
          "detect-indent": "npm:detect-indent@3.0.1"
        }
      },
      "npm:babel-register@6.9.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "core-js": "npm:core-js@2.4.0",
          "lodash": "npm:lodash@4.13.1",
          "path-exists": "npm:path-exists@1.0.0",
          "babel-core": "npm:babel-core@6.9.1",
          "home-or-tmp": "npm:home-or-tmp@1.0.0",
          "mkdirp": "npm:mkdirp@0.5.1",
          "source-map-support": "npm:source-map-support@0.2.10"
        }
      },
      "npm:babel-helpers@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-template": "npm:babel-template@6.9.0"
        }
      },
      "npm:regjsparser@0.1.5": {
        "map": {
          "jsesc": "npm:jsesc@0.5.0"
        }
      },
      "npm:debug@2.2.0": {
        "map": {
          "ms": "npm:ms@0.7.1"
        }
      },
      "npm:invariant@2.2.1": {
        "map": {
          "loose-envify": "npm:loose-envify@1.2.0"
        }
      },
      "npm:minimatch@2.0.10": {
        "map": {
          "brace-expansion": "npm:brace-expansion@1.1.5"
        }
      },
      "npm:chalk@1.1.3": {
        "map": {
          "strip-ansi": "npm:strip-ansi@3.0.1",
          "ansi-styles": "npm:ansi-styles@2.2.1",
          "has-ansi": "npm:has-ansi@2.0.0",
          "supports-color": "npm:supports-color@2.0.0",
          "escape-string-regexp": "npm:escape-string-regexp@1.0.5"
        }
      },
      "npm:detect-indent@3.0.1": {
        "map": {
          "repeating": "npm:repeating@1.1.3",
          "get-stdin": "npm:get-stdin@4.0.1",
          "minimist": "npm:minimist@1.2.0"
        }
      },
      "npm:home-or-tmp@1.0.0": {
        "map": {
          "os-tmpdir": "npm:os-tmpdir@1.0.1",
          "user-home": "npm:user-home@1.1.1"
        }
      },
      "npm:loose-envify@1.2.0": {
        "map": {
          "js-tokens": "npm:js-tokens@1.0.3"
        }
      },
      "npm:mkdirp@0.5.1": {
        "map": {
          "minimist": "npm:minimist@0.0.8"
        }
      },
      "npm:source-map-support@0.2.10": {
        "map": {
          "source-map": "npm:source-map@0.1.32"
        }
      },
      "npm:brace-expansion@1.1.5": {
        "map": {
          "balanced-match": "npm:balanced-match@0.4.1",
          "concat-map": "npm:concat-map@0.0.1"
        }
      },
      "npm:strip-ansi@3.0.1": {
        "map": {
          "ansi-regex": "npm:ansi-regex@2.0.0"
        }
      },
      "npm:has-ansi@2.0.0": {
        "map": {
          "ansi-regex": "npm:ansi-regex@2.0.0"
        }
      },
      "npm:repeating@1.1.3": {
        "map": {
          "is-finite": "npm:is-finite@1.0.1"
        }
      },
      "npm:source-map@0.1.32": {
        "map": {
          "amdefine": "npm:amdefine@1.0.0"
        }
      },
      "npm:is-finite@1.0.1": {
        "map": {
          "number-is-nan": "npm:number-is-nan@1.0.0"
        }
      },
      "github:jspm/nodelibs-http@0.2.0-alpha": {
        "map": {
          "http-browserify": "npm:stream-http@2.3.0"
        }
      },
      "npm:stream-http@2.3.0": {
        "map": {
          "inherits": "npm:inherits@2.0.1",
          "readable-stream": "npm:readable-stream@2.1.4",
          "to-arraybuffer": "npm:to-arraybuffer@1.0.1",
          "builtin-status-codes": "npm:builtin-status-codes@2.0.0",
          "xtend": "npm:xtend@4.0.1"
        }
      },
      "github:jspm/nodelibs-url@0.2.0-alpha": {
        "map": {
          "url-browserify": "npm:url@0.11.0"
        }
      },
      "npm:url@0.11.0": {
        "map": {
          "punycode": "npm:punycode@1.3.2",
          "querystring": "npm:querystring@0.2.0"
        }
      },
      "npm:babel-plugin-syntax-decorators@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-ng-annotate@0.3.2": {
        "map": {
          "babel-plugin-syntax-decorators": "npm:babel-plugin-syntax-decorators@6.8.0",
          "babel-preset-es2015": "npm:babel-preset-es2015@6.9.0",
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-plugin-transform-class-properties": "npm:babel-plugin-transform-class-properties@6.10.2"
        }
      },
      "npm:babel-plugin-transform-class-properties@6.10.2": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2",
          "babel-plugin-syntax-class-properties": "npm:babel-plugin-syntax-class-properties@6.8.0"
        }
      },
      "npm:babel-plugin-syntax-class-properties@6.8.0": {
        "map": {
          "babel-runtime": "npm:babel-runtime@6.9.2"
        }
      },
      "npm:babel-plugin-ng-inject@1.0.0": {
        "map": {
          "lodash": "npm:lodash@4.13.1"
        }
      }
    }
  },
  transpiler: "plugin-babel",
  babelOptions: {
    "optional": [
      "runtime",
      "optimisation.modules.system"
    ],
    "plugins": [
      "syntax-decorators",
      "ng-annotate",
      "ng-inject"
    ]
  },
  map: {
    "babel": "npm:babel-core@5.8.38"
  },
  packages: {
    "web-based-terrain-modeller": {
      "main": "boot.js",
      "format": "esm"
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json",
    "local:*.json"
  ],
  map: {
    "fft.js": "local:fft.js@0.0.1",
    "noisejs": "local:noisejs@0.0.1",
    "three-trackball-controls": "local:three-trackball-controls@0.77.0",
    "angular": "github:angular/bower-angular@1.5.6",
    "angular-animate": "npm:angular-animate@1.5.6",
    "angular-aria": "npm:angular-aria@1.5.6",
    "angular-filereader": "github:matteosuppo/angular-filereader@1.0.4",
    "angular-leaflet-directive": "npm:angular-leaflet-directive@0.10.0",
    "angular-material": "npm:angular-material@1.0.8",
    "angular-messages": "github:angular/bower-angular-messages@1.5.6",
    "angular-mocks": "github:angular/bower-angular-mocks@1.5.6",
    "angular-ui-router": "github:angular-ui/ui-router@0.2.18",
    "assert": "github:jspm/nodelibs-assert@0.2.0-alpha",
    "buffer": "github:jspm/nodelibs-buffer@0.2.0-alpha",
    "child_process": "github:jspm/nodelibs-child_process@0.2.0-alpha",
    "constants": "github:jspm/nodelibs-constants@0.2.0-alpha",
    "crypto": "github:jspm/nodelibs-crypto@0.2.0-alpha",
    "d3": "npm:d3@3.5.17",
    "es6-error": "npm:es6-error@3.0.0",
    "events": "github:jspm/nodelibs-events@0.2.0-alpha",
    "fs": "github:jspm/nodelibs-fs@0.2.0-alpha",
    "jquery": "npm:jquery@2.2.4",
    "jsfeat": "github:inspirit/jsfeat@0.0.8",
    "jsverify": "npm:jsverify@0.7.1",
    "leaflet": "github:Leaflet/Leaflet@0.7.7",
    "material-design-icons-iconfont": "npm:material-design-icons-iconfont@2.0.5",
    "ng-file-upload": "npm:ng-file-upload@12.0.4",
    "path": "github:jspm/nodelibs-path@0.2.0-alpha",
    "process": "github:jspm/nodelibs-process@0.2.0-alpha",
    "scss": "github:mobilexag/plugin-sass@0.4.3",
    "stream": "github:jspm/nodelibs-stream@0.2.0-alpha",
    "string_decoder": "github:jspm/nodelibs-string_decoder@0.2.0-alpha",
    "text": "github:systemjs/plugin-text@0.0.8",
    "three": "github:mrdoob/three.js@r77",
    "three-orbit-controls": "github:deltaaskii/three-orbit-controls@master",
    "underscore": "npm:underscore@1.8.3",
    "util": "github:jspm/nodelibs-util@0.2.0-alpha",
    "vm": "github:jspm/nodelibs-vm@0.2.0-alpha"
  },
  packages: {
    "github:angular-ui/ui-router@0.2.18": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6"
      }
    },
    "github:angular/bower-angular-animate@1.5.6": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6"
      }
    },
    "github:angular/bower-angular-aria@1.5.6": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6"
      }
    },
    "github:angular/bower-angular-messages@1.5.6": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6"
      }
    },
    "github:angular/bower-angular-mocks@1.5.6": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6"
      }
    },
    "github:jspm/nodelibs-path@0.1.0": {
      "map": {
        "path-browserify": "npm:path-browserify@0.0.0"
      }
    },
    "github:jspm/nodelibs-url@0.1.0": {
      "map": {
        "url": "npm:url@0.10.3"
      }
    },
    "github:mobilexag/plugin-sass@0.4.3": {
      "map": {
        "autoprefixer": "npm:autoprefixer@6.3.6",
        "lodash": "npm:lodash@4.13.1",
        "postcss": "npm:postcss@5.0.21",
        "reqwest": "github:ded/reqwest@2.0.5",
        "sass.js": "npm:sass.js@0.9.10",
        "url": "github:jspm/nodelibs-url@0.1.0",
        "path": "github:jspm/nodelibs-path@0.1.0",
        "fs": "github:jspm/nodelibs-fs@0.1.2"
      }
    },
    "npm:angular-leaflet-directive@0.10.0": {
      "map": {
        "angular": "npm:angular@1.5.6",
        "leaflet": "npm:leaflet@0.7.7"
      }
    },
    "npm:angular-material@1.0.8": {
      "map": {
        "angular": "github:angular/bower-angular@1.5.6",
        "angular-animate": "github:angular/bower-angular-animate@1.5.6",
        "angular-aria": "github:angular/bower-angular-aria@1.5.6",
        "angular-messages": "github:angular/bower-angular-messages@1.5.6",
        "css": "github:systemjs/plugin-css@0.1.22"
      }
    },
    "npm:asn1.js@4.6.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "inherits": "npm:inherits@2.0.1",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:autoprefixer@6.3.6": {
      "map": {
        "browserslist": "npm:browserslist@1.3.1",
        "caniuse-db": "npm:caniuse-db@1.0.30000471",
        "normalize-range": "npm:normalize-range@0.1.2",
        "num2fraction": "npm:num2fraction@1.2.2",
        "postcss": "npm:postcss@5.0.21",
        "postcss-value-parser": "npm:postcss-value-parser@3.3.0",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:bn.js@4.11.3": {
      "map": {
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:browserify-aes@1.0.6": {
      "map": {
        "buffer-xor": "npm:buffer-xor@1.0.3",
        "cipher-base": "npm:cipher-base@1.0.2",
        "create-hash": "npm:create-hash@1.1.2",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "inherits": "npm:inherits@2.0.1",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:browserify-cipher@1.0.0": {
      "map": {
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "browserify-des": "npm:browserify-des@1.0.0",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0"
      }
    },
    "npm:browserify-des@1.0.0": {
      "map": {
        "cipher-base": "npm:cipher-base@1.0.2",
        "des.js": "npm:des.js@1.0.0",
        "inherits": "npm:inherits@2.0.1",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:browserify-rsa@4.0.1": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "randombytes": "npm:randombytes@2.0.3",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:browserify-sign@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "create-hash": "npm:create-hash@1.1.2",
        "create-hmac": "npm:create-hmac@1.1.4",
        "elliptic": "npm:elliptic@6.2.7",
        "inherits": "npm:inherits@2.0.1",
        "parse-asn1": "npm:parse-asn1@5.0.0"
      }
    },
    "npm:browserslist@1.3.1": {
      "map": {
        "caniuse-db": "npm:caniuse-db@1.0.30000471",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:buffer-xor@1.0.3": {
      "map": {
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:cipher-base@1.0.2": {
      "map": {
        "inherits": "npm:inherits@2.0.1",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:core-util-is@1.0.2": {
      "map": {}
    },
    "npm:create-ecdh@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "elliptic": "npm:elliptic@6.2.7"
      }
    },
    "npm:create-hash@1.1.2": {
      "map": {
        "cipher-base": "npm:cipher-base@1.0.2",
        "inherits": "npm:inherits@2.0.1",
        "ripemd160": "npm:ripemd160@1.0.1",
        "sha.js": "npm:sha.js@2.4.5"
      }
    },
    "npm:create-hmac@1.1.4": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2",
        "inherits": "npm:inherits@2.0.1"
      }
    },
    "npm:crypto-browserify@3.11.0": {
      "map": {
        "browserify-cipher": "npm:browserify-cipher@1.0.0",
        "browserify-sign": "npm:browserify-sign@4.0.0",
        "create-ecdh": "npm:create-ecdh@4.0.0",
        "create-hash": "npm:create-hash@1.1.2",
        "create-hmac": "npm:create-hmac@1.1.4",
        "diffie-hellman": "npm:diffie-hellman@5.0.2",
        "inherits": "npm:inherits@2.0.1",
        "pbkdf2": "npm:pbkdf2@3.0.4",
        "public-encrypt": "npm:public-encrypt@4.0.0",
        "randombytes": "npm:randombytes@2.0.3",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:des.js@1.0.0": {
      "map": {
        "inherits": "npm:inherits@2.0.1",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:diffie-hellman@5.0.2": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "miller-rabin": "npm:miller-rabin@4.0.0",
        "randombytes": "npm:randombytes@2.0.3",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:elliptic@6.2.7": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "brorand": "npm:brorand@1.0.5",
        "hash.js": "npm:hash.js@1.0.3",
        "inherits": "npm:inherits@2.0.1",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:evp_bytestokey@1.0.0": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:has-flag@1.0.0": {
      "map": {}
    },
    "npm:hash.js@1.0.3": {
      "map": {
        "inherits": "npm:inherits@2.0.1"
      }
    },
    "npm:inherits@2.0.1": {
      "map": {}
    },
    "npm:isarray@1.0.0": {
      "map": {
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:js-base64@2.1.9": {
      "map": {}
    },
    "npm:jsverify@0.7.1": {
      "map": {
        "lazy-seq": "npm:lazy-seq@1.0.0",
        "rc4": "npm:rc4@0.1.5",
        "trampa": "npm:trampa@1.0.0",
        "typify-parser": "npm:typify-parser@1.1.0"
      }
    },
    "npm:lazy-seq@1.0.0": {
      "map": {}
    },
    "npm:lodash@4.13.1": {
      "map": {}
    },
    "npm:material-design-icons-iconfont@2.0.5": {
      "map": {}
    },
    "npm:miller-rabin@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "brorand": "npm:brorand@1.0.5"
      }
    },
    "npm:ng-file-upload@12.0.4": {
      "map": {}
    },
    "npm:parse-asn1@5.0.0": {
      "map": {
        "asn1.js": "npm:asn1.js@4.6.0",
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "create-hash": "npm:create-hash@1.1.2",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "pbkdf2": "npm:pbkdf2@3.0.4",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:path-browserify@0.0.0": {
      "map": {}
    },
    "npm:pbkdf2@3.0.4": {
      "map": {
        "create-hmac": "npm:create-hmac@1.1.4",
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:postcss@5.0.21": {
      "map": {
        "js-base64": "npm:js-base64@2.1.9",
        "source-map": "npm:source-map@0.5.6",
        "supports-color": "npm:supports-color@3.1.2"
      }
    },
    "npm:public-encrypt@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.3",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "create-hash": "npm:create-hash@1.1.2",
        "parse-asn1": "npm:parse-asn1@5.0.0",
        "randombytes": "npm:randombytes@2.0.3"
      }
    },
    "npm:punycode@1.3.2": {
      "map": {}
    },
    "npm:randombytes@2.0.3": {
      "map": {
        "systemjs-json": "github:systemjs/plugin-json@0.1.2"
      }
    },
    "npm:ripemd160@1.0.1": {
      "map": {}
    },
    "npm:sass.js@0.9.10": {
      "map": {}
    },
    "npm:sha.js@2.4.5": {
      "map": {
        "inherits": "npm:inherits@2.0.1"
      }
    },
    "npm:source-map@0.5.6": {
      "map": {}
    },
    "npm:string_decoder@0.10.31": {
      "map": {}
    },
    "npm:supports-color@3.1.2": {
      "map": {
        "has-flag": "npm:has-flag@1.0.0"
      }
    },
    "npm:trampa@1.0.0": {
      "map": {}
    },
    "npm:url@0.10.3": {
      "map": {
        "punycode": "npm:punycode@1.3.2",
        "querystring": "npm:querystring@0.2.0"
      }
    },
    "github:jspm/nodelibs-buffer@0.2.0-alpha": {
      "map": {
        "buffer-browserify": "npm:buffer@4.6.0"
      }
    },
    "npm:buffer@4.6.0": {
      "map": {
        "ieee754": "npm:ieee754@1.1.6",
        "isarray": "npm:isarray@1.0.0",
        "base64-js": "npm:base64-js@1.1.2"
      }
    },
    "github:jspm/nodelibs-crypto@0.2.0-alpha": {
      "map": {
        "crypto-browserify": "npm:crypto-browserify@3.11.0"
      }
    },
    "github:jspm/nodelibs-string_decoder@0.2.0-alpha": {
      "map": {
        "string_decoder-browserify": "npm:string_decoder@0.10.31"
      }
    },
    "github:jspm/nodelibs-stream@0.2.0-alpha": {
      "map": {
        "stream-browserify": "npm:stream-browserify@2.0.1"
      }
    },
    "npm:stream-browserify@2.0.1": {
      "map": {
        "inherits": "npm:inherits@2.0.1",
        "readable-stream": "npm:readable-stream@2.1.4"
      }
    },
    "npm:readable-stream@2.1.4": {
      "map": {
        "core-util-is": "npm:core-util-is@1.0.2",
        "inherits": "npm:inherits@2.0.1",
        "isarray": "npm:isarray@1.0.0",
        "string_decoder": "npm:string_decoder@0.10.31",
        "util-deprecate": "npm:util-deprecate@1.0.2",
        "process-nextick-args": "npm:process-nextick-args@1.0.7",
        "buffer-shims": "npm:buffer-shims@1.0.0"
      }
    }
  }
});
