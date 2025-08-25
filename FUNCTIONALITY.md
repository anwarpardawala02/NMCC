# Northolt Manor Cricket Club App – Current Functionality

_Last updated: 2025-08-24_

## Player Management
- **Player Registration:**
  - Public users can register as new players via the registration form.
  - Registration collects: full name, email, phone, and optional photo.
- **Player Listing:**
  - Team page displays all active players, grouped by role (player, secretary, treasurer, admin).
  - Player lookup by ID.
- **Player Roles:**
  - Players have roles: player, secretary, treasurer, admin (see `role` column in `players` table).

## Gallery
- **Photo Gallery:**
  - Publicly viewable gallery.
  - Authenticated users can upload photos.

## Blog/News
- **Blog Posts:**
  - Public can view club news.
  - Admins can create/edit blog posts.

## Sponsors
- **Sponsor Listing:**
  - Public can view sponsors.
  - Admins can add/edit sponsors.

## Matches & Availability
- **Fixtures & Results:**
  - Public can view upcoming and past matches.
- **Player Availability:**
  - Logged-in users can set their availability for matches.

## Statistics
- **Player Statistics:**
  - Public can view player stats by season.
  - Admins can update player statistics.

## Finance
- **Transactions:**
  - Treasurer/admin can add, view, and filter financial transactions.
  - Transactions are categorized (revenue/expense).

## Polls
- **Club Polls:**
  - Admins can create polls.
  - Members can vote on active polls.

## Authentication
- **Magic Link Login:**
  - Users sign in via email magic link.

---

## Future Ideas / Pending Work

## [ ] Player profile editing (by player)
## [ ] Automated email notifications (registration, match reminders)
## [ ] Export statistics/transactions to CSV
## [ ] Member directory (with privacy controls)
## [ ] Role-based dashboard views
## [ ] Mobile UI improvements
## [ ] Club documents (constitution, policies) section
## [ ] Online payments for fees
## [ ] More granular permissions (e.g., secretary can edit matches, not finances)

---

**Tip:**  
Update this document as you add new features or plan future work.
