# ConcurrentEditor

## Requirements
 * node-websocket-server
 * example requires connect

## Files

 * lib/client/api.js
include in your web page

    <script src="...">
 * lib/server/api.js
include on your server

    require(...)

## new Synchronizer()

### Synchronizer.prototype.sync(callback/*(err)*/)

 * client:
save(...) with all server connections

 * server:
broadcast doc to all clients

### Synchronizer.prototype.save(doc_or_stream,callback/*(err)*/)

 * client:
update the server to contain this text

 * server:
set the doc to the document or stream provided and broadcast results

### Synchronizer.prototype.get(callback/*(err,doc)*/)

grab the doc as currently known

### Synchronizer.prototype.open(websocket,callback/*(err)*/)

attach the synchronizer to the given websocket

### Synchronizer.prototype.close(websocket,callback/*(err)*/)

remove the synchronizer on the given websocket

### Synchronizer.onupdate(doc)

fires whenever doc is updated

## new TextSynchronizer(name)

creates a text synchronizer that uses a String document and is accessable by name from both ends.