/**
 * Scrapbook Viewer JavaScript - Turn.js Integration
 * Handles the static HTML scrapbook display with Turn.js flipbook functionality
 */

$(document).ready(function() {
  console.log('🚀 Scrapbook Viewer JavaScript loaded');
  
  // Wait a bit for all elements to be ready
  setTimeout(function() {
    const $book = $("#flipbook");
    const $toolbar = $(".scrapbook-toolbar");
    const $yearSelector = $("#yearSelector");
    
    console.log('📚 Book element:', $book.length);
    console.log('🎛️ Toolbar element:', $toolbar.length);
    console.log('📅 Year selector element:', $yearSelector.length);
    
    // Check if we're in a static HTML file (no year selector)
    const isStaticFile = $yearSelector.length === 0;
    console.log('📄 Is static file:', isStaticFile);
    
    if ($book.length === 0) {
      console.error('❌ No flipbook element found!');
      return;
    }
    
    // Initialize the flipbook with Turn.js
    function initializeFlipbook() {
      console.log('🔄 Initializing Turn.js flipbook...');
      
      // Check if we're in fullscreen mode
      const isFullscreen = $('.scrapbook-shell').hasClass('fullscreen');
      
      let width, height;
      if (isFullscreen) {
        // Fullscreen dimensions
        width = Math.min(window.innerWidth * 0.95, 2200);
        height = Math.min(window.innerHeight * 0.90, 1600);
      } else {
        // Normal dimensions
        width = Math.min(window.innerWidth * 0.9, 1200);
        height = Math.min(window.innerHeight * 0.8, 800);
      }
      
      console.log(`🔄 Turn.js dimensions: ${width}x${height}`);
      
      try {
        // Check if Turn.js is available
        if (typeof $.fn.turn === 'undefined') {
          console.error('❌ Turn.js not loaded!');
          return;
        }
        
        console.log('✅ Turn.js is available, initializing...');
        
        $book.turn({
          width: width,
          height: height,
          center: true,
          gradients: true,
          duration: 900,
          acceleration: true,
          elevation: 150,
          display: 'single',
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
        
        // Wait for Turn.js to initialize
        setTimeout(() => {
          try {
            const totalPages = $book.children().length;
            console.log(`🔄 Total pages in DOM: ${totalPages}`);
            
            if (totalPages > 0) {
              // Turn.js requires an even number of pages
              if (totalPages % 2 !== 0) {
                console.log('⚠️ Adding empty page to make even number for Turn.js');
                $book.append('<section class="page empty-page parchment-page"><div class="page-inner"><div class="page-content"></div></div></section>');
              }
              
              $book.turn('page', 1);
              const currentPage = $book.turn('page');
              console.log(`🔄 Turn.js current page: ${currentPage}`);
              updateNavigationButtons(currentPage);
            }
            
            console.log('✅ Turn.js initialization complete');
          } catch (error) {
            console.log('⚠️ Error accessing Turn.js methods:', error.message);
          }
        }, 100);
        
        // Add keyboard navigation
        addKeyboardNavigation();
        
      } catch (error) {
        console.error('❌ Error initializing Turn.js:', error.message);
      }
    }
    
    // Update navigation button states
    function updateNavigationButtons(currentPage) {
      try {
        const totalPages = $book.turn("pages");
        const $prevBtn = $("#prevPage");
        const $nextBtn = $("#nextPage");
        
        console.log(`🔄 Updating navigation: page ${currentPage} of ${totalPages}`);
        
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
      } catch (error) {
        console.log('⚠️ Error updating navigation buttons:', error.message);
      }
    }
    
    // Fullscreen functionality
    function toggleFullscreen() {
      const $shell = $('.scrapbook-shell');
      const $fullscreenBtn = $('#fullscreenBtn');
      
      if ($shell.hasClass('fullscreen')) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    }
    
    function enterFullscreen() {
      const $shell = $('.scrapbook-shell');
      const $fullscreenBtn = $('#fullscreenBtn');
      
      // Use native fullscreen API
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
      
      $shell.addClass('fullscreen');
      $fullscreenBtn.html('<i class="fas fa-compress"></i> Exit Fullscreen');
      
      // Reinitialize flipbook for fullscreen
      setTimeout(() => {
        $shell[0].offsetHeight; // Force reflow
        initializeFlipbook();
      }, 300);
    }
    
    function exitFullscreen() {
      const $shell = $('.scrapbook-shell');
      const $fullscreenBtn = $('#fullscreenBtn');
      
      // Exit native fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      
      $shell.removeClass('fullscreen');
      $fullscreenBtn.html('<i class="fas fa-expand"></i> Fullscreen');
      
      // Reinitialize flipbook for normal view
      setTimeout(() => {
        $shell[0].offsetHeight; // Force reflow
        initializeFlipbook();
      }, 300);
    }
    
    // Add keyboard navigation
    function addKeyboardNavigation() {
      $(document).on('keydown', function(e) {
        if (!$book.is(':visible')) {
          return;
        }
        
        try {
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
        } catch (error) {
          console.log('⚠️ Error in keyboard navigation:', error.message);
        }
      });
    }
    
    // Navigation button event handlers
    $("#prevPage").click(function() {
      if (!$("#prevPage").prop("disabled")) {
        try {
          $book.turn("previous");
        } catch (error) {
          console.log('⚠️ Error turning to previous page:', error.message);
        }
      }
    });
    
    $("#nextPage").click(function() {
      if (!$("#nextPage").prop("disabled")) {
        try {
          $book.turn("next");
        } catch (error) {
          console.log('⚠️ Error turning to next page:', error.message);
        }
      }
    });
    
    // Fullscreen button event handler
    $("#fullscreenBtn").click(function() {
      toggleFullscreen();
    });
    
    // Handle fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    function handleFullscreenChange() {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      const $shell = $('.scrapbook-shell');
      const $fullscreenBtn = $('#fullscreenBtn');
      
      if (!isFullscreen && $shell.hasClass('fullscreen')) {
        // User exited fullscreen via browser controls
        $shell.removeClass('fullscreen');
        $fullscreenBtn.html('<i class="fas fa-expand"></i> Fullscreen');
        
        // Reinitialize flipbook for normal view
        setTimeout(() => {
          initializeFlipbook();
        }, 100);
      }
    }
    
    // Handle window resize
    $(window).on("resize", function() {
      try {
        const isFullscreen = $('.scrapbook-shell').hasClass('fullscreen');
        
        let width, height;
        if (isFullscreen) {
          width = Math.min(window.innerWidth * 0.95, 2200);
          height = Math.min(window.innerHeight * 0.90, 1600);
        } else {
          width = Math.min(window.innerWidth * 0.9, 1200);
          height = Math.min(window.innerHeight * 0.8, 800);
        }
        
        $book.turn("size", width, height);
      } catch (error) {
        console.log('⚠️ Error resizing flipbook:', error.message);
      }
    });
    
    // Initialize everything
    if (isStaticFile) {
      console.log('📄 Initializing static HTML file...');
      // For static files, just initialize the flipbook directly
      initializeFlipbook();
    } else {
      console.log('📄 Initializing dynamic file...');
      // For dynamic files, load available years first
      loadAvailableYears();
    }
    
    // Load available years from static HTML files (for dynamic files)
    function loadAvailableYears() {
      console.log('📅 Loading available years...');
      
      // For now, we'll use a predefined list of years
      const availableYears = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
      
      if (availableYears.length > 0) {
        console.log('📅 Rendering year selector with years:', availableYears);
        renderYearSelector(availableYears);
      } else {
        console.log('📅 No years found, showing no content');
        showNoContent();
      }
    }
    
    // Render year selector
    function renderYearSelector(years) {
      $yearSelector.empty();
      
      years.forEach(year => {
        const $yearBtn = $(`<button class="year-btn" data-year="${year}">${year}</button>`);
        $yearBtn.click(() => selectYear(year));
        $yearSelector.append($yearBtn);
      });
    }
    
    // Select a year and load scrapbook
    function selectYear(year) {
      console.log(`📅 Switching to year: ${year}`);
      currentYear = year;
      
      // Update active year button
      $(".year-btn").removeClass("active");
      $(`.year-btn[data-year="${year}"]`).addClass("active");
      
      // Load scrapbook for the year
      loadScrapbook(year);
    }
    
    // Load scrapbook for a specific year
    function loadScrapbook(year) {
      console.log('📖 Loading scrapbook for year:', year);
      
      // For Phase 1, we'll create a test scrapbook
      createTestScrapbook(year);
    }
    
    // Create a test scrapbook for demonstration
    function createTestScrapbook(year) {
      console.log('📖 Creating test scrapbook for year:', year);
      
      // Clear the book element
      $book.empty();
      
      // Add test pages
      addTestPages(year);
      
      // Initialize Turn.js
      initializeFlipbook();
      
      // Show the toolbar
      $toolbar.show();
      
      console.log('✅ Test scrapbook created for year:', year);
    }
    
    // Add test pages to the scrapbook
    function addTestPages(year) {
      // Front Cover
      $book.append(`
        <section class="page front-cover leather-cover">
          <div class="page-inner">
            <div class="cover-content">
              <h1 class="cover-title embossed-text">Maguire Family Thanksgiving</h1>
              <p class="cover-year gold-text">${year}</p>
              <div class="cover-decoration">❦</div>
            </div>
          </div>
        </section>
      `);
      
      // Title Page
      $book.append(`
        <section class="page title-page parchment-page">
          <div class="page-inner">
            <div class="page-content">
              <h1 class="section-title decorative-text">Thanksgiving Memories</h1>
              <div class="title-decoration">❦</div>
            </div>
          </div>
        </section>
      `);
      
      // Text Page
      $book.append(`
        <section class="page text-page parchment-page">
          <div class="page-inner">
            <div class="page-content">
              <p class="text-paragraph">This was such a wonderful day filled with laughter, good food, and great company. The children played games while the adults shared stories around the table. We are so grateful for these precious moments together.</p>
            </div>
          </div>
        </section>
      `);
      
      // Back Cover
      $book.append(`
        <section class="page back-cover leather-cover">
          <div class="page-inner">
            <div class="cover-content">
              <h1 class="cover-title embossed-text">Thank You</h1>
              <p class="cover-year gold-text">${year}</p>
              <div class="cover-decoration">❦</div>
            </div>
          </div>
        </section>
      `);
    }
    
    // Show no content message
    function showNoContent() {
      $book.hide();
      $toolbar.hide();
      
      $yearSelector.html(`
        <div class="no-content-message">
          <i class="fas fa-book-open fa-3x mb-3" style="color: #ccc;"></i>
          <h4>No Scrapbook Data Available</h4>
          <p>Please check back later for scrapbook content.</p>
        </div>
      `);
    }
    
  }, 500); // Wait 500ms for everything to be ready
});