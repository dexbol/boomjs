/**@license
 * 
 * Boom , a javascript loader and manager
 * 
 * https://github.com/dexbol/boom
 *
 */




if(typeof CN6!='undefined'){
	CN6._CN6=CN6;
}

var CN6=function(){
	var C=this;
	if(! ( C instanceof CN6)){
		return new CN6();
	}
	
	C._init();
};


(function(C,win){

//默认文件/模块 信息，可以使用方法 addFile 添加
var META={
	/*
	'lib.php':{fullpath:'lib.php'},
	'test1.php':{fullpath:'test1.php',requires:['lib.php'],mods:['t1-1','t1-2']},
	'test2.php':{fullpath:'test2.php',requires:['lib.php'],mods:['t2-1','t2-2','t2-3']},
	'test3.php':{fullpath:'test3.php',requires:['lib.php'],mods:['t3-1','t3-2']},
	'test4.php':{fullpath:'test4.php',requires:['lib.php'],mods:['t4-1','t4-2']}
	*/
};

var proto,
	FILE=document.getElementsByTagName('script')[0];


function _loadOne(name,callback){
	var loaded=C.Env._loaded,
		loading=C.Env._loading,
		files=META,
		src=files[name]?files[name].fullpath:name,
		type=src.indexOf('.css')>-1?'css':'js';
	
	if(loaded[name]===true){
		if(callback){
			callback(name);
		}
		return;
	}
	
	if(loading[name]===true){
		setTimeout(function(){
			_loadOne(name,callback);
		},100);
		return;
	}
	
	if(type=='css'){
		var l=document.createElement('link');
		l.setAttribute('href',src);
		l.setAttribute('type','text/css');
		l.setAttribute('rel','stylesheet');
		FILE.parentNode.insertBefore(l,FILE);
		return;
	}

	

	var node=document.createElement('script');
	node.setAttribute('src',src);
	node.setAttribute('type','text/javascript');
	node.onload=node.onreadystatechange=function(){
		if(!this.readyState || this.readyState=='loaded' || this.readyState=='complete'){			
			loaded[name]=true;
			delete loading[name];		

			if(callback){
				callback(name);
			}
			node.load=node.onreadystatechange=null;

		}

	}

	FILE.parentNode.insertBefore(node,FILE);
	loading[src]=true;
};



function _loadGroup(ar,callback){

	if(!ar){
		return;
	}

	var i=0,
		len=ar.length,
		n,
		loaded=C.Env._loaded,

		

	cb=function(name){
		_delItem(ar,name);	

		if(ar.length==0&&callback){
			callback();
			cb=ar=callback=null;
		}
	};
	
	for(;i<len;i++){
		n=ar[i];
		_loadOne(n,cb);		
	}

};



function _load(thread){
	var list=_sortLoad(thread),	

	callback=function(){
		if(list.length==0){
			_process(thread,true);
			thread=callback=list=null;
			return;
		}
		_loadGroup(list.shift(),callback);

	};

	//console.info(list);
	_loadGroup(list.shift(),callback);
};



function _sortLoad(thread){
	var list=thread.loadList,
		files=META,
		rList=[],
		rListItem=[],
		i=0,
		len=list.length,
		processed={},
		maxLen=0,
		

	p=function(n){
		var f=files[n],
			requires=f.requires;
		
		if(processed[n]==true){
			return;
		}
		
		if(requires){
			var len=requires.length,i=0;
			for(;i<len;i++){
				p(requires[i]);
			}
		}

		rListItem.push(n);
		processed[n]=true;
	};

	

	for(;i<len;i++){
		p(list[i]);
		rList.push(rListItem);
		maxLen=Math.max(maxLen,rListItem.length);
		rListItem=[];
		processed={};
	}
	
	
	var ret=[],
		ar,
		arin;
	
	for(i=0;i<maxLen;i++){		
		ar=[];

		for(var j=0;j<len;j++){
			arin=rList[j][i];
			if(arin && !processed[arin]){
				ar.push(arin);
				processed[arin]=true;
			}
		}

		ret.push(ar);
		processed={};
	}
	

	thread.loadList=ret;
	return ret;
	

};



function _process(thread,fromLoader){
	var loadList=thread.loadList,
		waitList=thread.waitList,
		args=thread.args,
		list=fromLoader?waitList:args,
		i=0,
		len=list.length,
		mods=C.Env.mods,
		

		p=function(modName){
			if(!modName){
				return;
			}		

			//如果use的是文件不是模块
			if(modName.indexOf('.js')>-1||modName.indexOf('.php')>-1||modName.indexOf('.css')>-1){
				loadList.push(modName);
				

				_delItem(args,modName);
				return -1;
			}
			

			var mod=mods[modName],
				file;
			
			if(!mod){
				file=_searchFile(modName);
				if(file){
					loadList.push(file);
					waitList.push(modName);
				}
				return;
			}

			if(mod&&mod.details.requires){
				var len=mod.details.requires.length;
			
				for(var i=0;i<len;i++){
					p(mod.details.requires[i]);
				}
			}
				
		};

		

	for(;i<len;i++){
		if(p(list[i])===-1){
			--i;
			--len;
		}
	}
	
	if(loadList.length>0){
		_load(thread);
	}
	else{
		_attach(thread);
	}
	
};



function _attach(thread){
	var ar=thread.args,
		context=thread.context,
		callback=thread.callback,
		ret=[],
		i=0,
		len=ar.length,
		mods=C.Env.mods;
				
	p=function(n){
		var mod=mods[n];	

		if(mod&&mod.details.requires){
			var len=mod.details.requires.length;
		
			for(var i=0;i<len;i++){
				p(mod.details.requires[i]);
			}
		}
		
		ret.push(n);
	};
		
	for(;i<len;i++){
		p(ar[i]);
	}
	
	
	context._attach(ret);
	
	if(callback){
		callback(context);
	}
	C.Env[thread.id]=null;
	
};



function _searchFile(modName){
	var meta=META;
	for(var f in meta){
		if(meta.hasOwnProperty(f)){
			var mods=meta[f].mods||[];
			for(var i=0;i<mods.length;i++){
				if(mods[i]==modName){
					return f;
				}
			}
		}
	}
	
	return false;
};



//很弱的对象检测
function _isObject(o){
	if(!o){
		return false;
	}
	return Object.prototype.toString.call(o)=='[object Object]';
}



//删除数组中指定的项目
function _delItem(ar,item){
	var i=0,
		len=ar.length,
		it;
		
	for(;i<len;i++){
		it=ar[i];
		if(it==item){
			ar.splice(i,1);
			return;
		}
	}
}


proto={
	_init:function(){
		if(!C.Env){
			C.Env={
				mods:{},
				_attached:{},
				_used:{},
				_guidp:'ROOMS6-SEED-',
				_cidx:0,
				_loading:{},
				_loaded:{},
				_meta:META
			};
		}
		if(!this.Env){
			this.Env={
				_used:{},
				_attached:{}
			};
		}
	},

	

	//生成唯一的id，通常用来标记DOM元素
	guid:function(){
		return C.Env._guidp+(++C.Env._cidx);
	},

	
	//添加模块
	//add('modelName',function(C){},{requires:[],use:true});
	add:function(name,fn,details){
		C.Env.mods[name]={
			name:name,
			fn:fn,
			details:details||{}
		};
		
		//
		if(details&&details.use===true){
			this.use(name);
		}
		
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
		
		META[name]=info;
	},
	
	//使用单个或多个模块/文件
	//.use('mod1','mod2',callback)
	//.use('a.js','b.js',callback)
	use:function(){		
		var args=Array.prototype.slice.call(arguments,0),
			len=args.length,
			threadId=this.guid(),
			callback;

		callback=(typeof args[len-1]=='function')?args.pop():null;
	
		C.Env[threadId]={
			id:threadId,
			callback:callback,
			args:args,
			waitList:[],
			loadList:[],
			ret:[],
			context:this
		};
		
		_process(C.Env[threadId]);
		
	},

	

	_attach:function(ar){
		var len=ar.length,
			mods=C.Env.mods,
			attached=this.Env._attached;
		
		for(var i=0;i<len;i++){
			if(!attached[ar[i]]){
				mods[ar[i]].fn(this);
				attached[ar[i]]=true;
			}
			
		}
	},




//基本的对象操作 from YUI 3
//当使用类似jquery这种非OO的js框架时 ， 可以提供最基本的OOP


	mix:function(r, s, ov, wl, mode, merge) {
	    if (!s||!r) {
	        return r || this;
	    }
	
	    if (mode) {
	        switch (mode) {
	            case 1: // proto to proto
	                return C.mix(r.prototype, s.prototype, ov, wl, 0, merge);
	            case 2: // object to object and proto to proto
	                C.mix(r.prototype, s.prototype, ov, wl, 0, merge);
	                break; // pass through 
	            case 3: // proto to static
	                return C.mix(r, s.prototype, ov, wl, 0, merge);
	            case 4: // static to proto
	                return C.mix(r.prototype, s, ov, wl, 0, merge);
	            default:  // object to object is what happens below
	        }
	    }
	
	    // Maybe don't even need this wl && wl.length check anymore??
	    var i, l, p;
	
	    if (wl && wl.length) {
	        for (i = 0, l = wl.length; i < l; ++i) {
	            p = wl[i];
	            if (s.hasOwnProperty(p)) {
	                if (merge && _isObject(r[p])) {
	                    C.mix(r[p], s[p]);
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
	                if (merge && _isObject(r[i])) {
	                    C.mix(r[i], s[i], ov, wl, 0, true); // recursive
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
	},

	merge : function() {
	    var a = arguments, o = {}, i, l = a.length;
	    for (i=0; i<l; i=i+1) {
	        C.mix(o, a[i], true,0,true);
	    }
	    return o;
	},

/**
 * Utility to set up the prototype, constructor and superclass properties to
 * support an inheritance strategy that can chain constructors and methods.
 * Static members will not be inherited.
 * @param r {Function} the object to modify
 * @param s {Function} the object to inherit
 * @param px {Object} prototype properties to add/override
 * @param sx {Object} static properties to add/override
 * @return r {Object}
 */

	extend:function(r,s,px,sx){
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
	        C.mix(rp, px,true);
	    }
	
	    // add object overrides
	    if (sx) {
	        C.mix(r, sx,true);
	    }
	
	    return r;		
	}
};

C.prototype=proto;

for(p in proto){
	C[p]=proto[p];
}


C._init();


})(CN6,window);

