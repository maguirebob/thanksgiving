# Photo Carousel Feature - Design Document

**Project**: Thanksgiving Website  
**Issue**: #28 - Add Photo Carousel Feature: Rotating Slideshow of All Photos  
**Version**: 2.12.62+  
**Created**: October 7, 2025  
**Status**: Design Phase  

## 📋 **Overview**

This document outlines the complete design and implementation plan for adding a photo carousel feature that displays all photos in a rotating slideshow format. The carousel will provide an automated way for users to browse through the entire photo collection with smooth transitions and user controls.

### **Current State**
- ✅ Photos are displayed in a grid layout on `/photos` page (admin-only)
- ✅ Individual photos can be viewed via preview URLs
- ✅ Photo data is stored in database with S3 URLs
- ✅ Basic photo management functionality exists
- ❌ No automated slideshow/carousel functionality
- ❌ No full-screen photo viewing experience
- ❌ No keyboard/touch navigation for photos
- ❌ No public photo viewing experience for regular users

### **Target State**
- 🎯 Automated photo carousel with smooth transitions
- 🎯 User controls (play/pause, next/previous, speed control)
- 🎯 Full-screen viewing mode
- 🎯 Keyboard and touch navigation support
- 🎯 Responsive design for all devices
- 🎯 Photo metadata display (captions, dates, events)
- 🎯 Configurable rotation settings
- 🎯 Public access for all authenticated users
- 🎯 Accessible through main Photos navigation link

## 🎯 **User Stories**

### **Primary User Story**
As a user, I want to view all photos in an automated slideshow format so that I can easily browse through the entire photo collection without manual navigation.

### **Secondary User Stories**
- As a **regular user**, I want to access the photo carousel through the main Photos link so that I can view family photos easily
- As an **admin user**, I want to access the photo carousel through the main Photos link so that I can view all photos in slideshow format
- As a user, I want to control the slideshow (play/pause) so that I can pause on interesting photos
- As a user, I want to navigate manually (next/previous) so that I can skip to specific photos
- As a user, I want to view photos in full-screen mode so that I can see them in detail
- As a user, I want to use keyboard shortcuts so that I can navigate efficiently
- As a user, I want to swipe on mobile devices so that I can navigate naturally
- As a user, I want to see photo information so that I can learn about each photo
- As a **family member**, I want to share the photo carousel experience so that we can enjoy Thanksgiving memories together

## 🏗️ **Technical Architecture**

### **Frontend Components**

#### **1. Carousel Container**
```typescript
interface CarouselContainer {
  photos: Photo[];
  currentIndex: number;
  isPlaying: boolean;
  rotationSpeed: number;
  isFullscreen: boolean;
  showMetadata: boolean;
}
```

#### **2. Photo Display Component**
```typescript
interface PhotoDisplay {
  photo: Photo;
  isActive: boolean;
  transitionClass: string;
  metadata: PhotoMetadata;
}
```

#### **3. Control Panel**
```typescript
interface ControlPanel {
  isPlaying: boolean;
  currentIndex: number;
  totalPhotos: number;
  rotationSpeed: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSpeedChange: (speed: number) => void;
  onFullscreenToggle: () => void;
}
```

### **Backend API Endpoints**

#### **1. Carousel Data Endpoint**
```
GET /api/carousel/photos
Response: {
  photos: Photo[];
  totalCount: number;
  metadata: CarouselMetadata;
}
```

#### **2. Photo Metadata Endpoint**
```
GET /api/carousel/photos/:id/metadata
Response: {
  photo: Photo;
  event: Event;
  statistics: PhotoStats;
}
```

## 🎨 **UI/UX Design**

### **Design Consistency**
The carousel will maintain **complete visual consistency** with the existing Thanksgiving website:

#### **Visual Integration**
- **Color Scheme**: Uses existing CSS variables (`--primary-black`, `--accent-orange`, `--white`, `--light-gray`, `--border-gray`)
- **Typography**: Same fonts (`'Playfair Display'` for headers, `'Source Sans Pro'` for body text)
- **Layout Structure**: Uses the main `views/layout.ejs` template with consistent navigation
- **Component Styling**: Follows existing design patterns, spacing, and visual hierarchy
- **Responsive Design**: Uses same breakpoints and mobile-first approach as existing pages

#### **Navigation Integration**
- **Main Layout**: Carousel page renders within `views/layout.ejs` (same as all other pages)
- **Navigation Bar**: Same header with Home, About, Photos, Admin, Profile, Logout
- **Breadcrumbs**: Consistent with site navigation patterns
- **Footer**: Same footer styling and structure

#### **User Experience Consistency**
- **Interaction Patterns**: Same button styles, hover effects, and click behaviors
- **Loading States**: Consistent with existing page loading patterns
- **Error Handling**: Same error page styling and messaging
- **Accessibility**: Maintains existing ARIA labels and keyboard navigation

### **Layout Structure**
```
┌─────────────────────────────────────────────────────────┐
│                    Carousel Container                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Photo Display Area                 │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │                                         │   │   │
│  │  │            Current Photo               │   │   │
│  │  │                                         │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  Control Panel                         │
│  [◀] [⏸] [▶] [⏩] [⚙] [⛶] [📊]                      │
├─────────────────────────────────────────────────────────┤
│                Photo Information                        │
│  Title: "Grandma's Last Thanksgiving"                   │
│  Date: November 25, 2020 | Event: Thanksgiving 2020   │
│  Photo 3 of 47                                          │
└─────────────────────────────────────────────────────────┘
```

### **Responsive Design**

#### **Desktop (1200px+)**
- Large photo display area (800x600px)
- Full control panel visible
- Side-by-side metadata display
- Keyboard navigation enabled

#### **Tablet (768px - 1199px)**
- Medium photo display area (600x450px)
- Compact control panel
- Stacked metadata display
- Touch navigation enabled

#### **Mobile (320px - 767px)**
- Full-width photo display
- Minimal control panel (essential controls only)
- Collapsible metadata
- Swipe gestures enabled

### **Visual Design Elements**

#### **Colors**
- Primary: `var(--primary-black)` - Text and controls
- Accent: `var(--accent-orange)` - Active states and highlights
- Background: `var(--white)` - Main background
- Light: `var(--light-gray)` - Secondary backgrounds
- Border: `var(--border-gray)` - Borders and dividers
- Overlay: `rgba(0,0,0,0.8)` - Fullscreen overlay

#### **Typography**
- Headers: `'Playfair Display', Georgia, serif` (same as site)
- Body: `'Source Sans Pro', sans-serif` (same as site)
- Controls: `'Source Sans Pro', sans-serif` (small, bold)

#### **Animations**
- Photo transitions: `transform: translateX()` with `transition: all 0.5s ease-in-out`
- Control hover: `transform: scale(1.1)` with `transition: transform 0.2s ease`
- Loading states: `opacity: 0.5` with `transition: opacity 0.3s ease`
- **Consistency**: All animations use same timing and easing as existing site

#### **Component Styling**
- **Buttons**: Same border-radius, padding, and hover effects as existing site buttons
- **Cards**: Same shadow, border-radius, and spacing as existing content cards
- **Forms**: Same input styling and validation patterns as existing forms
- **Modals**: Same overlay and modal styling as existing site modals

## 🔧 **Implementation Plan**

### **Phase 1: Foundation & Core Functionality** (Week 1)

#### **Task 1.1: Create Carousel API Endpoint**
- [ ] Create `/api/carousel/photos` endpoint in `src/routes/carouselRoutes.ts`
- [ ] Implement photo data fetching with pagination
- [ ] Add photo metadata aggregation
- [ ] Include event information for each photo
- **Estimated Time**: 4 hours
- **Dependencies**: None

#### **Task 1.2: Build Core Carousel Component**
- [ ] Create `public/js/components/carouselComponent.js`
- [ ] Implement basic photo display logic
- [ ] Add automatic rotation functionality
- [ ] Implement play/pause controls
- **Estimated Time**: 6 hours
- **Dependencies**: Task 1.1

#### **Task 1.3: Create Carousel Page Template**
- [ ] Create `views/photos.ejs` template (replaces current photos management)
- [ ] Design responsive layout structure using existing site CSS variables
- [ ] Add control panel HTML with consistent button styling
- [ ] Implement photo metadata display with existing typography
- [ ] Ensure template renders within `views/layout.ejs` for consistency
- **Estimated Time**: 4 hours
- **Dependencies**: Task 1.2

#### **Task 1.4: Add Carousel Route**
- [ ] Add `/photos` route in `src/server.ts` (replace current photos management)
- [ ] Implement authentication (all authenticated users)
- [ ] Add carousel page rendering
- [ ] Test basic functionality
- **Estimated Time**: 2 hours
- **Dependencies**: Task 1.3

### **Phase 2: Enhanced Controls & Navigation** (Week 2)

#### **Task 2.1: Implement Manual Navigation**
- [ ] Add next/previous buttons
- [ ] Implement photo index tracking
- [ ] Add progress indicator
- [ ] Create thumbnail navigation
- **Estimated Time**: 5 hours
- **Dependencies**: Phase 1

#### **Task 2.2: Add Keyboard Navigation**
- [ ] Implement arrow key navigation
- [ ] Add spacebar for play/pause
- [ ] Add Escape key for fullscreen exit
- [ ] Add number keys for direct photo access
- **Estimated Time**: 3 hours
- **Dependencies**: Task 2.1

#### **Task 2.3: Implement Touch/Swipe Support**
- [ ] Add touch event listeners
- [ ] Implement swipe gesture detection
- [ ] Add momentum scrolling
- [ ] Test on mobile devices
- **Estimated Time**: 4 hours
- **Dependencies**: Task 2.1

#### **Task 2.4: Add Speed Controls**
- [ ] Create speed selection UI
- [ ] Implement variable rotation speeds
- [ ] Add speed persistence (localStorage)
- [ ] Test different speed settings
- **Estimated Time**: 3 hours
- **Dependencies**: Task 2.1

### **Phase 3: Full-Screen & Advanced Features** (Week 3)

#### **Task 3.1: Implement Full-Screen Mode**
- [ ] Add full-screen toggle button
- [ ] Implement full-screen API usage
- [ ] Create full-screen overlay
- [ ] Add exit full-screen functionality
- **Estimated Time**: 4 hours
- **Dependencies**: Phase 2

#### **Task 3.2: Enhanced Photo Metadata**
- [ ] Display photo captions and descriptions
- [ ] Show event information and dates
- [ ] Add photo statistics (file size, dimensions)
- [ ] Implement metadata toggle
- **Estimated Time**: 3 hours
- **Dependencies**: Task 3.1

#### **Task 3.3: Photo Loading & Error Handling**
- [ ] Implement lazy loading for photos
- [ ] Add loading states and spinners
- [ ] Handle missing or broken images
- [ ] Add retry functionality
- **Estimated Time**: 3 hours
- **Dependencies**: Task 3.1

#### **Task 3.4: Performance Optimization**
- [ ] Implement photo preloading
- [ ] Add image compression for thumbnails
- [ ] Optimize memory usage
- [ ] Add performance monitoring
- **Estimated Time**: 4 hours
- **Dependencies**: Task 3.3

### **Phase 4: Integration & Polish** (Week 4)

#### **Task 4.1: Navigation Integration**
- [ ] Update Photos link in main navigation to point to carousel
- [ ] Ensure Photos link is visible to all authenticated users
- [ ] Test navigation flow for both regular and admin users
- [ ] Verify admin functions remain in Admin dropdown
- **Estimated Time**: 2 hours
- **Dependencies**: Phase 3

#### **Task 4.2: Accessibility Features**
- [ ] Add ARIA labels and roles
- [ ] Implement screen reader support
- [ ] Add keyboard navigation hints
- [ ] Test with accessibility tools
- **Estimated Time**: 3 hours
- **Dependencies**: Task 4.1

#### **Task 4.3: User Preferences**
- [ ] Add settings panel
- [ ] Implement preference persistence
- [ ] Add theme options
- [ ] Create user preference API
- **Estimated Time**: 4 hours
- **Dependencies**: Task 4.2

#### **Task 4.4: Testing & Documentation**
- [ ] Write unit tests for carousel component
- [ ] Create integration tests
- [ ] Test across different browsers
- [ ] Update user documentation
- **Estimated Time**: 5 hours
- **Dependencies**: Task 4.3

## 📊 **Technical Specifications**

### **Performance Requirements**
- **Load Time**: Carousel should load within 2 seconds
- **Transition Speed**: Photo transitions should be smooth (60fps)
- **Memory Usage**: Maximum 100MB for photo cache
- **Network**: Optimize for mobile data usage

### **Browser Support**
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 13+
- **Features**: ES6+, CSS Grid, Flexbox, Web APIs

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Color contrast, keyboard navigation, screen reader support
- **Keyboard Navigation**: All functions accessible via keyboard
- **Screen Reader**: Proper ARIA labels and semantic HTML

## 🔒 **Security Considerations**

### **Authentication & Authorization**
- Carousel access restricted to authenticated users (all roles)
- Photos link visible to all authenticated users in main navigation
- Admin functions remain separate in Admin dropdown
- Secure photo URL generation with expiration

### **Data Protection**
- No sensitive data in client-side code
- Secure API endpoints with rate limiting
- Proper error handling without information leakage

## 📱 **Mobile Considerations**

### **Touch Interactions**
- Swipe left/right for navigation
- Pinch-to-zoom for photo details
- Tap to play/pause
- Long press for context menu

### **Performance**
- Optimized image sizes for mobile
- Lazy loading for better performance
- Minimal JavaScript for faster loading
- Progressive enhancement approach

## 🧪 **Testing Strategy**

### **Unit Tests**
- Carousel component functionality
- API endpoint responses
- Photo data processing
- Control panel interactions

### **Integration Tests**
- End-to-end carousel workflow
- Navigation between photos
- Full-screen mode functionality
- Mobile touch interactions

### **Performance Tests**
- Load time measurements
- Memory usage monitoring
- Network request optimization
- Cross-browser compatibility

### **User Acceptance Tests**
- Regular user carousel experience
- Admin user carousel experience
- Mobile device testing
- Accessibility compliance
- Error handling scenarios

## 📈 **Success Metrics**

### **Functional Metrics**
- [ ] Carousel loads and displays photos correctly
- [ ] All controls function as expected
- [ ] Full-screen mode works properly
- [ ] Mobile touch interactions work smoothly
- [ ] Photos link accessible to all authenticated users
- [ ] Navigation works for both regular and admin users

### **Performance Metrics**
- [ ] Initial load time < 2 seconds
- [ ] Photo transitions at 60fps
- [ ] Memory usage < 100MB
- [ ] Mobile performance acceptable

### **User Experience Metrics**
- [ ] Intuitive navigation controls
- [ ] Smooth transitions and animations
- [ ] Responsive design across devices
- [ ] Accessibility compliance achieved
- [ ] Family-friendly photo viewing experience
- [ ] Easy access through main Photos link

## 🚀 **Future Enhancements**

### **Phase 5: Advanced Features** (Future)
- **Photo Filtering**: Filter by event, date, or tags
- **Slideshow Themes**: Different visual themes and layouts
- **Social Sharing**: Share individual photos or slideshows
- **Photo Editing**: Basic editing tools within carousel
- **Playlist Creation**: Create custom photo playlists
- **Export Functionality**: Export slideshows as videos

### **Phase 6: Integration Features** (Future)
- **Event Integration**: Carousel for specific events
- **User-Generated Content**: Allow users to create carousels
- **Analytics**: Track carousel usage and popular photos
- **API Expansion**: Public API for carousel data

## 📝 **Implementation Notes**

### **Code Organization**
```
src/
├── routes/
│   └── carouselRoutes.ts          # Carousel API endpoints
├── controllers/
│   └── carouselController.ts      # Carousel business logic
├── middleware/
│   └── carouselValidation.ts      # Carousel input validation
└── services/
    └── carouselService.ts         # Carousel data processing

public/js/components/
└── carouselComponent.js           # Frontend carousel logic

views/
└── photos.ejs                     # Carousel page template (replaces current photos management)
    └── Renders within layout.ejs  # Maintains site consistency
```

### **Design Implementation Notes**
- **CSS Variables**: All styling uses existing site CSS variables for consistency
- **Layout Integration**: Carousel renders within `views/layout.ejs` for seamless navigation
- **Component Reuse**: Leverages existing button, card, and modal styles
- **Responsive Patterns**: Follows same mobile-first approach as existing pages
- **Accessibility**: Maintains existing ARIA patterns and keyboard navigation

### **Database Considerations**
- No new database tables required
- Leverage existing Photo and Event tables
- Consider adding carousel-specific indexes for performance
- Implement caching for frequently accessed photo data

### **Deployment Considerations**
- Feature flag for gradual rollout
- A/B testing for different carousel designs
- Monitoring for performance impact
- Rollback plan if issues arise
- **Important**: This will replace the current photos management page, so admin photo management will need to be moved to Admin dropdown

---

**Document Status**: Draft  
**Last Updated**: October 7, 2025  
**Next Review**: After Phase 1 completion  
**Approval Required**: Before implementation begins
