import { Router } from 'express'
import { getCurrentUser, getUserById, getAllUsers, updateUser, deleteUser } from '../controllers/userController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/me', authenticate, getCurrentUser)
router.get('/:id', authenticate, getUserById)
router.get('/', authenticate, requireAdmin, getAllUsers)
router.put('/:id', authenticate, updateUser)
router.delete('/:id', authenticate, requireAdmin, deleteUser)

export default router
