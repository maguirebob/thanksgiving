const db = require('../models');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Get blog posts with associations
    const blogPosts = await db.BlogPost.findAll({
      include: [
        { model: db.User, as: 'author', attributes: ['username', 'first_name', 'last_name'] },
        { model: db.BlogCategory, as: 'category', attributes: ['name', 'color'] },
        { model: db.BlogTag, as: 'tags', attributes: ['name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get blog categories
    const categories = await db.BlogCategory.findAll({
      order: [['name', 'ASC']]
    });

    // Get blog tags
    const tags = await db.BlogTag.findAll({
      order: [['usageCount', 'DESC']],
      limit: 10
    });

    // Get statistics
    const stats = {
      totalPosts: await db.BlogPost.count(),
      publishedPosts: await db.BlogPost.count({ where: { status: 'published' } }),
      draftPosts: await db.BlogPost.count({ where: { status: 'draft' } }),
      featuredPosts: await db.BlogPost.count({ where: { isFeatured: true } }),
      totalCategories: await db.BlogCategory.count(),
      totalTags: await db.BlogTag.count()
    };

    const result = {
      success: true,
      message: 'Blog API test successful on Vercel',
      data: {
        posts: blogPosts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status,
          isFeatured: post.isFeatured,
          viewCount: post.viewCount,
          author: post.author ? {
            username: post.author.username,
            name: `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim()
          } : null,
          category: post.category ? {
            name: post.category.name,
            color: post.category.color
          } : null,
          tags: post.tags.map(tag => ({
            name: tag.name,
            slug: tag.slug
          })),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        })),
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          slug: cat.slug,
          isActive: cat.isActive
        })),
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          usageCount: tag.usageCount
        })),
        stats
      }
    };

    console.log('🎉 Blog API test completed successfully');
    console.log('📊 Stats:', stats);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Blog API test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Blog API test failed'
    });
  }
}
