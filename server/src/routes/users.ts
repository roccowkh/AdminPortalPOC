import express from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', 
  authenticateToken,
  [
    query('role').optional().isIn(['ADMIN', 'USER']),
    query('search').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { role, search } = req.query;
      
      const where: any = {};
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get single user
router.get('/:id', 
  authenticateToken,
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// Create user
router.post('/', 
  authenticateToken,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('name').isLength({ min: 2 }),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['ADMIN', 'USER']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, name, phone, role = 'USER' } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          role
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Update user
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  [
    param('id').isString().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('name').optional().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['ADMIN', 'USER']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name, phone, role } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });

        if (emailExists) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
          ...(role && { role })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Delete user
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.user.delete({
        where: { id }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router; 