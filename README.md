# MeMixReMix

**Status: Work in Progress — Active Development**

MeMiXReMiX is a web application for combining synchronized instrument mp3 audio loops
into a musical arrangement. It allows a user to dynamically combine loops of individual instruments into a layered arrangement, and also to save and replay their arrangements.

The application is being developed with Node.js, Express, JavaScript, and Microsoft SQL Server.

> **Development Notice:** This project is currently under active development. Features, application architecture, and database structures are subject to change. The application is not yet considered production-ready.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** Microsoft SQL Server Express
- **ORM:** Sequelize
- **SQL Server Driver:** Tedious
- **Configuration:** dotenv
- **Database Schema Management:** SQL Database Projects (DACPAC)
- **Database Development:** Database-first using a SQL Database Project
- **Frontend:** HTML, CSS, JavaScript
- **Audio Processing:** JavaScript Web Audio API

## Project Dependencies

### Runtime Dependencies

- **Express** — HTTP server, routing, and static asset serving.
- **Sequelize** — Object-relational mapping and database access.
- **Tedious** — Microsoft SQL Server driver for Sequelize.
- **dotenv** — Environment variable configuration.

### Development Dependencies

- **sequelize-auto** — Generates Sequelize models from the existing SQL Server database schema.

## Current Functionality

- SQL Server database schema with audio assets, song loops, and their associations.
- Database-first Sequelize models.
- Automated discovery and registration of MP3 assets.
- REST API endpoint for retrieving available audio assets.
- Dynamic generation of instrument-selection controls.

## Planned Functionality

- Static serving of MP3 files through Express.
- Synchronized playback and looping using the Web Audio API.
- Saving user-created arrangements to SQL Server.
- Retrieving and replaying previously saved arrangements.
- Improved playback controls and user interface.
- User accounts and arrangement ownership.

## Development Notes

The application follows a database-first development approach. SQL Database Projects define and manage the database schema, while Sequelize provides application-level data access.

MP3 files are stored separately from SQL Server. The database maintains metadata and relative filesystem paths, allowing audio storage locations to be configured independently.

Additional setup and deployment documentation will be added as development progresses.
