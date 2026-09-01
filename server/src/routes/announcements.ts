/**
 * @file announcements.ts
 * @description Handles all announcement-related API endpoints
 * 
 * Endpoints:
 * - GET    /announcements      - List all announcements
 * - GET    /announcements/:id  - Get announcement by ID
 * - POST   /announcements      - Create new announcement
 * - PUT    /announcements/:id  - Update announcement
 * - DELETE /announcements/:id  - Delete announcement
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AnnouncementSchema } from 'shared/src/types/announcement'
import {
  createAnnouncement,
  findAnnouncementById,
  findAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} from '../db/database'

export const announcementRoutes = new Hono()
  /**
   * List all announcements
   */
  .get('/', async (c) => {
    try {
      const announcements = await findAllAnnouncements()
      return c.json({ data: announcements, count: announcements.length })
    } catch (error) {
      console.error('Error listing announcements:', error)
      return c.json({ error: 'Failed to list announcements' }, 500)
    }
  })

  /**
   * Get announcement by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const announcement = await findAnnouncementById(id)
      if (!announcement) {
        return c.json({ error: 'Announcement not found' }, 404)
      }
      return c.json({ data: announcement })
    } catch (error) {
      console.error('Error getting announcement:', error)
      return c.json({ error: 'Failed to get announcement' }, 500)
    }
  })

  /**
   * Create new announcement
   */
  .post('/', zValidator('json', AnnouncementSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const announcement = await createAnnouncement(data)
      return c.json({ data: announcement }, 201)
    } catch (error) {
      console.error('Error creating announcement:', error)
      return c.json({ error: 'Failed to create announcement' }, 500)
    }
  })

  /**
   * Update announcement
   */
  .put('/:id', zValidator('json', AnnouncementSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const announcement = await updateAnnouncement(id, data)
      if (!announcement) {
        return c.json({ error: 'Announcement not found' }, 404)
      }
      return c.json({ data: announcement })
    } catch (error) {
      console.error('Error updating announcement:', error)
      return c.json({ error: 'Failed to update announcement' }, 500)
    }
  })

  /**
   * Delete announcement
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await deleteAnnouncement(id)
      if (!deleted) {
        return c.json({ error: 'Announcement not found' }, 404)
      }
      return c.json({ message: 'Announcement deleted successfully' })
    } catch (error) {
      console.error('Error deleting announcement:', error)
      return c.json({ error: 'Failed to delete announcement' }, 500)
    }
  })
