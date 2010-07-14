var connect = require('connect')
  , ws = require('websocket-server')
  , sys = require('sys')

//nStore in memory emulation (nStore was causing some buggies)
var nStore = (function () {
  var dbs = {}
  function nStoreDB(name) {
    if(dbs[name]) return dbs[name]
    var id = 0
    var rows = {}
    dbs[name] = {
      "save": function(id,data,callback) {
         if(id==null) {
           while(id in rows) {
             id++
           }
           rows[id] = data
         }
         else {
           rows[id] = data
         }
         if(callback) callback(false)
      }
      ,"get": function(id,callback) {
         if(id in rows) {
           callback(false,rows[id])
         }
         else {
           callback("No such key")
         }
      }
    }
    return dbs[name]
  }
  return nStoreDB
})()

var diff = require("./static/diff")
diff=new diff.diff_match_patch()
diff.Diff_Timeout = 0.0
var dbs = {/*id:{db:(store.js).open(id),text:String(),user_count:Number(),users:[]}*/}
var editors = nStore('editors.db');
var server
function startServer() {
  server = ws.createServer({handleEvents: false},connect.createServer(
    connect.staticProvider(__dirname + '/static')
  ))
  server.addListener("connection", function(conn){
    sys.puts("opened connection: "+conn.id);
    conn.addListener("message", function(message){
      sys.puts("<"+conn.id+"> "+message);
      try {
        var msg = JSON.parse(message)
        sys.puts("ACTION: "+msg.action)
        switch(msg.action) {
          case "edit":
            onEdit(msg.editor,conn.id,msg.data)
            break
          case "load":
            onLoad(msg.editor,conn.id)
            break
          case "quit":
            onQuit(msg.editor,conn.id)
            break
        }
      }
      catch(ex) {
        sys.puts("----ERROR----\nWebSocket message is not JSON\n"+String(ex.stack)+"\n----")
      }
    });
  });
  server.listen(8888)
}

function getEditorDb(id,callback) {
  var db = dbs[id]
  if(db) {
    callback(false,db)
  }
  else {
    db = nStore('editors.js/'+String(id)+'.db')
    editors.get(String(id),function(err,doc,meta) {
      if(err) {
        text = ""
        db = dbs[id] = {"db":db,"text":text,"user_count":0,users:[]}
        editors.save(id,db,function(err,meta){
          callback(false,db)
        })
        return
      }
      var text = doc ? doc.text || "" : ""
      db = dbs[id] = {"db":db,"text":text,"user_count":0,users:[]}
      editors.save(id,db,function(err,meta){
        callback(false,db)
      })
    })
  }
}

function getEditorText(id,callback) {
  //make sure the db exists
  getEditorDb(id,function() {
    editors.get(id,function(err,doc,meta){
      if(err) {
        callback(err)
      }
      else {
        callback(false,doc.text || "")
      }
    })
  })
}

function applyDiff(diffs,text) {
  sys.puts(diffs)
  return diff.patch_apply(diff.patch_make(text, diffs),text)[0]
}

function applyEdit(db,editor_id,user_id,diffs) {
  var text = applyDiff(diffs,db.text)
  var data = {time:Date.now(),user:user_id,diff:diffs}
  db.db.save(null,data)

  db.text = text
  editors.get(editor_id,function(err,doc){
    if(err) {
      sys.puts(err)
    }
    else {
      doc.text = text
      editors.save(editor_id,/*JSON.parse*/(doc))
    }
  })
  var users = db.users
  for (var i=0;i<users.length;i++) {
    var user=users[i],data=JSON.stringify({
      "action":"text"
      ,"text":text
    })
    server.send(user,data)
  }
}

//@edit
function onEdit(editor_id,user_id,newText) {
  getEditorText(editor_id,function (err,text) {
    if(err) sys.puts("----ERROR----120",new Error().stack,err,"----")
    else {
      var diffs = diff.diff_main(text,newText)
      getEditorDb(editor_id,function(err,db){
        if(err) sys.puts(err)
        else applyEdit(db,editor_id,user_id,diffs)
      })
    }
  })
}

//@load (add user to editor, send out the text)
function onLoad(editor_id,user_id) {
  getEditorDb(editor_id,function(err,db){
    if (err) sys.puts("----ERROR----134",new Error().stack,err,"EDITOR:"+editor_id,"USER:"+user_id,"----")
    else {
      db.user_count++
      db.users.push(user_id)
      var data=JSON.stringify({
        "action":"text"
        ,"text":db.text
      })
      sys.puts("s@"+user_id+">"+data)
      server.send(user_id,data)
    }
  })
}

//@quit (remove user from editor, close up the db in memory if no users left)
function onQuit(editor_id,user_id) {
  getEditorDb(editor_id,function(err,db){
    if (err) sys.puts("----ERROR----145",new Error().stack,err,"EDITOR:"+editor_id,"USER:"+user_id,"----")
    else {
      db.user_count--
      db.users.splice(db.users.indexOf(user_id),1)
      if (db.user_count == 0) {
        sys.puts("REMOVING EDITOR "+editor_id)
        delete dbs[editor_id]
      }
    }
  })
}

startServer()