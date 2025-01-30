namespace BitShuva.Chavah.Models;

/// <summary>
/// A payment to be made to a musician on Chavah via Messiah's Music Fund.
/// </summary>
public class MessiahMusicFundPayment
{
    /// <summary>
    /// The recipient type for the payment.
    /// </summary>
    public MessiahMusicFundRecipientType RecipientType { get; set; }

    /// <summary>
    /// The amount of funds to send in US dollars, e.g. "5.42"
    /// </summary>
    public decimal AmountInUsd { get; set; }

    /// <summary>
    /// The recipient of the funds. This is either a PayPal email address or a Venmo phone number based on the <see cref="RecipientType"/>.
    /// </summary>
    public string Recipient { get; set; } = string.Empty;
}

/// <summary>
/// Type of payment when disbursing funds to a Messiah's Music Fund recipient.
/// </summary>
public enum MessiahMusicFundRecipientType
{
    /// <summary>
    /// The recipient is a PayPal email address.
    /// </summary>
    PayPalEmail,
    /// <summary>
    /// The recipient is a Venmo phone number.
    /// </summary>
    VenmoPhoneNumber
}
