
CREATE TABLE [dbo].[SongLoopAudioAssets]
(
    [SongLoopId] INT NOT NULL,
    [AudioAssetId] INT NOT NULL,

    -- Prevents the same audio asset from being associated with the same SongLoop more than once.
    CONSTRAINT [PK_SongLoopAudioAssets]
        PRIMARY KEY ([SongLoopId], [AudioAssetId]),

    -- Ensures every association references an existing SongLoop.
    CONSTRAINT [FK_SongLoopAudioAssets_SongLoops]
        FOREIGN KEY ([SongLoopId])
        REFERENCES [dbo].[SongLoops] ([SongLoopId]),

    -- Ensures every association references an existing audio asset.
    CONSTRAINT [FK_SongLoopAudioAssets_AudioAssets]
        FOREIGN KEY ([AudioAssetId])
        REFERENCES [dbo].[AudioAssets] ([AudioAssetId])
);
