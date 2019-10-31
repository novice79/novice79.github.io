## 演示一下用手势操控wow游戏角色

记得以前wow有一、二十个技能，两排技能栏都摆满了，键盘左半边按键不够用，还要绑shift/alt+XXX的快捷键，因为一般都是用左手键盘，右手鼠标这样操作的。后面手机大量普及后，很多人都在等wow移植到移动端，结果一直没实现。我想除了体积太大（几十G）之外——但只用60前的场景与模型的话也就几个G，手机完全可以装下，主要就是操作方式难以移植，因为没法在屏幕上摆十几个按钮，更别说还要旋转摄像头观察左、右、后方的操作。像当前流行的XXXX游戏，都是在手机左边摆个虚拟方向盘，右边摆几个技能按钮，搞的像80年代红白机的手柄似的，除了没压感之外。     
我想手机操作模式无非就是声控跟手势。先实验一下声控，在网上找了一个卡内基·梅隆的[sphinx](https://cmusphinx.github.io/)库，这个库可以训练自定义发音的，比如你说“向前奔跑”、“旋风斩”，只要训练成模型了加载进去，再说这句话它就会识别。我用了一个[openears](https://www.politepix.com/openears/)的ios SDK读取/辨析sphinx训练的句子，再用[blend4web]加载游戏角色模型和动画，这样就能用声音控制角色移动和技能施放了。实验效果是：安静环境下，大多数情况能控制，但在有噪音的环境容易误判。所以声控并不实用，因为没法控制周围环境。再试一下手势操控。     
安卓有一个GestureOverlayView可以识别自定义手势，但我不想绑定在Android平台，就像什么“小程序”只能在XX环境中运行一样，我想要在像浏览器这种omnipresent的环境中运行。找到一个华盛顿大学+微软工程师开发的一个[$1]，把其中的js库拿出来再自己加了点垃圾代码，就可在h5的canvas里用了。        
然后用什么webgl库加载3D模型呢，用[threejs](https://threejs.org/)还是[blend4web]？现在大多数人都用unity，虽然笨重了点但确实好用，就用unity写控制逻辑吧，再导出为webgl。把[$1]的canvas叠加到unity的webgl div上，用vuejs做手势设置和帮助界面，这样一个【[$1]+unity+vue】的spa 3D网站就出来了。问题是这个网站太大，十几兆（血精灵模型+10个fbx动画），没人会等几分钟去打开一个网站，主要是现在网速太慢，可能等以后网速再提高10倍，3D网站才会普及。那就用cordova打包成安卓app吧，实际上打包成ios或其它平台的app都行。    
运行效果如下：
<div style="display:flex;flex-wrap: wrap;align-items: center;justify-content: center;">
    <video style="margin:1.0em;" src="https://novice79.github.io/video/gg.mp4"></video>
    <img style="margin:1.0em;" src="https://novice79.github.io/screenshots/gg/Screenshot_20191031-220744.jpg" />
</div>

**[App下载（15.8M）](https://novice79.github.io/dist/gg.apk)**

git库：     
[https://github.com/novice79/gesture_game](https://github.com/novice79/gesture_game)


[blend4web]: https://www.blend4web.com/
[$1]: http://depts.washington.edu/acelab/proj/dollar/index.html