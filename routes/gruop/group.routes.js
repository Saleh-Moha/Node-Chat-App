const ex = require('express')
const groupcontroller = require('../../controllers/groupController')
const authMiddleware = require('../../middelwares/authMiddleware')
const addAdminscontroller = require('../../controllers/Group/addusers.controller')
const router = ex.Router()

router.post('/create', authMiddleware, groupcontroller.creategroup);
router.get('/get', authMiddleware, groupcontroller.getgroups);
router.get('/get/:id', authMiddleware, groupcontroller.getgroup);
router.patch('/update/:id', authMiddleware, groupcontroller.updategroup);
router.post('/addadmin/:id', authMiddleware, addAdminscontroller.Addadmins);
router.post('/addmember/:id', authMiddleware, addAdminscontroller.Addmembers);
router.delete('/deletemember/:id', authMiddleware, addAdminscontroller.Deletemembers);


module.exports = router