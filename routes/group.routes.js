const ex = require('express')
const controller = require('../controllers/groupController')
const authMiddleware = require('../middelwares/authMiddleware')
const roles = require('../middelwares/roles')
const router = ex.Router()

router.post('/create', authMiddleware, controller.creategroup);
router.get('/get', authMiddleware, controller.getgroups);
router.get('/get/:id', authMiddleware, controller.getgroup);
router.patch('/update/:id', authMiddleware, controller.updategroup);

module.exports = router