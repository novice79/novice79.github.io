import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
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
import { MD } from './Md'
import { posts } from './posts'

function App() {
  const history = useHistory();
  useEffect(() => {
    let path = localStorage.getItem('path');
    if(path) {
      localStorage.removeItem('path');
      console.log(`localStorage's path=${path}`)
      history.replace(path);
    }
  }, []);
  return (
    <div>
      <Header>
      <h1>飘云阁主居</h1>
      <Logo src={logo}></Logo>
      <Slogan>无拘的灵魂，飘逸的软件</Slogan>
      </Header>
      <Container>
        <Content>
          <Switch>
            <Route exact path="/:post">
              <MD/>
            </Route>
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
