# Manual playtest checklist

Run through this on a phone-sized viewport (Chrome DevTools device mode at
minimum) before calling a milestone done.

## M1 — Exhibition sim

- [ ] App loads with no console errors
- [ ] "New Exhibition" produces a game in under a second
- [ ] Line score innings add up to the final score for both teams
- [ ] Box score hits/at-bats look plausible (team BA roughly .200–.350)
- [ ] Extra-inning games display "Final / N" correctly
- [ ] School/mascot names read naturally (no "University of High")
- [ ] No duplicate last names within one roster
- [ ] "Play Again" and "Home" both work repeatedly
- [ ] `?seed=42` produces the same game every time

## M2 — Interactive at-bat (Baseball 9 controls)

Test on a real phone or Chrome device mode (portrait, touch).

- [ ] Two-thumb batting: left thumb drags the PCI smoothly at 60fps while the
      right thumb taps SWING — no missed taps, no scroll/zoom hijacking
- [ ] PCI marker rides visibly above the aiming finger (not hidden under it)
- [ ] Swing feels instant — no perceptible delay between tap and bat flash
- [ ] Perfect-timed swing near the ball's location produces hard contact
      regularly on rookie; casual play gets hits within a few at-bats
- [ ] Taking a pitch outside the zone is called a BALL; in the zone a STRIKE
- [ ] Pitching: chips show the pitcher's real repertoire; target drag +
      shrinking ring feel responsive; a perfect LOCK hits near the target
- [ ] Field-choice overlay appears each defensive half; "Sim ½ inning" is
      one tap and instant
- [ ] Auto AB / Sim ½ / Sim Game all work mid-game without visual glitches
- [ ] Walk-off / FINAL banner shows, then the box score matches the HUD score
- [ ] A game played with default sim usage finishes in under 10 minutes
