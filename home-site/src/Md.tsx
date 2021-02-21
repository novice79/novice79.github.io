import React, { useState, useEffect } from "react"
// import ReactMarkdown from "react-markdown";
// import ReactMarkdown from 'react-markdown/with-html'
import ReactMarkdownWithHtml from 'react-markdown/with-html'
import { useParams, useHistory, } from "react-router-dom";
import gfm from 'remark-gfm'
import { posts } from './posts'
interface ParamType {
  post: string
}

export const MD = () => {
  const history = useHistory();
  const [markdown, setMarkdown] = useState("");
  let { post } = useParams<ParamType>();
  if( ! posts.find( ({ md }) => md === post ) ){
    // history.replace('/personal');
    // return (<div/>)
    post = 'personal'
  }

  post = `/posts/${post}.md`
  // console.log(`post url=${post}`)
  useEffect(() => {
    const md = sessionStorage.getItem(post)
    if( md ) {
      setMarkdown(md)
    } else {
      fetch(post)
      .then((res) => res.text())
      .then((text) => {
        // console.log(`get markdown content from server returned`)
        sessionStorage.setItem(post, text)
        setMarkdown(text)
      });
    }
    
  }, [post]);

  return (
    <>
      <ReactMarkdownWithHtml plugins={[gfm]} allowDangerousHtml source={markdown} />
    </>
  );
}
