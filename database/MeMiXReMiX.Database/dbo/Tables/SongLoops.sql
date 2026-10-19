
CREATE TABLE [dbo].[SongLoops]
(
    [SongLoopId] INT IDENTITY(1,1) NOT NULL,

    -- User-defined name for the saved arrangement.
    [Name] NVARCHAR(100) NOT NULL,

    [CreatedAt] DATETIME2 NOT NULL
        CONSTRAINT [DF_SongLoops_CreatedAt]
        DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [PK_SongLoops]
        PRIMARY KEY ([SongLoopId])
);
