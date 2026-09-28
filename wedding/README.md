# Wedding Invitation Pilot — Phase 2 RSVP Backend

Mobile-first wedding invitation prototype for the `/wedding/` path.

## Current design
- Blue-and-white regal/vintage visual direction.
- Fixed `static-background.png` behind the invitation content at all times.
- Landing letter is built from separate HTML/CSS layers inspired by the supplied landing-page artwork: paper panels, flap, inner card, fold lines, and a blue wax-seal treatment.
- Guest messages use `comment-background.png` as the decorative frame for every message card.

## Page structure
1. Opening / cover
2. Islamic invitation: Bismillah, parents, invitation wording, Luqman & Nadia
3. Save the Date + countdown + attendance
4. Guest messages + RSVP

## Scrolling
After the visitor presses **Open Invitation**, the invitation is revealed and the slow continuous auto-scroll starts immediately. Wheel, touch, pointer-down, or scrolling keys stop auto-scroll and transfer control to the visitor.

## RSVP backend
RSVP submissions are connected to the Supabase project configured in `js/wedding.js`. The browser submits new records to the `public.rsvps` table through the Supabase REST API.

The website reads public comments from the `public.rsvp_comments` view and attendance totals from the `public.rsvp_counts` view. The underlying RSVP table remains protected by Row Level Security.

The Supabase publishable key is safe to expose in the frontend; never place a database password or secret/service-role key in this project.

The site no longer uses browser `localStorage` for RSVP records.

## Supplied design references used
- `images/landing-reference.png`
- `images/comment-background.png`
- `images/static-background.png`


## Phase 5 design updates
- Landing artwork is split into top/bottom layers so the opening keeps only the circular wax seal; the lower oval duplicate is removed.
- Static floral background is subtly warmed to a very light cream/off-white.
- RSVP messages use the new shorter decorative plaque and no longer have a nested scroll area, so the fixed background remains visible around the cards.
- Auto-scroll now waits for the invitation layout to become scrollable before starting, with retry logic for slow layout/rendering.


Phase 6 updates: static paper warmed toward #FFFAED; guest messages are newest-first inside a scrollable viewport showing about three cards; message plaques are approximately 30% shorter.


## Background music

The invitation expects the background music at:

`assets/music/wedding-music.mp3`

The MP3 is intentionally not included in this ZIP. Add your MP3 using that exact filename and path. The guest's **Open Invitation** tap starts the local audio. The Music panel provides Mute/Unmute and the existing YouTube link.
