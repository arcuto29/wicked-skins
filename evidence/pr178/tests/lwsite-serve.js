const http=require("http"),fs=require("fs"),path=require("path");
http.createServer((req,res)=>{ res.setHeader("content-type","text/html"); res.end(fs.readFileSync(path.join(__dirname,"index.html"))); }).listen(8123,"127.0.0.1");
