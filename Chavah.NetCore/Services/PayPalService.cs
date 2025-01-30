using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services;

/// <summary>
/// Service for interacting with PayPal. Used by admin backend to send payments to artists whose music is on Chavah and have opted into donation disbursements.
/// </summary>
public class PayPalService
{
    private readonly string clientId;
    private readonly string clientSecret;
    private readonly string payPalApiUrl;
    private readonly HttpClient http;
    private readonly ILogger<PayPalService> logger;

    /// <summary>
    /// Creates a new instance of the PayPal service.
    /// </summary>
    /// <param name="httpClientFactory">The factory for creating an HTTP client to use to make calls to the PayPal REST API.</param>
    /// <param name="settings">App settings containing PayPal authentication information.</param>
    /// <param name="logger">Logger.</param>
    public PayPalService(IHttpClientFactory httpClientFactory, IOptions<AppSettings> settings, ILogger<PayPalService> logger)
    {
        clientId = settings.Value.PayPalClientId;
        clientSecret = settings.Value.PayPalClientSecret;
        payPalApiUrl = settings.Value.PayPalApiUrl;
        http = httpClientFactory.CreateClient();
        this.logger = logger;
    }

    /// <summary>
    /// Sends one or more payments via <see href="https://developer.paypal.com/docs/api/payments.payouts-batch/v1/#payouts_post">PayPal's Payouts API</see>. 
    /// </summary>
    /// <see cref=""/>
    /// <param name="payments">The payments to send.</param>
    /// <returns></returns>
    public async Task SendPayments(List<MessiahMusicFundPayment> payments)
    {
        var accessToken = await GetAccessTokenAsync();
        var batchPaymentResponse = await SubmitBatchPayout(accessToken, payments);

        // TODO: fetch the payout batch details to get the status of each payment. See https://developer.paypal.com/docs/api/payments.payouts-batch/v1/#payouts_get
    }

    private async Task<PayoutBatchResponse> SubmitBatchPayout(string accessToken, List<MessiahMusicFundPayment> payments)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sandbox.paypal.com/v1/payments/payouts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        var requestBody = new
        {
            sender_batch_header = new
            {
                sender_batch_id = "MessiahsMusicFundPayout_" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                email_subject = "You've received a payout from Chavah",
                email_message = "You have received a disbursement from Chavah Messianic Radio! Thank you for letting us play your music on our station. For details, visit messianicradio.com/give"
            },
            items = payments.Select(p => new
            {
                recipient_type = p.RecipientType == MessiahMusicFundRecipientType.PayPalEmail ? "EMAIL" : "PHONE",
                amount = new
                {
                    value = p.AmountInUsd.ToString("F2"),
                    currency = "USD"
                },
                note = "Courtesy of Chavah Messianic Radio, Messiah's Music Fund",
                purpose = "DONATIONS",
                sender_item_id = $"disbursement-{p.Recipient}-{p.AmountInUsd}",
                receiver = p.Recipient
            }).ToArray()
        };
        request.Content = JsonContent.Create(requestBody);

        var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Failed to send PayPal payout due to non-successful status code {code} - {status}.\r\n\r\nPayload:\r\n{json}", response.StatusCode, response.ReasonPhrase, requestBody.Value);
            throw new Exception("Failed to send PayPal payout due to error. See logs for more info.")
                .WithData("statusCode", response.StatusCode)
                .WithData("reasonPhrase", response.ReasonPhrase ?? string.Empty);
        }

        logger.LogInformation("Successfully submitted payments to {count} recipients totalling ${sum}.", payments.Count, payments.Sum(p => p.AmountInUsd));

        var responseContent = await response.Content.ReadAsStringAsync();
        var batchResponse = JsonSerializer.Deserialize<PayoutBatchResponse>(responseContent);
        if (batchResponse == null)
        {
            throw new Exception("Failed to deserialize PayPal payout response.");
        }

        return batchResponse;
    }

    private async Task<string> GetAccessTokenAsync()
    {
        var accessTokenUrl = new Uri(new Uri(payPalApiUrl), "/v1/oauth2/token");
        var request = new HttpRequestMessage(HttpMethod.Post, accessTokenUrl);
        var authToken = Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authToken));
        request.Content = new StringContent("grant_type=client_credentials", Encoding.UTF8, "application/x-www-form-urlencoded");

        var authResponse = await http.SendAsync(request);
        authResponse.EnsureSuccessStatusCode();

        var responseContent = await authResponse.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(responseContent);
        if (tokenResponse == null)
        {
            throw new Exception("Failed to deserialize PayPal token response.");
        }

        if (string.IsNullOrEmpty(tokenResponse.AccessToken))
        {
            throw new Exception("PayPal token response contained an empty access token");
        }

        return tokenResponse.AccessToken;
    }

    /// <summary>
    /// An OAuth token response from PayPal.
    /// </summary>
    internal class TokenResponse
    {
        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }

        [JsonPropertyName("app_id")]
        public string? AppId { get; set; }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; set; }

        [JsonPropertyName("nonce")]
        public string? Nonce { get; set; }
    }

    /// <summary>
    /// An OAuth token response from PayPal.
    /// </summary>
    internal class PayoutBatchResponse
    {
        [JsonPropertyName("batch_header")]
        public PayoutBatchHeader? BatchHeader { get; set; }
        [JsonPropertyName("links")]
        public List<PayPalLink>? Links { get; set; }
    }

    internal class PayoutBatchHeader
    {
        [JsonPropertyName("payout_batch_id")]
        public string? PayoutBatchId { get; set; }

        [JsonPropertyName("batch_status")]
        public string? BatchStatus { get; set; }

        [JsonPropertyName("sender_batch_header")]
        public SenderBatchHeader? SenderBatchHeader { get; set; }
    }

    internal class SenderBatchHeader
    {
        [JsonPropertyName("sender_batch_id")]
        public string? SenderBatchId { get; set; }

        [JsonPropertyName("email_subject")]
        public string? EmailSubject { get; set; }

        [JsonPropertyName("email_message")]
        public string? EmailMessage { get; set; }
    }

    internal class PayPalLink
    {
        [JsonPropertyName("href")]
        public string? Href { get; set; }

        [JsonPropertyName("rel")]
        public string? Rel { get; set; }

        [JsonPropertyName("method")]
        public string? Method { get; set; }

        [JsonPropertyName("encType")]
        public string? EncType { get; set; }
    }
}
