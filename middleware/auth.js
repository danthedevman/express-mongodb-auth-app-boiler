function ensureAuthenticated(req, res, next) {
    try {
      if (req.isAuthenticated()) {
        res.locals.user = req.user;
        return next();
      };
      res.redirect("/auth/login");
    } catch (error) {
      res.redirect("/auth/login");
    }
  }
  
  module.exports = {
    ensureAuthenticated,
  };
  