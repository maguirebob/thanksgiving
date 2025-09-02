# Thanksgiving Menu Web Application

A Node.js web application that displays a collection of Thanksgiving menus from 1994 to 2005 using Express, Sequelize, and PostgreSQL.

## Features

- Display all Thanksgiving menus on the home page
- Beautiful, responsive design with Bootstrap
- Database integration with Sequelize ORM
- PostgreSQL database support
- Menu images display with fallback placeholder

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

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

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
thanksgiving/
├── admin/
│   └── create_tables.sql          # Database schema and sample data
├── models/
│   ├── index.js                   # Sequelize configuration
│   └── Event.js                   # Event model definition
├── views/
│   ├── layout.ejs                 # Main layout template
│   ├── index.ejs                  # Home page template
│   └── error.ejs                  # Error page template
├── public/
│   └── images/                    # Menu images directory
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
