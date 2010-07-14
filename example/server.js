var connect = require('connect')
  , ws = require('websocket-server')
  , sys = require('sys')
  , SynchronizedText = require('./api').SynchronizedText

var input = new SynchronizedText('input')
  , input_color = new SynchronizedText('input.color')
input.onupdate = function(doc) {
  input_color.save(doc)
}
var texts = [
  new SynchronizedText('textarea')
  , input
  , input_color
]

server = ws.createServer(
  {
    //let http fall through to sub-server
    handleEvents: false
  }
  , connect.createServer(
    connect.staticProvider(__dirname + '/static')
  )
)
server.addListener("connection", function (conn) {
  sys.puts("opened connection: "+conn.id);
  //sys.puts(Object.keys(conn))
  conn.addListener("message", function(message){
    sys.puts("<"+conn.id+"> "+message);
  });
  //registration w/ text
  texts.forEach(function(text){text.open(conn)})
  //close causes unregistration w/ text
  conn.addListener("close", function () {
    texts.forEach(function(text){text.close(conn)})
  })
})
server.listen(8888)