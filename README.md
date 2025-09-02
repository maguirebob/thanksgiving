# Thanksgiving Menu Web Application

A web application that displays a collection of Thanksgiving menus from 1994 to 2005. Available as both a Node.js server application and a static site for GitHub Pages deployment.

## Features

- Display all Thanksgiving menus on the home page
- Beautiful, responsive design with Bootstrap
- Static site version for GitHub Pages
- Node.js server version with database integration
- Menu images display with fallback placeholder

## Deployment Options

### Option 1: GitHub Pages (Static Site) - Recommended for Public Sharing

The static version is ready for GitHub Pages deployment and requires no server setup.

### Option 2: Node.js Server (Local Development)

For local development with database integration.

## Prerequisites (Node.js Version Only)

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## GitHub Pages Deployment (Static Site)

### Quick Setup

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add static site for GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/docs" folder
   - Click "Save"

3. **Add Menu Images:**
   - Place your menu images in the `docs/images/` directory
   - Make sure filenames match those in `docs/data/events.json`

4. **Access Your Site:**
   - Your site will be available at: `https://yourusername.github.io/thanksgiving`

### Manual Deployment

If you prefer manual deployment:

1. Copy files from `public/` to `docs/`
2. Add your menu images to `docs/images/`
3. Push changes to GitHub
4. GitHub Pages will automatically deploy from the `docs/` folder

## Local Development (Node.js Server)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd thanksgiving
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your PostgreSQL database:
   - Create a database named `thanksgiving_db` (or update the name in config.js)
   - Run the SQL script in `admin/create_tables.sql` to create the table and insert sample data

4. Configure your database connection:
   - Update the database credentials in `config.js`
   - Or set environment variables:
     ```bash
     export DB_HOST=localhost
     export DB_PORT=5432
     export DB_NAME=thanksgiving_db
     export DB_USER=your_username
     export DB_PASSWORD=your_password
     ```

5. Add menu images:
   - Place your menu images in the `public/images/` directory
   - Make sure the filenames match those in your database

### Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
thanksgiving/
├── docs/                          # GitHub Pages static site
│   ├── index.html                 # Main page
│   ├── data/
│   │   └── events.json            # Menu data
│   └── images/                    # Menu images for GitHub Pages
├── public/                        # Static site files
│   ├── index.html                 # Main page
│   ├── data/
│   │   └── events.json            # Menu data
│   └── images/                    # Menu images
├── admin/
│   └── create_tables.sql          # Database schema and sample data
├── models/
│   ├── index.js                   # Sequelize configuration
│   └── Event.js                   # Event model definition
├── views/
│   ├── layout.ejs                 # Main layout template
│   ├── index.ejs                  # Home page template
│   └── error.ejs                  # Error page template
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions deployment
├── config.js                      # Database configuration
├── server.js                      # Express server setup
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## API Endpoints

- `GET /` - Home page displaying all menus
- `GET /api/events` - JSON API endpoint returning all events

## Database Schema

The application uses a single `Events` table that contains:
- `event_id` - Primary key (auto-increment)
- `event_name` - Name of the event
- `event_type` - Type of event (e.g., "Thanksgiving")
- `event_location` - Location of the event
- `event_date` - Date of the event
- `event_description` - Description of the event
- `menu_title` - Title of the menu
- `menu_image_filename` - Filename of the menu image

## Customization

- Update the styling in `views/layout.ejs` to match your preferences
- Modify the database schema in `models/Event.js` if needed
- Add new routes in `server.js` for additional functionality
- Update the menu images in `public/images/` directory

## Troubleshooting

1. **Database Connection Issues**: Verify your PostgreSQL credentials and ensure the database exists
2. **Image Not Displaying**: Check that menu images are in the `public/images/` directory with correct filenames
3. **Port Already in Use**: Change the PORT environment variable or kill the process using port 3000

## License

ISC
