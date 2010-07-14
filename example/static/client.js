//make an input match a SynchronizedText on the server
function SyncInput(element,websocket,name) {
  var sync = new SynchronizedText(name)
  sync.open(websocket)
  sync.onupdate = function(doc) {
    element.disabled = false
    element.value = doc
  }
  element.onkeydown = function(e) {
    if(!element.disabled) {
      setTimeout(function() {
        sync.get(function(err,doc) {
          if(err) console.error(err)
          else if(doc !== element.value) sync.save(element.value)
        })
      },0)
    }
  }
}

window.addEventListener("load",function(){
  var connection = new WebSocket("ws://localhost:8888")
  var input = document.getElementsByTagName("input")[0]
  connection.onopen = function() {
    SyncInput(
      document.getElementsByTagName("textarea")[0]
      , connection
      , "textarea"
    )
    SyncInput(
      document.getElementsByTagName("input")[0]
      , connection
      , "input"
    )
  }
  var color = new SynchronizedText('input.color')
  color.open(connection)
  color.onupdate = function(doc) {
    input.style.color = doc
  }
})