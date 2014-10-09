// ~> Response
// ~A Scott Smereka

module.exports = function(app, db, config) {
  var fox = require('foxjs'),
      sender = fox.send;
  
  app.all('/*', sendResponse);

  function sendResponse(req, res, next) {
    if(sender.isRequestHandled(req)) {
      var response = sender.getResponse(res);
      
      if(response === undefined || response === null) {
        return sender.createAndSendError("Response is undefined.", 500, req, res, next);
      } 

      sender.sendResponse(response, req, res, next);
    } else {
      next();
    }
  }
};