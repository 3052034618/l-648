import { Router } from 'express'
import { register, login, logout, refresh } from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authenticate, logout)
router.post('/refresh', refresh)

export default router
