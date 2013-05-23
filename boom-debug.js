/** @license Boom.js v6.0.1 , a javascript loader and manager | Any License You Want */

// for debug
void function(win, doc) {
	if (win.console && win.console.group) {
		return;
	}
	var methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 
					'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'count', 
					'trace', 'profile', 'profileEnd'];
	var method;
	var i = 0;
	var noop = function() {};
	var console = {};
	var oldConsole = win.console || {};
	for (; i < methods.length; i++) {
		method = methods[i]
		console[method] = typeof oldConsole[method] == 'function' ? oldConsole[method] : noop;
	}
	win.console = console;

	// fake console.group and console.log for ie
	var mlist = [];
	var pageloaded = false;
	var consoleLayerId = '_IE_FAKE_CONSOLE_'

	console.log = function(msg) {
		var p;
		if (! pageloaded) {
			mlist.push(msg);
		} else {
			p = doc.createElement('p');
			p.innerHTML = msg;
			doc.getElementById(consoleLayerId).appendChild(p);
		}
	};
	console.groupCollapsed = function(msg) {
		msg = '------------------' + msg + '--------------------';
		console.log(msg);
	};
	win.attachEvent('onload', function() {
		var div = doc.createElement('div');
		var body = doc.getElementsByTagName('body')[0];
		pageloaded = true;
		div.innerHTML = mlist.join('');
		div.id = consoleLayerId;
		body.insertBefore(div, body.firstChild);
	});

}(window, document);
// for debug end


;(function(win, doc) {

var LOADING = 1;
var LOADED = 2;

// closure-module: 
// It's a piece of code isolation by closure that created by Boom.use method.
// 
// This object contains some information about closure-module's name, 
// factory function and required modules. e.g.
// {
// 		"name": "closure-module's name",
// 		"fn": "factory function",
// 		"details": {
// 			"requires": ["dependence module"]
// 		}
// }
var closureModule = {};

// file-module:
// File-module is a file that is not load and execute yet.
// Normally, a file-module contains one or mutiple closure-module.
// But in sometimes it does't contain any closure-module, e.g.
// a jQuery file or other third party library.
// If a file-module contains only one closure-module and the closure-module's name 
// is the same as file-module's name (normally, the file name), 
// the closure-module will be executed automatically after file-module loaded,
// if you use a file-module.
// 
// This object holds file-module object that contains file-module's path, 
// closure-module that it contained, and required modules.
// In fact, file-module object is not necessary. In other word, 
// you can use a file-module by a url directly, so you don't need use Boom.add method
// to create a file-module object then use it.
// 
// normally, a file-module object like this:
// {
// 		"path": "project/girl.js",
// 		"mods": ["girl.kiss", "girl.strip"],
// 		"requires": ["dependence modules"]
// }
var fileModule = {};

// file object holder, the key is file-module's name or just it's url
var files = {};

// thread object holder
// Each time call Boom.use, a thread object will be create.
// It contains information about thread id, modules that needs
// and so on.
var threads = {};
var config = {
	'timeout': 12000,
	'base': '',
	'fail': function(filename, url) {}
}

// the boom.js tag
// If you load boom.js by other loader, the tag will be incorrect.
// @see https://developer.mozilla.org/en-US/docs/Web/API/document.currentScript
// @see http://msdn.microsoft.com/en-us/library/ie/ms534359(v=vs.85).aspx
var jsSelf = function() {
	var scripts = doc.getElementsByTagName('script');
	return scripts[scripts.length - 1];
}();

// Global variable that refer to Boom.
var symbol = jsSelf.getAttribute('data-symbol') || 'Boom';

// @see http://labjs.com/documentation.php
// @see http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
// @see http://hsivonen.iki.fi/script-execution/
var ordered = doc.createElement('script').async === true;
var rPath = /.+?\.(js|css)(?:\?.*)?$/
var rFullpath = /^(\/|http)/;


var now = + new Date();

var isObject = function(obj) {
	return obj && Object.prototype.toString.call(obj) == '[object Object]'; 
};

var each = function(ar, fn) {
	var i = 0;
	var len = ar.length;
	for (; i<len; i++) {
		fn(ar[i], i);
	}
};

// from YUI3
var mix = function(r, s, ov, wl, merge) {
    var i, l, p;

    if (wl && wl.length) {
        for (i = 0, l = wl.length; i < l; ++i) {
            p = wl[i];
            if (s.hasOwnProperty(p)) {
                if (merge && isObject(r[p])) {
                    mix(r[p], s[p]);
                } else if (ov || !(p in r)) {
                    r[p] = s[p];
                }            
            }
        }
    } else {
        for (i in s) {
            if (s.hasOwnProperty(i)) {
                if (merge && isObject(r[i])) {
                    mix(r[i], s[i], ov, wl, true);
                } else if (ov || !(i in r)) {
                    r[i] = s[i];
                }
            }
        }
    }
    return r;
};

var isFileModule = function(name) {
	return (fileModule[name] || rPath.test(name)) && ! closureModule[name];
};

var fileModuleIsLoaded = function(name) {
	var filemodule = fileModule[name];
	var src = filemodule ? filemodule.path : name;
	var fileobj = files[src];
	
	return !!(fileobj && fileobj.s === LOADED);
}

var searchInFileModule = function(modName) {
	var meta = fileModule;
	var f;
	var mods;
	var i;

	for (f in meta) {
		mods = meta[f].mods || [];
		for (i = 0; i < mods.length; i++) {
			if (mods[i] == modName) {
				return f;
			}
		}
	}
	return false;
};

// Load files parallelly.
var loadRow = function(list, callback) {
	var flag = list.length;
	var file;
	var cb = function() {
		if (-- flag <= 0) {
			callback && callback();
			callback = cb = null;
		}
	};

	// If list is empty , just invoke callback function.
	if (flag == 0) {
		return cb();
	}

	while (file = list.shift()) {
		loadFile(file, cb);
	}
};

// Load files one by one.
var loadColumn = function(list, callback) {
	var cb = function() {
		if (list.length == 0) {
			callback && callback();
			callback = cb = null;
		} else {
			loadFile(list.shift(), cb);
		}
	}
	cb();
}

var loadRowColumn = function(row, column, callback) {
	var row_result = false;
	var column_result = false;
	var complete = function() {
		if (row_result && column_result && callback) {
			callback();
			complete = callback = null;
		}
	}

	loadRow(row, function() {
		row_result = true;
		complete()
	});
	loadColumn(column, function() {
		column_result = true;
		complete();
	});
};

var loadFile = function(name, callback) {
	var metaFile = fileModule;
	var src = metaFile[name] ? metaFile[name].path : name;
	var type = rPath.exec(src)[1] == 'css' ? 'css' : 'js';
	var file = files[src];
	var node;

	// Shorter properties h:handler,s:status
	if (! file) {
		file = files[src] = {
			h: [callback], 
			s: 0
		};
	}

	// http://www.phpied.com/when-is-a-stylesheet-really-loaded/
	// http://lifesinger.org/lab/2011/load-js-css/
	if (type == 'css') {
		node = doc.createElement('link');
		node.href = src;
		node.rel = 'stylesheet';
		jsSelf.parentNode.insertBefore(node, jsSelf);
		callback && callback()
		file.s = LOADED;
		return;
	}

	if (file.s == LOADED) {
		callback && callback(name);
		return;
	}

	if (file.s == LOADING) {
		callback && file.h.push(callback);
		return;
	}

	node = doc.createElement('script');
	node.async = false;
	node.src = src;

	file.t = win.setTimeout(function() {
		config.fail(name, src);
	}, config.timeout);

	node.onload = node.onreadystatechange = function() {
		// When the script's readyState is loaded in IE 10 , it has been downloaded 
		// but has not executed yet.
		// @see https://github.com/headjs/headjs/pull/191
		if (!this.readyState || (ordered ? this.readyState == 'complete' :  
				this.readyState == 'loaded' || this.readyState == 'complete')) {
			console.log('Loaded : ' + src);

			var handler = file.h;
			var fn;
			win.clearTimeout(file.t);
			file.s = LOADED;

			while (handler.length > 0) {
				fn = handler.shift();
				fn && fn(name);
			}

			// http://www.phpied.com/async-javascript-callbacks/
			this.onload = this.onreadystatechange = null;
			this.parentNode.removeChild(this);
		}
	};

	jsSelf.parentNode.insertBefore(node, jsSelf);
	file.s = LOADING;
};

var processThread = function(thread, fromLoader) {
	// for debug
	if (fromLoader) {
		console.groupEnd();
	}
	console.groupCollapsed('Process Thread : ' + thread.id);
	// for debug end
	var loadList = thread.f;
	var lost = thread.lost;
	var list = fromLoader ? lost : thread.mods;
	var mods = closureModule;
	var processed = {};

	var process = function(modName) {
		var mod;
		var file;
		var requires;

		if (!modName || processed[modName]) {
			return;
		}

		processed[modName] = true;

		// It's a file-module
		if (isFileModule(modName)) {
			if (!fileModuleIsLoaded(modName)) {
				loadList.push(modName);
				lost.push(modName);					
			}

		// It's a closure-module that wat not loaded yet.
		} else if (!(mod = mods[modName])) {
			file = searchInFileModule(modName);

			// The closure-module was not found, or the corrsponding 
			// file-module not contain it.
			if (!file || fileModuleIsLoaded(file)) {
				throw new Error('Can\'t found the moudle : ' + modName);
			}

			lost.push(modName);
			if (!processed[file]) {
				loadList.push(file);
				processed[file] = true;
			}

		// closure-module was loaded and had requirement.
		} else if (requires = mod.details.requires) {
			each(requires, process);
		}
	};

	each(list, process);

	if (loadList.length > 0) {
		console.log('LoadList : ' + loadList);
		loadThread(thread);

	} else {
		console.log('>>>>>loadList loaded ! attache ' + thread.id);
		attachModule(thread);
		console.groupEnd();
	}
};

var loadThread = function(thread) {
	var list = fileModuleDependence(thread.f);
	var col = [];
	var row = [];

	if (ordered) {
		row = list;

	} else {
		each(list, function(item, index) {
			var file = fileModule[item];

			// File-module that contains mod attribute should not "execute"
			// when loaded, So it dones't depend other module. 
			if (file && file.mods) {
				row.push(item)

			} else {
				col.push(item);
			}
		});
	}

	console.log('row: ' + row);
	console.log('col: ' + col);
	loadRowColumn(row, col, function() {
		thread.f = [];
		processThread(thread, true);
	})
};

// Calculate depends for file-module
var fileModuleDependence = function(filelist) {
	var ret = [];
	var processed = {};
	var process = function(f) {
		var fobj;
		var requires;

		if (processed[f] || !isFileModule(f)) {
			return;
		}

		processed[f] = true;
		fobj = fileModule[f];

		if ( requires = (fobj && fobj.requires)) {
			each(requires, process);
		}
		ret.push(f);
	}
	
	each(filelist, process);
	return ret;
};

// When all relevant file-module was loaded, We can execute 
// closure-module if needed.
var attachModule = function(thread) {
	var context = thread.cx;
	var callback = thread.cb;
	var ret = [];
	var mods = closureModule;
	var processed = {};

	var process = function(n) {
		var mod;
		if (processed[mod]) {
			return;
		}
		processed[n] = true;
		mod = mods[n];

		if (mod && mod.details.requires) {
			each(mod.details.requires, process);
		}
		mod && !isFileModule(n) && ret.push(n);
	};

	each(thread.mods, process);
	console.log('>>>>>attach ' + thread.id + ' : ' + ret.join())
	context._attach(ret);
	callback && callback(context);
	delete threads[thread.id];
};

// Add a file-module object when it contains some closure-module.
// Thus, when you use a closure-module that not loaded, we will know
// which file-module contained it.
// In fact, you don't need add file-module object manually, because 
// the builder tools will add it automailly.
// Otherwise you can use file-module by a url directly.
var addFileModule = function(name, info) {
	var p;
	var path;

	if (isObject(name)) {
		for (p in name) {
			addFileModule(p, name[p]);
		}

	} else {
		path = info.path;
		info.path = rFullpath.test(path) ? path : config.base + path;
		fileModule[name] = info;
	}
};

var addClosureModule = function(name, fn, details) {
	closureModule[name] = {
		name: name, 
		fn: fn,
		details: details || {}
	}
}

// --- Class Boom ---

var Boom = function() {
	if (! (this instanceof Boom)) {
		return new Boom();
	}
	this._init();
}

var bproto = {
	_init: function() {
		Boom.Env = Boom.Env || {
			attached: {},
			mods: closureModule,
			rmods: fileModule,
			thread: threads,
			config: config
		}
		this.Env = this.Env || {
			attached: {}
		}
	},

	// generate uniqute id
	guid: function() {
		return (++ now).toString(36);
	},

	// add file-module or closure-module
	add: function() {
		var args = [].slice.call(arguments, 0);

		if (args.length == 1 && isObject(args[0])) {
			addFileModule(args[0]);

		} else if (typeof args[1] == 'function') {
			addClosureModule.apply(this, args);

		} else {
			addFileModule.apply(this, args);
		}
	},
	
	// Load module by url parallelly, but can't ensure
	// executed in order.
	load: function() {
		var ar = [].slice.call(arguments, 0);
		loadRow(ar);
		return this;
	},

	use: function() {
		var args = [].slice.call(arguments, 0);
		var len = args.length;
		var threadId = this.guid();
		var callback;
		var thread

		callback = typeof args[len-1] == 'function' ? args.pop() : null;
		thread = threads[threadId] = {
			id: threadId,
			cb: callback,
			mods: args,
			lost: [],
			f: [],
			cx: this
		};
		processThread(thread);
	},

	_attach: function(ar) {
		var mods = closureModule;
		var attached = this.Env.attached;
		var i = 0;
		var mod;
		var result;

		for(; mod = ar[i]; i++) {
			if (attached[mod]) {
				continue;
			}
			if (result = mods[mod].fn(this)) {
				this.register(mod, result);
			}
			attached[mod] = true;
		}
	},
	
	// register a namespace on Boom object.
	register: function(ns, value) {
		var obj = this;
		var path = ns.split('.');
		var i = 0;
		var len = path.length;
		var p;

		for (; i < len; i++) {
			p = path[i];
			if (i == len - 1) {
				if (obj[p]) {
					throw 'register has failed[' + ns + ']'
				}
				obj[p] = value;
			} else {
				obj[p] = obj[p] || {};
				obj = obj[p];				
			}
		}
		return obj;
	},

	config: function(key, value) {
		if (isObject(key)) {
			mix(config, key, true);
			
		} else if(value) {
			config[key] = value;
			
		} else {
			return config[key];
		}
	},

	//for debug
	oldBrowser: function() {
		ordered = false;
	},
	//for debug end
	mix: mix
};

Boom.prototype = bproto;
mix(Boom, bproto);
Boom._init();

if (!win[symbol]) {
	win[symbol] = win.CN6 = Boom;
}

})(window, document)

