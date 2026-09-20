/*
Anki Search Action for LaunchBar

Opens Anki's card browser and runs the entered search query, using the
AnkiConnect add-on (https://ankiweb.net/shared/info/2055492159), which exposes
Anki's API on http://127.0.0.1:8765.

Port of the Alfred workflow "Anking - Anki Searcher".
*/

const ANKI_CONNECT_URL = 'http://127.0.0.1:8765';
const ANKI_BUNDLE_ID = 'net.ankiweb.anki';
const ANKI_CONNECT_PAGE = 'https://ankiweb.net/shared/info/2055492159';
const LAUNCH_TIMEOUT_SECONDS = 30;

/**
 * Entry point called by LaunchBar with the text the user entered (or a string
 * passed in from another action / selected text).
 *
 * Holding ⇧ while pressing ↩ shows the setup instructions instead of searching.
 *
 * @param {string} argument The Anki search query, e.g. "deck:Anatomy tag::leech".
 * @returns {void} Nothing; on success Anki is brought to the front showing the results.
 */
function run(argument) {
  if (LaunchBar.options.shiftKey) {
    showSetupHelp();
    return;
  }

  const query = (argument || '').trim();

  if (query === '') {
    LaunchBar.alert(
      'Nothing to search for',
      'Type a query after the action name, e.g. "deck:Anatomy" or "tag:leech".'
    );
    return;
  }

  let response = ankiConnect('guiBrowse', { query: query });

  if (response.unreachable) {
    if (!makeAnkiReachable()) return;
    response = ankiConnect('guiBrowse', { query: query });
    if (response.unreachable) {
      showUnreachableAlert();
      return;
    }
  }

  if (response.error) {
    LaunchBar.alert('Anki could not run this search', response.error);
    return;
  }

  LaunchBar.hide();
  LaunchBar.executeAppleScript('tell application id "' + ANKI_BUNDLE_ID + '" to activate');
}

/**
 * Sends a single request to the AnkiConnect API (API version 6).
 *
 * @param {string} action AnkiConnect action name, e.g. "guiBrowse" or "version".
 * @param {Object} [params] Parameters for that action.
 * @returns {{unreachable: boolean, error: ?string, result: *}} `unreachable` is
 *   true when nothing answered on the AnkiConnect port; `error` carries the
 *   message AnkiConnect reported; `result` is the decoded payload.
 */
function ankiConnect(action, params) {
  const payload = JSON.stringify({
    action: action,
    version: 6,
    params: params || {},
  });

  const output = LaunchBar.execute(
    '/usr/bin/curl',
    '--silent',
    '--max-time', '5',
    '--request', 'POST',
    '--data-binary', payload,
    ANKI_CONNECT_URL
  );

  if (output == undefined || output.trim() === '') {
    return { unreachable: true, error: null, result: null };
  }

  try {
    const parsed = JSON.parse(output);
    return { unreachable: false, error: parsed.error, result: parsed.result };
  } catch (exception) {
    return {
      unreachable: false,
      error: 'Unexpected response from AnkiConnect:\n' + output.trim(),
      result: null,
    };
  }
}

/**
 * Checks whether the Anki desktop app is currently running.
 *
 * @returns {boolean} True if a process with Anki's bundle identifier exists.
 */
function isAnkiRunning() {
  const result = LaunchBar.executeAppleScript(
    'tell application "System Events" to return (exists (processes whose bundle identifier is "' +
      ANKI_BUNDLE_ID +
      '"))'
  );
  return (result || '').trim() === 'true';
}

/**
 * Tries to get AnkiConnect answering: offers to launch Anki when it is not
 * running and waits for the add-on to come up.
 *
 * @returns {boolean} True if AnkiConnect answered and the search can be retried.
 */
function makeAnkiReachable() {
  if (isAnkiRunning()) {
    showUnreachableAlert();
    return false;
  }

  const choice = LaunchBar.alert(
    'Anki is not running',
    'The card browser can only be opened while Anki is running.',
    'Launch Anki',
    'Cancel'
  );

  if (choice !== 0) return false;

  LaunchBar.executeAppleScript('tell application id "' + ANKI_BUNDLE_ID + '" to activate');

  for (let waited = 0; waited < LAUNCH_TIMEOUT_SECONDS; waited++) {
    LaunchBar.execute('/bin/sleep', '1');
    if (!ankiConnect('version').unreachable) return true;
  }

  LaunchBar.alert(
    'Anki did not respond',
    'Anki was launched but AnkiConnect did not answer within ' +
      LAUNCH_TIMEOUT_SECONDS +
      ' seconds. Please try the search again once Anki has finished loading.'
  );
  return false;
}

/**
 * Explains why AnkiConnect could not be reached although Anki appears to run.
 *
 * @returns {void}
 */
function showUnreachableAlert() {
  const choice = LaunchBar.alert(
    'AnkiConnect did not answer',
    'Anki is running, but nothing is listening on ' +
      ANKI_CONNECT_URL +
      '.\n\nMake sure the AnkiConnect add-on is installed, Anki has been restarted afterwards, and that no profile dialog is blocking Anki.',
    'Open AnkiConnect page',
    'Cancel'
  );

  if (choice === 0) {
    LaunchBar.hide();
    LaunchBar.openURL(ANKI_CONNECT_PAGE);
  }
}

/**
 * Shows the one-time setup instructions for this action (⇧ ↩).
 *
 * @returns {void}
 */
function showSetupHelp() {
  const choice = LaunchBar.alert(
    'Anki Search – Setup',
    '1. Install the AnkiConnect add-on (code 2055492159) and restart Anki.\n' +
      '2. macOS only: follow the "Notes for macOS Users" section of the AnkiConnect documentation so Anki keeps responding in the background.\n' +
      '3. Invoke this action, press the spacebar and type an Anki search query.\n\n' +
      'The query syntax is the same as in Anki\'s browser, e.g. "deck:Anatomy tag:leech is:due".',
    'Open AnkiConnect page',
    'Close'
  );

  if (choice === 0) {
    LaunchBar.hide();
    LaunchBar.openURL(ANKI_CONNECT_PAGE);
  }
}
