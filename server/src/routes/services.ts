import express from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all services
router.get('/', 
  authenticateToken,
  [
    query('isActive').optional().isBoolean(),
    query('search').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { isActive, search } = req.query;
      
      const where: any = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const services = await prisma.service.findMany({
        where,
        orderBy: {
          name: 'asc'
        }
      });

      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  }
);

// Get single service
router.get('/:id', 
  authenticateToken,
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const service = await prisma.service.findUnique({
        where: { id }
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  }
);

// Create service
router.post('/', 
  authenticateToken,
  requireAdmin,
  [
    body('name').isLength({ min: 2 }),
    body('description').optional().isString(),
    body('duration').isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, description, duration, price, isActive = true } = req.body;

      const service = await prisma.service.create({
        data: {
          name,
          description,
          duration,
          price,
          isActive
        }
      });

      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
);

// Update service
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  [
    param('id').isString().notEmpty(),
    body('name').optional().isLength({ min: 2 }),
    body('description').optional().isString(),
    body('duration').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, duration, price, isActive } = req.body;

      const existingService = await prisma.service.findUnique({
        where: { id }
      });

      if (!existingService) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = await prisma.service.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(duration && { duration }),
          ...(price !== undefined && { price }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  }
);

// Delete service
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

      const service = await prisma.service.findUnique({
        where: { id }
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Check if service is used in any bookings
      const bookingsWithService = await prisma.bookingsOnServices.findFirst({
        where: { serviceId: id }
      });

      if (bookingsWithService) {
        return res.status(400).json({ 
          error: 'Cannot delete service that is used in bookings. Deactivate it instead.' 
        });
      }

      await prisma.service.delete({
        where: { id }
      });

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  }
);

export default router; 