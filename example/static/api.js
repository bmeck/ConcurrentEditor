//@theory
Synchronizer = function(){}


//@use
SynchronizedText = function(name) {
  this.name = name
  this.id = 0
  this.clients = []
  this.doc = ""
}
SynchronizedText.prototype = new Synchronizer


//TODO: Resolve merge errors...
SynchronizedText.prototype.save = function(doc,callback) {
  this.doc = doc
  this.sync()
  if(callback) callback(false)
}


SynchronizedText.prototype.sync = function(callback) {
  var name = this.name
    , doc = this.doc
  this.clients.forEach(function(client){
    client.websocket.send(name+"@"+doc)
  })
  if(callback) callback(false)
}


SynchronizedText.prototype.get = function(callback) {
  if(callback) callback(false,this.doc)
}


SynchronizedText.prototype.open = function(websocket,callback) {
  var $this = this
    , listener = function(msg) {
    msg = String(msg.data)
    var index = msg.indexOf("@")
    if(index !== -1) {
      var target = msg.slice(0,index)
      if(target === $this.name) {
        var doc = msg.slice(index+1)
        $this.doc = doc
        if($this.onupdate) $this.onupdate(doc)
      }
    }
  }
  this.clients.push({websocket:websocket,listener:listener})
  websocket.addEventListener("message",listener)
  if(callback) callback(false)
}


SynchronizedText.prototype.close = function(websocket,callback) {
  var notFound = true
  this.clients.forEach(function(client){
    if(client.websocket === websocket) {
      notFound = false
      websocket.removeEventListener(client.listener)
    }
  })
  if(callback) callback(notFound)
}