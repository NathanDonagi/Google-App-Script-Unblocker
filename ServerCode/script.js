import fetch from 'node-fetch';
import express from 'express';
import {JSDOM} from "jsdom"
import fs from "fs"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const app = express()
const port = 8000

async function proxifyURL(proxyUrl, rawUrl, link){
  let originLink = link
  if(link.startsWith('data')){
    return link
  }

  if(link.startsWith('//') && link.includes('login')){
    link = "https:" + link
  }
  
  if(link.startsWith('/')){
    link = rawUrl.origin + link
  }
  
  if(!link.startsWith('http')){
    link = `${rawUrl.href}/${link}`
  }

  console.log('-----', link, rawUrl, !link.includes(rawUrl.origin))
  if(!link.includes(rawUrl.origin)){
    return link
  }

  const response = await fetch(link);
  var contentType = response.headers.get('content-type');
  if (contentType == null) contentType = "text/plain"
  console.log('888888888', link, originLink, contentType);
  if(contentType.includes('html')){
    let main_link = Buffer.from(link).toString('base64')
    return `${proxyUrl}/web/${main_link}`;
  }else if(contentType.includes('javascript')){
    let script_string = await response.text();
    proxifyJs(script_string)
    return `data:${contentType};charset=UTF-8,${encodeURIComponent(script_string)}`
  }else{
    const buffer = await response.arrayBuffer();
    const base64data = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64data}`;
  }
}

function proxifyJs(script){
  script.replace(/window.location/g, "window.proxyLocation").replace(/window.document.location/g, "window.document.proxyLocation")
  return script
}

async function proxifyJSNode(node){
  node.innerHTML = proxifyJs(node.innerHTML)
  return node.innerHTML
}

async function proxifyCSS(proxyUrl, rawUrl, css){

  let promises = [];
  css.replace(/url\("(.*?)"\)/gi, match => {
    const promise = proxifyURL(proxyUrl, rawUrl, match.replace(/url\("/gi, "").replace(/"\)/gi, ""));
    promises.push(promise);
  });
  
  let data = await Promise.all(promises);
  css = css.replace(/url\("(.*?)"\)/gi, match => `url(${data.shift()})`);

  promises = [];
  css.replace(/url\('(.*?)'\)/gi, match => {
    const promise = proxifyURL(proxyUrl, rawUrl, match.replace(/url\('/gi, "").replace(/'\)/gi, ""));
    promises.push(promise);
  });
  
  data = await Promise.all(promises);
  css = css.replace(/url\('(.*?)'\)/gi, match => `url(${data.shift()})`);
  
  promises = [];
  css.replace(/url\((.*?)\)/gi, match => {
    const promise = proxifyURL(proxyUrl, rawUrl, match.replace(/url\(/gi, "").replace(/\)/gi, ""));
    promises.push(promise);
  });
  
  data = await Promise.all(promises);
  css = css.replace(/url\((.*?)\)/gi, match => `url(${data.shift()})`);

  return css
}

async function proxifyStyleAttribute(proxyUrl, rawUrl, node){
  let buffer = node.getAttribute('style')
  buffer = await proxifyCSS(proxyUrl, rawUrl, buffer)
  node.setAttribute('style',  buffer)
  
  return node
}

async function proxifyStyleNode(proxyUrl, rawUrl, node){
  let buffer = node.textContent
  buffer = await proxifyCSS(proxyUrl, rawUrl, buffer)
  node.textContent = buffer

  return node
}

async function proxifyURLNode(proxyUrl, rawUrl, node){
  var link = null;
  
  if (node.href) link = node.href;
  if (node.src) link = node.src;
  
  if(link == null) return;

  link = await proxifyURL(proxyUrl, rawUrl, link);
  // console.log(node.href, node.src, link)
  if (node.src) node.src=link;
  if (node.href) node.href=link;
  return link
}

async function proxifyHTML(proxyUrl, rawUrl, base64url, body){
  const html = new JSDOM(body, {contentType: 'text/html'}), document = html.window.document;

  var promises = [];
  
  for(var node of document.querySelectorAll('*')){
    if (node.getAttribute('nonce')) node.removeAttribute('nonce');
    if (node.getAttribute('integrity')) node.removeAttribute('integrity');
    promises.push(proxifyURLNode(proxyUrl, rawUrl, node));
    if (node.getAttribute('style')) promises.push(proxifyStyleAttribute(proxyUrl, rawUrl, node));
  };
  
  //stuff to do
  for(node of document.querySelectorAll("script, embed, iframe, audio, video, img, input, source, track")){
    if (node.tagName.toLowerCase() == 'script' && node.innerHTML != '') promises.push(proxifyJSNode(node));;
  };

  for(node of document.querySelectorAll("style")){
    promises.push(proxifyStyleNode(proxyUrl, rawUrl, node));
  };

  const inject_config = {
    site_url: proxyUrl,
    url: `${rawUrl}/base64url`
  }
  
  const inject_script = document.createElement('script');     

  inject_script.src = `${proxyUrl}/inject.js`
  inject_script.setAttribute('data-config', btoa(JSON.stringify(inject_config)));

  document.querySelector('head').insertBefore(inject_script, document.querySelector('head').childNodes[0])       

  return Promise.all(promises).then((values) => {
    return html.serialize();
  }).then(output => {
    return output;
  })
}

app.get('/:url', (req, res) => {
  let urlbufferObj = Buffer.from(req.params['url'], "base64");
  let url = urlbufferObj.toString("utf8");
  
  fetch(url).then(response => {
    return response.text();
  }).then(raw_body => {
    var rawUrl;
    if(url.charAt(url.length-1)=="/"){
      rawUrl = new URL(url.substring(0,url.length))
    }else{
      rawUrl = new URL(url)
    }
    return proxifyHTML("https://script.google.com/a/macros/students.lmsd.org/s/AKfycbzxti3jpD9fbBjrGJ47SO-Ka3-LpXEz1NRcjgIvq83F/dev", rawUrl, req.params['url'], raw_body.replace(", minimal-ui", ""))
  }).then(parsed => {
    fs.writeFile("index.html", parsed, function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("The file was saved!");
    }); 
    return res.end(parsed)
  })
})


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function proxifyPost(url, res) {
  var headers
  const b64 = await fetch(url)
  .then((response) => {
    headers = response.headers.raw()
    return response.buffer()
  }).then((buffer) => {
    const b64 = buffer.toString('base64');
    return b64;
  })
  .catch(console.error);
  res.end(JSON.stringify({'sigh': [[headers, b64]]}))
  console.log(b64)
}

app.post("/", (req, res) => {
  var postData = req.body;
  let url = postData[0];
  proxify(url, res)
});

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})