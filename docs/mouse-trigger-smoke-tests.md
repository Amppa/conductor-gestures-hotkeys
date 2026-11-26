# Mouse trigger smoke tests

The engine only captures buttons used by enabled rules. A chord starts when all
configured buttons are held and ends when any member is released. Button order
is canonicalized as L, M, R, X1, X2. Left-only triggers are rejected.

Automated tests cover chord matching, release dispatch, normalization, validation,
and generator classification. Physical input and native application behavior
still require the following checks with a rebuilt executable:

- Configure R + down in Mouse Gestures and R+X1 without movement in Mouse Button
  Triggers. Verify R and both press orders of R+X1. L and M are unavailable in
  the gesture editor; button chords may still include either button.
- Release either chord member first. Verify one dispatch, with no second dispatch
  or native click when releasing the remaining member.
- Configure L+R without movement. Verify both press orders, normal left clicks, double-clicks,
  text selection, and dragging in Explorer and a browser.
- A stationary left press is deferred while waiting for a chord. If the mouse
  moves before the chord forms, native left dragging begins at the press origin.
  Actions already performed by that native drag cannot be undone by adding another
  chord member later. Applications requiring immediate left-down or long-press
  events need particular attention.
- Verify pure wheel gestures with R repeat per notch, reverse direction, and do
  not dispatch again on release. Chords with movement or wheel steps are unsupported.
- Verify a chord that crosses the movement threshold looks up the full chord
  with direction steps and does not fall back to its button-only rule.
- Verify pause during a chord, disabled apps,
  and ordinary input after disabling all mouse rules.

Do not interpret headless tests as proof of native click or drag compatibility.
