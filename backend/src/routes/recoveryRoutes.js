const express = require('express');
const router = express.Router();
const { savePassphrase, recoverIdentity } = require('../controllers/recoveryController');

router.post('/save', savePassphrase);
router.post('/recover', recoverIdentity);

module.exports = router;
