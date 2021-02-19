## 尝试写了一个人脸比较服务
##### *2019-10-06*   
<br />
两年前公司说有个项目要搞“刷脸过闸”，开始大家都不知怎么搞，我就到网上查了一下，开始查到一个[openface](https://github.com/cmusatyalab/openface/)，一个python库，我就用flask+flask_socketio将之封装成一个docker镜像run在服务器上，然后各个闸机通过socket.io连接（每个闸机上有个nodejs服务）把页面中通过getUserMedia抓取的图像发到服务器上去比较。     
我想当然的认为这个流程应该是：游客在自助机上买票时，刷脸进行下一步选票，扫码付款成功后，自助机把人脸照片发到后台去提取特征值存数据库，每台闸机每两秒（或界面上有个按钮触发）抓张照片发到后台去，与已付款但是还未入园的游客特征比较，如果某个匹配则通知闸机开闸，并改数据库状态标记该游客已消费。然后写了个demo测试发现效果还行。因为公司里搞硬件的就我一个，我就自己想当然的瞎搞。  
后来又发现有个这个项目[face_recognition]，也是个python库，但是封装的更好，觉得以前的很多都白做了。但是有个问题，每台闸机都发照片去后台提取特征/比较，这个操作是很耗时的，如果闸机多的话会搞的服务器压力很大。为什么不在本地提取特征，然后购票成功的游客特征通过服务器广播到每台闸机，那么人脸比较在本地进行就好了，匹配成功后开闸and通知服务器改状态。
因为闸机上已经有个nodejs服务了，nwjs做界面，通过socket.io与本地nodejs交互操作硬件（下面有个nodejs接硬件的文档），本地node再通过Websocket与后台交互进行支付等操作。那么我想干嘛不能让本地nodejs直接提供人脸特征 提取/比较 服务？我看上面那个[face_recognition]是封装dlib的，dlib是个C++库，C++写nodejs插件再合适不过了。

然后我一拍脑袋就把boost+opencv+dlib写成了一个nodejs插件，其实boost没怎么用到，只是用了其中的log库，整合进去留作以后备用吧。顺便把tts也加进去吧，因为闸机/自助机经常要语音播报的。nodejs用express把C++写的功能用restful服务呈现出来，再用pkg打包成可执行文件，双击运行后，用浏览器打开本地链接http://localhost:12345就可以使用了，接口说明及jquery's ajax调用方式请参考其中的例子代码。     
这东西写好后，公司那个项目后面又没做了，因为这只是我个人瞎搞的，而且现在已离职了，就发出来给感兴趣的参考下吧。

git库：     
[https://github.com/novice79/node_face](https://github.com/novice79/node_face)

因为这个C++代码编译比较麻烦，可以下载这个编译好的（里面的人脸模型比较大，100多兆），解压后直接双击运行即可。     
[人脸比较服务Demo](https://github.com/novice79/node_face/releases/download/1.0/dist.rar)

github上下载太慢，再加个     
[网盘分享](https://pan.baidu.com/s/1xrM18CeJMGbCBzcq2KGSiw)


***后记***：后面发现别人根本就不是这个流程，而是先刷身份证，获取身份证上的照片再与摄像头拍摄的比较，可能他们觉得人脸比较不能100%可靠，还需要身份证号验证吧。

附：之前写的一个文档：    
[nodejs对接硬件.doc](https://novice79.github.io/doc/nodejs对接硬件.doc)

[face_recognition]: https://github.com/ageitgey/face_recognition