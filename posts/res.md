## 写一个Android本地音乐播放器的心路历程

开始的想法很简单，就是能通过wifi传mp3到手机上播放，有单曲循环、顺序播放、目录循环什么的就行了。客户端应不需装任何软件，就用浏览器传文件。    
但市面上好像没有这种应用，不是要数据线拷文件，就是要在线播放它提供的歌曲，胡里花哨的一大堆不需要的功能，还几十、上百兆的。   
那我就着手自己写一个吧，首先要一个android http server，请参考[【用一个安卓 app 实验全栈开发】](https://www.v2ex.com/t/597323)，这个有了之后又要加入文件管理功能，比如：创建新文件夹、移动、删除、重命名等。把这个简单的文件管理界面加上后，再加上播放器相关的：单曲播放、单曲循环、顺序播放、目录循环。因为这是用浏览器的```<audio>```标签播放，所以局域网内的其它人也可以同时播放你手机上的音乐。    
那不是可以当作文件服务器用吗？干嘛限制只能上传mp3？所以要让它可以上传十几个G的蓝光电影，或几百兆的office安装包。别人通过浏览器可以下载（或在线播放）你手机上的文件。好了，这些又有了之后感觉不太过瘾。    
既然整个boost asio都在上面，顺便也写个socks5代理吧，让别人可以通过你手机代理上网，如果你手机有vpn账号的话还是有点用的。

目前所有的一切还在局域网内，要让它上广域网，界面是vuejs写的，运行在安卓webview里，我觉得应该把webrtc加上，webrtc需要个signaling server，然后我就用nodejs写了个signaling server做成了docker镜像（包含stun/turn server），随便在哪个有公网ip的服务器上run起来，不需要域名。这个app里再加上个“服务器配置界面”，可以配置多个服务器，就像wow的不同世界服一样，但要让它同时与不同服务器的玩家交互，就要有个id来标识它，就用手机硬件序列号的hash做id吧。比如玩家a同时在s1，s2两台服务器上出现的话，玩家b也在这两台服务器，那么a与b只会建立一个webrtc连接，因为同一id的玩家已有连接的话就不会再建立了。

流程是这样的：玩家打开app，就会同时建立N个websocket连接到他配置的服务器去，配置了几个就连几个，如果没有一个服务器的话，那他就完全在自己局域网内当文件服务器用，每个公网服务器会随机选最多100个其它玩家的id发给它——通过加密后websocket连接（就像https），然后这个安卓app会把该服务器当作signaling server，与这些玩家建立直接连接——其后与这些玩家的交互就不再经过任何服务器了。所以我又加了几个界面：附近玩家列表（直连的），私聊界面，附近频道，世界频道，及个人信息配置界面：昵称、头像、签名，是否允许加好友，是否允许音频/视频聊天，是否允许被当作代理（这个后面会解释）。     
私聊界面就类似微信的，可以发语音、文字、图片、文件什么的，还可以申请语音/视频聊天，***及请求代理***。有的手机浏览器版本太低，建立实时音频/视频聊天会失败，我个人测试用一加5t与华为平板可以视频聊天，但是与nexus 6p则会失败，可能要Android7以上的webview才行吧。不过这个不重要了，因为可以发录音文件嘛，就像微信那样按下说话，松开发送那种——而且还可以在附近频道群发。如果有人发垃圾消息可以屏蔽他，屏蔽后会与他断开直连，并不再接收其世界频道消息；有些人也可以加为好友，好友列表里的玩家会被优先直连，所有玩家不需要注册，他的手机就是他的id，除非换手机。

到目前为止还没什么有创意的。上面说了每个玩家手机上都有个socks5代理，如果让别的玩家做代理服务器上网呢？     
这个问题困扰了我许久，最初想用udp打洞穿透，然后tcp走udp，但据说有些手机网ISP会屏蔽udp，而且这个内/外网的ip建立连接还要像ICE那样处理，相当于是把webrtc的功能再实现一遍，看了几篇rfc文档，觉得这个不是短期能做的。开始是想让C++层直接穿透直连，因为tcp的监听也是在C++做的，都放在一起做感觉会简单点，那时把那个[udt](http://udt.sourceforge.net/)（不是udp）库都已编译成安卓版了，这个是可靠传输的udp C++库，试了下感觉它那个接口跟asio不太兼容，明明用C++写的，还非得要搞成BSD socket那样C接口，就放弃了。况且即使这个能用也还要实现几个rfc文档。所以就整个放弃C++层穿透了。      
webview里的webrtc都已经直连了为什么不用呢？开始考虑的是C++服务是运行在Android Service里，而Webview是运行在Activity里，service可以长期运行，activity切换到后台其中的代码执行就会被中断。所以又去查了下什么情况下webview里的websocket不会被中断。[这篇文章](https://medium.com/@oriharel/how-to-run-javascript-code-in-a-background-service-on-android-8ec1a12ebe92)说了个方法，试了一下，遗憾的是它需要用户手工开启特殊权限，而且允许这个特殊权限的接口在以后的android版本里还可能会变化。     
算了，就直接用Activity里的webview里的webrtc吧。我把本地socks5的监听端口号+100，开另一个tcp监听（我称作远程socks5代理端口），当这个端口有连接过来，C++层会通过本地websocket询问webview层“是否有附近玩家同意作为代理”，有的话则通过webrtc通道（直连通道）通知对端的webview再通过它本地的websocket通知它的C++层建立与它自身socks5的tcp连接……。说起来太拗口了，图示如下：
![流程图](https://novice79.github.io/img/draft.jpg "流程图") 

最终这样实现了，自己测试了一下效果还行，如果打开网站去查ip的话，会显示别人手机的ip——为了测这个还买了个XX云 1核/1G/1M 的服务器自己搭了个vpn用另一台手机连接测试。因为没什么人脉，都是自己搞。     
后面还想把bt下载也加进去，是用webtorrent（js库）呢？还是用libtorrent（C++库）？我是倾向用webtorrent，因为用js写起来简单些，结果一测根本就不支持老一点手机的webview，就像那个视频聊天一样。

算了，等以后大家换几代手机再说吧。回想当初不是只写个音乐播放器吗，先到这吧，有点扯远了。

<div style="display:flex;flex-wrap: wrap;align-items: center;justify-content: center;">
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/banner.jpg"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20190714-231523.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20190714-231554.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20190714-232400.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-232210.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-232455.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-232738.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-232747.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-233736.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/Screenshot_20191007-233928.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/resource/proxy_setting_demo.jpg" />
</div>

**[App下载（5.3M）](https://novice79.github.io/dist/armeabi-v7a/res.apk)**

默认加了一个测试服地址——1核1G1兆的服务器。你也可以自己起服务，然后让自己的圈内人都配置这个地址      
signaling server的代码地址，就一百多行nodejs代码
>[https://github.com/novice79/ss](https://github.com/novice79/ss)