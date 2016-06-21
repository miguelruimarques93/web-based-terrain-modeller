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
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.12"
    },
    "packages": {
      "npm:babel-runtime@5.8.38": {
        "map": {}
      },
      "npm:core-js@1.2.6": {
        "map": {
          "systemjs-json": "github:systemjs/plugin-json@0.1.2"
        }
      }
    }
  },
  transpiler: "plugin-babel",
  babelOptions: {
    "optional": [
      "runtime",
      "optimisation.modules.system"
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
