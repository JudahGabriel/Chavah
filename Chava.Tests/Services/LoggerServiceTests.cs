using BitShuva.Models;
using BitShuva.Services;
using Raven.Client;
using Raven.Client.Embedded;
using System.Threading.Tasks;
using Xunit;

namespace Chava.Tests.Services
{
    public class LoggerServiceTests
    {
        private EmbeddableDocumentStore _documentStore;
        private LoggerService _logger;
        private IAsyncDocumentSession _session;
        
        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public LoggerServiceTests()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();
            _logger = new LoggerService(_session);
        }
        #endregion

        [Fact]
        public async Task InfoTest()
        {   //Arrange
            var message = "Info";

            //Act
            var result = await _logger.Info(message);

            //Assert
            Assert.Equal(LogLevel.Info, result.Level);
            Assert.Equal(message, result.Message);
        }

        [Fact]
        public async Task ErrorTest()
        {   //Arrange
            var message = "Error";

            //Act
            var result = await _logger.Error(message,message);

            //Assert
            Assert.Equal(LogLevel.Error, result.Level);
            Assert.Equal(message, result.Message);
        }

        public async Task WarnTest()
        {   //Arrange
            var message = "Warn";

            //Act
            var result = await _logger.Warn(message);

            //Assert
            Assert.Equal(LogLevel.Warn, result.Level);
            Assert.Equal(message, result.Message);
        }
              
    }
}
