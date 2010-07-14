var requirements = 2
  , wsURL = "ws://localhost:8888/"
  , connection = new WebSocket(wsURL)
  , editor
  , editor_id = 1
function wsInit() {
  connection.send(JSON.stringify({"action":"load","editor":editor_id}))
  console.log("opened")
  requirements--
  setup()
}
function wsOnClose() {
  editor.disabled = true
  console.log("closed")
  //try to reconnect
  connection = new WebSocket(wsURL)
  requirements = 1
  connection.onopen = wsInit
  connection.onclose = function () {
    console.log("connection rejected trying again in 10 seconds")
    setTimeout(wsOnClose,10*1000)
  }
}
connection.onopen = wsInit
window.onload = function() {
  editor = document.body.getElementsByTagName("textarea")[0]
  editor.disabled = true
  requirements--
  setup()
}
function setup() {
  if(requirements === 0) {
    var text = ""
    connection.onmessage = function(evt) {
      var msg = JSON.parse(evt.data)
      if(msg.action == "text") {
        text = editor.value = msg.text
        editor.disabled = false
        console.log("s> "+text)
      }
    }
    connection.onclose = wsOnClose
    //@edit
    editor.onkeypress = function(e) {
      if(!editor.disabled)
      //timeout since cant tell future text of a textarea (way to go w3...)
      setTimeout(function() {
        if(editor.value != text) {
          text = editor.value
          connection.send(JSON.stringify({"action":"edit","editor":editor_id,"data":text}))
          console.log("c> "+text)
        }
      },0)
    }
  }
}