exports.build = function(locale, code) {
  var err = new Error(locale);
  err.status = code || 500;
  return err;
};