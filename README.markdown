![logo](http://vi3.6rooms.com/ce/15/p479651373251050.png) 
A javascript loader and manager

Glossary
========

*CLOSUSRE-MODULE* - It's a piece of code isolation by closures that created
by Boom.add method. The syntax is almost the same as YUI:

	Boom.add('closure-module-name', function(instance) {
		// define module code ...
		// return module
	}, {requires: ['other-module']});

The argument `instance` is the Boom or its instance which called `.use`
method to use the module in code.

*FILE-MODULE* - just a javascript file(or css). Sometimes, a file-module
can include one or more closure-module, otherwise just javascript
code, e.g. mootools.js or underscore.js. You can add a file-module by
Boom.add method too:

	Boom.add('file-module-name', {
		path: '/xx.js',
		mods: ['closure-module-1', 'closure-module-2'],
		requires: ['other-module']
	});

In this code, `path` is required, the others is optional . If the file-module
includes some closure-module, set `mods` will make more benefits, in fact,
the builder tool can set it automatically. When the file-module depend on other
module you can set `requires`, but it's not necessary because of that when you
use some module it will execute orderly one by one.

*MODULE* - means a closure-module or file-module.

Use Modules
===========

As mentioned above, you know kind of modules and how add it, now we use it
by .use method:

	Boom.use('closure-module-name', 'or file-module-name or', 
		'just a url of file-module', function(instance) {

		// callback function
	});

You can use a module by it's name or a url of file-module, Boomjs will 
calculate module dependence, then load it(some situlations load them
parallelly, otherwise one by one) and exectute orderly.

Tricks
======

*   Use moudles by url directly is more convenient sometimes. for example:

		// don't worry execution order.
		Boom.use('/workspace/jquery.js', '/workspace/jquery.plugin.js',
			function(instance) {
			// use the jquery plugin.
		});

*   If you add many file-module, and them in one directory, you can
	do it like this:

		Boom.config({
			'base': '/directory/workspace/'
		});

		// the file's path is  /directory/workspace/one.js
		Boom.add('file-module', {
			'path': 'one.js'
		})

*   Use [Bomb](https://github.com/dexbol/bomb) can build project
	by boomjs automaticly.


Style Guide
============

*   If closure-module created a object, the module name should be the same as
	object name and it like this: `namespace.object` ,`namespace.ClassObject`,
	`object` or `ClassObject`.

*   If closure-module did not create any new object(maybe just extend a object
	that exists), the moudle name should be like this: `namespace-feature`,
	`exsitObject-feature`.

*   The file name should be alway use lower case, and do not use dots(.)
	and space in name,use dashes(-) or underscores(_) concatenate words.
	So, `module-name.js` 	`module-name-sub.js` or `modulename` is *GOOD*,
	`moduleName.js` `module.name.js` is *BAD*.



Reinventing The Wheel? 
======================

![image from codinghorror.com](http://codinghorror.typepad.com/.a/6a0120a85dcdae970b0120a86df78c970b-pi)

This wheel is fit for me. First, I don't like AMD, you should `define` anything
that you will be used even third-party libraries.(I know requirejs can use
original jquery by shim configuration.) The sencond, in my practice I just need
a loader to build simple projects or pages sometimes, in otherwise I need a
module solution to build bigger project too. And I need both in one page for
back-compatible sometimes.

When the YUI 3.0 release, I scan the source and it's amazing I think. Then I
clone YUI seed solution and make this, and rewrite it over and over. Of course
,I don't know AMD yet in that time. Stupid? Maybe.








