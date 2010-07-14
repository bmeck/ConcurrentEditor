//@theory
var Synchronizer = exports.Synchronizer = function Synchronizer() {
  //this.sockets = []
  //this.doc = undefined
}


//update all clients to current value
Synchronizer.prototype.sync = function(callback/*(err)*/) {
  //this.sockets.forEach(socket) {socket.write(this.doc)}
  //callback(false)
}


//someone posts an update
Synchronizer.prototype.save = function(doc_or_stream,callback/*(err)*/) {
  //this.doc = doc
  //callback(false)
}


//someone requests doc
Synchronizer.prototype.get = function(callback/*(err,doc)*/) {
  //callback(false,this.doc)
}


//client connects
Synchronizer.prototype.open = function(websocket,callback/*(err)*/) {
  //callback(EventEmitter)
  // -edit
  // -open
  // -quit
}


//client closes
Synchronizer.prototype.close = function(websocket,callback/*(err)*/) {
  //callback()
}


//@use
var SynchronizedText = exports.SynchronizedText = function SynchronizedText(name) {
  this.name = name
  this.id = 0
  this.clients = []
  this.doc = ""
}
SynchronizedText.prototype = new Synchronizer


SynchronizedText.prototype.sync = function(callback) {
  var $this = this
  this.clients.forEach(function(client){
    var data = $this.name+"@"+$this.doc
    client.websocket.write(data)
  })
  if(callback) callback(false)
}


//TODO: Resolve merge errors...
SynchronizedText.prototype.save = function(doc,callback) {
  if(typeof doc === "string") {
    this.doc = doc
    this.sync()
    if(callback) callback(false)
    if(this.onupdate) this.onupdate(doc)
  }
  else {
    var _tmp = String()
      , $this = this
    doc.addListener("data",function(chunk){_tmp += String(chunk)})
    doc.addListener("close",function(){
      $this.doc = _tmp
      $this.sync()
      if(callback) callback(false)
      if($this.onupdate) $this.onupdate(_tmp)
    })
  }
}


SynchronizedText.prototype.get = function(callback) {
  if(callback) callback(false,this.doc)
}


SynchronizedText.prototype.open = function(websocket,callback) {
  var $this = this
    , listener = function(chunk) {
    chunk = String(chunk)
    var index = chunk.indexOf("@")
    if(index !== -1) {
      var target = chunk.slice(0,index)
      if(target === $this.name) {
        var doc = $this.doc = chunk.slice(index+1)
        $this.sync()
        if($this.onupdate) $this.onupdate(doc)
      }
    }
  }
  this.clients.push({websocket:websocket,listener:listener})
  websocket.addListener("message",listener)
  var data = this.name+"@"+this.doc
  websocket.write(data)
  if(callback) callback(false)
}


SynchronizedText.prototype.close = function(websocket,callback) {
  var notFound = true
  this.clients.forEach(function(client){
    if(client.websocket === websocket) {
      notFound = false
      websocket.removeListener("message",client.listener)
    }
  })
  if(callback) callback(notFound)
}