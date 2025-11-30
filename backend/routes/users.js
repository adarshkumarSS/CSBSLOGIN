const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// All user routes require HOD authentication
router.use(auth.verifyToken);
router.use(auth.requireHod);

// Search users with filters
router.get('/search', userController.searchUsers);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
