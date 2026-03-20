[2026-03-21 00:10] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Status bar contrast",
    "EXPECTATION": "Ensure time, Wi‑Fi, and battery are visible by avoiding white text/icons on a white background.",
    "NEW INSTRUCTION": "WHEN status bar background luminance is high THEN render icons and text in dark color"
}

[2026-03-21 00:12] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Status bar visibility",
    "EXPECTATION": "Status bar icons (time, Wi‑Fi, battery) should remain visible after load and not switch to an invisible state.",
    "NEW INSTRUCTION": "WHEN sampled luminance is high or sampling fails THEN force dark status icons"
}

