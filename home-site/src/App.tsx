import React from 'react';
import logo from './logo.png';
import './App.css';
import { 
  Header, Logo, Slogan, 
  Container, Content, Sidebar, 
  Item, StyledLink 
} from "./styles"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import {MD} from './Md'
const posts = [
  {name: '个人简介', md: 'personal'},
  {name: '安卓版视频转码和nodejs服务器', md: 'res2'},
  {name: '写了一个服务框架，让大家可发布自己的网站到安卓手机', md: 'res1'},
  {name: '写一个Android本地音乐播放器的心路历程', md: 'res'},
  {name: '演示一下用手势操控wow游戏角色', md: 'gg'},
  {name: '尝试写了一个人脸比较服务', md: 'face'},
  {name: '在一个安卓app上实验全栈开发', md: 'cashier'},
]

function App() {
  return (
    <div>
      <Header>
      <h1>小白的网站</h1>
      <Logo src={logo}></Logo>
      <Slogan>无拘的灵魂，飘逸的软件</Slogan>
      </Header>
      <Container>
        <Content>
          <Switch>
            <Route path="/:md" children={<MD/>} />
          </Switch>
          <Route path="/">
              <Redirect to="/personal" />
          </Route>
        </Content>
        <Sidebar>
        {
          posts.map(p => <Item><StyledLink to={`/${p.md}`}>{p.name}</StyledLink></Item>)
        }
        </Sidebar>
      </Container>
    </div>
    
  );
}

export default App;
