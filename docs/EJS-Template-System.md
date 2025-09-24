# EJS Template System Documentation

## Overview

This document explains how the EJS templating system works in the Thanksgiving website, specifically the relationship between `layout.ejs` and individual page templates like `index.ejs`.

## Template Hierarchy

### Master Template: `layout.ejs`

**Purpose**: Contains the common HTML structure for ALL pages

**Contains**:
- `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` tags
- Common CSS/JS includes (Bootstrap, Font Awesome, custom styles)
- Navigation menu, header, footer
- `<%- body %>` placeholder where page content gets inserted

**Key Features**:
- Defines the overall page structure
- Includes all shared resources (CSS, JavaScript, fonts)
- Contains the navigation menu and site-wide elements
- Uses `<%- body %>` to inject page-specific content

### Page Templates: `index.ejs`, `detail.ejs`, etc.

**Purpose**: Contains ONLY the specific content for each page

**Contains**:
- Page-specific content (hero sections, forms, data displays)
- NO HTML structure tags (no `<html>`, `<head>`, `<body>`)
- Just the content that goes inside the layout

**Examples**:
- `index.ejs` - Homepage content (hero, menu grid, story section)
- `detail.ejs` - Individual menu detail page content
- `auth/login.ejs` - Login form content
- `admin/dashboard.ejs` - Admin dashboard content

## How Templates Work Together

### Template Rendering Process

```
When you render 'index.ejs':
1. Express looks for layout.ejs (the master template)
2. Express takes the content from index.ejs
3. Express inserts index.ejs content into layout.ejs at <%- body %>
4. The final HTML combines both templates
```

### File Structure

```
views/
├── layout.ejs              ← Master template (HTML structure)
├── index.ejs               ← Homepage content only
├── detail.ejs              ← Menu detail page content only
├── error.ejs               ← Error page content only
├── auth/
│   ├── login.ejs           ← Login page content only
│   ├── register.ejs        ← Register page content only
│   └── profile.ejs         ← Profile page content only
└── admin/
    ├── dashboard.ejs       ← Admin dashboard content only
    └── users.ejs           ← User management content only
```

## Express Configuration

The template system is configured in `api/index.js`:

```javascript
const expressLayouts = require('express-ejs-layouts');

// Enable EJS layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');  // Use layout.ejs as the master template
```

## Benefits of This System

### 1. DRY Principle (Don't Repeat Yourself)
- No repeated HTML structure across pages
- Common elements defined once in `layout.ejs`

### 2. Consistent Styling
- All pages automatically use the same CSS/JS
- Navigation menu consistent across all pages
- Branding and styling centralized

### 3. Easy Maintenance
- Change navigation once, affects all pages
- Update CSS/JS in one place
- Add new global features easily

### 4. Modular Design
- Each page focuses only on its unique content
- Templates are easier to read and maintain
- Clear separation of concerns

## Example: Homepage Rendering

### Route Handler
```javascript
app.get('/', redirectToLogin, async (req, res) => {
  // Fetch data
  const events = await getEvents();
  
  // Render template
  res.render('index', {
    title: 'Thanksgiving Menus',
    events: events,
    user: req.user
  });
});
```

### Template Combination
1. **Express finds `layout.ejs`** as the master template
2. **Express finds `index.ejs`** as the page content
3. **Express combines them**:
   - `layout.ejs` provides HTML structure, navigation, styles
   - `index.ejs` content gets inserted at `<%- body %>`
4. **Final HTML** = Complete page with navigation + homepage content

## Template Variables

### Available in All Templates
- `title` - Page title
- `user` - Current user object (if logged in)
- `error` - Error messages
- `success` - Success messages

### Page-Specific Variables
- `events` - Array of events (homepage)
- `event` - Single event object (detail page)
- `users` - Array of users (admin users page)
- `stats` - Statistics object (admin dashboard)

## Best Practices

### 1. Keep Page Templates Focused
- Only include content specific to that page
- Don't repeat HTML structure elements
- Use semantic HTML for content sections

### 2. Use Layout Variables
- Pass common data through the layout
- Use `typeof` checks for optional variables
- Provide sensible defaults

### 3. Organize Templates
- Group related templates in subdirectories
- Use descriptive filenames
- Keep templates under 200 lines when possible

### 4. Error Handling
- Always provide fallback content
- Use conditional rendering (`<% if %>`)
- Handle missing data gracefully

## Common Patterns

### Conditional Content
```ejs
<% if (typeof user !== 'undefined' && user) { %>
  <p>Welcome, <%= user.username %>!</p>
<% } else { %>
  <p>Please log in to continue.</p>
<% } %>
```

### Dynamic Titles
```ejs
<title><%= typeof title !== 'undefined' ? title : 'Thanksgiving Menus' %> - Thanksgiving Menus</title>
```

### Looping Through Data
```ejs
<% events.forEach(event => { %>
  <div class="menu-item">
    <h3><%= event.event_name %></h3>
    <p><%= event.description %></p>
  </div>
<% }); %>
```

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Check file path in `res.render()`
   - Ensure template exists in `views/` directory

2. **Variables Not Defined**
   - Use `typeof` checks for optional variables
   - Pass all required data in `res.render()`

3. **Layout Not Applied**
   - Verify `expressLayouts` is configured
   - Check `app.set('layout', 'layout')` setting

4. **Styling Issues**
   - Ensure CSS is included in `layout.ejs`
   - Check for conflicting styles in page templates

## Conclusion

The EJS template system provides a clean, maintainable way to build web pages with consistent structure and styling. By separating layout concerns from page content, we can easily maintain and extend the website while keeping code organized and DRY.

This system is commonly used in web development and is supported by many templating engines including EJS, Handlebars, and others.
