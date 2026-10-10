Fix three failure patterns found in the baseline: prop descriptions in the catalog, Plasma stops hidden, narrower stops promotion

Baseline failures traced to the app, not the model's taste:
- All 5 scenes using Plasma `stops` rendered as a flat wash of the last color (overall <= 2, both "broken" scenes).
- "the word POKEMON in pixel art": the model set Pixelate scale 12 believing higher = bigger pixels; the registry says the opposite, but the catalog only listed the range.
- The validator converted colorA/colorB to stops on every shader with a stops prop, including Plasma where the conversion itself caused the wash.

Same 60 prompts, model (Opus 5.5) and judge as baseline. Expected: fewer broken/low scenes in mood, vague and tricky; cost per scene rises (catalog ~7k -> ~15k tokens).
