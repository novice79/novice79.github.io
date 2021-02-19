## 在一个安卓app上实验全栈开发  
##### *2019-09-02*   
<br />  

##### 2021-02-20注释：
##### 这是19年写的一个Proof of concept 项目，这个支付需要服务端的，这个服务端需要腾讯认证的公司，并在它的后台配置合法域名才能调用支付接口。
##### 我之前注册了一个个人公司测试这个项目，后来没钱交服务费了，就把公司转给别人了。现在这个app也用不了，这个帖子还留在这里当做一个技术经历。
##### 之后我可能会把那个支付服务做一个docker image发布出来  
<br />  

一般所谓“全栈开发”就是前后台一起搞，既然Android也是Linux内核，那么不是也可以当服务器用吗？但是用常规的后台开发语言PHP、java、nodejs之类的都不太合适，把php-fpm交叉编译成arm版的这个有人做过，nodejs也有安卓版的，但都是提供一个环境让别人去写后台代码，光这个环境就几十兆了，很笨重还不好用。java倒是有点靠谱，又是Android原生语言。只是不太喜欢java，感觉表达起来太啰嗦。   
所以我选择用 **C++** 做后台，sqlite做数据库（自己编译的原生版，不是安卓自带的那个），前端用 **vuejs** 做spa，通过ajax + websocket与本地的C++后台交互。   
我想写一个商城‘网站’，用户在手机上添加商品，包括价格、文字描述、图片/视频展示，同一内网中的其它客户端，包括安卓、iphone、PC端，用浏览器打开这个“运行在安卓”上的商城就可以自助购物，如果直接用微信扫码打开的，就直接用公众号方式支付，如果是在PC端打开的，就显示一个二维码，让客户扫码支付。那么这台手机上售出的所有订单和商品信息都存在本地的sqlite数据库中，并且可让它支持退款。  
客户付的款到哪里去了？那就要让安卓手机的机主可以直接在app上开通自己的微信商户并绑定自己的银行卡，那别人在你手机上买东西的钱就由微信转到你银行卡中了。  
那么就需要解决几个问题：
1. 对接微信官方小微商户接口（这个可以绑个人银行卡的，不需要公司对公账户）
2. 上传商品的图片、视频到http站点目录，实际上是保存文件到安卓内部存储中，sqlite存储媒体文件的url并与该商品关联。上传的视频文件大小没限制（只要手机容量够大）
3. 在其它客户端用浏览器播放视频流，现在支持html5的浏览器都支持```<audio><video>```标签，所以没问题。在http服务器中加入range分段处理即可。就是让客户可以拖动进度条播放那种。
4. 顺便也加上扫码收款，扫客户的付款码，也可出示收款码让客户扫，直接选商品生成，不用输入金额。而且开通了小微商户别人可用信用卡支付。  
这样线上、线下支付都有了。所谓线上也只是内网的线上，别人没法通过公网访问你的安卓http网站（除非在路由器中加ip映射）。

然后这样拍脑袋搞出来的东西是这样的（请不要吐槽界面，我美工比较弱）：
<div style="display:flex;flex-wrap: wrap;">
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-165725.jpg" alt="线下收款"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-165703.jpg" alt="商品管理"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170314.jpg" alt="交易记录"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170323.jpg" alt="商户信息"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170338.jpg" alt="商户注册"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170418.jpg" alt="内网商城"/>
    <img style="margin:0.5em;" src="https://novice79.github.io/screenshots/cashier/Screenshot_20190902-171737.jpg" alt="系统消息"/>
</div>

用wrk压一下看看，在我的一加5t上的结果如下：

get请求：
```
wrk -t10 -c100 -d30s  http://192.168.1.96:12345/
Running 30s test @ http://192.168.1.96:12345/
10 threads and 100 connections
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    24.50ms   54.23ms 664.45ms   97.81%
    Req/Sec   578.20     66.91   787.00     87.00%
169020 requests in 30.03s, 171.67MB read
Requests/sec:   5627.78
Transfer/sec:      5.72MB
```

post json请求订单查询：
```
wrk -t10 -c100 -d30s -s ./post.lua http://192.168.1.96:12345/get_cli_orders
Running 30s test @ http://192.168.1.96:12345/get_cli_orders
10 threads and 100 connections
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    17.13ms    8.25ms 342.00ms   97.62%
    Req/Sec   599.25     45.59     1.06k    87.99%
178558 requests in 30.03s, 22.14MB read
Requests/sec:   5945.60
Transfer/sec:    754.81KB
```
因为这是用boost asio单线程异步处理的，理论上应该与nodejs单进程的http服务性能差不多。不过对内网商城来说已经够用了。

<!-- 324*648 -->
**[App下载（4.2M）](https://novice79.github.io/dist/cashier.apk)**
<!-- 
![线下收款](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-165725.jpg "线下收款")
![商品管理](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-165703.jpg "商品管理")
![交易记录](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170314.jpg "交易记录")
![商户信息](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170323.jpg "商户信息")
![商户注册](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170338.jpg "商户注册")
![内网商城](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-170418.jpg "内网商城")
![系统消息](https://novice79.github.io/screenshots/cashier/Screenshot_20190902-171737.jpg "系统消息") 
-->