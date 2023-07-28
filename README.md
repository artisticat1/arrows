# Obsidian Arrows
A plugin that enables you to draw arrows in your notes.

## Usage
### Drawing arrows
Write

- `{arrow-identifier|color|opacity|type|track|arrow-end}` to denote the start of an arrow, where:
    - `arrow-identifier` is a string that acts as the arrow's identifier
    - `color` is any color in CSS notation
    - `opacity` is a float between 0 and 1, e.g. `0.6`. Defaults to 1.
    - `type` is either "diagonal" or "margin". Defaults to "margin".
    - `track` is an integer between 0 and 30. Sets the x-position of margin arrows. Defaults to 0.
    - `arrow-end` is either "no-arrow" or "arrow". Use "arrow" to add an arrowhead to the start of the arrow. Defaults to "no-arrow".

    `opacity`, `type`, `track`, and `arrow-end` are optional. You can omit any or all of them, and their default values will be used.
- `{arrow-identifier}` to denote the end of an arrow.
    - You can write `{arrow-identifier|no-arrow}` instead to remove the arrowhead from the end of the arrow.


Arrows will be drawn from each start identifier to all matching end identifiers.

When the cursor is moved outside of the syntax, the syntax will be rendered as a small circle ● for a tidy look.


### Moving between arrows
Clicking on an arrow identifier circle ● will cause the editor to scroll to the next identifier.

You can use this to quickly move between the start and end-points of arrows.


### User-defined colors
You can define your own color names in the plugin settings. Then, you can set those arrow colors using CSS as follows:


```css
[data-arrow-color="blue"] {
    color: #28a2ff !important;
}
```

This feature lets you override CSS colors and/or use shorthand for color names.


## Acknowledgements
This project uses the [leader-line](https://anseki.github.io/leader-line/) library to draw arrows.