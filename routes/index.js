const express = require('express');
const router = express.Router();
const { getIndex } = require("../controllers/index");
const {ensureAuthenticated} = require("../middleware/auth");
router.get('/', ensureAuthenticated, getIndex);

module.exports = router;
