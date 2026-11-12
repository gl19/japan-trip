# Japan trip itinerary

A public GitHub Pages site for a group trip to Japan (12 Nov – 2 Dec 2026). The whole site is one file, `index.html`. The owner (Xin) asks Claude to add or change plans, usually by pasting booking emails or screenshots, sometimes from a phone while traveling.

## Where the data lives

All trip data is the JSON inside `<script type="application/json" id="trip-data">` in `index.html`. Change that block only. Leave the CSS and the `app-code` script alone unless asked for a feature.

```
{ "name", "start", "end", "travelers": ["Xin", "Sheila", "Rohan", "Danny", "Nathan"], "items": [ ... ] }
```

Each item is one JSON object on its own line:

| field | meaning |
|---|---|
| `id` | unique, e.g. `h-hotel-name`, `e-event`, `t-from-to`, `f-flight` |
| `type` | `flight`, `hotel`, `transit`, `event` (activities), `food` |
| `title` | name; for flights, airline + number (`ZIPAIR · ZG026`) |
| `date`, `time` | `YYYY-MM-DD`, `HH:MM` 24h. Hotels: check-in |
| `endDate`, `endTime` | flights: arrival; hotels: check-out; events/transit: end time |
| `from`, `to` | flights: airport codes (`NRT`); transit: start/end places, ideally exact hotel names or stations so the Directions link is precise |
| `city` | `Tokyo`, `Kyoto`, … (hotels need it; it drives the route line) |
| `address`, `ja` | street address; Japanese name for showing taxi drivers |
| `status` | `booked`, `tobook`, `open` (no booking needed / walk-in), `maybe` (tentative) |
| `who` | comma-separated first names; leave out when it's everyone |
| `notes`, `link` | free text (`\n` for line breaks); a URL |
| `area`, `cuisine`, `price` (1–4) | food only |
| `by` | `"Claude"` for suggestions Claude added rather than real bookings |
| `options` | several choices for one slot (e.g. lunch spots): `[{title, ja, cuisine, area, address, price, notes}]`. Shown as one entry; the dropdown lists each with its own Map button. Set the item's `cuisine` to e.g. `"4 options"` |
| `optionsLabel` | optional heading for the options list, e.g. `"Vegetarian-focused spots nearby"` (default: `"N options"`) |

No date means it shows under "Ideas" (or the Food tab). Overlapping hotels are fine: the "Plans for" switch at the top filters by `who`, and the Everyone view uses the stay with the most people.

## Rules

- **This site and its git history are public.** Never add confirmation numbers, booking IDs, PINs, e-ticket numbers, seat numbers, card digits, email addresses, a private person's phone number, or anyone's last name. Business phone numbers (hotels, shops) are fine. Say where the code is instead ("the reservation ID is in Sheila's email").
- Times are local to where each thing happens. Sheila's Google Calendar invites are in **Pacific time**: in November add 17 hours to get Japan time (9:30 pm PST Sat = 14:30 JST Sun).
- Use first names: Xin, Sheila, Rohan, Danny, Nathan (not Nathaniel). Tarun appears on some bookings but is Rohan's dad, not a traveler.
- When adding a time-sensitive activity, consider how people get there and add a `transit` item before it if the trip is non-trivial.
- Escape `<` in the JSON as `<`.

## Publishing

1. Edit the JSON block.
2. Run `node tools/check.js`. It must print `OK`. It fails on anything that looks private.
3. Commit and push to `main`. GitHub Pages redeploys in about a minute.
