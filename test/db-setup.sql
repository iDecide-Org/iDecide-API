-- Test database setup script
-- This script ensures the test database exists and is properly configured

-- Create the test database if it doesn't exist (run this manually if needed)
-- CREATE DATABASE idecide_test;

-- Connect to the test database
\c idecide_test;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE idecide_test TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';
