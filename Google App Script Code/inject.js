var site_url = "https://script.google.com/a/macros/students.lmsd.org/s/AKfycbzxti3jpD9fbBjrGJ47SO-Ka3-LpXEz1NRcjgIvq83F/dev"
var proxyConfig = JSON.parse(atob(document.currentScript.getAttribute('data-config')));
proxyConfig.url = new URL(proxyConfig.url)
proxyConfig.site_url = new URL(proxyConfig.site_url)


var proxify = {
   url: (url, type) => {
       return `${proxyConfig.site_url}/web/${btoa(url)}`
   }
};


window.proxyLocation = new Proxy({}, {
   set(obj, prop, value) {
       if (prop == 'assign' || prop == 'reload' || prop == 'replace' || prop == 'toString') return;
       return location[prop] = proxify.url(value)
   },
   get(obj, prop) {
       if (prop == 'assign' || prop == 'reload' || prop == 'replace' || prop == 'toString') return {
           assign: arg => window.location.assign(proxify.url(arg)),
           replace: arg => window.location.replace(proxify.url(arg)),
           reload: () => window.location.reload(),
           toString: () => {
               return proxyConfig.url.href
           }
       } [prop];
       else return proxyConfig.url[prop];
   }
});


window.document.proxyLocation = window.proxyLocation;


function proxifiedOpen(target, f, a) {
   target.url = a[0]
   return f(a)


}


proxify.elementHTML = element_array => {
   element_array.forEach(element => {
       Object.defineProperty(element.prototype, 'innerHTML', {
           set(value) {
               const elem = new DOMParser().parseFromString(Object.getOwnPropertyDescriptor(window.Element.prototype, "outerHTML").get.call(this), 'text/html').body.querySelectorAll('*')[0];
               Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML").set.call(elem, value);
               elem.querySelectorAll("script[src], iframe[src], embed[src], audio[src], img[src], input[src], source[src], track[src], video[src]").forEach(node => node.setAttribute('src', node.getAttribute('src')));
               elem.querySelectorAll("object[data]").forEach(node => node.setAttribute('data', node.getAttribute('data')));
               elem.querySelectorAll("a[href], link[href], area[href").forEach(node => node.setAttribute('href', node.getAttribute('href')));
               return Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML").set.call(this, elem.innerHTML);
           },
           get() {
               return Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML").get.call(this);
           }
       });
       Object.defineProperty(element.prototype, 'outerHTML', {
           set(value) {
               const elem = new DOMParser().parseFromString(Object.getOwnPropertyDescriptor(window.Element.prototype, "outerHTML").get.call(this), 'text/html').body;
               Object.getOwnPropertyDescriptor(window.Element.prototype, "outerHTML").set.call(elem.querySelectorAll('*')[0], value);
               elem.querySelectorAll("script[src], iframe[src], embed[src], audio[src], img[src], input[src], source[src], track[src], video[src]").forEach(node => node.setAttribute('src', node.getAttribute('src')));
               elem.querySelectorAll("object[data]").forEach(node => node.setAttribute('data', node.getAttribute('data')));
               elem.querySelectorAll("a[href], link[href], area[href").forEach(node => node.setAttribute('href', node.getAttribute('href')));
               return Object.getOwnPropertyDescriptor(window.Element.prototype, "outerHTML").set.call(this, elem.innerHTML);
           },
           get() {
               return Object.getOwnPropertyDescriptor(window.Element.prototype, "outerHTML").get.call(this);
           }
       });
   });
};


proxify.elementAttribute = (element_array, attribute_array) => {
   element_array.forEach(element => {
       if (element == window.HTMLScriptElement) {
           Object.defineProperty(element.prototype, 'integrity', {
               set(value) {
                   return this.removeAttribute('integrity')
               },
               get() {
                   return this.getAttribute('integrity');
               }
           });
           Object.defineProperty(element.prototype, 'nonce', {
               set(value) {
                   return this.removeAttribute('nonce')
               },
               get() {
                   return this.getAttribute('nonce');
               }
           });
       }


       element.prototype.setAttribute = new Proxy(element.prototype.setAttribute, {
           apply(target, thisArg, [element_attribute, value]) {
               attribute_array.forEach(array_attribute => {
                   if (array_attribute == 'srcset' && element_attribute.toLowerCase() == array_attribute) {
                       var arr = [];


                       value.split(',').forEach(url => {
                           url = url.trimStart().split(' ');
                           url[0] = proxify.url_http(url[0]);
                           arr.push(url.join(' '));
                       });


                       return Reflect.apply(target, thisArg, [element_attribute, arr.join(', ')]);
                   };


                   // General attribute rewriting.
                   if (element_attribute.toLowerCase() == array_attribute) value = proxify.url_http(value);
               });
               return Reflect.apply(target, thisArg, [element_attribute, value]);
           }
       });


       attribute_array.forEach(attribute => {


           Object.defineProperty(element.prototype, attribute, {
               set(value) {
                   return this.setAttribute(attribute, value);
               },
               get() {
                   return this.getAttribute(attribute);
               }
           });


       });


   });
};




proxify.elementHTML([window.HTMLDivElement]);
proxify.elementAttribute([window.HTMLAnchorElement, window.HTMLLinkElement, window.HTMLAreaElement], ['href']);
proxify.elementAttribute([window.HTMLScriptElement, window.HTMLIFrameElement, window.HTMLEmbedElement, window.HTMLAudioElement, window.HTMLInputElement, window.HTMLTrackElement, window.HTMLVideoElement], ['src']);
proxify.elementAttribute([window.HTMLImageElement, HTMLSourceElement], ['src', 'srcset']);
proxify.elementAttribute([window.HTMLObjectElement], ['data']);
proxify.elementAttribute([window.HTMLFormElement], ['action']);


// History method proxifying.
window.History.prototype.pushState = new Proxy(window.History.prototype.pushState, {
   apply(target, thisArg, args) {


       // Discord support
       if (proxyConfig.url.origin == atob('aHR0cHM6Ly9kaXNjb3JkLmNvbQ==') && args[2] == '/app') {
           args[2] = proxify.url(args[2])
           Reflect.apply(target, thisArg, args);
           return window.location.reload();
       }


       args[2] = proxify.url(args[2])
       return Reflect.apply(target, thisArg, args)
   }
});


window.History.prototype.replaceState = new Proxy(window.History.prototype.replaceState, {
   apply(target, thisArg, args) {
       args[2] = proxify.url(args[2])
       return Reflect.apply(target, thisArg, args)
   }
});


window.Worker = new Proxy(window.Worker, {
   construct(target, args) {
       args[0] = proxify.url(args[0]);
       return Reflect.construct(target, args);
   }
});


Object.defineProperty(document, 'cookie', {
           get() {
               var cookie = Object.getOwnPropertyDescriptor(window.Document.prototype, 'cookie').get.call(this),
                   new_cookie = [],
                   cookie_array = cookie.split('; ');


               cookie_array.forEach(cookie => {


                   const cookie_name = cookie.split('=').splice(0, 1).join(),
                       cookie_value = cookie.split('=').splice(1).join();


                   if (proxyConfig.url.hostname.includes(cookie_name.split('@').splice(1).join())) new_cookie.push(cookie_name.split('@').splice(0, 1).join() + '=' + cookie_value);


               });
               return new_cookie.join('; ');;
           },
           set(value) {
               return Object.getOwnPropertyDescriptor(window.Document.prototype, 'cookie').set.call(this, value);
           }
       })


let request_queue = []
let url_queue = []


function b64toBlob(b64Data, contentType='', sliceSize=512){
 const byteCharacters = atob(b64Data);
 const byteArrays = [];


 for(let offset = 0; !(offset >= byteCharacters.length); offset += sliceSize) {
   const slice = byteCharacters.slice(offset, offset + sliceSize);


   const byteNumbers = new Array(slice.length);
   for (let i = 0; !(i >= slice.length); i++) {
     byteNumbers[i] = slice.charCodeAt(i);
   }


   const byteArray = new Uint8Array(byteNumbers);
   byteArrays.push(byteArray);
 }
  
 const blob = new Blob(byteArrays, {type: contentType});
 return blob;
}


function sendRequestsSuccess(raw_data){
 url_queue = []
 let data = JSON.parse(raw_data)
 console.log(data)


 for(var i=0; !(i>=data['sigh'].length); i++){
   [headers, raw] = data['sigh'][i]
   console.log(headers, raw)
   let blob = b64toBlob(raw)
   let response = new Response(blob, headers)
   request_queue[i][1](response)
 }


 request_queue = []
}


function sendRequestsFail(error){
 console.log(error)
}


function generatePromise(f, url, options){
 let promise = new Promise(function(resolve, reject) {
     request_queue.push([f, resolve, reject, url, options])
     url_queue.push(url, options)
 });
 return promise;
}


function sendRequests(){
 if(request_queue.length>0){
   google.script.run.withSuccessHandler(sendRequestsSuccess).withFailureHandler(sendRequestsFail).sendProxiedRequest(url_queue)
 }
}


setInterval(sendRequests, 3000);


window.fetch = function(url, options) {
 return generatePromise("fetch", url, options)
};


function proxifiedOpen(target, f, a){
 target.url = a[0]
 return f(a)
 }


window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
 construct(target, args) {
   let out = new target(...args);
   out.original_open = out.open,
   out.original_send = out.send,


   out.open = (method, url, async = false, user = null, password = null) => {
     this.method = method;
     this.url = url;
     original_open(..arguments)
   }


   out.send = new Proxy(out.original_send, {
     apply(target, thisArg, argumentsList) {
       var body;
       if(argumentsList.size()>0){
         body = null;
       }else{
         body = argumentsList[0]
       }
     }
   })


   return out;
 },
})


document.currentScript.remove();
