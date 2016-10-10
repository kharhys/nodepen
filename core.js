'use strict';


// deBouncer by hnldesign.nl
// based on code by Paul Irish and the original debouncing function from John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
var debounce = function (func, threshold, execAsap) {
    var timeout;
    return function debounced () {
        var obj = this, args = arguments;
        function delayed () {
            if (!execAsap)
                func.apply(obj, args);
            timeout = null;
        }
        if (timeout)
            clearTimeout(timeout);
        else if (execAsap)
            func.apply(obj, args);
        timeout = setTimeout(delayed, threshold || interval);
    };
};


function render(markup, stylesheet, script) {
  var doc = function doc(markup, stylesheet, script) {
    return "\n  <!doctype html>\n  " + markup + "\n  <style> "
      + stylesheet + " </style>\n  <script> " + script + " </script>\n";
  };
  var page = doc(markup, stylesheet, script)
  var blob = new Blob([page], {type: "text/html"});
  var blob_url = URL.createObjectURL(blob);
  var blob_iframe = document.querySelector('#preview-panel');

  blob_iframe.src = blob_url;
}

function cache(filename, content) {
  globalCache.set(filename, content)
}

function save(filename, content) {
  var fs = require('fs')
  var writeFile = function() {
    cache(filename, content)
    fs.writeFile(filename, content, function(err) {
      if (err) return console.log(err)
      console.log('saved successfully ', filename);
    })
  }
  fs.stat('/', function (err, stats) {
    if (err)  {
      fs.mkdir('/', function (err, res) {
        if (err) return console.log(err)
        else writeFile()
      })
    }
    else writeFile()
  });
}

function read(filename, cb) {
  var fs = require('fs')
  fs.readFile(filename, function(err, content) {
    if (err) return console.error(err)
    else cb(content.toString())
  })
}


// building
boot().catch(function (err) {
  return console.error(err);
}).then(function (res) {
  var fs = require('fs');
  globalCache.set('fs', fs);
  globalCache.get('fs').stat('/', function (err, stats) {
    console.log('fetch deps + int fs', Gator);
  });

  // let bundle = bundler()
  // bundle()
});

// bloocks
function boot() {

  // building
  return fetchDeps()//.then(initFileSystem);

  /* blocks */

  // Installs globals onto window:
  function initFileSystem() {
    return new Promise(function (resolve, reject) {
      BrowserFS.install(window);
      // Constructs an instance of the LocalStorage-backed file system.
      var lsfs = new BrowserFS.FileSystem.LocalStorage();
      // Initialize it as the root file system.
      BrowserFS.initialize(lsfs);
      // Attaches global reference onto window
      window.fs = BrowserFS;
      var fs = require('fs');
      fs.stat('/', function (err, stats) {
        if (!err) resolve(BrowserFS);else {
          fs.mkdir('/', function (err, res) {
            if (err) reject(err);else resolve(BrowserFS);
          });
        }
      });
    });
  }

  function fetchDeps() {
    return new Promise(function (resolve, reject) {
      var deps = [
        'https://unpkg.com/gator@1.2.4',
        'https://wzrd.in/standalone/micro-promisify',
        'https://unpkg.com/rollup/dist/rollup.browser.js'
      ];
      var loadScript = function loadScript(src) {
        return new Promise(function (resolve, reject) {
          var script = document.createElement('script');
          script.onload = resolve;
          script.onerror = reject;
          script.src = src;
          document.querySelector('head').appendChild(script);
        });
      };

      var dependencies = deps.map(loadScript);
      Promise.all(dependencies).then(resolve).catch(reject);
      // console.log()
    });
  }
}

function bundler() {

  var moduleById = {
    main_js: {
      name: 'main',
      code: 'import log from "./dep.js"; //log()'
    },
    dep_js: {
      name: 'dep',
      code: 'export default function log () { console.log("not just some string"); }'
    }
  };
  var supported = !!window.Promise && !!window.Map && !!window.Set;
  // if (supported) console.log(`${rollup.VERSION}`)

  var path = function path() {
    var relativePath = /^\.?\.\//;
    var absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|\/])/;

    var isAbsolute = function isAbsolute(path) {
      return absolutePath.test(path);
    };
    var isRelative = function isRelative(path) {
      return relativePath.test(path);
    };
    var basename = function basename(path) {
      return path.split(/(\/|\\)/).pop();
    };

    var dirname = function dirname(path) {
      var match = /(\/|\\)[^\/\\]*$/.exec(path);
      if (!match) return '.';
      var dir = path.slice(0, -match[0].length);
      return dir ? dir : '/';
    };

    var extname = function extname(path) {
      var match = /\.[^\.]+$/.exec(basename(path));
      if (!match) return '';
      return match[0];
    };

    var relative = function relative(from, to) {
      var toParts = to.split(/[\/\\]/).filter(Boolean);
      var fromParts = from.split(/[\/\\]/).filter(Boolean);

      while (fromParts[0] && toParts[0] && fromParts[0] === toParts[0]) {
        fromParts.shift();
        toParts.shift();
      }

      while (toParts[0] === '.' || toParts[0] === '..') {
        var toPart = toParts.shift();
        if (toPart === '..') fromParts.pop();
      }

      while (fromParts.pop()) {
        toParts.unshift('..');
      }

      return toParts.join('/');
    };

    var resolve = function resolve() {
      for (var _len = arguments.length, paths = Array(_len), _key = 0; _key < _len; _key++) {
        paths[_key] = arguments[_key];
      }

      var resolvedParts = paths.shift().split(/[\/\\]/);
      paths.forEach(function (path) {
        if (isAbsolute(path)) {
          resolvedParts = path.split(/[\/\\]/);
        } else {
          var parts = path.split(/[\/\\]/);
          while (parts[0] === '.' || parts[0] === '..') {
            var part = parts.shift();
            if (part === '..') {
              resolvedParts.pop();
            }
          }
          resolvedParts.push.apply(resolvedParts, parts);
        }
      });
      return resolvedParts.join('/');
    };

    return {
      basename: basename,
      resolve: resolve,
      dirname: dirname
    };
  };

  var bundle = function bundle() {
    var _path = path();

    var resolve = _path.resolve;
    var basename = _path.basename;
    var dirname = _path.dirname;


    var resolveId = function resolveId(importee, importer) {

      if (!importer) return importee;
      if (importee[0] !== '.') return false;

      var resolved = resolve(dirname(importer), importee).replace(/^\.\//, '');
      console.log("importer, importee", importer, importee, resolved.split('.').join('_'));
      if (resolved.split('.').join('_') in moduleById) return resolved;

      // resolved += '.js'
      // if ( resolved in moduleById ) return resolved

      throw new Error('Could not resolve \'' + importee + '\' from \'' + importer + '\'');
    };

    var load = function load(asset) {
      var id = basename(asset).split('.').join('_');
      console.log('asset', asset);
      return moduleById[id].code;
    };

    rollup.rollup({
      entry: './main.js',
      plugins: [{ resolveId: resolveId, load: load }]
    }).then(function (bundle) {
      var generated = bundle.generate({});
      console.log(generated);
    }).catch(function (error) {
      setTimeout(function () {
        throw error;
      });
    }).then(function () {
      return console.log('rolled up', moduleById);
    });

    // console.log(moduleById) return function() { return eval(js); }.call(context);
  };

  return bundle;
}

function PackageManager() {

  function load(src) {
    var successful = function successful(request) {
      return {
        src: request.responseURL,
        tag: request.responseURL.split('@')[1],
        name: request.responseURL.split('@')[0].split('/').pop(),
        code: request.responseText
      };
    };
    var failed = function failed(request) {
      return {
        status: request.status,
        description: request.statusText
      };
    };
    return new Promise(function (resolve, reject) {
      var req = new XMLHttpRequest();
      // req.open('GET', 'https://unpkg.com/' + src)
      req.open('GET', 'https://wzrd.in/standalone/' + src);
      req.onloadend = function () {
        return req.status === 200 ? resolve(successful(req)) : reject(failed(req));
      };
      req.send();
    });
  }

  var evaluateInContext = function evaluateInContext(code, context) {
    return function () {
      return eval(code);
    }.call(context);
  };

  function evaluate(module) {
    var code = module.code;

    var shimScript = function shimScript(script) {
      return "var exports = this; var module = this;" + script;
    };
    return new Promise(function (resolve, reject) {
      try {

        var context = {
          module: {},
          env: new UAParser().getResult()
        };
        evaluateInContext(shimScript(code), context);
        resolve(Object.assign(module, { runtime: context }));
      } catch (err) {
        reject(err);
      }
    });
  }

  function expose(module) {
    return new Promise(function (resolve, reject) {
      window[module.name] = module.runtime.exports;
      resolve(module);
    });
  }

  function require(src) {
    return load(src).then(function (module) {
      return evaluate(module);
    }).then(function (module) {
      return expose(module);
    });
  }
  return { require: require, evaluateInContext: evaluateInContext };
}

function getLost() {
  PackageManager().require('lost').then(function (e) {
    var css = '.two-elements {lost-column: 1/3;}';
    postcss([lost]).process(css).then(function (res) {
        console.log('postcss done', res.css);
      });
  });
}

PackageManager().require('postcss').then(function (res) {
  console.log("res", res);
  // getLost();
}).catch(function (err) {
  return console.error(err);
});
