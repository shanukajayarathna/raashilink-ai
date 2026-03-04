const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

router.get('/profile',        protect, (req, res) => res.json({ message: 'Get profile - TODO' }));
router.put('/profile',        protect, (req, res) => res.json({ message: 'Update profile - TODO' }));

module.exports = router;