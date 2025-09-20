const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// EJS configuration
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production';

// Simple test endpoint (no database required)
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

module.exports = app;
