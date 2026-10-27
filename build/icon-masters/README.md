# Icon masters

Book's app icon: an italic ampersand in warm paper colour on a deep ink tile.

The ampersand is the outline of `&` from [Instrument Serif](https://github.com/Instrument/instrument-serif) Italic, converted to a path. Instrument Serif is under the SIL Open Font License 1.1, which allows using its outlines in a logo.

| Master | Used for |
| --- | --- |
| `icon.svg` | macOS, 64px and up: Apple's grid (an 824px tile in a 1024px canvas) with a soft shadow |
| `icon-small.svg` | macOS, 32px and below: a larger ampersand, so its thin strokes survive |
| `icon-windows.svg` | Windows 48px and up, the Linux window icon, and the icon inside the app |
| `icon-windows-small.svg` | Windows, 32px and below |

After changing a master, run `bun run icons` to rebuild `build/icon.icns`, `build/icon.ico`, `build/icon.png`, `resources/icon.png` and `src/renderer/src/shared/ui/book-icon.svg`. Commit the masters and the built files together.
