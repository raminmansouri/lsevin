# Tours admin guide

How to manage tours data in the Lsevin admin panel: tours, destinations, the landing page, translations, departures, bookings and settings.

- **Where:** Admin panel → sidebar group **Tours platform**, or go straight to `/fa/admin/tours-platform` (any language prefix works).
- **Who:** any user with the `admin` or `superadmin` role. `financeadmin` alone cannot open the panel.
- **Labels:** button and screen names below are the English labels. The panel shows the same buttons in Persian when you use `/fa/`.

The panel has its own tab bar at the top. The sidebar only lists the most-used screens; **Taxonomy, Commissions, Incidents, Reviews, Compliance and Notifications** are reachable only from the tab bar.

---

## 1. Before you start: rules that apply everywhere

- **Reasons are recorded.** Many actions open a box "Reason (recorded in the audit log)". The confirm button stays disabled until you type at least 5 characters. Write a real reason; it is permanent.
- **Everything is audited.** Each tour's **History** tab shows who did what and when.
- **Customers never see drafts.** Only published tours, approved text and approved photos reach customers. Use **Preview as customer** to see a tour exactly as customers will.
- **Bookings are protected.** Changing a price, a cancellation policy or a commission never changes bookings that already exist; each booking keeps the price, rules and commission it was made with.
- **Never edit the database by hand.** Seat counts, commissions and translation status are enforced by the database. Changing rows directly can corrupt bookings. Use the panel; if the panel cannot do something, ask a developer.

---

## 2. Daily check (5 minutes)

Open **Tours overview**. It shows what needs attention:

| Card | What to do |
|---|---|
| Waiting for review | Review tours (section 4) |
| Departures in the next 7 days | Check capacity and weather (section 8) |
| Open incidents | Read and resolve (section 10) |
| Open disputes | Decide (section 10) |
| Media to moderate | Approve or reject photos (section 4.3) |
| Reviews to moderate | Publish, hide or reject (section 10) |
| Guide documents expiring | Ask the provider for new documents |

Also open **Tour bookings** and filter **Booking status = requested**: these are customers waiting for an answer (section 9.1). Requests expire after 24 hours and the customer loses the booking.

---

## 3. Destinations

**Tour destinations** (`…/tours-platform/destinations`).

A destination is a place customers browse (Shiraz, Isfahan…). Customers only see a destination when **all** of these are true:

1. **Published** is ticked;
2. today is inside its **Publish from / Publish until** window (if set);
3. it has **at least one published tour** from an active provider.

So an empty destination stays hidden even when published; that is intentional.

### Add or edit a destination

| Field | Rule |
|---|---|
| Slug | Lower-case letters, numbers and `-` (e.g. `shiraz`). Becomes the web address `/tours/destinations/shiraz`. Must be unique. |
| Name | One per language. At least one is required; fill Persian and English at minimum. |
| Region, Description | Per language, optional. |
| Country (ISO) | 2 letters, e.g. `IR`. |
| Latitude / Longitude | Both or neither. |
| Timezone | Default `Asia/Tehran`. |
| Cover image URL | Must start with `https://` or `/`. See section 7 for images. |
| Cover alternative text | **Required when there is a cover.** Describe the photo for screen readers, e.g. "Coloured light from the stained glass of Nasir al-Mulk Mosque". |
| Featured | Shows it in "Popular destinations". |
| Order | Lower numbers appear first. |

**Delete** only works when the destination has no tours. It is permanent.

---

## 4. Tours

**Tours & review queue** (`…/tours-platform/tours`). Filters at the top. To see only tours waiting for you, open the review queue: `…/tours-platform/tours?queue=1`.

The **Requirements** column shows "Ready" or "N blocking issues".

### 4.1 Tour statuses

| Status (label) | Meaning | Customers see it? |
|---|---|---|
| Draft | Being written | No |
| In review | Submitted, waiting for an admin | No |
| Changes requested | Rejected with a note | No |
| Published | Live | **Yes** |
| Paused | Temporarily hidden | No (existing bookings stay valid) |
| Archived | Retired **for good** | No |

A published tour can also have **changes waiting for review**. The live version stays visible until you approve the changes.

### 4.2 Review and publish a tour

Open the tour → **Overview** tab → panel **Review and publication**.

1. Click **Preview as customer** and read it as a traveller would: photos, price, day plan, meeting point, cancellation rules, in Persian and English.
2. Check the requirements list. **Errors block publishing**:
   - title, summary, description, meeting instructions, cancellation policy and safety notes in every required language;
   - at least one photo;
   - a price (an adult price, or a private-group option);
   - a cancellation policy;
   - a meeting point on the map;
   - a duration;
   - an active provider.

   **Warnings** (no day plan, no upcoming departures, translations needing review) do not block, but fix them first if you can.
3. Then either:
   - **Approve & publish** (optional approval note): all pending text goes live **and all pending photos are approved automatically**, so check the photos first; or
   - **Reject** (required note): the provider sees your note and must fix and resubmit. On a published tour, rejecting only discards the pending changes; the live tour stays as it is.

### 4.3 The tour editor tabs

| Tab | What you manage | Watch out |
|---|---|---|
| **Overview** | Core facts: destination, type, duration, group size, ages, guide languages, **Confirmation (Instant / On request)**, meeting point, exact or approximate location, accessibility claims. Placement: Featured / Sponsored. | Slug, currency and source language cannot change after creation. Featured/Sponsored need an end date. |
| **Text & translations** | All texts, source language on the left, target language on the right. **Save** saves that language as a draft. | Changing the source text marks other languages "Needs review". |
| **Media** | Approve, Reject (reason shown to the provider), reorder, set cover, **Add media** by URL. | **Remove** is permanent. You cannot remove the last approved photo of a published tour. |
| **Itinerary** | Day-by-day stops: type, time, place, title and description per language. | **Save replaces the whole day plan.** A stop you remove is deleted with all its translations. |
| **Options & prices** | Options (per person or private group) with prices per traveller type; add-ons. | Removing an option only deactivates it. Existing bookings keep their price. |
| **Policy** | Refund rules (hours before departure → refund %), no-show refund, late arrival, weather policy, cancellation text per language. | **Create version** always makes a new version; old versions are never edited or deleted. Bookings keep the version they accepted. |
| **Schedule** | Recurring schedules, **Generate departures**, **Block dates**, price adjustments for date ranges. | See section 8. Schedules and price adjustments cannot be edited or deleted from the panel. |
| **History** | Revisions and the audit trail. | Read-only. |

### 4.4 Other tour actions

| Button | Effect | Reversible? |
|---|---|---|
| **Suspend publication** (reason) | Published → Paused. Hidden from customers; bookings stay. | Yes: **Restore publication** |
| **Retire** (reason, red) | → Archived. | **No.** An archived tour can never come back. Use Suspend if you might need it again. |
| **Duplicate as draft** (new slug) | Copies the tour as a new draft (text, photos as pending, prices, latest policy). Not copied: bookings, departures, reviews. | Yes: it is a separate draft |
| **Create draft** (on the tours list) | Start a tour on behalf of a provider. | Yes: it stays a draft |

**Accessibility claims** (wheelchair, low mobility, recovery friendly): customers' accessibility filters ignore a claim until you click **Mark claims verified**. Only verify after checking the claim with the provider.

---

## 5. Landing page content

**Tours landing content** (`…/tours-platform/editorial`). Controls the blocks on the tours home page.

| Module kind | Use |
|---|---|
| Hero | The big photo and headline at the top |
| Onboarding | Introductory block |
| Collection | A named row of tours (e.g. "Weekend trips") |
| Offers | A row of discounted tours |
| Popular destinations | A row of destinations |

For each module: code, image URL, order, title/subtitle/button text per language, and **Status (Draft / Published)** with an optional publish window.

- **Picking tours:** choose tours or destinations explicitly (up to 50), **or** leave them empty and use **Automatic selection** (category, sort, max items, family-friendly or accessible only).
- A Collection or Offers module with no tours to show is hidden automatically.
- **Sponsored** modules are labelled for customers and must have an end date.
- **If no Hero module is published**, the home page shows the default photo of Naqsh-e Jahan Square with the default headline. To change the hero, publish a Hero module with your own photo (and add the photo credit if its licence requires one).
- **Delete** is permanent.

---

## 6. Categories and tags (Taxonomy)

Tab **Taxonomy**. Lists of categories, tags, transport modes, difficulty, amenities, inclusions, badges, suitability and age rules.

- Each term has a code (lower-case, e.g. `culture`), a label per language, an order and an **Active** checkbox.
- A term that tours use cannot be renamed or deleted. Untick **Active** instead.

---

## 7. Images

- **There is no upload in the tours panel. Images are added by URL.** The URL must start with `https://` or `/`.
- Upload the file somewhere public first (the site's file storage or CDN), then paste its link.
- Use landscape photos at least **1600 px wide**, in **WebP or JPEG**, under about **500 KB**. The panel does not check size or type for you.
- **Only use photos you have the right to use.** For free-licence photos (e.g. Wikimedia Commons, CC BY / CC BY-SA), put the credit in the photo caption, e.g. "Persepolis — Photo: Skot, CC BY-SA 4.0". The four showcase tours already do this.
- Every image needs **alternative text** describing it, in at least Persian and English.
- Photos added by providers wait for approval. Photos added by an admin are approved immediately.

---

## 8. Departures and schedules

### 8.1 Creating departures (tour → **Schedule** tab)

1. **Add schedule**: repeat (Once / Weekly with weekdays / Monthly), local time, start and end date, capacity, option. Departures are created automatically.
2. **Generate departures**: fills the **next 180 days** from all active schedules. Safe to click again; it never duplicates.
3. Click **Generate departures** about once a month for long-running tours, so departures never run out.

To close dates (holiday, maintenance): **Block dates** with a reason. Only departures with no bookings are blocked; dates that already have bookings must be cancelled on purpose (8.2).

### 8.2 Managing a single departure (**Tour departures** board)

Filter by date, provider or status. Each card shows capacity, booked, held, waitlist and check-ins. **Admin actions** (all need a reason):

| Action | Effect |
|---|---|
| **Block date / Unblock** | Stop or allow new bookings for that departure. |
| **Override capacity** | Change seats (1–10000). Cannot go below booked + held seats. |
| **Delay departure** | 1–1440 minutes. Sends your message in the app to everyone booked, in their own language if you provide it. |
| **Disable live tracking** | Stops sharing the guide's location. |
| **Cancel departure** (red) | See below. |

**Cancel departure is permanent:**

- every booking is cancelled with a **100% refund request**;
- held seats, the waitlist and guide assignments are released;
- your message goes to all travellers.

There is no undo. The refund requests then appear in the platform refunds workflow (`/admin/refunds`), where finance processes them.

---

## 9. Bookings

**Tour bookings**: search by voucher or booking id, filter by status, payment, provider and dates. Customer names are partly hidden.

### 9.1 Answer a booking request (tours set to "On request")

1. Open the booking (status **requested**).
2. **Accept**:
   - a free booking is confirmed;
   - otherwise the customer is asked to pay and has **2 hours** to do it (4× the payment window).
3. **Decline** (reason): the seats are released and the customer is told.
4. If nobody answers within **24 hours**, the request expires automatically, the customer is told and nothing is charged.

> **The four showcase tours (Persepolis, Isfahan, Yazd, Kish) belong to the provider "تورهای السوین", which has no staff in the provider portal yet.** Until staff are added, **admins must answer their requests here**, or customers' requests will expire. Check requested bookings at least twice a day.

### 9.2 Other booking actions (booking detail page)

| Action | Use | Notes |
|---|---|---|
| **Reveal contact details** (reason, 10+ characters) | Call or email the traveller | Every reveal is logged with your reason. Only reveal when you need it. |
| **Rebook** → Find departures → Move booking (reason) | Move a traveller to another date of the **same tour** | Same price, voucher and payment. The traveller is **not notified automatically**; tell them. |
| **Open case** | Start a cancellation, refund exception, chargeback or complaint | Goes to the Disputes screen (section 10). |

There is **no button to cancel a single booking**. To cancel and refund one booking, open a **Cancellation** case (section 10). After it is approved, the refund request is created, but the booking itself is not cancelled; ask a developer to close it.

---

## 10. Disputes, reviews, incidents, compliance

### Disputes (**Tour disputes**)

Cases opened from a booking. Who may approve depends on the amount:

| Case | Approval level needed |
|---|---|
| No amount, or ≤ 25% of the booking | agent |
| ≤ 75% of the booking | manager |
| More, or any chargeback | finance |

- **Approve / Reject** need a decision note (5+ characters).
- Approving below the needed level **escalates** the case to the next level.
- An approved case with an amount creates a refund request. Decisions are final.
- **Approval roles** panel (finance-level admins only): find an admin, choose agent / manager / finance, then **Assign**. `superadmin` and `financeadmin` users are finance level automatically.

### Reviews (tab **Reviews**)

- **Publish** a review.
- **Hide** or **Reject** it with a reason.
- Approve or reject providers' replies.
- The tour's star rating counts published reviews only.

### Incidents (tab **Incidents**)

- Reported by providers and guides. Critical ones notify all admins.
- **Escalate**, or **Resolve** with a resolution note.
- The link inside an incident **notification** currently opens a missing page. Open the **Incidents** tab instead.

### Compliance (tab **Compliance**)

- Shows expiring guide documents, providers without verification, unverified accessibility claims and provider flags.
- **Set flag / Clear** (Trusted, Watch, Quality review, Documents missing, Listing suspended).
- **Flags are notes for admins only.** "Listing suspended" does **not** hide the provider's tours. To hide a tour, use **Suspend publication** on each tour.

### Commissions (tab **Commissions**)

- **Create** an agreement for one provider or for all providers (platform default): percent, start date (today or later), optional end date.
- Agreements cannot be edited or deleted. To change a rate, create a new agreement starting on a future date; the old open-ended one is closed automatically.
- Bookings keep the commission they were made with.

---

## 11. Translations

**Tour translations** screen.

- **Coverage report**: for every tour and language, how many required fields are present and how many need review.
- **Translator / reviewer assignments**: find a user, choose a language and a provider (or all), then **Assign**.
  - Translators work in the **provider portal**, not in this admin panel. They can edit and approve text in their own language only.
  - **Revoke** removes the assignment immediately, without asking.
- **Glossary**: fixed translations for names and terms (e.g. Persepolis → تخت جمشید). Translators see these hints while editing.

**Status of a text** (shown per field):

| Status | Meaning |
|---|---|
| Missing | Empty |
| Draft | Saved, not submitted |
| Submitted | Waiting for review |
| Approved | Approved, goes live on the next publish |
| Published | Live |
| Needs review | The source text changed after this translation; the old translation stays live until someone updates and approves it |

On a **published** tour, **Approve** (per field or "Approve all in this language") puts the text **live immediately**.

**Required publish languages** (in Settings): by default only the tour's own source language is required. Add `en-US` there if every tour must have English before it can be published.

---

## 12. Settings

**Tours settings**. Click **Save settings** at the bottom. Changes can take up to 30 seconds to apply everywhere.

| Setting | Default | Meaning |
|---|---|---|
| Enabled languages | 11 languages | Languages tour text can be written in |
| Default language | fa-IR | |
| Content fallback order | source, en-US, fa-IR | Which language customers see when theirs is missing |
| Required publish languages | source | Languages that must be complete before publishing |
| Default calendar per language | Persian for fa, Hijri (Umm al-Qura) for ar, Gregorian otherwise | |
| Seat hold (minutes) | 15 | How long seats are held while a customer checks out |
| Payment window (minutes) | 30 | Time to pay before an unpaid booking expires |
| Request-to-book reply time (hours) | 24 | **Currently has no effect.** Requests always expire after 24 hours. |
| Service fee % | 0 | |
| Default platform commission % | 10 | Used when no commission agreement applies |
| Weather settings | Open-Meteo | Provider, caching and the attribution text |

The remaining settings are privacy-retention values (recently viewed tours, searches, location history). Leave them unless the privacy policy changes.

---

## 13. Providers

- A business becomes a tour provider by applying in the provider portal (`/provider-portal/applications/new`). An admin approves it at **Admin → Provider portal → Applications**. The applicant becomes the provider's **owner**.
- Provider staff create and edit their tours in the **provider portal** and submit them; you review them here (section 4.2).
- An admin can also **Create draft** for any provider from the tours list and edit any tour directly.
- **Adding staff to a provider is not possible from this admin panel.** The provider's owner does it in the provider portal.

---

## 14. What cannot be undone

| Action | Why |
|---|---|
| Cancel departure | All bookings cancelled and refunded |
| Retire (Archive) a tour | No way back |
| Approve & publish | Text and all pending photos go live |
| Approve text on a published tour | Live immediately |
| Reveal contact details | Logged permanently |
| Commission agreement | Cannot edit or delete |
| Dispute decision | Final |
| Remove media, delete destination, term, landing module, glossary entry | Deleted permanently |
| Save itinerary | Removed stops and their translations are deleted |

**When unsure, use the reversible option:** Suspend instead of Retire, Block instead of Cancel, untick Active instead of Delete.

---

## 15. Getting help

Contact the development team when you need to:

- cancel a single booking (section 9.2);
- edit or delete a schedule or a price adjustment;
- add staff to a provider;
- correct anything the panel cannot change (slug, currency, source language);
- investigate a booking whose seats or payment look wrong.

Include the **booking id or voucher**, the **tour slug**, and what you expected to happen.
