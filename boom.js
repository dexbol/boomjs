/**@license
 * Boom v1.0 , a javascript loader and manager
 * 
 * MIT License
 * 
 * http://dexbol.github.com/boom/
 * 
 */


(function(win,doc){

var LOADING=0,
	LOADED=1;
	
var _config_={},
	//通过.addFile添加的meta文件
	_meta_={
	/*
	'lib.php':{fullpath:'lib.php'},
	'test1.php':{fullpath:'test1.php',requires:['test2.php'],mods:['t1-1','t1-2']},
	'test2.php':{fullpath:'test2.php',requires:['test3.php'],mods:['t2-1','t2-2','t2-3']},
	'test3.php':{fullpath:'test3.php',requires:['test4.php'],mods:['t3-1','t3-2']},
	'test4.php':{fullpath:'test4.php',requires:[],mods:['t4-1','t4-2']}
	*/
	},
	//通过.add 添加的模块
	_mods_={}, 
	//存贮加载文件的状态 handler等
	_files_={},
	_thread_={};

	
var proto,

	//the boom.js , tech from Do.js v2 
	jsSelf=(function(){
		var scripts=doc.getElementsByTagName('script');
		return scripts[scripts.length-1];
	})(),
	
	symbol=jsSelf.getAttribute('data-boom-symbol')||'Boom',
	
	//firefox 和 opera 使用script dom 加载js 可以实现并发加载 按顺序执行
	//所以这两个浏览器不用一个一个的按顺序添加scriot dom，不管依赖关系 一律并发下载
	//Firefox 4 开始 script.async默认属性为ture ，添加时要改成false 否则不能按顺序执行
	//tech from headjs
	isAsync=doc.createElement("script").async === true ||
					"MozAppearance" in doc.documentElement.style ||
					window.opera;
	//isAsync=false;


//很弱的对象检测
function isObject(o){
	if(!o){
		return false;
	}
	return Object.prototype.toString.call(o)=='[object Object]';
}

function each(ar,fn){
	//if(Array.prototype.forEach){
	//	return ar.forEach(fn);
	//}
	var len=ar.length,
		i=0;
		
	for(;i<len;i++){
		fn(ar[i],i);
	}
}

//基本的对象操作 from YUI 3
//当使用类似jquery这种非OO的js框架时 ， 可以提供最基本的OOP
function mix(r, s, ov, wl, mode, merge) {
    if (!s||!r) {
        return r || this;
    }

    if (mode) {
        switch (mode) {
            case 1: // proto to proto
                return mix(r.prototype, s.prototype, ov, wl, 0, merge);
            case 2: // object to object and proto to proto
                mix(r.prototype, s.prototype, ov, wl, 0, merge);
                break; // pass through 
            case 3: // proto to static
                return mix(r, s.prototype, ov, wl, 0, merge);
            case 4: // static to proto
                return mix(r.prototype, s, ov, wl, 0, merge);
            default:  // object to object is what happens below
        }
    }

    // Maybe don't even need this wl && wl.length check anymore??
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
            // if (s.hasOwnProperty(i) && !(i in FROZEN)) {
            if (s.hasOwnProperty(i)) {
                // check white list if it was supplied
                // if the receiver has this property, it is an object,
                // and merge is specified, merge the two objects.
                if (merge && isObject(r[i])) {
                    mix(r[i], s[i], ov, wl, 0, true); // recursive
                // otherwise apply the property only if overwrite
                // is specified or the receiver doesn't have one.
                } else if (ov || !(i in r)) {
                    r[i] = s[i];
                }
                // if merge is specified and the receiver is an array,
                // append the array item
                // } else if (arr) {
                    // r.push(s[i]);
                // }
            }
        }
    
    }
    return r;
}

function merge() {
    var a = arguments, o = {}, i, l = a.length;
    for (i=0; i<l; i=i+1) {
        mix(o, a[i], true,0,true);
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
	var extend=name.substring(name.lastIndexOf('.')+1);
	return extend=='js'||extend=='css';
}

//找到模块所在的meta文件
function searchFile(modName){
	var meta=_meta_,
		f,
		mods,
		i,
		len;
	
	for(f in meta){
		if(meta.hasOwnProperty(f)){
			mods=meta[f]&&meta[f].mods||[];
			len=mods.length;
			for(i=0;i<len;i++){
				if(mods[i]==modName){
					return f;
				}
			}
		}
	}
	
	return false;
};

function loadFile(name,callback){
	var metaFile=_meta_,
		src=metaFile[name]?metaFile[name].fullpath:name,
		type=src.indexOf('.css')>-1?'css':'js',
		script=_files_[name];
	
	if(type=='css'){
		var l=document.createElement('link');
		l.setAttribute('href',src);
		l.setAttribute('type','text/css');
		l.setAttribute('rel','stylesheet');
		jsSelf.parentNode.insertBefore(l,jsSelf);
		return;
	}
	
	if(!script){
		script=_files_[name]={handler:[callback?callback:null]};
	}
	

	if(script.status==LOADED){
		if(callback){
			callback(name);
		}
		return;
	}
	
	if(script.status==LOADING){
		if(callback){
			script.handler.push(callback);
		}		
		return;
	}
	

	var node=document.createElement('script');
	node.src=src;
	node.async=false;
	node.onload=node.onreadystatechange=function(){
		if(!this.readyState || this.readyState=='loaded' || this.readyState=='complete'){
			
			
			//ie9 由于下面script=null ,会导致报错。
			script.status=LOADED;
			
			var handler=script.handler,
				fn;

			while(handler.length>0){
				fn=handler.shift();
				if(fn){
					fn(name);
				}
			}
			
			
			node.load=node.onreadystatechange=null;
		}

	}

	jsSelf.parentNode.insertBefore(node,jsSelf);
	script.status=LOADING;	
}

//一个thread可能会多次调用此函数
//因为包含某mod的meta文件加载前我们无法知道此mod是否依赖其他mod，
//参数fromLoader 为真时 说明不是第一调用
//来处理首次调用未能处理的mod (unfoundMod)
function processThread(thread,fromLoader){
	var loadList=thread.f,
		unfoundMod=thread.unfound,
		list=fromLoader?unfoundMod:thread.mods,
		mods=_mods_,
		processed={},
		

		p=function(modName){
			if(!modName || processed[modName]){
				return;
			}
			
			processed[modName]=true;
			
			//要加载的模块是一个meta文件，直接放入加载列表并返回
			if(isFile(modName)){
				//如果还没加载
				if(!(_files_[modName]&&_files_[modName].status==LOADED)){
					loadList.push(modName);
				}
				return;
			}
			
			var mod=mods[modName],
				file;
			
			if(!mod){
				
				file=searchFile(modName);

				//防止meta对象中mods信息与文件中实际添加模块的信息不一致
				//比如:用户添加文件 .addFile({'test.js',{mods:['a','b']}});
				//但是test.js内只添加了模块a，没有b，这时候就会造成死循环，不断的加载test.js
				if(_files_[file]&&_files_[file].status==LOADED){
					throw new Error('Can\'t found the module : '+modName);
					return;
				}
			
				if(file && !processed[file]){
					loadList.push(file);
					processed[file]=true;
					unfoundMod.push(modName);
				}
				return;
			}

			if(mod&&mod.details.requires){
				each(mod.details.requires,p)
			}
		};

	each(list,p);

	//有需要加载的meta文件加载
	//否则attach模块
	if(loadList.length>0){
		loadThread(thread);
	}
	else{
		attachMod(thread);
	}
	
}


//加载thread中需要加载meta文件
function loadThread(thread){
	
	//可以确保执行顺序而且并发加载的浏览器
	if(isAsync){
		var list=thread.f=sortLoadList(thread , true),
			flag=list.length,
			
			callback=function(){
				if(--flag==0){
					thread.f=[];
					callback=list=null;
					processThread(thread,true);
				}
			};
			
		each(list,function(item){
			loadFile(item,callback);
		});
		
		return;
	}
	
	//其他浏览器按顺序分组加载
	var list=thread.f=sortLoadList(thread),	

	callback=function(){
		if(list.length==0){
			processThread(thread,true);
			thread=callback=list=null;
			return;
		}
		loadGroup(list.shift(),callback);

	};

	//console.info(list);
	loadGroup(list.shift(),callback);
};


function sortLoadList(thread,isAsync){
	
	var list=thread.f,
		processed={},
		ret=[],
		
	p=function(f){
		if(processed[f]){
			return;
		}
		processed[f]=true;
		
		var fobj=_meta_[f];
		
		if(fobj&&fobj.requires){
			each(fobj.requires,p);
		}
		
		ret.push(f);
	}
	
	if(isAsync){
		each(list,p);
		return ret
	}
	
	var maxLen=0,
		tempAr=[],
		groupAr=[];
			
	each(list,function(item){
		//now,ret had processed files
		p(item);
		processed={};
		//copy ret to tempAr
		each(ret,function(item){
			tempAr.push(item);
		});
		maxLen=Math.max(maxLen,ret.length);
		//save result to groupAr
		groupAr.push(tempAr);
		//reset ret and tempAr
		ret=[];
		tempAr=[];
	});
	
	ret=[];
	
	while(--maxLen>=0){
		tempAr=[];
		processed={};
		each(groupAr,function(ar){
			var i=ar.shift();
			//去重
			if(i&&!processed[i]){
				tempAr.push(i);
			}
			processed[i]=true;
		});
		ret.push(tempAr);
	}

	return ret;
	

};

function loadGroup(ar,callback){
	if(!ar){
		return;
	}
	
	var flag=ar.length,
		
	cb=function(name){
		if(--flag==0){
			callback&&callback();
			cb=ar=callback=flag=eachFn=null;
		}
	},
	eachFn=function(item){
		loadFile(item,cb)
	};
	
	each(ar,eachFn);

};


//当所有需要使用的模块以及依赖模块都下载完毕后
//再次处理mod的依赖关系并attach
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
	thread=null;

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
				
				_guidp:'BOOM-',
				_cidx:0,
				
				//把部分局部变量放出
				mods:_mods_,
				meta:_meta_,
				thread:_thread_
			};
		}
		if(!this.Env){
			this.Env={
				_attached:{}
			};
		}
	},

	//生成唯一的id，通常用来标记DOM元素
	guid:function(){
		var env=Boom.Env;
		return env._guidp+(++env._cidx);
	},

	//添加模块
	//add('modelName',function(C){},{requires:[],use:true});
	add:function(name,fn,details){
		_mods_[name]={
			name:name,
			fn:fn,
			details:details||{}
		};
		
		return this;
	},

	//添加文件
	//addFile('file-name',{fullpath:'test1.php',requires:['lib.php'],mods:['t1-1','t1-2']})
	//addFile({'file-name':{...},'file-name-other':{...}})
	addFile:function(name,info){
		if(typeof name=='object'){
			for(var p in name){
				if(name.hasOwnProperty(p)){
					this.addFile(p,name[p]);
				}
			}
		}
		else{			_meta_[name]=info;	
		}
		return this;
	},
	
	//加载js或者css文件详见loadFile
	load:loadFile,
	
	//使用单个或多个模块
	//.use('mod1','mod2',callback)
	//或者加载一个或多个文件！
	//.use('a.js','b.js',callback)
	use:function(){
		var args=Array.prototype.slice.call(arguments,0),
			len=args.length,
			threadId=this.guid(),
			callback;

		callback=(typeof args[len-1]=='function')?args.pop():null;
		
		//一个加载线程对象
		_thread_[threadId]={
			id:threadId,
			cb:callback,
			//最初要加载的模块
			mods:args,
			//需要但未找到的模块，可能不存在，也可能在未加载的meta文件中
			unfound:[],
			//待加载的meta文件
			f:[],
			cx:this
		};
		
		processThread(_thread_[threadId]);
		
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

	mix:mix,
	merge:merge,
	extend:extend

};

Boom.prototype=proto;

for(p in proto){
	Boom[p]=proto[p];
}

Boom._init();

win[symbol]=win.CN6=win.Boom=Boom;


})(window,document);








