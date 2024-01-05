var site_url = "https://script.google.com/a/macros/students.lmsd.org/s/AKfycbyTHJxPFrp9IFzjnV3VIkUoSbqPKdeXMuC38dA-50U/dev"
var repl_url = "https://fetch-rewriting.nathandonagi.repl.co"


function doGet(e) {
 var path = e.pathInfo


 if(path == null){
   return HtmlService.createTemplateFromFile('index').evaluate();
 }


 if(path == "inject.js"){
     return ContentService.createTextOutput(HtmlService.createHtmlOutputFromFile(path).getContent()).setMimeType(ContentService.MimeType.JAVASCRIPT);
 }
}


function sendProxiedRequest(url_queue){
 var options = {
   'method' : 'post',
   'contentType': 'application/json',
   'payload' : JSON.stringify(url_queue)
 };
 return UrlFetchApp.fetch(repl_url, options).getContentText();
}
