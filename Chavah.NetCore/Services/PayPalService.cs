using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using PaypalServerSdk.Standard;
using PaypalServerSdk.Standard.Authentication;
using PaypalServerSdk.Standard.Models;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services;

/// <summary>
/// Service for interacting with PayPal. Used by admin backend to send payments to artists whose music is on Chavah and have opted into donation disbursements.
/// </summary>
public class PayPalService
{
    private readonly PaypalServerSdkClient payPalClient;
    private readonly ILogger<PayPalService> logger;

    /// <summary>
    /// Creates a new instance of the PayPal service.
    /// </summary>
    /// <param name="httpClientFactory">The factory for creating an HTTP client to use to make calls to the PayPal REST API.</param>
    /// <param name="settings">App settings containing PayPal authentication information.</param>
    /// <param name="logger">Logger.</param>
    public PayPalService(IHttpClientFactory httpClientFactory, IOptions<AppSettings> settings, ILogger<PayPalService> logger)
    {
        var clientId = settings.Value.PayPalClientId;
        var clientSecret = settings.Value.PayPalClientSecret;
        var payPalEnv = settings.Value.PayPalEnv;

        var auth = new ClientCredentialsAuthModel.Builder(clientId, clientSecret).Build();
        payPalClient = new PaypalServerSdkClient.Builder()
            .ClientCredentialsAuth(auth)
            .Environment(payPalEnv == "production" ? PaypalServerSdk.Standard.Environment.Production : PaypalServerSdk.Standard.Environment.Sandbox)
            .LoggingConfig(c => c
                .LogLevel(LogLevel.Debug)
                .RequestConfig(req => req.Body(true))
                .ResponseConfig(res => res.Headers(true)))
            .Build();

        this.logger = logger;
    }

    /// <summary>
    /// Creates a PayPal order via the PayPal REST API. https://github.com/paypal/PayPal-Dotnet-Server-SDK
    /// Creating an order doesn't pay it. In order to pay, the user must confirm payment via the returned approval link, then call .PayOrder(orderId)
    /// </summary>
    /// <param name="payment">The payment to send.</param>
    /// <returns>A PayPal order containing the payment amount and payee.</returns>
    public async Task<PayPalOrderConfirmation> CreateOrder(MessiahMusicFundPayment payment)
    {
        var order = new OrdersCreateInput
        {
            Prefer = "return=representation",
            Body = new OrderRequest
            {
                Intent = CheckoutPaymentIntent.Capture,
                PurchaseUnits = new List<PurchaseUnitRequest>
                {
                    new()
                    {
                        Amount = new AmountWithBreakdown
                        {
                            CurrencyCode = "USD",
                            MValue = payment.AmountInUsd.ToString(),
                        },
                        Description = $"Courtesy of Chavah Messianic Radio, Messiah's Music Fund. https://messianicradio.com/give Thanks for the music!",
                        Payee = new Payee
                        {
                            EmailAddress = payment.RecipientAddress
                        },
                    },
                },
                ApplicationContext = new OrderApplicationContext
                {
                    ReturnUrl = $"https://messianicradio.com/#/admin/donations?paypalordercreated=true&artistid={Uri.EscapeDataString(payment.RecipientArtistId)}",
                    CancelUrl = $"https://messianicradio.com/#/admin/donations?paypalordercreated=false&artistid={Uri.EscapeDataString(payment.RecipientArtistId)}",
                    UserAction = OrderApplicationContextUserAction.PayNow
                }
            }
        };

        var orderResult = await payPalClient.OrdersController.OrdersCreateAsync(order);
        var approveLink = orderResult.Data.Links
            .Where(link => link.Rel == "approve")
            .Select(link => new Uri(link.Href))
            .FirstOrDefault();
        if (approveLink == null)
        {
            logger.LogError("Paypal order was created with status code {status}, but no approve link was found in the response: {links}", orderResult.StatusCode, string.Join("\r\n", orderResult.Data.Links));
            throw new Exception("PayPal order was created, but no approve link was found in the response.");
        }

        logger.LogInformation("Successfully created PayPal order {id} with status {status} for donation of ${amount} to {payee}, with approval link {approvalLink}", orderResult.Data.Id, orderResult.StatusCode, payment.AmountInUsd, payment.RecipientAddress, approveLink);
        return new PayPalOrderConfirmation(orderResult.Data.Id, approveLink);
    }

    /// <summary>
    /// Captures payment for an order. This is the final step in the payment process.
    /// </summary>
    /// <param name="orderId">The ID of the previously-created order.</param>
    /// <returns>The paid order ID.</returns>
    public async Task<string> PayOrder(string orderId)
    {
        var capture = new OrdersCaptureInput
        {
            Id = orderId,
            Prefer = "return=representation"
        };
        var captureResult = await payPalClient.OrdersController.OrdersCaptureAsync(capture);
        logger.LogInformation("Successfully captured PayPal order {id} with status {status}", captureResult.Data.Id, captureResult.StatusCode);
        return captureResult.Data.Id;
    }
}
