# Scene-quality metrics

Each case is one text prompt. The app generates a scene through its real entry
point (`generateScene`), the scene is rendered in headless Chrome, and the
screenshot is graded.

| Metric | How it's graded |
|---|---|
| Matches prompt | Vision judge (Sonnet 5.5): would the prompt's author recognize the mood/subject they asked for? |
| Explicit asks | Vision judge: every explicit request (colors, named effects, on-screen words) is visibly honored. Cases with no explicit request count as a pass, so compare this metric within the `palette`/`effect`/`text` categories. |
| Not broken | Vision judge: not blank, flat, unreadably dark/blown out, or drowned in artifacts. |
| Overall (1-5) | Vision judge, anchored scale: 1 broken/unrelated … 3 acceptable … 5 striking and spot-on. |
| Valid 1st try | Programmatic: the scene passed validation with zero repair turns. |

The judge sees only the screenshot and the prompt, never the model's rationale.
A scene that was never produced (refusal, or invalid after 2 repairs) scores 0
on every binary metric and 1 overall.
