/**
 * @typedef {"browser"|"editor"|"terminal"|"files"|"mail"|"notes"|"sheet"} AppId
 * @typedef {"safe"|"browser-reserved"|"os-reserved"} ShortcutRisk
 * @typedef {{key:string,ctrl?:boolean,alt?:boolean,shift?:boolean,meta?:boolean}} ShortcutDefinition
 * @typedef {Object} ShortcutChallenge
 * @property {string} id
 * @property {string} title
 * @property {string} instruction
 * @property {string} description
 * @property {AppId} application
 * @property {string} category
 * @property {"beginner"|"intermediate"|"advanced"} difficulty
 * @property {"windows"|"mac"|"cross-platform"} platform
 * @property {ShortcutDefinition} expectedShortcut
 * @property {ShortcutDefinition=} trainingShortcut
 * @property {ShortcutDefinition[]=} acceptedShortcuts
 * @property {ShortcutRisk} risk
 * @property {Record<string, unknown>} initialState
 * @property {Record<string, unknown>} successCondition
 * @property {string} hint
 * @property {string} explanation
 * @property {string} productivityTip
 * @property {number} points
 * @property {string} action
 */

const keys = (key, modifiers = {}) => ({ key, ...modifiers });

const makeChallenge = (challenge) => ({
  description: challenge.instruction,
  difficulty: "beginner",
  platform: "cross-platform",
  initialState: {},
  successCondition: { action: challenge.action },
  hint: "Use the highlighted keys on the virtual keyboard.",
  productivityTip: "A keyboard-first flow avoids repeated pointer travel.",
  points: 100,
  risk: "safe",
  category: challenge.application,
  ...challenge,
});

const safeTraining = {
  closeTab: keys("w", { ctrl: true, alt: true, shift: true }),
  newTab: keys("n", { ctrl: true, alt: true, shift: true }),
  restoreTab: keys("r", { ctrl: true, alt: true, shift: true }),
  nextTab: keys("ArrowRight", { alt: true, shift: true }),
  previousTab: keys("ArrowLeft", { alt: true, shift: true }),
  focusAddress: keys("l", { ctrl: true, alt: true, shift: true }),
  switchApp: keys("a", { ctrl: true, alt: true, shift: true }),
  showDesktop: keys("d", { ctrl: true, alt: true, shift: true }),
};

/** @type {ShortcutChallenge[]} */
export const challenges = [
  makeChallenge({ id:"browser-address", title:"Jump to the address bar", instruction:"Focus the browser address bar without reaching for the mouse.", application:"browser", expectedShortcut:keys("l",{ctrl:true}), trainingShortcut:safeTraining.focusAddress, risk:"browser-reserved", action:"focus-address", explanation:"Ctrl + L focuses a real browser address bar. Shortcut Lab uses a labelled three-modifier chord so your actual browser stays put.", productivityTip:"Useful when opening a known URL or starting a web search.", points:120 }),
  makeChallenge({ id:"browser-restore-tab", title:"Restore the lost research tab", instruction:"Bring the recently closed documentation tab back.", application:"browser", expectedShortcut:keys("t",{ctrl:true,shift:true}), trainingShortcut:safeTraining.restoreTab, risk:"browser-reserved", action:"restore-tab", explanation:"Ctrl + Shift + T restores a closed browser tab. The lab uses Ctrl + Alt + Shift + R to avoid changing real tabs.", points:140 }),
  makeChallenge({ id:"browser-next-tab", title:"Move to the next tab", instruction:"Switch from the brief to the API reference.", application:"browser", expectedShortcut:keys("Tab",{ctrl:true}), trainingShortcut:safeTraining.nextTab, risk:"browser-reserved", action:"next-tab", explanation:"Ctrl + Tab cycles forward through browser tabs. Here, Alt + Shift + Right controls only the simulated tabs.", points:120 }),
  makeChallenge({ id:"browser-previous-tab", title:"Return to the previous tab", instruction:"Move back to the brief tab.", application:"browser", expectedShortcut:keys("Tab",{ctrl:true,shift:true}), trainingShortcut:safeTraining.previousTab, risk:"browser-reserved", action:"previous-tab", explanation:"Ctrl + Shift + Tab cycles backward. The safe chord keeps focus inside Shortcut Lab.", points:130 }),
  makeChallenge({ id:"browser-find", title:"Find text on the page", instruction:"Open page search and locate the word “latency”.", application:"browser", expectedShortcut:keys("f",{ctrl:true}), action:"find-page", explanation:"Ctrl + F opens find-in-page in most browsers and document tools.", productivityTip:"Faster than visually scanning long documentation pages." }),
  makeChallenge({ id:"browser-close-tab", title:"Close the inactive tab", instruction:"Close the current simulated browser tab.", application:"browser", expectedShortcut:keys("w",{ctrl:true}), trainingShortcut:safeTraining.closeTab, risk:"browser-reserved", action:"close-tab", explanation:"Ctrl + W closes a real tab, so the lab never captures it directly. Ctrl + Alt + Shift + W is the training substitute.", points:140 }),
  makeChallenge({ id:"browser-new-tab", title:"Open a clean research tab", instruction:"Create a new simulated browser tab.", application:"browser", expectedShortcut:keys("t",{ctrl:true}), trainingShortcut:safeTraining.newTab, risk:"browser-reserved", action:"new-tab", explanation:"Ctrl + T is reserved by the browser. Ctrl + Alt + Shift + N performs the simulated action safely.", points:130 }),

  makeChallenge({ id:"editor-quick-open", title:"Open a file quickly", instruction:"Open the quick file picker to jump to apiClient.js.", application:"editor", expectedShortcut:keys("p",{ctrl:true}), action:"quick-open", explanation:"Ctrl + P opens files by name in many editors.", productivityTip:"Speeds up navigation in projects with deep folder trees." }),
  makeChallenge({ id:"editor-find", title:"Search the current file", instruction:"Find every use of retryDelay in the current file.", application:"editor", expectedShortcut:keys("f",{ctrl:true}), action:"find-code", explanation:"Ctrl + F searches the active file or document." }),
  makeChallenge({ id:"editor-replace", title:"Open find and replace", instruction:"Replace the old timeout name across this file.", application:"editor", expectedShortcut:keys("h",{ctrl:true}), action:"replace-code", explanation:"Ctrl + H opens find and replace in many code editors.", points:120 }),
  makeChallenge({ id:"editor-command", title:"Open command search", instruction:"Open the editor command palette.", application:"editor", expectedShortcut:keys("p",{ctrl:true,shift:true}), action:"command-palette", explanation:"Ctrl + Shift + P exposes editor commands without hunting through menus.", points:120 }),
  makeChallenge({ id:"editor-delete-word", title:"Delete the previous word", instruction:"Remove the unnecessary word before the cursor in one action.", application:"editor", category:"text", expectedShortcut:keys("Backspace",{ctrl:true}), action:"delete-word", explanation:"Ctrl + Backspace deletes the word to the left of the cursor.", productivityTip:"Useful when correcting long identifiers and prose." }),
  makeChallenge({ id:"editor-select-match", title:"Select the next match", instruction:"Add the next occurrence of the selected variable.", application:"editor", expectedShortcut:keys("d",{ctrl:true}), action:"select-match", explanation:"Ctrl + D adds the next matching occurrence in many editors.", difficulty:"intermediate", points:140 }),
  makeChallenge({ id:"editor-comment", title:"Toggle a line comment", instruction:"Comment out the temporary debug statement.", application:"editor", expectedShortcut:keys("/",{ctrl:true}), action:"toggle-comment", explanation:"Ctrl + / toggles a line comment in most code editors.", points:120 }),
  makeChallenge({ id:"editor-move-up", title:"Move the line up", instruction:"Move the validation line above the network call.", application:"editor", expectedShortcut:keys("ArrowUp",{alt:true}), action:"move-line-up", explanation:"Alt + Up moves the current line upward without copy and paste.", difficulty:"intermediate", points:140 }),
  makeChallenge({ id:"editor-move-down", title:"Move the line down", instruction:"Move the fallback line below the response check.", application:"editor", expectedShortcut:keys("ArrowDown",{alt:true}), action:"move-line-down", explanation:"Alt + Down moves the current line downward.", difficulty:"intermediate", points:140 }),
  makeChallenge({ id:"editor-duplicate", title:"Duplicate the current line", instruction:"Duplicate the retry configuration line.", application:"editor", expectedShortcut:keys("ArrowDown",{alt:true,shift:true}), action:"duplicate-line", explanation:"Shift + Alt + Down duplicates the current line in many editors.", difficulty:"intermediate", points:150 }),
  makeChallenge({ id:"editor-rename", title:"Rename the symbol", instruction:"Start a safe project-wide rename for retryDelay.", application:"editor", expectedShortcut:keys("F2"), action:"rename-symbol", explanation:"F2 starts symbol rename in popular editors and file managers.", difficulty:"intermediate", points:150 }),
  makeChallenge({ id:"editor-terminal", title:"Toggle the integrated terminal", instruction:"Open the terminal without leaving the editor.", application:"editor", expectedShortcut:keys("`",{ctrl:true}), action:"toggle-terminal", explanation:"Ctrl + ` toggles the integrated terminal in many editors.", points:120 }),
  makeChallenge({ id:"editor-save", title:"Save the active file", instruction:"Save apiClient.js after the refactor.", application:"editor", expectedShortcut:keys("s",{ctrl:true}), action:"save-file", explanation:"Ctrl + S saves the current document.", points:100 }),

  makeChallenge({ id:"terminal-clear", title:"Clear the terminal", instruction:"Clear the simulated terminal output while keeping your session.", application:"terminal", expectedShortcut:keys("l",{ctrl:true}), action:"clear-terminal", explanation:"Ctrl + L clears the terminal viewport without deleting command history." }),
  makeChallenge({ id:"terminal-history-up", title:"Recall the previous command", instruction:"Bring back npm run build from command history.", application:"terminal", expectedShortcut:keys("ArrowUp"), action:"history-up", explanation:"Arrow Up walks backward through terminal command history." }),
  makeChallenge({ id:"terminal-history-down", title:"Move forward in history", instruction:"Return to the newer command in terminal history.", application:"terminal", expectedShortcut:keys("ArrowDown"), action:"history-down", explanation:"Arrow Down moves forward through commands you have recalled." }),
  makeChallenge({ id:"terminal-cancel", title:"Cancel the running process", instruction:"Stop the simulated watch process.", application:"terminal", expectedShortcut:keys("c",{ctrl:true}), action:"cancel-process", explanation:"Ctrl + C sends an interrupt to the current terminal process.", points:120 }),
  makeChallenge({ id:"terminal-line-start", title:"Jump to command start", instruction:"Move the terminal cursor to the beginning of the command.", application:"terminal", category:"text", expectedShortcut:keys("a",{ctrl:true}), action:"line-start", explanation:"Ctrl + A moves to the start of a shell command line." }),
  makeChallenge({ id:"terminal-line-end", title:"Jump to command end", instruction:"Move the terminal cursor to the end of the command.", application:"terminal", category:"text", expectedShortcut:keys("e",{ctrl:true}), action:"line-end", explanation:"Ctrl + E moves to the end of a shell command line." }),

  makeChallenge({ id:"files-rename", title:"Rename the selected file", instruction:"Rename the selected draft file without opening a menu.", application:"files", expectedShortcut:keys("F2"), action:"rename-file", explanation:"F2 renames the selected file on Windows and in many file tools." }),
  makeChallenge({ id:"files-copy", title:"Copy the selected file", instruction:"Copy launch-notes.md into the simulated clipboard.", application:"files", expectedShortcut:keys("c",{ctrl:true}), action:"copy-file", explanation:"Ctrl + C copies the current selection." }),
  makeChallenge({ id:"files-paste", title:"Paste into this folder", instruction:"Paste the copied notes into the Release folder.", application:"files", expectedShortcut:keys("v",{ctrl:true}), action:"paste-file", explanation:"Ctrl + V pastes copied content into the current context." }),
  makeChallenge({ id:"files-cut", title:"Move a file with cut", instruction:"Cut the outdated brief so it can be moved.", application:"files", expectedShortcut:keys("x",{ctrl:true}), action:"cut-file", explanation:"Ctrl + X cuts the current selection for moving." }),
  makeChallenge({ id:"files-select-all", title:"Select all files", instruction:"Select every visible report in the Release folder.", application:"files", expectedShortcut:keys("a",{ctrl:true}), action:"select-all-files", explanation:"Ctrl + A selects all items in the active context." }),
  makeChallenge({ id:"files-delete", title:"Delete the obsolete draft", instruction:"Move the selected simulated file to the fake recycle area.", application:"files", expectedShortcut:keys("Delete"), action:"delete-file", explanation:"Delete removes the selected item. Shortcut Lab never touches real files.", points:120 }),
  makeChallenge({ id:"files-parent", title:"Go to the parent folder", instruction:"Return from Release to the Project folder.", application:"files", expectedShortcut:keys("Backspace"), action:"parent-folder", explanation:"Backspace navigates to the parent folder in many file managers." }),

  makeChallenge({ id:"mail-search", title:"Search your inbox", instruction:"Find the release approval message.", application:"mail", expectedShortcut:keys("f",{ctrl:true}), action:"search-mail", explanation:"Ctrl + F provides a familiar search action in this simulated mail client." }),
  makeChallenge({ id:"mail-save-draft", title:"Save the update as a draft", instruction:"Save the current status update without sending it.", application:"mail", expectedShortcut:keys("s",{ctrl:true}), action:"save-draft", explanation:"Ctrl + S saves the current draft in many productivity tools." }),
  makeChallenge({ id:"notes-undo", title:"Undo the accidental edit", instruction:"Restore the sentence you just removed from the note.", application:"notes", category:"text", expectedShortcut:keys("z",{ctrl:true}), action:"undo-note", explanation:"Ctrl + Z reverses the most recent edit." }),
  makeChallenge({ id:"notes-redo", title:"Redo the useful change", instruction:"Reapply the formatting change you just undid.", application:"notes", category:"text", expectedShortcut:keys("y",{ctrl:true}), acceptedShortcuts:[keys("z",{ctrl:true,shift:true})], action:"redo-note", explanation:"Ctrl + Y or Ctrl + Shift + Z reapplies an undone change, depending on the app." }),
  makeChallenge({ id:"notes-bold", title:"Emphasise the heading", instruction:"Toggle bold formatting for the selected heading.", application:"notes", category:"text", expectedShortcut:keys("b",{ctrl:true}), action:"bold-note", explanation:"Ctrl + B toggles bold formatting in many editors." }),
  makeChallenge({ id:"sheet-find", title:"Find the release row", instruction:"Search the spreadsheet for version 2.4.0.", application:"sheet", expectedShortcut:keys("f",{ctrl:true}), action:"find-cell", explanation:"Ctrl + F searches values in a spreadsheet." }),
  makeChallenge({ id:"sheet-save", title:"Save the tracker", instruction:"Save the updated release tracker.", application:"sheet", expectedShortcut:keys("s",{ctrl:true}), action:"save-sheet", explanation:"Ctrl + S saves the active workbook." }),

  makeChallenge({ id:"desktop-switch-app", title:"Switch applications", instruction:"Switch from the editor to the simulated browser.", application:"editor", category:"desktop", expectedShortcut:keys("Tab",{alt:true}), trainingShortcut:safeTraining.switchApp, risk:"os-reserved", action:"switch-app", explanation:"Alt + Tab belongs to the operating system. Ctrl + Alt + A safely switches fake applications inside the lab.", difficulty:"intermediate", points:150 }),
  makeChallenge({ id:"desktop-show", title:"Reveal the desktop", instruction:"Minimise the simulated windows to reveal the lab desktop.", application:"files", category:"desktop", expectedShortcut:keys("d",{meta:true}), trainingShortcut:safeTraining.showDesktop, risk:"os-reserved", action:"show-desktop", explanation:"Win + D is controlled by the operating system. Ctrl + Alt + D is the lab-only substitute.", difficulty:"intermediate", points:150 }),
];

export const challengeById = Object.fromEntries(challenges.map((challenge) => [challenge.id, challenge]));

export const challengeCategories = [
  { id:"browser", label:"Browser", description:"Tabs, navigation, and page search" },
  { id:"editor", label:"Code editor", description:"Files, refactoring, and code movement" },
  { id:"terminal", label:"Terminal", description:"History and command-line navigation" },
  { id:"files", label:"File management", description:"Select, move, rename, and organise" },
  { id:"text", label:"Text editing", description:"Fast corrections and formatting" },
  { id:"desktop", label:"Desktop navigation", description:"Switch context without leaving the lab" },
  { id:"mixed", label:"Mixed productivity", description:"Adaptive practice across every app" },
];

export function challengesForCategory(category) {
  return category === "mixed" ? challenges : challenges.filter((challenge) => challenge.category === category || challenge.application === category);
}
