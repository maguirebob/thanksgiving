// Scrapbook Flipbook JavaScript - Turn.js Integration
$(function() {
  console.log('🚀 Scrapbook Flipbook JavaScript loaded');
  
  const $book = $("#flipbook");
  const $toolbar = $(".scrapbook-toolbar");
  let currentYear = null;
  let journalData = null;
  let flipbookInitialized = false;
  
  console.log('📚 Book element:', $book.length);
  console.log('🎛️ Toolbar element:', $toolbar.length);
  
  // Hide flipbook and toolbar initially
  $book.hide();
  $toolbar.hide();
  console.log('👁️ Hidden flipbook and toolbar initially');
  
  // Initialize the flipbook with turn.js
  function initializeFlipbook() {
    if (flipbookInitialized) {
      return; // Already initialized
    }
    
    // Check if we're in fullscreen mode
    const isFullscreen = $('.scrapbook-shell').hasClass('fullscreen');
    
    let width, height;
    if (isFullscreen) {
      // Slightly smaller dimensions to ensure content fits within viewport
      width = Math.min(window.innerWidth * 0.95, 2200);
      height = Math.min(window.innerHeight * 0.90, 1600);
    } else {
      // Much larger normal size to prevent any content cutoff
      width = Math.min(window.innerWidth * 0.9, 1250);
      height = Math.min(window.innerHeight * 0.8, 1000); // Reduced height to test image scaling
    }
    
    $book.turn({
      width: width,
      height: height,
      center: true, // Center the flipbook
      gradients: true,
      duration: 900,
      acceleration: true,
      elevation: 150,
      display: 'single', // Show only one page at a time
      when: {
        turning: function(event, page, view) {
          console.log('Turning to page:', page);
        },
        turned: function(event, page, view) {
          console.log('Turned to page:', page);
          updateNavigationButtons(page);
        }
      }
    });
    
    // Add keyboard navigation
    addKeyboardNavigation();
    
    flipbookInitialized = true;
  }
  
  // Update navigation button states
  function updateNavigationButtons(currentPage) {
    const totalPages = $book.turn("pages");
    const $prevBtn = $("#prevPage");
    const $nextBtn = $("#nextPage");
    
    // Disable/enable buttons based on current page
    if (currentPage <= 1) {
      $prevBtn.prop("disabled", true).addClass("disabled");
    } else {
      $prevBtn.prop("disabled", false).removeClass("disabled");
    }
    
    if (currentPage >= totalPages) {
      $nextBtn.prop("disabled", true).addClass("disabled");
    } else {
      $nextBtn.prop("disabled", false).removeClass("disabled");
    }
  }

  // Fullscreen functionality
  function toggleFullscreen() {
    const $shell = $('.scrapbook-shell');
    const $fullscreenBtn = $('#fullscreenBtn');
    const $icon = $fullscreenBtn.find('i');
    
    if ($shell.hasClass('fullscreen')) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  function enterFullscreen() {
    const $shell = $('.scrapbook-shell');
    const $fullscreenBtn = $('#fullscreenBtn');
    const $icon = $fullscreenBtn.find('i');
    
    // Use native fullscreen API to hide browser chrome
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
    
    $shell.addClass('fullscreen');
    $icon.removeClass('fa-expand').addClass('fa-compress');
    $fullscreenBtn.attr('title', 'Exit Fullscreen');
    
    // Reinitialize flipbook for fullscreen
    if (flipbookInitialized) {
      $book.turn('destroy');
      flipbookInitialized = false;
    }
    
    // Wait longer for CSS to apply and force a reflow
    setTimeout(() => {
      // Force a reflow to ensure CSS is applied
      $shell[0].offsetHeight;
      initializeFlipbook();
    }, 300); // Increased from 100ms to 300ms
  }

  function exitFullscreen() {
    const $shell = $('.scrapbook-shell');
    const $fullscreenBtn = $('#fullscreenBtn');
    const $icon = $fullscreenBtn.find('i');
    
    // Exit native fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    $shell.removeClass('fullscreen');
    $icon.removeClass('fa-compress').addClass('fa-expand');
    $fullscreenBtn.attr('title', 'Toggle Fullscreen');
    
    // Reinitialize flipbook for normal view
    if (flipbookInitialized) {
      $book.turn('destroy');
      flipbookInitialized = false;
    }
    
    // Wait longer for CSS to apply and force a reflow
    setTimeout(() => {
      // Force a reflow to ensure CSS is applied
      $shell[0].offsetHeight;
      initializeFlipbook();
    }, 300); // Increased from 100ms to 300ms
  }
  
  // Add keyboard navigation for page turning
  function addKeyboardNavigation() {
    $(document).on('keydown', function(e) {
      // Only handle arrow keys when the flipbook is visible
      if (!$book.is(':visible') || !flipbookInitialized) {
        return;
      }
      
      const currentPage = $book.turn('page');
      const totalPages = $book.turn('pages');
      
      switch(e.keyCode) {
        case 37: // Left arrow key
          e.preventDefault();
          if (currentPage > 1) {
            $book.turn('previous');
          }
          break;
        case 39: // Right arrow key
          e.preventDefault();
          if (currentPage < totalPages) {
            $book.turn('next');
          }
          break;
      }
    });
  }
  
  // Load available years
  function loadYears() {
    console.log('📅 Loading years...');
    fetch('/api/journal/viewer/years')
      .then(response => {
        console.log('📅 Years API response:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('📅 Years data received:', data);
        if (data.success && data.data && data.data.years.length > 0) {
          console.log('📅 Rendering year selector with years:', data.data.years);
          renderYearSelector(data.data.years);
        } else {
          console.log('📅 No years found, showing no content');
          showNoContent();
        }
      })
      .catch(error => {
        console.error('📅 Error loading years:', error);
        showNoContent();
      });
  }
  
  // Render year selector
  function renderYearSelector(years) {
    const $yearSelector = $("#yearSelector");
    $yearSelector.empty();
    
    years.forEach(year => {
      const $yearBtn = $(`<button class="year-btn" data-year="${year}">${year}</button>`);
      $yearBtn.click(() => selectYear(year));
      $yearSelector.append($yearBtn);
    });
  }
  
  // Select a year and load journal data
  function selectYear(year) {
    console.log(`📅 Switching to year: ${year}`);
    console.log(`📅 Previous year was: ${currentYear}`);
    console.log(`📅 Flipbook initialized: ${flipbookInitialized}`);
    
    currentYear = year;
    
    // Update active year button
    $(".year-btn").removeClass("active");
    $(`.year-btn[data-year="${year}"]`).addClass("active");
    
    // Load journal data for the year
    loadJournalData(year);
  }
  
  // Load journal data for a specific year
  function loadJournalData(year) {
    console.log('📖 Loading journal data for year:', year);
    fetch(`/api/journal/viewer/data?year=${year}`)
      .then(response => {
        console.log('📖 Journal data API response:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('📖 Journal data received:', data);
        if (data.success && data.data && data.data.journal_sections && data.data.journal_sections.length > 0) {
          console.log('📖 Found journal sections:', data.data.journal_sections.length);
          journalData = data.data; // Store the data portion, not the full response
          generateFlipbookPages();
        } else {
          console.log('📖 No journal sections found for year:', year);
          showNoContentForYear(year);
        }
      })
      .catch(error => {
        console.error('📖 Error loading journal data:', error);
        showNoContentForYear(year);
      });
  }
  
  // Generate flipbook pages from journal data
  function generateFlipbookPages() {
    console.log('🔄 Regenerating flipbook pages...');
    
    // Destroy existing flipbook if it exists
    if (flipbookInitialized && $book.turn) {
      console.log('🗑️ Destroying existing flipbook');
      $book.turn('destroy');
      flipbookInitialized = false;
    }
    
    // Clear the book content
    $book.empty();
    
    // Add cover page
    addCoverPage();
    
    // Add content pages with proper distribution
    if (journalData.journal_sections) {
      journalData.journal_sections.forEach(section => {
        addContentPagesWithDistribution(section);
      });
    }
    
    // Show flipbook and toolbar, then initialize turn.js
    $book.show();
    $toolbar.show();
    initializeFlipbook();
  }
  
  // Add content pages with proper distribution logic
  function addContentPagesWithDistribution(section) {
    console.log('📖 Adding content pages for section:', section.title);
    
    const PAGE_HEIGHT = 820; // Fixed page height
    const contentItems = section.content_items || [];
    
    if (contentItems.length === 0) {
      addContentPage(section, []);
      return;
    }
    
    // Distribute content across pages
    const pages = distributeContentAcrossPages(contentItems, PAGE_HEIGHT);
    
    pages.forEach((pageContent, index) => {
      const pageSection = {
        ...section,
        title: index === 0 ? section.title : `${section.title} (continued)`,
        content_items: pageContent
      };
      addContentPage(pageSection, pageContent);
    });
  }
  
  // Distribute content across pages based on height constraints
  function distributeContentAcrossPages(contentItems, pageHeight) {
    const pages = [];
    let currentPage = [];
    let currentPageHeight = 0;
    
    contentItems.forEach(item => {
      const itemHeight = estimateContentItemHeight(item);
      
      // If adding this item would exceed page height, start a new page
      if (currentPageHeight + itemHeight > pageHeight && currentPage.length > 0) {
        pages.push([...currentPage]);
        currentPage = [];
        currentPageHeight = 0;
      }
      
      // Special rules for certain content types
      if (item.content_type === 'menu' || item.content_type === 'page_photo') {
        // Menus and page photos get their own page
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
          currentPage = [];
          currentPageHeight = 0;
        }
        pages.push([item]);
        currentPage = [];
        currentPageHeight = 0;
      } else {
        currentPage.push(item);
        currentPageHeight += itemHeight;
      }
    });
    
    // Add remaining items to last page
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    console.log('📖 Distributed content into', pages.length, 'pages');
    return pages;
  }
  
  // Estimate height of content item
  function estimateContentItemHeight(item) {
    switch (item.content_type) {
      case 'heading':
        return 60;
      case 'text':
        return Math.max(100, (item.custom_text?.length || 0) * 0.5);
      case 'menu':
        return 600; // Menu gets its own page
      case 'photo':
        return 180; // Reduced to fit 4 photos on one page (820px / 4 = ~200px per photo)
      case 'page_photo':
        return 600; // Page photo gets its own page
      case 'blog':
        const blogHeight = 200 + (item.blog_post?.content?.length || 0) * 0.3;
        const imageCount = (item.blog_post?.images?.length || 0) + (item.blog_post?.featured_image ? 1 : 0);
        return blogHeight + (imageCount * 200);
      default:
        return 100;
    }
  }
  
  // Add cover page
  function addCoverPage() {
    const coverHtml = `
      <section class="page cover">
        <div class="page-inner">
          <div class="page-content">
            <h1 class="cover-title">🦃 Maguire Family Thanksgiving</h1>
            <p class="cover-subtitle">Our treasured memories in one book</p>
            <div class="cover-decoration">❦</div>
          </div>
        </div>
      </section>
    `;
    $book.append(coverHtml);
  }
  
  // Add content page
  function addContentPage(section, contentItems = null) {
    const items = contentItems || section.content_items || [];
    const pageHtml = `
      <section class="page">
        <div class="page-inner">
          <div class="page-content">
            ${generateContentHtml(items)}
          </div>
        </div>
      </section>
    `;
    $book.append(pageHtml);
  }
  
  // Generate content HTML for a section
  function generateContentHtml(contentItems) {
    console.log('📄 Generating content HTML for items:', contentItems);
    if (!contentItems || contentItems.length === 0) {
      console.log('📄 No content items found');
      return '<p>No content available for this section.</p>';
    }
    
    let html = '';
    let photoItems = [];
    
    contentItems.forEach((item, index) => {
      console.log(`📄 Processing item ${index}:`, item.content_type, item);
      switch (item.content_type) {
        case 'heading':
          // Skip headings - don't display them
          break;
        case 'text':
          html += `<p>${item.custom_text || ''}</p>`;
          break;
        case 'menu':
          console.log('📄 Menu item data:', item.menu);
          if (item.menu && item.menu.menu_image_s3_url) {
            html += `<div class="menu-content">
              <img src="${item.menu.menu_image_s3_url}" alt="Menu" class="menu-image">
            </div>`;
            console.log('📄 Menu HTML generated:', html);
          } else {
            console.log('📄 Menu item missing data:', item);
          }
          break;
        case 'photo':
          console.log('📄 Photo item data:', item.photo);
          if (item.photo && item.photo.s3_url) {
            photoItems.push(item);
          }
          break;
        case 'page_photo':
          console.log('📄 Page photo item data:', item.photo);
          if (item.photo && item.photo.s3_url) {
            html += `<div class="page-photo-content">
              <img src="${item.photo.s3_url}" alt="Page Photo" class="page-photo-image">
            </div>`;
          }
          break;
        case 'blog':
          console.log('📄 Blog item data:', item.blog_post);
          if (item.blog_post) {
            html += `<div class="blog-content">
              <p>${item.blog_post.content || ''}</p>
              ${generateBlogImages(item.blog_post)}
            </div>`;
          }
          break;
      }
    });
    
    // Add photo container if we have photos
    if (photoItems.length > 0) {
      html += '<div class="photo-container">';
      photoItems.forEach(item => {
        html += `<div class="photo-content">
          <img src="${item.photo.s3_url}" alt="Photo" class="photo-image">
        </div>`;
      });
      html += '</div>';
    }
    
    console.log('📄 Final HTML generated:', html);
    return html;
  }
  
  // Generate blog images HTML
  function generateBlogImages(blogPost) {
    if (!blogPost) return '';
    
    let images = [];
    
    // Add featured image if exists
    if (blogPost.featured_image) {
      images.push(blogPost.featured_image);
    }
    
    // Add images array if exists
    if (blogPost.images && Array.isArray(blogPost.images)) {
      images = images.concat(blogPost.images);
    }
    
    if (images.length === 0) return '';
    
    let html = '<div class="blog-images-container">';
    images.forEach(imageUrl => {
      html += `<img src="${imageUrl}" alt="Blog Image" class="blog-image">`;
    });
    html += '</div>';
    
    return html;
  }
  
  // Show no content message
  function showNoContent() {
    $book.hide();
    $toolbar.hide();
    
    // Show message in year selector area
    const $yearSelector = $("#yearSelector");
    $yearSelector.html(`
      <div class="no-content-message">
        <i class="fas fa-book-open fa-3x mb-3" style="color: #ccc;"></i>
        <h4>No Journal Data Available</h4>
        <p>Please check back later for journal content.</p>
      </div>
    `);
  }
  
  // Show no content message for specific year
  function showNoContentForYear(year) {
    $book.hide();
    $toolbar.hide();
    
    // Show message in year selector area
    const $yearSelector = $("#yearSelector");
    $yearSelector.html(`
      <div class="no-content-message">
        <i class="fas fa-calendar-times fa-3x mb-3" style="color: #ccc;"></i>
        <h4>No Content for ${year}</h4>
        <p>No journal entries found for ${year}. Please select a different year.</p>
        <button class="year-btn" onclick="location.reload()">Try Again</button>
      </div>
    `);
  }
  
  // Navigation button event handlers
  $("#prevPage").click(() => {
    if (!$("#prevPage").prop("disabled")) {
      $book.turn("previous");
    }
  });
  
  $("#nextPage").click(() => {
    if (!$("#nextPage").prop("disabled")) {
      $book.turn("next");
    }
  });

  // Fullscreen button event handler
  $("#fullscreenBtn").click(() => {
    toggleFullscreen();
  });

  // Handle fullscreen change events (when user exits via Escape key or browser controls)
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);

  function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const $shell = $('.scrapbook-shell');
    const $fullscreenBtn = $('#fullscreenBtn');
    const $icon = $fullscreenBtn.find('i');
    
    if (!isFullscreen && $shell.hasClass('fullscreen')) {
      // User exited fullscreen via browser controls
      $shell.removeClass('fullscreen');
      $icon.removeClass('fa-compress').addClass('fa-expand');
      $fullscreenBtn.attr('title', 'Toggle Fullscreen');
      
      // Reinitialize flipbook for normal view
      if (flipbookInitialized) {
        $book.turn('destroy');
        flipbookInitialized = false;
      }
      
      setTimeout(() => {
        initializeFlipbook();
      }, 100);
    }
  }
  
  // Handle window resize
  $(window).on("resize", function() {
    if ($book.turn("pages")) {
      // Check if we're in fullscreen mode
      const isFullscreen = $('.scrapbook-shell').hasClass('fullscreen');
      
      let width, height;
      if (isFullscreen) {
        // Slightly smaller dimensions to ensure content fits within viewport
        width = Math.min(window.innerWidth * 0.95, 2200);
        height = Math.min(window.innerHeight * 0.90, 1600);
      } else {
        // Much larger normal size to prevent any content cutoff
        width = Math.min(window.innerWidth * 0.9, 1250);
        height = Math.min(window.innerHeight * 0.8, 1000); // Reduced height to test image scaling
      }
      
      $book.turn("size", width, height);
    }
  });
  
  // Initialize everything
  loadYears();
});
