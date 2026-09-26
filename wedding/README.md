# Wedding Invitation Pilot — Phase 4

Mobile-first wedding invitation prototype for the `/wedding/` path.

## Current design
- Blue-and-white regal/vintage visual direction.
- Fixed `static-background.png` behind the invitation content at all times.
- Landing letter is built from separate HTML/CSS layers inspired by the supplied landing-page artwork: paper panels, flap, inner card, fold lines, and a blue wax-seal treatment.
- Guest messages use `comment-background.png` as the decorative frame for every message card.

## Page structure
1. Opening / cover
2. Islamic invitation: Bismillah, parents, invitation wording, Alex & Sarah
3. Save the Date + countdown + attendance
4. Guest messages + RSVP
5. Thank You

## Scrolling
After the visitor presses **Open Invitation**, the invitation is revealed and the slow continuous auto-scroll starts immediately. Wheel, touch, pointer-down, or scrolling keys stop auto-scroll and transfer control to the visitor.

## Pilot storage
RSVP submissions currently use browser `localStorage` only. This is development behavior; the production version should use the planned remote database.

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
