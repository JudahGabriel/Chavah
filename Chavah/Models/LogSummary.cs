using Optional;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    /// <summary>
    /// An instance of an error or other log. Rather than logging the same error 20 times, we store a single LogSummary containing all the instances of that error.
    /// Makes it easier for humans to reason about which errors are occuring and how often.
    /// </summary>
    public class LogSummary
    {
        public string Id { get; set; }
        public string Message { get; set; }
        public string Exception { get; set; }
        public LogLevel Level { get; set; }
        public DateTime? FirstOccurrence { get; set; }
        public DateTime LastOccurrence { get; set; } = DateTime.UtcNow;
        public List<ChavahLog> Occurrences { get; set; } = new List<ChavahLog>();
        public int OccurrencesCount { get; set; }

        private const int MaxErrorCount = 10;

        /// <summary>
        /// Adsd
        /// </summary>
        /// <param name="log"></param>
        public void AddLog(ChavahLog log)
        {
            if (FirstOccurrence == null)
            {
                FirstOccurrence = DateTime.UtcNow;
            }

            Occurrences.Add(log);
            LastOccurrence = DateTime.UtcNow;
            OccurrencesCount++;
            Level = log.Level;
            Message = log.Message;
            Exception = log.Exception;
            Id = GetIdForLog(log);
            
            // We don't store an infinite number of logs inside a LogSummary. Trim them down as necessary.
            if (Occurrences.Count > MaxErrorCount)
            {
                Occurrences.RemoveAt(0);
            }
        }

        public static string GetIdForLog(ChavahLog log)
        {
            var hashCode = log.Exception.SomeNotNull() // Use the Exception
                .Or(log.Message) // No Exception? Use the message.
                .Map(m => m.GetHashCode())
                .ValueOr(() => log.GetHashCode()); // No Exception or Message? Use the hash code of the log.
            
            return "LogSummary/" + hashCode;
        }
    }
}