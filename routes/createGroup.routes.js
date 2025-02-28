const ex = require('express')
const controller = require('../controllers/createGroup')
const authMiddleware = require('../middelwares/authMiddleware')
const router = ex.Router()

router.post('/create', authMiddleware, controller.creategroup);
router.get('/get', authMiddleware, controller.getgroups);
router.get('/get/:id', authMiddleware, controller.getgroup);


module.exports = router