# Logging Configuration

The application uses a configurable logging system to control console output verbosity.

## Environment Variables

### LOG_LEVEL
Controls the verbosity of console output. Available levels:

- `ERROR` (0) - Only error messages
- `WARN` (1) - Warnings and errors (default in production)
- `INFO` (2) - Informational messages, warnings, and errors (default in development)
- `DEBUG` (3) - All messages including debug information

### Examples

```bash
# Minimal output (production-like)
LOG_LEVEL=WARN npm start dev

# Normal development output
LOG_LEVEL=INFO npm start dev

# Verbose debugging output
LOG_LEVEL=DEBUG npm start dev
```

## Default Behavior

- **Development**: `INFO` level (shows important messages, hides debug details)
- **Production**: `WARN` level (shows only warnings and errors)

## What's Logged at Each Level

### ERROR
- Database connection failures
- S3 upload/download errors
- Authentication failures
- Server startup errors

### WARN
- S3 credentials not configured
- Database connection warnings
- All ERROR level messages

### INFO
- Server startup messages
- S3 service initialization
- Prisma client initialization
- All WARN and ERROR level messages

### DEBUG
- Authentication checks
- Home page event processing
- S3 file operations (uploads, downloads, signed URLs)
- Prisma database queries
- All other level messages

## Prisma Query Logging

Prisma query logging is controlled separately:
- **Default**: Only warnings and errors
- **Debug mode**: All queries when `LOG_LEVEL=DEBUG` in development
- **Production**: Only warnings and errors regardless of LOG_LEVEL
