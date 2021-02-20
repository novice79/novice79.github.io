import React, { useState, useEffect } from "react"
// import ReactMarkdown from "react-markdown";
// import ReactMarkdown from 'react-markdown/with-html'
import ReactMarkdownWithHtml from 'react-markdown/with-html'
import { useParams, useHistory } from "react-router-dom";
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
    history.replace('/personal');
    return (<div/>)
  }
  // todo: if md not in [], then set md = personal
  post = `/posts/${post}.md`
  // console.log(`md=${md}`)
  // useEffect(() => {
    fetch(post)
      .then((res) => res.text())
      .then((text) => setMarkdown(text));
  // }, []);

  return (
    <>
      <ReactMarkdownWithHtml plugins={[gfm]} allowDangerousHtml source={markdown} />
    </>
  );
}

