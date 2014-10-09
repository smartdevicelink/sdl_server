// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {

  var fox        = require('foxjs'),
      crypto     = fox.crypto,
      sender     = fox.send,
      auth       = fox.authentication,
      model      = fox.model,
      multiparty = require('multiparty'),                                 // Pull in the application schema
      fs         = require('fs'),
      path       = require('path');


  /* ************************************************** *
  * ******************** Routes and Permissions
  * ************************************************** */
  app.post('/upload/appIcon', uploadAppIcon);


  /* ************************************************** *
  * ******************** Route Methods
  * ************************************************** */
  function uploadAppIcon(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
      if(err) return next(err);

      if(files.file && files.file.length > 0) {
        // Generate a unique name for file to prevent collisions.
        crypto.generateKey(12, function(err, hash) {
          if(err) return next(err);

          var uploadPath = config.paths.clientAssetsImgUploadsFolder + hash + path.extname(files.file[0].originalFilename);

          copyFile(files.file[0].path, uploadPath, function(err) {
            if(err) return next(err);

            // Icon path is relative to the client application directory.
            var iconPath = '/' + path.relative(config.paths.clientDirectory, uploadPath);
            console.log("Icon path: " + iconPath);

            sender.setResponse({iconPath: iconPath}, req, res, next);
          });
        });
      } else {
        var error = new Error('No files to upload.');
        next(error);
      }
    });
  }

  function copyFile(source, target, cb) {
    var cbCalled = false;
    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
      done(err);
    });

    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
      done(err);
    });
    wr.on("close", function(ex) {
      done();
    });

    rd.pipe(wr);

    function done(err) {
      if (!cbCalled) {
        cb(err);
        cbCalled = true;
      }
    }
  }
};
