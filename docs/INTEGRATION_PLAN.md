// Integration plan for the new template system with existing journal system

// 1. UPDATE EXISTING JOURNAL CONTROLLER
// Add new methods to src/controllers/journalController.ts

export const generateScrapbookFromJournal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, year, sectionOrder } = req.body;
    
    // Get journal section data (existing functionality)
    const journalSection = await prisma.journalSection.findFirst({
      where: {
        event_id: parseInt(eventId),
        year: parseInt(year),
        section_order: parseInt(sectionOrder) || 1
      },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' },
          include: {
            photo: true,
            blog_post: true
          }
        }
      }
    });

    if (!journalSection) {
      res.status(404).json({
        success: false,
        message: 'Journal section not found'
      });
      return;
    }

    // Convert journal section to scrapbook format
    const scrapbookData = await convertJournalToScrapbook(journalSection);
    
    // Generate HTML using template service
    const templateService = new ScrapbookTemplateService();
    const filename = `journal-${eventId}-${year}-${sectionOrder}`;
    const outputPath = await templateService.generateScrapbook(scrapbookData, filename);
    
    res.json({
      success: true,
      message: 'Scrapbook generated from journal section',
      path: outputPath,
      url: `/scrapbooks/${filename}.html`,
      data: {
        eventId: parseInt(eventId),
        year: parseInt(year),
        sectionOrder: parseInt(sectionOrder),
        title: scrapbookData.title,
        pageCount: scrapbookData.pages.length
      }
    });
  } catch (error) {
    console.error('Error generating scrapbook from journal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate scrapbook from journal',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 2. ADD NEW ROUTES TO EXISTING JOURNAL ROUTES
// Update src/routes/journalRoutes.ts

// Add these routes to the existing journalRoutes.ts:
router.post('/generate-scrapbook', generateScrapbookFromJournal);
router.get('/scrapbook/:eventId/:year/:sectionOrder', serveScrapbook);

// 3. UPDATE JOURNAL VIEWER TO USE NEW TEMPLATE
// Modify public/js/components/journalViewer.js

class JournalViewer {
    // ... existing code ...
    
    async generatePages() {
        console.log('📄 Generating pages from journal data...');
        
        // Check if we should use the new template system
        if (this.shouldUseTemplateSystem()) {
            await this.generateTemplatePages();
        } else {
            // Use existing page generation
            this.generateLegacyPages();
        }
    }
    
    async generateTemplatePages() {
        try {
            // Generate scrapbook using new template system
            const response = await fetch('/api/journal/generate-scrapbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: this.currentEventId,
                    year: this.currentYear,
                    sectionOrder: 1
                })
            });
            
            const result = await response.json();
            if (result.success) {
                // Redirect to the generated scrapbook
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Error generating template pages:', error);
            // Fallback to legacy system
            this.generateLegacyPages();
        }
    }
    
    shouldUseTemplateSystem() {
        // Add logic to determine when to use template system
        // Could be based on user preference, section type, etc.
        return this.currentYear >= 2024; // Example: Use template for 2024+
    }
}

// 4. UPDATE JOURNAL EDITOR TO SAVE TEMPLATE DATA
// Modify the existing journal editor to save layout_config

// In the existing journal editor JavaScript:
async function saveJournalSection() {
    const layoutConfig = {
        templateType: 'scrapbook', // New field
        pages: generatePageLayout(), // New function
        version: '2.0' // Template system version
    };
    
    const journalData = {
        event_id: currentEventId,
        year: currentYear,
        title: sectionTitle,
        description: sectionDescription,
        layout_config: layoutConfig, // This already exists!
        content_items: contentItems
    };
    
    // Existing save logic remains the same
    await saveJournalSectionData(journalData);
}

// 5. ADD TEMPLATE SYSTEM ROUTES TO MAIN SERVER
// Update src/server.ts

// Add scrapbook routes to the main server
app.use('/api/scrapbook', scrapbookRoutes);

// Add route to serve generated scrapbooks
app.get('/scrapbooks/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../public/scrapbooks', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Scrapbook not found');
  }
});

// 6. UPDATE DATABASE SCHEMA (MINIMAL CHANGES)
// The existing JournalSection.layout_config field can store template data

// No schema changes needed! The existing layout_config JSON field can store:
{
  "templateType": "scrapbook",
  "pages": [
    {
      "id": "cover-front",
      "type": "cover",
      "content": { "title": "My Scrapbook" },
      "position": { "x": 0, "y": 0 },
      "size": { "width": 400, "height": 600 }
    }
    // ... more pages
  ],
  "version": "2.0"
}

// 7. BACKWARD COMPATIBILITY
// The system will work with both old and new journal sections

function isTemplateSystem(section) {
  return section.layout_config?.templateType === 'scrapbook';
}

// In journal viewer:
if (isTemplateSystem(journalSection)) {
  // Use new template system
  await generateTemplatePages(journalSection);
} else {
  // Use existing legacy system
  generateLegacyPages(journalSection);
}
