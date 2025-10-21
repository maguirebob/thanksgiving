import { Router } from 'express';
import { ScrapbookHtmlGenerator } from '../services/scrapbookHtmlGenerator';
import prisma from '../lib/prisma';

const router = Router();

/**
 * Generate scrapbook HTML for a specific year
 * POST /api/scrapbook/generate/:year
 */
router.post('/generate/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    const generator = new ScrapbookHtmlGenerator();
    const outputPath = await generator.generateScrapbook(year);
    
    // Extract just the filename from the full path
    const filename = outputPath.split('/').pop();
    const url = `/scrapbooks/${filename}`;
    
    return res.json({ 
      success: true, 
      message: `Scrapbook generated successfully for ${year}`,
      filename: filename,
      url: url
    });
    
  } catch (error) {
    console.error('Error generating scrapbook:', error);
    return res.status(500).json({ 
      error: 'Failed to generate scrapbook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get list of available scrapbooks
 * GET /api/scrapbook/list
 */
router.get('/list', async (_req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const scrapbookDir = path.join(__dirname, '../../public/scrapbooks');
    const files = await fs.promises.readdir(scrapbookDir);
    
    // Filter for HTML files and exclude simple.html template
    const scrapbooks = files
      .filter(file => file.endsWith('.html') && file !== 'simple.html')
      .map(file => ({
        filename: file,
        year: file.replace('.html', ''),
        url: `/scrapbooks/${file}`,
        created: fs.statSync(path.join(scrapbookDir, file)).mtime
      }))
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    res.json({ scrapbooks });
    
  } catch (error) {
    console.error('Error listing scrapbooks:', error);
    res.status(500).json({ 
      error: 'Failed to list scrapbooks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Convert journal content to scrapbook content for a specific year
 * POST /api/scrapbook/convert-from-journal/:year
 */
router.post('/convert-from-journal/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    // Get all published journal sections for the year
    const sections = await prisma.journalSection.findMany({
      where: { 
        is_published: true,
        event: {
          event_date: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1)
          }
        }
      },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        },
        event: true
      },
      orderBy: { section_order: 'asc' }
    });

    if (sections.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: `No published journal sections found for year ${year}. Please publish your journal sections first.`,
        error: 'NO_PUBLISHED_SECTIONS',
        year: year
      });
    }

    console.log(`🗑️ SCRAPBOOK DEBUG: Clearing existing scrapbook content for year ${year}`);
    
    // Clear existing scrapbook content for this year
    await prisma.scrapbookContent.deleteMany({
      where: { year }
    });

    console.log(`🔄 SCRAPBOOK DEBUG: Converting journal content to scrapbook format`);
    
    // Convert journal content to scrapbook content
    const scrapbookContent = [];
    let displayOrder = 1;

    for (const section of sections) {
      console.log(`📝 SCRAPBOOK DEBUG: Processing section: ${section.title || 'Untitled'} (ID: ${section.section_id})`);
      
      // Add section title and description as combined content
      if (section.title) {
        console.log(`📋 SCRAPBOOK DEBUG: Adding section title: "${section.title}"`);
        
        // Create combined title+description content
        const titleContent = {
          title: section.title,
          description: section.description && section.description.trim() ? section.description : null
        };
        
        scrapbookContent.push({
          year,
          content_type: 'title',
          content_reference: JSON.stringify(titleContent),
          display_order: displayOrder++,
          page_break_before: true,
          page_break_after: false
        });
      }

      console.log(`📄 SCRAPBOOK DEBUG: Processing ${section.content_items.length} content items`);
      
      // Convert content items
      for (const item of section.content_items) {
        let contentType = '';
        let contentReference = '';

        console.log(`🔍 SCRAPBOOK DEBUG: Processing item - Type: ${item.content_type}, Content ID: ${item.content_id}, Custom Text: ${item.custom_text?.substring(0, 50) || 'none'}`);

        if (item.content_type === 'menu') {
          contentType = 'menu';
          contentReference = `menu_${item.content_id}`;
        } else if (item.content_type === 'photo') {
          contentType = 'photo';
          contentReference = `photo_${item.content_id}`;
        } else if (item.content_type === 'page_photo') {
          contentType = 'page-photo';
          contentReference = `page_photo_${item.content_id}`;
        } else if (item.content_type === 'blog') {
          contentType = 'blog';
          contentReference = `blog_${item.content_id}`;
        } else if (item.content_type === 'text') {
          contentType = 'text-paragraph';
          contentReference = item.custom_text || '';
        } else if (item.content_type === 'heading') {
          contentType = 'heading';
          contentReference = item.custom_text || '';
        }

        if (contentType && contentReference) {
          console.log(`✅ SCRAPBOOK DEBUG: Adding scrapbook item - Type: ${contentType}, Reference: ${contentReference}`);
          scrapbookContent.push({
            year,
            content_type: contentType,
            content_reference: contentReference,
            display_order: displayOrder++,
            page_break_before: item.manual_page_break || false,
            page_break_after: false
          });
        } else {
          console.log(`⚠️ SCRAPBOOK DEBUG: Skipping item - missing contentType or contentReference`);
        }
      }
    }

    console.log(`💾 SCRAPBOOK DEBUG: Inserting ${scrapbookContent.length} scrapbook content items`);
    
    // Insert scrapbook content
    if (scrapbookContent.length > 0) {
      await prisma.scrapbookContent.createMany({
        data: scrapbookContent
      });
    }

    console.log(`✅ SCRAPBOOK DEBUG: Successfully converted ${scrapbookContent.length} content items`);
    
    return res.json({ 
      success: true, 
      message: `Converted ${scrapbookContent.length} content items from journal to scrapbook format`,
      itemsConverted: scrapbookContent.length,
      year: year
    });
    
  } catch (error) {
    console.error('❌ SCRAPBOOK DEBUG: Error converting journal to scrapbook:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to convert journal content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get scrapbook content for a specific year
 * GET /api/scrapbook/content/:year
 */
router.get('/content/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    const content = await prisma.scrapbookContent.findMany({
      where: { year },
      orderBy: { display_order: 'asc' }
    });

    return res.json(content);
    
  } catch (error) {
    console.error('Error fetching scrapbook content:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch scrapbook content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Add new scrapbook content item
 * POST /api/scrapbook/content
 */
router.post('/content', async (req, res) => {
  try {
    const { year, content_type, content_reference, display_order, page_break_before, page_break_after } = req.body;

    if (!year || !content_type || !content_reference || !display_order) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const content = await prisma.scrapbookContent.create({
      data: {
        year: parseInt(year),
        content_type,
        content_reference,
        display_order: parseInt(display_order),
        page_break_before: page_break_before || false,
        page_break_after: page_break_after || false
      }
    });

    return res.json(content);
    
  } catch (error) {
    console.error('Error creating scrapbook content:', error);
    return res.status(500).json({ 
      error: 'Failed to create scrapbook content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete scrapbook content item
 * DELETE /api/scrapbook/content/:id
 */
router.delete('/content/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID parameter' });
    }

    await prisma.scrapbookContent.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Content item deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting scrapbook content:', error);
    return res.status(500).json({ 
      error: 'Failed to delete scrapbook content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available scrapbook years
 * GET /api/scrapbook/available-years
 */
router.get('/available-years', async (_req, res) => {
  try {
    const scrapbookFiles = await prisma.scrapbookFiles.findMany({
      where: { status: 'generated' },
      select: {
        year: true,
        filename: true,
        generated_at: true,
        file_size: true,
        access_count: true,
        last_accessed: true
      },
      orderBy: { year: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        years: scrapbookFiles,
        count: scrapbookFiles.length
      }
    });
    
  } catch (error) {
    console.error('Error getting available scrapbook years:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to get available scrapbook years',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Serve scrapbook from S3
 * GET /api/scrapbook/serve/:year
 */
router.get('/serve/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year parameter' });
    }

    // Check if scrapbook exists in database
    const scrapbookFile = await prisma.scrapbookFiles.findUnique({
      where: { year: year }
    });

    if (!scrapbookFile || scrapbookFile.status !== 'generated') {
      return res.status(404).json({ 
        error: 'Scrapbook not found',
        message: `No scrapbook available for year ${year}`
      });
    }

    // Update access tracking
    await prisma.scrapbookFiles.update({
      where: { year: year },
      data: {
        last_accessed: new Date(),
        access_count: { increment: 1 }
      }
    });

    // If we have a local file, serve it directly
    if (scrapbookFile.local_path) {
      return res.sendFile(scrapbookFile.local_path);
    }

    // Otherwise, serve from S3
    if (scrapbookFile.s3_key) {
      const s3Service = (await import('../services/s3Service')).default;
      const signedUrl = await s3Service.getSignedUrl(scrapbookFile.s3_key, 3600);
      return res.redirect(signedUrl);
    }

    return res.status(404).json({ 
      error: 'Scrapbook file not found',
      message: 'Neither local nor S3 file available'
    });
    
  } catch (error) {
    console.error('Error serving scrapbook:', error);
    res.status(500).json({ 
      error: 'Failed to serve scrapbook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;