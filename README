![logo](http://i3.6.cn/d3/7f/k524631301385441.png)

一个javascript loader , 参考了YUI3 ， Do.js , KISSY , Headjs 等，并有以下两个特点。

1.虽然没有使用preload(参考Headjs)技术，但最大程度的实现了并发加载。比如：
a.js依赖lib.js , b.js依赖lib.js .use('a.js','b.js')  会先加载lib.js ,然后
同时加载a.js 和 b.js

2.手动维护文件和模块的依赖关系。因为一些项目没条件提供一台安装了类似YUI Combo的程序或
脚本的服务器，而且一些第三方CDN服务商不能缓存带参数的文件。所以这部分工作只能手动维护。
不过起码可以把版本更新和发布的工作交给ANT。



