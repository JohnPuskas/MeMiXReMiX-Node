-- Create a SQL Server login for the app.
-- Replace the password placeholder in a temporary local copy.
USE [master];
GO

CREATE LOGIN [memixremix_app]
WITH PASSWORD = 'REPLACE_WITH_SECURE_PASSWORD',
     CHECK_POLICY = ON,
     CHECK_EXPIRATION = OFF,
     DEFAULT_DATABASE = [MeMiXReMiX];
GO

-- Create a database user associated with the server login.
USE [MeMiXReMiX];
GO

CREATE USER [memixremix_app]
FOR LOGIN [memixremix_app];
GO

-- Grant permissions to read and modify application data but do not grant db_owner or sysadmin privileges.
ALTER ROLE [db_datareader]
ADD MEMBER [memixremix_app];
GO

ALTER ROLE [db_datawriter]
ADD MEMBER [memixremix_app];
GO