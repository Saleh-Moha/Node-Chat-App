const ex = require('express')
const controller = require('../controllers/auth')

const router = ex.Router()

router.post('/sign-up', controller.signup)
router.post('/log-in', controller.login)



module.exports = router