﻿namespace BitShuva.Chavah.Models
{
    public class AccountToken
    {
        public string? Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public string ApplicationUserId { get; set; } = string.Empty;
    }
}
