using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;

using Microsoft.Extensions.Logging;

using Raven.Client.Documents;
using Raven.Client.Documents.Linq;

namespace BitShuva.Chavah.Services;

/// <summary>
/// Background service that periodically checks for old album submissions that have been are no longer in the pending state. When it finds them, it will delete it and all of its temporary file uploads.
/// It also cleans up any TemporaryFile documents that are older than a certain amount of time.
/// </summary>
public class AlbumSubmissionCleanup : TimedBackgroundServiceBase
{
    private readonly ICdnManagerService cdn;
    private readonly IDocumentStore db;

    private readonly TimeSpan rejectedSubmissionMaxAge = TimeSpan.FromDays(30 * 3); // 3 months
    private readonly TimeSpan tempFileMaxAge = TimeSpan.FromDays(30 * 6); // 6 months

    public AlbumSubmissionCleanup(
        ICdnManagerService cdn,
        IDocumentStore db,
        ILogger<AlbumSubmissionCleanup> logger)
        : base(dueTime: TimeSpan.FromHours(24), intervalTime: TimeSpan.FromDays(7), logger)
    {
        this.cdn = cdn;
        this.db = db;
    }

    public override async Task DoWorkAsync(CancellationToken cancelToken)
    {
        await DeleteCompletedAlbumSubmissions();
        await DeleteOldTempFiles();
    }

    private async Task DeleteOldTempFiles()
    {
        using var dbSession = db.OpenAsyncSession();
        var oldTempFiles = await dbSession.Query<TempFile>()
            .Where(t => t.CreatedAt < DateTime.UtcNow.Subtract(tempFileMaxAge))
            .Take(100)
            .ToListAsync();
        foreach (var tempFile in oldTempFiles)
        {
            await cdn.DeleteTempFileAsync(tempFile.CdnId);
            dbSession.Delete(tempFile);
        }
    }

    private async Task DeleteCompletedAlbumSubmissions()
    {
        using var dbSession = db.OpenAsyncSession();
        var completedSubmissions = await dbSession.Query<AlbumSubmissionByArtist>()
            .Where(a => a.Status != ApprovalStatus.Pending && a.CreatedAt < DateTime.UtcNow.Subtract(rejectedSubmissionMaxAge))
            .Take(10)
            .ToListAsync();
        foreach (var submission in completedSubmissions)
        {
            try
            {
                // Delete the album submission document.
                dbSession.Delete(submission);

                // Delete the temporary media files from the CDN.
                var tempFilesToDelete = submission.Songs.Concat([submission.AlbumArt]);
                foreach (var tempFile in tempFilesToDelete)
                {
                    await cdn.DeleteTempFileAsync(tempFile.CdnId);
                }

                await dbSession.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to delete rejected album submission with ID {submissionId}. You may want to manually delete this submission and its temporary media files. Album name {albumName} by artist {artist}", submission.Id, submission.Name, submission.Artist);
            }
        }
    }
}
