import { Hono } from 'hono'
import { Effect } from 'effect'
import { AnnouncementSchema, AnnouncementInput, makePartial } from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { AnnouncementRepo } from '../services/AnnouncementRepo'

const AnnouncementUpdateSchema = makePartial(AnnouncementInput.fields)

export const announcementRoutes = new Hono()
  /**
   * List all announcements
   */
  .get('/', async (c) => {
    try {
      const announcements = await appRuntime.runPromise(
        AnnouncementRepo.use((repo) => repo.findAll())
      )
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
      const announcement = await appRuntime.runPromise(
        AnnouncementRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
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
  .post('/', effectValidator('json', AnnouncementSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const announcement = await appRuntime.runPromise(
        AnnouncementRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: announcement }, 201)
    } catch (error) {
      console.error('Error creating announcement:', error)
      return c.json({ error: 'Failed to create announcement' }, 500)
    }
  })

  /**
   * Update announcement
   */
  .put('/:id', effectValidator('json', AnnouncementUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const announcement = await appRuntime.runPromise(
        AnnouncementRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
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
      const deleted = await appRuntime.runPromise(
        AnnouncementRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Announcement not found' }, 404)
      }
      return c.json({ message: 'Announcement deleted successfully' })
    } catch (error) {
      console.error('Error deleting announcement:', error)
      return c.json({ error: 'Failed to delete announcement' }, 500)
    }
  })
