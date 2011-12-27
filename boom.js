/**@license Boom.js v3.0 , a javascript loader and manager | MIT License  */
(function(){
var win=this;
var doc=win.document;

var LOADING=1;
var	LOADED=2;
	
var _config_={
		timeout:12000,
		base:'',
		debug:false,
		util:[],
		fail:function(name,src){
			//doc.title='✖ '+src+' Load Abortively,Please Refresh';
		}
	};
var	_meta_={
	/*
	'lib.php':{path:'lib.php'},
	'test1.php':{path:'test1.php',requires:['test2.php'],mods:['t1-1','t1-2']},
	'test2.php':{path:'test2.php',requires:['test3.php'],mods:['t2-1','t2-2','t2-3']},
	'test3.php':{path:'test3.php',requires:['test4.php'],mods:['t3-1','t3-2']},
	'test4.php':{path:'test4.php',requires:[],mods:['t4-1','t4-2']}
	*/
	};
var	_mods_={};
var	_files_={};
var	_thread_={};

	
var proto;

//the boom.js , tech from Do.js v2 
var	jsSelf=(function(){
		var scripts=doc.getElementsByTagName('script');
		return scripts[scripts.length-1];
	})();

var	symbol=jsSelf.getAttribute('data-boom-symbol')||'Boom';
/**
 * @see http://labjs.com/documentation.php
 * @see http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
 * @see http://hsivonen.iki.fi/script-execution/
 */
var	ordered=doc.createElement("script").async === true;
//var ordered=false;
var rFiletype=/\.(js|css|php)(\?|$)/;
var rFullpath=/^(\/|http)/;


function isObject(o){
	return !!(o&&Object.prototype.toString.call(o)=='[object Object]');
}

function each(ar,fn){
	for(var i=0,len=ar.length;i<len;i++){
		fn(ar[i],i);
	}
}

//the three function followed from YUI3
function mix(r, s, ov, wl, merge) {
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

function merge() {
    var a = arguments, o = {}, i, l = a.length;
    for (i=0; i<l; i=i+1) {
        mix(o, a[i], true);
    }
    return o;
}

function extend(r,s,px,sx){
    if (!s || !r){
		return r;
	} 
	
    var OP = Object.prototype,
        O = function (o) {
                function F() {}
                F.prototype = o;
                return new F();
            },
        sp = s.prototype,
        rp = O(sp);

    r.prototype = rp;
    rp.constructor = r;
    r.superclass = sp;

    // assign constructor property
    if (s !== Object && sp.constructor === OP.constructor) {
        sp.constructor = s;
    }

    // add prototype overrides
    if (px) {
        mix(rp, px,true);
    }

    // add object overrides
    if (sx) {
        mix(r, sx,true);
    }

    return r;		
}


function isFile(name){
	return !!(!_mods_[name]&&rFiletype.test(name));
}

function searchFile(modName){
	var meta=_meta_,
		f,
		mods,
		i,
		len;
	
	for(f in meta){
		mods=meta[f].mods||[];
		len=mods.length;
		for(i=0;i<len;i++){
			if(mods[i]==modName){
				return f;
			}
		}
	}
	
	return false;
};

function loadRow(list,callback){
	var flag=list.length,
		file,
		cb=function(){
			if(--flag<=0){
				callback&&callback();
				cb=null;
			}
		};
	
	// if list is empty , just invoke callback function.
	if(flag==0){
		cb();
		return;
	}
	
	while(file=list.shift()){
		loadFile(file,cb);
	}
}

function loadColumn(list,callback){
	function cb(){
		if(list.length==0){
			callback&&callback();
			cb=null;
		}
		else{
			loadFile(list.shift(),cb);		
		}
	}
	cb();	
}

function loadRowColumn(row,column,callback){
	var r=false,
		c=false;
		
	function complete(){
		if(r&&c&&callback){
			callback();
			callback=null;
		}
	}

	loadRow(row,function(){
		r=true;
		complete();
	});
	loadColumn(column,function(){
		c=true;
		complete();
	});
}

function loadFile(name,callback){
	var metaFile=_meta_,
		src=metaFile[name]?metaFile[name].path:name,
		type=rFiletype.exec(src)[1]=='css'?'css':'js',
		file=_files_[name],
		node;
	
	src=rFullpath.test(src)?src:_config_.base+src;
	
	if(!file){
		//shorter property h:handler,s:status
		file=_files_[name]={h:[callback],s:0};
	}

	//http://www.phpied.com/when-is-a-stylesheet-really-loaded/
	//http://lifesinger.org/lab/2011/load-js-css/
	if(type=='css'){
		node=doc.createElement('link');
		node.href=src;
		node.type='text/css';
		node.rel='stylesheet';
		jsSelf.parentNode.insertBefore(node,jsSelf);
		callback&&callback();
		file.s=LOADED;
		return;
	}
	
	if(file.s==LOADED){
		callback&&callback(name);
		return;
	}
	
	if(file.s==LOADING){
		callback&&file.h.push(callback);
		return;
	}
	
	node=doc.createElement('script');
	node.async=false;
	node.src=src;
	
	file.t=win.setTimeout(function(){
		_config_.fail(name,src);
	},_config_.timeout);
	
	node.onload=node.onreadystatechange=function(){
		if(!this.readyState || this.readyState=='loaded' || this.readyState=='complete'){
					
			win.clearTimeout(file.t);
			file.s=LOADED;
			
			var handler=file.h,
				fn;
			
			while(handler.length>0){
				fn=handler.shift();
				fn&&fn(name);
			}
						this.load=this.onreadystatechange=null;
			!_config_.debug && node.parentNode.removeChild(node);
			
		}
	}
	
	jsSelf.parentNode.insertBefore(node,jsSelf);
	file.s=LOADING;	
}

function processThread(thread,fromLoader){	
	var loadList=thread.f,
		count=thread.count,
		lost=thread.lost,
		list=fromLoader?lost:thread.mods,
		mods=_mods_,
		processed={},
		
		
		p=function(modName){
			if(!modName || processed[modName]){
				return;
			}			processed[modName]=true;
			
			if(isFile(modName)){
				if(!(_files_[modName]&&_files_[modName].s==LOADED)){
					loadList.push(modName);
				}
				return;
			}
			
			var mod=mods[modName],
				file;
			
			if(!mod){
				file=searchFile(modName);
				if(!file || (_files_[file]&&_files_[file].s==LOADED)){
					throw 'Can\'t found the module : '+modName;
				}
				
				lost.push(modName);
				
				//ignore requres each other
				if(!processed[file]){
					loadList.push(file);
					processed[file]=true;
				}
				return;
			}
			else if(mod.details.requires){
				each(mod.details.requires,p)
			}
		};

	each(list,p);
	
	if(loadList.length>0){		loadThread(thread);
	}
	else{		attachMod(thread);
	}}

function loadThread(thread){

	var list=fileDepend(thread.f),
		col=[],
		row=[];
	
	if(ordered){
		row=row.concat(list);
	}
	else{
		each(list,function(item,index){
			var file=_meta_[item];
			if(file&&file.mods){
				row.push(item);
			}
			else{
				col.push(item);
			}
		});
	}
		
	loadRowColumn(row,col,function(){
		thread.f=[];
		processThread(thread,true);
	});
	
}

function fileDepend(files){
	var ret=[],
		processed={},
				
	p=function(f){
		var fobj;
		if(processed[f]){
			return;
		}
		
		processed[f]=true;
		fobj=_meta_[f];
		
		if(fobj&&fobj.requires){
			each(fobj.requires,p);
		}
		
		ret.push(f);		
	}
	each(files,p);
	return ret;
}

function attachMod(thread){
	var context=thread.cx,
		callback=thread.cb,
		ret=[],
		mods=_mods_,
		processed={};
				
	p=function(n){
		if(processed[n]){
			return;
		}
		processed[n]=true;
		
		var mod=mods[n];	

		if(mod&&mod.details.requires){
			each(mod.details.requires,p);
		}
		
		if(mod&&!isFile(n)){
			ret.push(n);
		}
	};
		
	each(thread.mods,p);

	context._attach(ret);

	callback&&callback(context);
	
	delete _thread_[thread.id];
}

function Boom(){
	var boom=this;
	if(! boom instanceof Boom){
		return new Boom();
	}
	boom._init();
}

proto={
	_init:function(){
		if(!Boom.Env){
			Boom.Env={
				_attached:{},
				_cidx:+new Date(),
				_mods:_mods_,
				_meta:_meta_,
				_thread:_thread_
			};
		}
		if(!this.Env){
			this.Env={
				_attached:{}
			};
		}
	},

	//generate uniqute id
	guid:function(){
		return 'B'+(++Boom.Env._cidx).toString(36);
	},

	//add('modelName',function(C){},{requires:[]});
	add:function(name,fn,details){
		var oq=details&&details.requires?details.requires:[];
		details=details||{};
		details.requires=oq.concat(_config_.util);
		
		_mods_[name]={
			name:name,
			fn:fn,
			details:details
		};
		
		return this;
	},

	//addFile('file-name',{path:'test1.php',requires:['lib.php'],mods:['t1-1','t1-2']})
	//addFile({'file-name':{...},'file-name-other':{...}})
	addFile:function(name,info){
		if(isObject(name)){
			for(var p in name){
				if(name.hasOwnProperty(p)){
					this.addFile(p,name[p]);
				}
			}
		}
		else{
			_meta_[name]=info;	
		}
		return this;
	},
	
	//.load('a.js','http://xx.xx/a.js');
	load:function(){
		var ar=[].slice.call(arguments,0);
		loadRow(ar);
		return this;
	},

	use:function(){
		var args=[].slice.call(arguments,0),
			len=args.length,
			threadId=this.guid(),
			callback;

		callback=(typeof args[len-1]=='function')?args.pop():null;
		
		_thread_[threadId]={
			id:threadId,
			cb:callback,
			mods:args,
			lost:[],
			f:[],
			cx:this
		};
		processThread(_thread_[threadId]);
		return this;
	},

	_attach:function(ar){
		var mods=_mods_,
			attached=this.Env._attached,
			self=this;

		each(ar,function(item){
			if(!attached[item]){
				mods[item].fn(self);
				attached[item]=true;
			}
		});
	},
	
	//Boom.register('people.name',100);
	//Boom.people.name===100 ture;
	register:function(ns,value){
		var obj=this,
			path=ns.split('.'),
			i=0,
			len=path.length,
			p;
						
		for(;i<len;i++){
			p=path[i];
			
			if(i==len-1){
				if(obj[p]){
					throw 'register has failed['+ns+']';
				}
				obj[p]=value;
			}
			obj[p]=obj[p]||{};
			obj=obj[p];
		}
		return obj;
	},
	
	config:function(key,value){
		if(!value){
			mix(_config_,key,true);
		}
		else{
			_config_[key]=value;
		}
	},

	mix:mix,
	merge:merge,
	extend:extend

};

Boom.prototype=proto;

for(p in proto){
	Boom[p]=proto[p];
}

Boom._init();

win[symbol]=win.CN6=Boom;

if(win.location.search.indexOf('debug')>-1||doc.cookie.indexOf('debug=')>-1){
	_config_.debug=true;
}

})();







