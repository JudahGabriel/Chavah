using System;

namespace BitShuva.Chavah.Models;

/// <summary>
/// Represents a PayPal order that was created but not yet approved. The user will need to visite the ApproveUrl in their browser to approve it.
/// </summary>
/// <param name="OrderId">The ID of the PayPal order.</param>
/// <param name="ApproveUrl">The URL where the payer can approve the order.</param>
public record PayPalOrderConfirmation(string OrderId, Uri ApproveUrl);
