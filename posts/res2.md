## 安卓版视频转码和nodejs服务器
##### *2021-02-19*   
<br />
之前写的那个安卓“资源库”app，可以用网页同时上传多个文件到手机上，但不能上传文件夹，所以我用ndk交叉编译了unrar和7z整合进去，这样就可以上传三种压缩包（zip,rar,7z），然后在手机上解压。  

![解压界面](https://novice79.github.io/screenshots/res2/Screenshot_20210219-085502.jpg)    
本来的一个功能是上传音频、视频到手机，然后在内网中当做媒体服务器用，但大多数浏览器只能播放h264+aac编码的mp4视频，所以最好能在手机上转码，当然可以先在PC上转码好了再上传，但大多数玩家可能没有工具或不会转码，所以我又编译了ffmpeg进去。另外一般视频中可能包含了字幕轨，但h5的video播放器不支持内嵌的srt、ass、mov_text字幕，你给别人看个美剧，没字幕也不行啊，浏览器只支持外部的vtt文件字幕，如果还要另外从别处下载字幕转成vtt，再上传到手机，那就太麻烦了。所以我让它可以直接提取视频文件中的字幕轨转为vtt，或把外部的srt文件转为vtt都行。  
这样在播放视频时它会根据文件名自动加载所有匹配的字幕，比如视频文件叫frozen.mp4, 播放时会自动加载frozen_中文.vtt，frozen_英文.vtt 这类文件。还有人可能想提取视频中的音轨，所以顺便又加了把声道提取为mp3文件的功能，每次ffmpeg调用都是一个单独线程，所以视频转码和mp3提取可以同时进行。见下图： 

![转码界面](/screenshots/res2/Screenshot_20210215-093152.jpg)   
上图转码一个近两小时的电影，h265(10bit) --> h264(8bit)，在我的一加5手机上平均0.5倍速，也就是将近4小时才转完。当然手机性能越强劲，速度越快。   
下图是在浏览器中播放，选择字幕截图   

![选择字幕](/screenshots/res2/Screenshot_20210219-092204.jpg)   
我一直想让用户可以上传自己的动态网站到手机上。这样就要加入动态语言解析器，本来c++整合lua是最简洁高效的，原本是想把lua挂上asio的异步事件循环，就像把js挂上libuv变成nodejs一样，做一个简洁的lua版node，但一来lua没有多少外部库可以使用，二来别人还要学会你的自定义api才能用，这样搞出来是没有人用的。考虑过python、ruby、php，但整合这些框架文件太分散了（一个原生文件+多个脚本文件），不像node这样一个原生可执行文件就行，而且npm统一把所需的第三方包安装到工程目录，这样直接压缩这个目录上传也方便，先在本地测试好了，压缩、上传、打开手机动态网站，ok。就这样搞了，网上有现成的 [https://code.janeasystems.com/nodejs-mobile](https://code.janeasystems.com/nodejs-mobile)  ，整合很简单，它是一个动态库，另起一个线程调用这个动态库即可。但有一个问题，如果用户重新上传网站呢，我把这个网站代码解压了，原来那个node线程怎么办，没办法强制杀死那个线程，再另外重启一个，一般一个线程结束另外一个线程，是给那个线程发消息，或设置一个共享变量，另一个线程在循环中检查，如果收到消息了则自己退出。但这个node动态库调用了后，没有循环处理，只要它的异步事件没处理完永远不会返回，比如它运行一个express server永远不会返回，post express server让它调用process.exit()？一是不知道它的地址是多少，二是这个process.exit()会退出整个安卓app，而不只是这个线程。  
那这样就只能上传node网站后要重启app才能生效，这不太好。所以我要把这个动态库编译成一个可执行文件，我clone了[它的代码](https://github.com/janeasystems/nodejs-mobile)，把其中android-configure文件中最后的那个--shared去掉，重新编译就成了exe。然后把这个exe放进去，每次上传网站时，自动解压、强杀进程、重启进程，网站立即生效。看上去比较完美，但   
数据库呢？不考虑mysql，pgsql，太大了又难以编译，就用sqlite，之前的c++网站已整合c版本的sqlite，没法让nodejs调用，即使提供了restful服务，调用起来也不方便。一般nodejs是用[sqlite3](https://www.npmjs.com/package/sqlite3)这个npm包存取数据库，如果是纯js的包都好办，直接把整个node_modules一起压缩上传即可，但这个[sqlite3](https://www.npmjs.com/package/sqlite3)包含了原生代码，在PC上安装的是x86_64版本，在安卓的arm机上用不了，又要交叉编译这个，交叉编译 安卓版nodejs的npm包 这个资料在网上还很难找到，最后在[这个build.gradle](https://github.com/janeasystems/nodejs-mobile-cordova/blob/4a79e96b8f313296fb050ecc413f053d1ac7f5c8/src/android/build.gradle)中找到了线索，写了一个脚本，编译成功，armeabi-v7a版的测试ok，arm64-v8a版的加载失败，这是它那个arm64版node的bug，网上有说。等他们升级版本后再试吧（目前的安卓nodejs版本是12.19.0-pre），因为我是自己编译github上的代码，所以版本号带pre。反正armeabi-v7a的在arm64上也能用，直接整合进去，arm和arm64安卓机都测试ok。包括一个原来老安卓5.0的手机上都可以跑nodejs网站。

感兴趣的可以试下：   

**[资源库armeabi-v7a版下载](https://novice79.github.io/dist/armeabi-v7a/res.apk)**

**[资源库arm64-v8a版下载](https://novice79.github.io/dist/arm64-v8a/res.apk)**