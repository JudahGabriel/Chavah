using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    [Migration(2, Description = "Adds an empty ThrowawayEmail document to the database")]
    public class ThrowawayEmailDoc : Migration
    {
        public override void Up()
        {
            using var dbSession = DocumentStore.OpenSession();
            var id = "ThrowawayEmailDomains/1";
            var existingDoc = dbSession.Load<ThrowawayEmailDomains>(id);
            if (existingDoc == null)
            {
                dbSession.Store(new ThrowawayEmailDomains(), id);
                dbSession.SaveChanges();
            }
        }
    }
}
