import express from 'express';
import { body, query, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';

const router = express.Router();
const prisma = new PrismaClient();

// Get all bookings with optional filters
router.get('/', 
  authenticateToken,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
    query('userId').optional().isString(),
    query('serviceId').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startDate, endDate, status, userId, serviceId } = req.query;
      
      const where: any = {};
      
      if (startDate && endDate) {
        where.startTime = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }
      
      if (status) {
        where.status = status;
      }
      
      if (userId) {
        where.users = {
          some: {
            userId: userId as string
          }
        };
      }
      
      if (serviceId) {
        where.services = {
          some: {
            serviceId: serviceId as string
          }
        };
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }
);

// Get bookings for calendar view (weekly)
router.get('/calendar', 
  authenticateToken,
  [
    query('date').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const date = req.query.date ? parseISO(req.query.date as string) : new Date();
      const startOfWeekDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      const endOfWeekDate = endOfWeek(date, { weekStartsOn: 1 });

      const bookings = await prisma.booking.findMany({
        where: {
          startTime: {
            gte: startOfWeekDate,
            lte: endOfWeekDate
          }
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Format for calendar
      const calendarBookings = bookings.map(booking => ({
        id: booking.id,
        title: `${booking.users[0]?.user.name || 'Unknown'} - ${booking.services[0]?.service.name || 'Unknown Service'}`,
        start: booking.startTime,
        end: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        users: booking.users.map(u => u.user),
        services: booking.services.map(s => s.service)
      }));

      res.json(calendarBookings);
    } catch (error) {
      console.error('Error fetching calendar bookings:', error);
      res.status(500).json({ error: 'Failed to fetch calendar bookings' });
    }
  }
);

// Get single booking
router.get('/:id', 
  authenticateToken,
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ error: 'Failed to fetch booking' });
    }
  }
);

// Create new booking
router.post('/', 
  authenticateToken,
  [
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('userIds').isArray({ min: 1 }),
    body('userIds.*').isString(),
    body('serviceIds').isArray({ min: 1 }),
    body('serviceIds.*').isString(),
    body('notes').optional().isString(),
    body('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startTime, endTime, userIds, serviceIds, notes, status = 'CONFIRMED' } = req.body;

      // Check for conflicts
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          OR: [
            {
              startTime: {
                lt: new Date(endTime),
                gte: new Date(startTime)
              }
            },
            {
              endTime: {
                gt: new Date(startTime),
                lte: new Date(endTime)
              }
            }
          ]
        }
      });

      if (conflictingBooking) {
        return res.status(409).json({ error: 'Time slot conflicts with existing booking' });
      }

      // Create booking with relations
      const booking = await prisma.booking.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status,
          notes,
          users: {
            create: userIds.map((userId: string) => ({
              userId
            }))
          },
          services: {
            create: serviceIds.map((serviceId: string) => ({
              serviceId
            }))
          }
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

// Update booking
router.put('/:id', 
  authenticateToken,
  [
    param('id').isString().notEmpty(),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
    body('userIds').optional().isArray(),
    body('userIds.*').optional().isString(),
    body('serviceIds').optional().isArray(),
    body('serviceIds.*').optional().isString(),
    body('notes').optional().isString(),
    body('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startTime, endTime, userIds, serviceIds, notes, status } = req.body;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id }
      });

      if (!existingBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check for conflicts (excluding current booking)
      if (startTime && endTime) {
        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            id: { not: id },
            OR: [
              {
                startTime: {
                  lt: new Date(endTime),
                  gte: new Date(startTime)
                }
              },
              {
                endTime: {
                  gt: new Date(startTime),
                  lte: new Date(endTime)
                }
              }
            ]
          }
        });

        if (conflictingBooking) {
          return res.status(409).json({ error: 'Time slot conflicts with existing booking' });
        }
      }

      // Update booking
      const updateData: any = {};
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (notes !== undefined) updateData.notes = notes;
      if (status) updateData.status = status;

      const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        }
      });

      // Update relations if provided
      if (userIds) {
        await prisma.bookingsOnUsers.deleteMany({
          where: { bookingId: id }
        });
        await prisma.bookingsOnUsers.createMany({
          data: userIds.map((userId: string) => ({
            bookingId: id,
            userId
          }))
        });
      }

      if (serviceIds) {
        await prisma.bookingsOnServices.deleteMany({
          where: { bookingId: id }
        });
        await prisma.bookingsOnServices.createMany({
          data: serviceIds.map((serviceId: string) => ({
            bookingId: id,
            serviceId
          }))
        });
      }

      // Fetch updated booking with relations
      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true
                }
              }
            }
          }
        }
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  }
);

// Delete booking
router.delete('/:id', 
  authenticateToken,
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id }
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      await prisma.booking.delete({
        where: { id }
      });

      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ error: 'Failed to delete booking' });
    }
  }
);

export default router; 