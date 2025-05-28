# Manual Steps Required to Complete the Migration

## 1. Database Update

You need to execute the SQL script to add the role column to your usuarios table. 

**Run this in your MySQL client (MySQL Workbench, phpMyAdmin, or command line):**

```sql
USE ingeocim_form;

-- Add role column if it doesn't exist
ALTER TABLE usuarios ADD COLUMN role ENUM('admin', 'lab', 'client') DEFAULT 'client';

-- Update existing users with their roles
UPDATE usuarios SET role = 'admin' WHERE email = 'eider@ingeocimyc.com';
UPDATE usuarios SET role = 'lab' WHERE email = 'milton@ingeocimyc.com';
UPDATE usuarios SET role = 'admin' WHERE email = 'daniel@ingeocimyc.com';

-- Verify the changes
SELECT email, name, role, created_at FROM usuarios;
```

## 2. New API Structure

After running the SQL script, your API will have the following structure:

### Admin Routes (admin role required)
- `/api/auth/*` - Authentication
- `/api/project-management/projects/*` - Project management
- `/api/project-management/financial/*` - Financial management

### Lab Routes (admin, lab roles)
- `/api/lab/apiques/*` - Apiques management
- `/api/lab/profiles/*` - Profiles and blow management

### Client Routes (admin, client, lab roles for viewing)
- `/api/client/service-requests/*` - Service request management
- `/api/services/*` - Available services

### PDF Generation
- `/api/pdf/*` - PDF generation (admin only)

## 3. User Roles

- **admin**: Full access to all modules
- **lab**: Access to laboratory modules (apiques, profiles) and viewing service requests
- **client**: Can create service requests and view services

## 4. Testing Steps

1. Run the SQL script above
2. Start the application: `npm run start:dev`
3. Test authentication with each user:
   - milton@ingeocimyc.com (lab role)
   - eider@ingeocimyc.com (admin role) 
   - daniel@ingeocimyc.com (admin role)

## 5. API Documentation

Once running, visit: http://localhost:5050/api/docs

This will show you all the available endpoints organized by role-based modules.
