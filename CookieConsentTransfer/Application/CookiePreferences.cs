using System;

namespace YkbYapikredi.Application.CookieConsent
{
    public sealed record CookiePreferences(bool Functional, bool Analytics, bool Advertising)
    {
        public static CookiePreferences EssentialOnly { get; } = new CookiePreferences(false, false, false);
        public static CookiePreferences All { get; } = new CookiePreferences(true, true, true);

        public string Outcome => this == All ? "accepted" : this == EssentialOnly ? "rejected" : "partial";

        public string ToCookieValue() =>
            (Functional ? "1" : "0") + (Analytics ? "1" : "0") + (Advertising ? "1" : "0");

        public static CookiePreferences? FromCookieValue(string value)
        {
            if (value.Length != 3 || Array.Exists(value.ToCharArray(), c => c != '0' && c != '1'))
            {
                return null;
            }

            return new CookiePreferences(value[0] == '1', value[1] == '1', value[2] == '1');
        }
    }
}
