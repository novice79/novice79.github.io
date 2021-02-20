## 写了一个服务框架，让大家可发布自己的网站到安卓手机
##### *2019-11-12*   
<br />
之前写的这个<a href='https://novice79.github.io/res'>安卓文件+代理服务器</a>界面太弱，我想干嘛不让别人自己做网站传上去？所以就加了这个功能，可以把整个网站打包成zip文件（这个zip里有个index.html），通过“上传网站”页面传到Android手机上，后台会自动解压，这样别人就能访问你的网站了。但是只传个静态网站上去没意思，一般做网站都是有前/后台的，后台与数据库交互，前台通过ajax或websocket与后台交互，实际上就是间接与数据库交互。我直接提供存取数据库的接口出来，让前端post SQL语句到后台去执行，后台用的是sqlite，只要sqlite支持的语句都行，但起码也要加个验证吧，不然不是谁都可以改你的数据库了？我想了一下，分两级密码，一个给客户端网页用的，只能查询，就是只能执行select语句，另一个是管理员密码，可以执行任何sql语句，包括建/删表，增删改记录。玩过类似wordpress这样的cms都知道，它有个管理后台，登录进去后可以执行管理操作，实际就是改数据库内容，改完后前端页面呈现的就是查询结果。所以我又加了个登录接口，post 登录用户名/密码过去，登录成功后返回管理员密码，就相当于进入管理后台了，随便你怎么操作数据库。    
我把这些密码和登录账号存在一个user表里面，表结构如下：   

```
-----------------------
|admin|client|usr|pass|     ----字段名
-----------------------
|root|guest|mystore|letmein|----初始默认值
```  
所以程序装好后，先用postman之类的把这些默认值改了，然后做自己的网站时就用修改后的密码存取数据库。         
后台提供的接口类似这样   

```
请求/返回的数据都是json格式，用post方式调用
①：执行sql语句接口
请求格式： pass为数据库访问密码，sql为sqlite支持的所有sql语句
URL： http://手机ip:端口（默认57001）/sql。如果在站点页面中访问，请用相对地址：/sql
{ 
  "pass": "root",
  "sql": "update user set admin='my-password';"
}
返回格式： ret为0代表执行成功，-1代表失败，同时带回msg字段标示失败原因, 
如果sql为select语句，result表示返回的查询结果
{
  ret: 0,
  msg: "错误描述，失败时返回",
  result: [{"字段1":value1, "字段2":value2, ...}, ...]
}
②：登录接口
URL： http://手机ip:端口（默认57001）/login。相对地址：/login
{ 
  "usr": "mystore",
  "pass": "letmein"
}
返回格式： ret为0代表登录成功，-1代表失败，同时带回msg字段标示失败原因, 
如果成功，返回的admin字段带回管理员密码，其后用这个密码可进行任何数据库操作
{
  ret: 0,
  msg: "错误描述，失败时返回",
  admin: "管理员密码"
}

提示：
这个接口已开启了cors，可在其它站点的js中调用，不存在跨域问题。所以也可把手机当做数据库服务器使用。
如果误操作把user表删除了，或修改后忘记密码，那就只能重装软件才能使用数据库了。
```
前端界面SPA（一般用vue or react做）和数据库访问都有了，那么一个网站还差什么，对了，还差实时交互，这就要用到websocket了，因为要让别人可以做实时聊天或在线游戏网站呀。   
就像上次用unity3d写的[webgl手势游戏网站](https://novice79.github.io/gg)，就可以做成一个多人实时在线交互的网站。因此我又提供了一个websocket广播接口    
这样调用    

```
websocket地址为：ws://手机ip:端口（默认57001）/broadcast
// 在网站中建立websocket的示例代码：
const url = `ws://${location.host}/broadcast`;
const ws = new WebSocket(url);
ws.onmessage = (evt)=>{
  // 接收其它浏览器发送的广播数据
  const msg = evt.data;
}
ws.onopen = ()=>{
  console.log(`ws.onopen`)
  const msg = "hello everyone";
  // 这个消息会广播至所有websocket客户端
  ws.send(msg);
};
//或者角色施放某个技能时，调用ws.send(msg)广播到其它所有网页同步播放动画  

```
一个网站所需的基本接口具备了，下面来测一下服务器性能，祭出wrk：    
>测试环境，服务端跑在一加5t手机上，测试机用一台Linux，都是通过wifi连同一个路由器

先是一个简单的hello world页面测一下get请求
```
<!-- get index.html -->
wrk -t10 -c100 -d30s  http://192.168.1.96:57001/
Running 30s test @ http://192.168.1.96:57001/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     8.30ms    2.83ms  87.65ms   86.40%
    Req/Sec     1.22k   113.53     1.46k    81.23%
  365176 requests in 30.03s, 40.05MB read
Requests/sec:  12162.22
Transfer/sec:      1.33MB
```
再测一下读写数据库接口     
先建一张product表吧，用postman或jquery的ajax执行下面语句
```
create table if not exists product (
    _id integer primary key autoincrement not null,
    name text,
    price real default 0.0,
    desc text default '',
    inventory INTEGER default 0
);
```
然后用wrk执行插入记录测试
```
<!-- {"pass": "root", "sql":"insert into product (name) values ('iphone7');"} -->
wrk -t10 -c100 -d30s --timeout 5s -s ./post.lua http://192.168.1.96:57001/sql
Running 30s test @ http://192.168.1.96:57001/sql
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   911.85ms  378.13ms   4.82s    81.03%
    Req/Sec    11.48      7.30    70.00     67.91%
  2414 requests in 30.06s, 275.82KB read
  Socket errors: connect 0, read 0, write 0, timeout 55
Requests/sec:     80.31
Transfer/sec:      9.18KB
```
插入记录的rps才80，应该是手机的sd卡写入速度太慢，现在表里有2500条记录了，再测下查询   
```
<!-- {"pass": "guest", "sql":"select * from product where _id=79;"}-->
<!-- app run foreground -->
wrk -t10 -c100 -d30s --timeout 5s -s ./post.lua http://192.168.1.96:57001/sql
Running 30s test @ http://192.168.1.96:57001/sql
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    12.34ms    6.26ms 190.62ms   96.82%
    Req/Sec   831.85     83.18     1.01k    76.00%
  248092 requests in 30.03s, 30.76MB read
Requests/sec:   8260.65
Transfer/sec:      1.02MB
```
这个数据还不错，再测下修改记录
```
<!-- {"pass": "root", "sql":"update product set price=79.0,inventory=2018 where _id=79;"} -->
wrk -t10 -c100 -d30s --timeout 5s -s ./post.lua http://192.168.1.96:57001/sql
<!-- app run foreground -->
Running 30s test @ http://192.168.1.96:57001/sql
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    13.46ms    5.01ms 113.13ms   87.86%
    Req/Sec   755.64    112.81     0.95k    75.02%
  225685 requests in 30.03s, 25.18MB read
Requests/sec:   7515.30
Transfer/sec:    858.68KB
```
这里需要说明一下，上面两项数据都是app运行在“前台”时的效果，如果在手机上按home键，把app切换到后台运行，那rps只有1500左右了。可能手机系统对后台进程做了什么节能处理。    
另外需要说明的是，每个sql执行前都会先验证密码，就是先查user表里的密码是否匹配，再执行sql。相当于每个请求执行了两次sql操作。     
那我故意输错密码，让它只查一次数据库看看
```
<!-- wrong pass -->
{"pass": "admin1", "sql":"insert into user (pass) values ('novice')"}
wrk -t10 -c100 -d30s -s ./post.lua http://192.168.1.96:57001/sql
Running 30s test @ http://192.168.1.96:57001/sql
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    10.83ms    4.48ms 227.74ms   86.37%
    Req/Sec     0.94k   164.75     1.23k    73.30%
  281577 requests in 30.03s, 37.59MB read
Requests/sec:   9375.64
Transfer/sec:      1.25MB
```
<hr>

上面这些数据到底是什么水平？再跟PC上的服务比较一下吧。我找了台PC通过wifi连同一台路由器，与手机同样的距离。     
run起一个nginx官方的docker，就比较get请求吧，懒得再去写个读写数据库的服务了。

```
<!-- docker nginx hello world -->
<!-- worker_processes 1； worker_connections 1024 -->
<!-- cpu i7-7700HQ 2.8GHz, 4核，单核双线程，8个虚拟cpu,16G内存 -->
wrk -t10 -c100 -d30s  http://192.168.1.46:8080/
Running 30s test @ http://192.168.1.46:8080/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   130.61ms  134.25ms   2.00s    96.38%
    Req/Sec    89.00     31.79   454.00     83.71%
  25386 requests in 30.04s, 6.22MB read
  Socket errors: connect 0, read 14, write 0, timeout 40
Requests/sec:    844.95
Transfer/sec:    212.04KB
```
让我吓了一跳，才800多rps，我进docker去看一下nginx配置：单进程，工作连接数1024。这个配置低了。我把它改为8进程，4096连接数
```
<!-- worker_processes 8； worker_connections 4096 -->
Running 30s test @ http://192.168.1.46:8080/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    84.82ms   27.78ms 389.33ms   80.86%
    Req/Sec   118.44     22.21   280.00     74.40%
  35257 requests in 30.04s, 8.64MB read
  Socket errors: connect 0, read 23, write 0, timeout 0
Requests/sec:   1173.56
Transfer/sec:    294.51KB
```
怎么搞的，才一千多rps。对了，我想windows下的docker是在虚拟机里运行，应该找一个windows版的nginx测试。然后我去官网下了个windows版的nginx，把配置改为8进程，4096
```
<!-- windows native nginx -->
<!-- worker_processes 8； worker_connections 4096 -->
wrk -t10 -c100 -d30s  http://192.168.1.46
Running 30s test @ http://192.168.1.46
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    39.75ms   65.90ms   1.36s    98.12%
    Req/Sec   303.24     56.57     1.26k    83.95%
  89639 requests in 30.04s, 21.97MB read
Requests/sec:   2983.50
Transfer/sec:    748.65KB
```
这个数据虽高了一点，还是不行啊。这就是号称高性能的nginx？对了，应该是nginx不适合在windows下运行。还是换nodejs测试吧        
我用npm install http-server -g，装了个nodejs http服务应用，在一个有index.html的目录下run起这个服务
```
<!-- nodejs http-server 1 thread -->
wrk -t10 -c100 -d30s  http://192.168.1.46:3000/
Running 30s test @ http://192.168.1.46:3000/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    74.71ms   12.31ms 342.51ms   90.75%
    Req/Sec   135.01     40.17   212.00     72.61%
  40230 requests in 30.04s, 12.09MB read
Requests/sec:   1339.05
Transfer/sec:    411.91KB
```
这不行啊，应该是这个模块太老了。我就不信邪了，自己写一段nodejs代码测试
```
<!-- 自己写的 nodejs app -->
wrk -t10 -c100 -d30s  http://192.168.1.46:3000/
Running 30s test @ http://192.168.1.46:3000/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     8.96ms    4.89ms 220.92ms   96.27%
    Req/Sec     1.14k   105.76     1.35k    78.47%
  339952 requests in 30.03s, 47.01MB read
Requests/sec:  11320.87
Transfer/sec:      1.57MB
```
唉，这个数据终于正常了，但这只是单进程啊。用cluster模式运行试下，把cpu全部利用上。
```
<!-- nodejs cluster 9进程，1 master+8 slave 直接返回 hello world-->
wrk -t10 -c100 -d30s  http://192.168.1.46:3000/
Running 30s test @ http://192.168.1.46:3000/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     7.58ms    2.58ms  61.14ms   88.54%
    Req/Sec     1.34k   111.05     1.57k    77.80%
  399901 requests in 30.03s, 53.01MB read
Requests/sec:  13318.53
Transfer/sec:      1.77MB
```
cluster模式运行，cpu基本上全程跑满。好了，这个数据终于超出我的一加5t手机了，不然会让人感觉不科学。    
等等，上面那个数据是直接返回内存中的“hello world”，而我手机上是读取sd卡html文件里的内容再返回的。它这还没算上读取文件的损耗呢。把nodejs也改为读取文件试试
```
<!-- nodejs cluster 9进程，1 master+8 slave 读取硬盘上的html文件返回 hello world-->
Running 30s test @ http://192.168.1.46:3000/
  10 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     9.39ms   13.01ms 267.41ms   98.77%
    Req/Sec     1.21k   138.65     1.43k    88.66%
  360032 requests in 30.03s, 48.07MB read
Requests/sec:  11989.87
Transfer/sec:      1.60MB
```
以上就是
>高通骁龙835+6G RAM的一加5t ***vs*** i7-7700HQ + 16G RAM + 全固态硬盘 的 联想拯救者r720     

火力全开下的数据对比。不过一加5t有时会遇到打开网站很慢，不知道是我压的太猛，还是它那个sd卡或系统本身的bug。重启手机就好了。       

之前[这篇帖子里](https://novice79.github.io/cashier)也有个测试数据，但那是单线程服务器。现在这个用了多线程。开了6个监听端口（5个tcp，一个udp），udp是跟signaling server发心跳用的，一个本地socks5代理端口，一个本地文件服务http端口，一个本地用户网站端口，一个远程socks5端口，一个远程用户网站端口。用户网站用了N个线程（N根据cpu个数而定），外加一个socks5代理线程，和文件http服务线程（这个线程开了3个端口），所以总共是N+2个c++线程，还不算java端和webview的线程。

<hr>

好了，上面的开胃菜已经上完了。下面我想说的是，难道这个网站只能在局域网内访问吗？        
实际上它可以http协议走webrtc通道，被远程的玩家穿透访问。原理就跟我在上一篇文章里画的示意图是一样的。       
更有意思的是，如果另一个远程局域网内的玩家穿透进来访问你的网站，它那个局域网内的所有其它设备都可以通过它的手机访问你的网站，而且在一个网页里发websocket广播，会广播到不同局域网内的所有浏览器，其它内网的用户也同样可以读取你手机上的数据库内容。

<div style="display:flex;flex-wrap: wrap;align-items: center;justify-content: center;">
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/res1/sketch_access.jpg"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/res1/uphome.jpg" />
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/res1/target_home_screenshot_merged.jpg" />
</div>


**[资源库armeabi-v7a版下载](https://novice79.github.io/dist/armeabi-v7a/res.apk)**

**[资源库arm64-v8a版下载](https://novice79.github.io/dist/arm64-v8a/res.apk)**