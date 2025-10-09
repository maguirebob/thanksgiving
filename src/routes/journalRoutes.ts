import { Router } from 'express';
import {
  createJournalPage,
  getJournalPages,
  getJournalPage,
  updateJournalPage,
  deleteJournalPage,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
  getAvailableContent,
  getJournalViewerData,
  getJournalYears
} from '../controllers/journalController';

const router = Router();

// Journal Pages Routes
router.post('/', createJournalPage);
router.get('/', getJournalPages);
router.get('/:journalPageId', getJournalPage);
router.put('/:journalPageId', updateJournalPage);
router.delete('/:journalPageId', deleteJournalPage);

// Content Items Routes
router.post('/:journalPageId/content-items', createContentItem);
router.put('/content-items/:contentItemId', updateContentItem);
router.delete('/content-items/:contentItemId', deleteContentItem);
router.put('/:journalPageId/reorder', reorderContentItems);

// Available Content Route
router.get('/available-content/:eventId', getAvailableContent);

// Public Journal Viewer Routes
router.get('/viewer/years', getJournalYears);
router.get('/viewer/data', getJournalViewerData);

export default router;
