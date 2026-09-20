# Anki Search – a LaunchBar Action

Opens Anki's card browser with the query you type, from anywhere in macOS.

Uses the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on, which
exposes Anki's API on `http://127.0.0.1:8765`, and calls its `guiBrowse` action.

## Requirements

- [LaunchBar](https://www.obdev.at/products/launchbar/) 6 or later
- [Anki](https://apps.ankiweb.net/) with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on (code `2055492159`)

## Setup

1. In Anki: *Tools → Add-ons → Get Add-ons…*, enter the code `2055492159`, restart Anki.
2. Follow *Notes for macOS Users* in the
   [AnkiConnect documentation](https://git.sr.ht/~foosoft/anki-connect) so Anki
   keeps answering while it is in the background.
3. Download the action from the [releases](https://github.com/arkhandir/Anki-Search/releases)
   and double-click `Anki Search.lbaction`. LaunchBar installs it into
   `~/Library/Application Support/LaunchBar/Actions/`.

## Usage

Invoke `Anki Search` in LaunchBar, press <kbd>Space</kbd>, type an Anki search
query and press <kbd>↩</kbd>. Anki's browser opens with the results and comes to
the front.

The query syntax is the one Anki uses (there is an excellent page in the manual: [Anki Manual:Searching](https://docs.ankiweb.net/searching.html)), for example:

```
deck:Anatomy tag:leech is:due
```

A string passed in from another action, or text selected in any app, works as
input too.

<kbd>⇧</kbd><kbd>↩</kbd> shows the setup instructions.

If Anki is not running, the action offers to launch it and waits for AnkiConnect
to come up before retrying the search. If AnkiConnect does not answer although
Anki is running, it says so instead of failing silently.

## Credits

Inspired by the Alfred workflow
[Anki Search](https://github.com/AnKingMed/Alfred-Anki-Search) by AnKingMed.

## License

[MIT](LICENSE)
