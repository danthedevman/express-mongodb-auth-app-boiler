function ensureAuthenticated(req, res, next) {
    try {
      if (req.isAuthenticated()) {
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
  