const express = require('express');
const router = express.Router();
 
router.get('/', itemsController.getItems);

module.exports = router;