import express from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', 
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user has a password and if it matches
      if (!user.password) {
        // For demo purposes, check against hardcoded credentials
        if (email === 'admin@example.com' && password === 'admin123') {
          const token = jwt.sign(
            { 
              id: user.id, 
              email: user.email, 
              role: user.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '15m' }
          );

          const refreshToken = jwt.sign(
            { 
              id: user.id, 
              email: user.email 
            },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '7d' }
          );

          // Store refresh token in database
          await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
          });

          return res.json({
            token,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          });
        } else {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      // If user has a password, verify it
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email 
        },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
      );

      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Token refresh endpoint
router.post('/refresh', 
  [
    body('refreshToken').isString().withMessage('Refresh token is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
      ) as any;

      // Check if refresh token exists in database
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.id,
          refreshToken: refreshToken
        }
      });

      if (!user) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );

      res.json({
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
  }
);

// Logout endpoint (invalidate refresh token)
router.post('/logout', 
  [
    body('refreshToken').isString().withMessage('Refresh token is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { refreshToken } = req.body;
      
      // Remove refresh token from database
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
);

export default router; 