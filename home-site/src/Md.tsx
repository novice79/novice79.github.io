import React, { useState, useEffect } from "react"
// import ReactMarkdown from "react-markdown";
// import ReactMarkdown from 'react-markdown/with-html'
import ReactMarkdownWithHtml from 'react-markdown/with-html'
import { useParams } from "react-router-dom";
import gfm from 'remark-gfm'
interface ParamType {
  md: string
}

export const MD = () => {
  const [markdown, setMarkdown] = useState("");
  let { md } = useParams<ParamType>();
  md = `/posts/${md}.md`
  // console.log(`md=${md}`)
  // useEffect(() => {
    fetch(md)
      .then((res) => res.text())
      .then((text) => setMarkdown(text));
  // }, []);

  return (
    <>
      <ReactMarkdownWithHtml plugins={[gfm]} allowDangerousHtml source={markdown} />
    </>
  );
}

