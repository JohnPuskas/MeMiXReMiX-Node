
CREATE TABLE [dbo].[AudioAssets]
(
    [AudioAssetId] INT IDENTITY(1,1) NOT NULL,
    [InstrumentType] VARCHAR(50) NOT NULL,

    -- mp3 audio asset's path relative to the application's audio directory.
    [RelativePath] VARCHAR(255) NOT NULL,

    CONSTRAINT [PK_AudioAssets]
        PRIMARY KEY ([AudioAssetId]),

    /*
    Prevents registering the same mp3 file more than once.
    Each audio file should have only one catalog record even when reused by multiple saved songs.
    */
    CONSTRAINT [UQ_AudioAssets_RelativePath]
        UNIQUE ([RelativePath])
);
