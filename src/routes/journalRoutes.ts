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

const router = Router();

// Journal Sections Routes
router.post('/', createJournalSection);
router.get('/', getJournalSections);
router.get('/:sectionId', getJournalSection);
router.put('/:sectionId', updateJournalSection);
router.delete('/:sectionId', deleteJournalSection);

// Content Items Routes
router.post('/:sectionId/content-items', createContentItem);
router.put('/content-items/:itemId', updateContentItem);
router.delete('/content-items/:itemId', deleteContentItem);
router.put('/:sectionId/reorder', reorderContentItems);

// Page Break Management Routes
router.post('/content-items/:contentItemId/page-break', addPageBreak);
router.delete('/content-items/:contentItemId/page-break', removePageBreak);

// Available Content Route
router.get('/available-content/:eventId', getAvailableContent);

// Public Journal Viewer Routes
router.get('/viewer/years', getJournalYears);
router.get('/viewer/data', getJournalViewerData);

export default router;
