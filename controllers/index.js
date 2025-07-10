const getIndex = async (req, res, next) => {
  try {
    res.render("index");
  } catch (error) {
    next(error);
  }
};

module.exports = {
    getIndex
}
