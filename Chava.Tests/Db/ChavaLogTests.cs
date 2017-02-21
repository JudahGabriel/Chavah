using BitShuva.Models;
using Raven.Client;
using Raven.Client.Embedded;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Chava.Tests.Db
{
    public class ChavaLogTests
    {
        private EmbeddableDocumentStore _documentStore;
        private IAsyncDocumentSession _session;

        #region TestInitize
        /// <summary>
        /// TestInitialize for the tests
        /// </summary>
        public ChavaLogTests()
        {
            // Arrange
            _documentStore = new InMemoryDocumentStore().Store;
            _session = _documentStore.OpenAsyncSession();
        }
        #endregion

        [Fact]
        public async Task InfoTest()
        {   //Arrange
            var message = "Info";

            //Act
            var result = await ChavahLog.Info(_session, message);

            //Assert
            Assert.Equal(LogLevel.Info, result.Level);
            Assert.Equal(message, result.Message);
        }

        [Fact]
        public async Task ErrorTest()
        {
            //Arrange
            var message = "Exception";

            //Act
            var result = await ChavahLog.Error(_session, message, message);

            //Assert
            Assert.Equal(LogLevel.Error, result.Level);
            Assert.Equal(message, result.Message);
        }

        [Fact]
        public async Task WarnTest()
        {
            //Arrange
            var message = "Warn";

            //Act
            var result = await ChavahLog.Warn(_session, message, message);

            //Assert
            Assert.Equal(LogLevel.Warn, result.Level);
            Assert.Equal(message, result.Message);
        }
    }
}
