import { Router } from 'express';
import {
  createJournalSection,
  getJournalSections,
  getJournalSection,
  updateJournalSection,
  deleteJournalSection,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
  addPageBreak,
  removePageBreak,
  getAvailableContent,
  getJournalViewerData,
  getJournalYears
} from '../controllers/journalController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to editor routes (not viewer routes)
router.use((req, res, next) => {
  // Skip authentication for public viewer routes
  if (req.path.startsWith('/viewer/')) {
    return next();
  }
  // Apply authentication to all other routes
  return requireAuth(req, res, next);
});

// Journal Sections Routes (Editor - requires auth)
router.post('/', (req, res, _next) => {
  console.log('🔍 === ROUTE DEBUG: POST /api/journal ===');
  console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔐 Session user ID:', req.session?.userId);
  console.log('🔐 Session user role:', req.session?.userRole);
  console.log('🌍 Environment:', process.env['NODE_ENV']);
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('✅ Route handler reached - calling createJournalSection');
  return createJournalSection(req, res);
});
router.get('/', getJournalSections);
router.get('/:sectionId', getJournalSection);
router.put('/:sectionId', updateJournalSection);
router.delete('/:sectionId', deleteJournalSection);

// Content Items Routes (Editor - requires auth)
router.post('/:sectionId/content-items', createContentItem);
router.put('/content-items/:itemId', updateContentItem);
router.delete('/content-items/:itemId', deleteContentItem);
router.put('/:sectionId/reorder', reorderContentItems);

// Page Break Management Routes (Editor - requires auth)
router.post('/content-items/:contentItemId/page-break', addPageBreak);
router.delete('/content-items/:contentItemId/page-break', removePageBreak);

// Available Content Route (Editor - requires auth)
router.get('/available-content/:eventId', getAvailableContent);

// Public Journal Viewer Routes (No auth required)
router.get('/viewer/years', getJournalYears);
router.get('/viewer/data', getJournalViewerData);

export default router;
