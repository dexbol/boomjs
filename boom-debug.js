/**@license Boom.js v5.1.2 , a javascript loader and manager | Any License You Want */

//for debug
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
	var oldConsole = win.console;
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
//for debug end


(function(win, doc) {

var LOADING = 1;
var LOADED = 2;

// local modules
// contains some information about name, factory function and requirement module
var _modules_ = {};

// remote modules is a file that not yet load and execute
// normally, a remote module contains one or mutiple local module
// remote module does't contain any local module sometimes. e.g.
// a jQuery file or other third party library.
// if a remote module contains only one local module and the local module's name 
// is as same as remote module's name, when you use the remote module , the local 
// module will be used automatically after remote module loaded.
var _remoteModules_ = {};

// files holder, the key is a file's src or remote module's name
var _files_ = {};

// thread object holder
var _thread_ = {};
var _config_ = {
	'timeout': 12000,
	'base': '',
	'debug': false,
	'util': [],
	'fail': function(filename, url) {}
}

// the boom.js tag , tech form Do.js v2
var jsSelf = function() {
	var scripts = doc.getElementsByTagName('script');
	return scripts[scripts.length - 1];
}();

// global variable that a reference to Boom
var symbol = jsSelf.getAttribute('data-symbol') || 'Boom';

// @see http://labjs.com/documentation.php
// @see http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
// @see http://hsivonen.iki.fi/script-execution/
var ordered = doc.createElement('script').async === true;
var rFiletype = /\.(\w+)(\?|$)/;
var rFullpath = /^(\/|http)/;
var rModuleName = /^(?:\w*?(?=\!)!?)?([-_\.\w]+)$/;

var isObject = function(obj) {
	return obj && Object.prototype.toString.call(obj) == '[object Object]'; 
}

var each = function(ar, fn) {
	var i = 0;
	var len = ar.length;
	for (; i<len; i++) {
		fn(ar[i], i);
	}
}

//the three functions followed from YUI3
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
}

var merge = function() {
    var a = arguments;
    var o = {};
    var i = 0;
    var l = a.length;

    for (; i<l; i++) {
        mix(o, a[i], true);
    }
    return o;
}

var extend = function(r, s, px, sx) {
	if (! s || ! r) {
		return r;
	}

	var OP = Object.prototype;
	var O = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	}
	var sp = s.prototype;
	var rp = O(sp);
	r.prototype = rp;
	rp.constructor = r;
	r.superclass = sp;

    // assign constructor property
    if (s !== Object && sp.constructor === OP.constructor) {
        sp.constructor = s;
    }

    // add prototype overrides
    if (px) {
        mix(rp, px, true);
    }

    // add object overrides
    if (sx) {
        mix(r, sx, true);
    }

    return r;
}

var isRemoteModule = function(name) {
	return (_remoteModules_[name] || rFiletype.test(name)) && ! _modules_[name];
}

var searchInRemoteModule = function(modName) {
	var meta = _remoteModules_;
	var f;
	var mods;
	var i;
	var len;

	for (f in meta) {
		mods = meta[f].mods || [];
		len = mods.length;
		for (i = 0; i < len; i++) {
			if (mods[i] == modName) {
				return f;
			}
		}
	}
	return false;
}

//load file parallelly
var loadRow = function(list, callback) {
	var flag = list.length;
	var file;
	var cb = function() {
		if (-- flag <= 0) {
			callback && callback();
			callback = cb = null;
		}
	};

	// if list is empty , just invoke callback function.
	if (flag == 0) {
		return cb();
	}

	while (file = list.shift()) {
		loadFile(file, cb);
	}
}

//load file one by one.
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
}

var loadFile = function(name, callback) {
	var metaFile = _remoteModules_;
	var src = metaFile[name] ? metaFile[name].path : name;
	var type = rFiletype.exec(src)[1] == 'css' ? 'css' : 'js';
	// because mutiple remote modules maybe had the same src attribute
	// so, we hold src and name both for avoid load duplicate files
	var file = _files_[src] || _files_[name];
	var node;

	//shorter property h:handler,s:status
	if (! file) {
		file = _files_[name] = _files_[src] = {
			h: [callback], 
			s: 0
		};
	}

	//http://www.phpied.com/when-is-a-stylesheet-really-loaded/
	//http://lifesinger.org/lab/2011/load-js-css/
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
		_config_.fail(name, src);
	}, _config_.timeout);

	node.onload = node.onreadystatechange = function() {
		if (! this.readyState || this.readyState == 'loaded' 
		  || this.readyState == 'complete') {
			console.log('Loaded : ' + name);

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
			! _config_.debug && this.parentNode.removeChild(this);
		}
	};

	jsSelf.parentNode.insertBefore(node, jsSelf);
	file.s = LOADING;
}

var processThread = function(thread, fromLoader) {
	//for debug
	if (fromLoader) {
		console.groupEnd();
	}
	console.groupCollapsed('Process Thread : ' + thread.id);
	//for debug end
	var loadList = thread.f;
	var count = thread.count;
	var lost = thread.lost;
	var list = fromLoader ? lost : thread.mods;
	var mods = _modules_;
	var processed = {};

	var process = function(modName) {
		var mod;
		var file;
		var requires;
		if (! modName || processed[modName]) {
			return;
		}

		console.log(modName);
		processed[modName] = true;

		if (isRemoteModule(modName)) {
			if (! (_files_[modName] && _files_[modName].s == LOADED)) {
				loadList.push(modName);
				lost.push(modName);				
			}

		} else if (! (mod = mods[modName])) {
			file = searchInRemoteModule(modName);
			if (!file || _files_[file] && _files_[file].s == LOADED) {
				throw new Error('Can\'t found the moudle : ' + modName);
			}
			lost.push(modName);
			if (! processed[file]) {
				loadList.push(file);
				processed[file] = true;
			}

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
	}
	console.groupEnd();
}

var loadThread = function(thread) {
	var list = remoteModuleDepend(thread.f);
	var col = [];
	var row = [];

	if (ordered) {
		row = list;

	} else {
		each(list, function(item, index) {
			var file = _remoteModules_[item];

			// remote module that contains mod attribute don't "execute"
			// when loaded, so it dones't depend other remote module yet. 
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
}

//calculate depends for remote module
var remoteModuleDepend = function(file) {
	var ret = [];
	var processed = {};

	var process = function(f) {
		var fobj;
		var requires;
		if (processed[f] || ! isRemoteModule(f)) {
			return;
		}
		processed[f] = true;
		fobj = _remoteModules_[f];
		if ( requires = (fobj && fobj.requires)) {
			each(requires, process);
		}
		ret.push(f);
	}
	
	each(file, process);
	return ret;
}

var attachModule = function(thread) {
	var context = thread.cx;
	var callback = thread.cb;
	var ret = [];
	var mods = _modules_;
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
		if (mod && ! isRemoteModule(n)) {
			ret.push(n);
		}
	};

	each(thread.mods, process);
	console.log('>>>>>attach ' + thread.id + ' : ' + ret.join())
	context._attach(ret);
	callback && callback(context);
	delete _thread_[thread.id];
}

var addRemoteModule = function(name, info) {
	var p;
	var path;

	if (isObject(name)) {
		for (p in name) {
			addRemoteModule(p, name[p]);
		}
		return;
	}
	path = info.path;
	info.path = rFullpath.test(path) ? path : _config_.base + path;
	_remoteModules_[name] = info;
}

var addModule = function(name, fn, details) {
	var oq;
	details = details || {};
	oq = details.requires || [];
	details.requires = _config_.util.concat(oq);
	//remove prefix
	name = name.replace(rModuleName, '$1');

	_modules_[name] = {
		name: name, 
		fn: fn,
		details: details
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
			cidx: + new Date(),
			mods: _modules_,
			rmods: _remoteModules_,
			thread: _thread_,
			config: _config_
		}
		this.Env = this.Env || {
			attached: {}
		}
	},

	//generate uniqute id
	guid: function() {
		return 'B' + (++ Boom.Env.cidx).toString(36);
	},

	//add module or file
	add: function() {
		var args = [].slice.call(arguments, 0);
		if (args.length == 1 && isObject(args[0])) {
			addRemoteModule(args[0]);

		} else if (typeof args[1] == 'function') {
			addModule.apply(this, args);

		} else {
			addRemoteModule.apply(this, args);
		}
	},
	
	//.load('a.js','http://xx.xx/a.js');
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
		thread = _thread_[threadId] = {
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
		var mods = _modules_;
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
	
	//Boom.register('people.name',100);
	//Boom.people.name===100 ture;
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
			mix(_config_, key, true);
			
		} else if(value) {
			_config_[key] = value;
			
		} else {
			return _config_[key];
		}
	},

	//for debug
	oldBrowser: function() {
		ordered = false;
	},
	//for debug end
	mix: mix,
	merge: merge,
	extend: extend
};

Boom.prototype = bproto;
mix(Boom, bproto);
Boom._init();

if (!win[symbol]) {
	win[symbol] = win.CN6 = Boom;
}

if (win.location.search.indexOf('debug') > -1 || doc.cookie.indexOf('debug=') > -1) {
	_config_.debug = true;
}
})(window, document)


