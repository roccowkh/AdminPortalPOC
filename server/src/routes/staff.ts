import express from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../../uploads/staff');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all staff members
router.get('/', 
  authenticateToken,
  async (req, res) => {
    try {
      const { search } = req.query;
      
      let where = {};
      if (search) {
        where = {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { staffId: { contains: search as string, mode: 'insensitive' } }
          ]
        };
      }

      const staff = await prisma.staff.findMany({
        where,
        select: {
          id: true,
          name: true,
          staffId: true,
          pictures: true,
          status: true,
          remarks: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  }
);

// Get staff member by ID
router.get('/:id', 
  authenticateToken,
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const staffMember = await prisma.staff.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          staffId: true,
          pictures: true,
          status: true,
          remarks: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!staffMember) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      res.json(staffMember);
    } catch (error) {
      console.error('Error fetching staff member:', error);
      res.status(500).json({ error: 'Failed to fetch staff member' });
    }
  }
);

// Create staff member
router.post('/', 
  authenticateToken,
  requireAdmin,
  upload.array('pictures', 10), // Allow up to 10 pictures
  [
    body('name').isLength({ min: 2 }),
    body('staffId').isLength({ min: 1 }),
    body('status').isIn(['active', 'inactive']),
    body('remarks').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, staffId, status, remarks } = req.body;
      const pictures = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/staff/${file.filename}`) : [];

      const existingStaff = await prisma.staff.findUnique({
        where: { staffId }
      });

      if (existingStaff) {
        return res.status(400).json({ error: 'Staff with this ID already exists' });
      }

      const staffMember = await prisma.staff.create({
        data: {
          name,
          staffId,
          pictures,
          status,
          remarks
        },
        select: {
          id: true,
          name: true,
          staffId: true,
          pictures: true,
          status: true,
          remarks: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json(staffMember);
    } catch (error) {
      console.error('Error creating staff member:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  }
);

// Update staff member
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  upload.array('pictures', 10), // Allow up to 10 pictures
  [
    param('id').isInt(),
    body('name').optional().isLength({ min: 2 }),
    body('staffId').optional().isLength({ min: 1 }),
    body('status').optional().isIn(['active', 'inactive']),
    body('remarks').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, staffId, status, remarks } = req.body;
      const newPictures = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/staff/${file.filename}`) : undefined;

      const existingStaff = await prisma.staff.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingStaff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      // Check if staffId is being changed and if it already exists
      if (staffId && staffId !== existingStaff.staffId) {
        const staffIdExists = await prisma.staff.findUnique({
          where: { staffId }
        });

        if (staffIdExists) {
          return res.status(400).json({ error: 'Staff with this ID already exists' });
        }
      }

      // If new pictures are uploaded, replace the old ones
      let pictures = existingStaff.pictures;
      if (newPictures !== undefined) {
        // Delete old picture files
        for (const oldPicture of existingStaff.pictures) {
          const picturePath = path.join(__dirname, '..', oldPicture);
          if (fs.existsSync(picturePath)) {
            fs.unlinkSync(picturePath);
          }
        }
        pictures = newPictures;
      }

      const staffMember = await prisma.staff.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(staffId && { staffId }),
          ...(status && { status }),
          ...(newPictures !== undefined && { pictures }),
          ...(remarks !== undefined && { remarks })
        },
        select: {
          id: true,
          name: true,
          staffId: true,
          pictures: true,
          status: true,
          remarks: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json(staffMember);
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  }
);

// Delete staff member
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  [param('id').isInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const staffMember = await prisma.staff.findUnique({
        where: { id: parseInt(id) }
      });

      if (!staffMember) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      // Delete picture files if they exist
      for (const picture of staffMember.pictures) {
        const picturePath = path.join(__dirname, '..', picture);
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
        }
      }

      await prisma.staff.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  }
);

export default router;
