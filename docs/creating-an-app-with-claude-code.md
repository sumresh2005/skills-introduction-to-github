# Creating an App From Scratch with Claude Code

_A beginner's step-by-step guide — no prior coding or tooling experience required._

Claude Code is a command-line tool that lets you build software by describing
what you want in plain English. It reads and writes files, runs commands,
and iterates with you until the app works. This guide walks you through
going from "I have an idea" to "I have a working app," one step at a time.

---

## 1. Understand what you're working with

- **Terminal**: A text-based window where you type commands instead of
  clicking buttons. On macOS it's called "Terminal," on Windows it's
  "PowerShell" or "Windows Terminal," on Linux it's usually "Terminal" too.
- **Claude Code**: A CLI (command-line interface) tool you run inside the
  terminal. You type instructions, Claude reads/writes code and runs
  commands on your behalf, and you review the results.
- **Git/GitHub**: Tools for saving snapshots of your project (commits) and
  storing them online (repositories) so you don't lose work and can share it.

You don't need to know how to code to start — Claude Code writes the code.
You do need to be comfortable running a few commands and reading output.

---

## 2. Install the prerequisites

1. **Install Node.js** (Claude Code runs on it):
   - Go to [nodejs.org](https://nodejs.org) and download the "LTS" version
     for your operating system.
   - Run the installer, accepting the defaults.
   - Verify it worked by opening your terminal and typing:
     ```
     node --version
     ```
     You should see a version number like `v20.x.x`.

2. **Install Claude Code**:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
   Verify it installed:
   ```
   claude --version
   ```

3. **Sign in**: The first time you run `claude`, it will prompt you to log
   in with your Anthropic/Claude account (or an API key if you're using the
   API directly). Follow the on-screen link and approve access.

---

## 3. Create a project folder

Pick (or create) an empty folder for your app, then open a terminal there.

```
mkdir my-first-app
cd my-first-app
```

If you're on Windows/macOS/Linux and prefer a GUI, you can create the
folder in Finder/Explorer and then right-click → "Open in Terminal," or
open the folder in VS Code and use its built-in terminal (View → Terminal).

---

## 4. Start Claude Code

Inside the project folder, run:

```
claude
```

This starts an interactive session. You'll see a prompt where you can type
messages, similar to a chat window, but Claude can also read your files,
write new ones, and run commands like `npm install` for you.

---

## 5. Describe your app idea clearly

The quality of what you get back depends heavily on how clearly you describe
what you want. A good first message includes:

- **What the app does** ("a to-do list app," "a personal expense tracker,"
  "a simple blog").
- **Who uses it** (just you, or multiple users with logins?).
- **Platform** (web app in the browser, mobile, or a command-line tool?).
- **Any preferences** (a particular look, a particular language/framework —
  or say "you choose" if you have no preference).

Example first prompt:

> I want to build a simple to-do list web app from scratch. Users should be
> able to add tasks, mark them done, and delete them. Tasks should be saved
> so they're still there after refreshing the page. I have no preference on
> the tech stack — pick something simple and modern. Please set up the
> project structure first and explain what you're creating before writing
> code.

Claude Code will typically:
- Ask a couple of clarifying questions if your request is ambiguous.
- Propose a plan (framework choice, file structure, key features).
- Start scaffolding the project (creating folders, config files, and code).

Tip: For a bigger or more complex app, ask Claude to enter **plan mode**
first (type `/plan` or ask it to "plan before making changes") so it
outlines the approach before touching any files. You approve the plan, then
it executes.

---

## 6. Let Claude build, and review as it goes

As Claude works, it will:
- Create files (you'll see it use tools to write code).
- Run commands like `npm install` to add dependencies.
- Explain what each part does.

You should:
- **Watch for permission prompts.** Claude Code asks before running
  commands that change your system or install things, especially the first
  time. Review each one before approving.
- **Read the summaries.** You don't need to read every line of generated
  code, but understanding the high-level structure (which files exist and
  why) will help you steer the project later.
- **Ask questions anytime.** If something is unclear, just ask — e.g. "why
  did you use a database instead of a plain file?" or "explain what this
  file does."

---

## 7. Run the app and try it yourself

Once Claude says the initial version is ready, ask it how to run the app,
or just ask it to run it for you:

> Please start the app so I can try it.

For a typical web app this might mean:
```
npm run dev
```
and then opening `http://localhost:3000` (or whatever port it tells you) in
your browser.

Actually **use the app** — click buttons, add data, try to break it. This is
the most important step: you're the one who knows whether it matches what
you wanted.

---

## 8. Iterate — this is the normal workflow

Building an app with Claude Code is a loop, not a one-shot request:

1. Try the app.
2. Notice something wrong or missing.
3. Tell Claude specifically what you saw and what you expected instead.
4. Let Claude fix it, then try again.

Good iteration prompts are specific:
- "When I click 'Add Task' with an empty input, it adds a blank task. It
  should show an error instead."
- "Can you make the completed tasks show with a strikethrough and move to
  the bottom of the list?"
- "The app crashes when I refresh the page — here's the error I see in the
  browser console: `<paste error>`"

Pasting exact error messages or screenshots dramatically speeds up fixes.

---

## 9. Save your work with Git

Once you have something working, save a snapshot. You can ask Claude Code
to do this for you:

> Please initialize a git repository and make a commit with the current
> progress.

Under the hood this runs something like:
```
git init
git add .
git commit -m "Initial version of to-do app"
```

Do this regularly — after each meaningful working change — so you always
have a point to go back to if something breaks later.

To back your project up online, create a repository on
[github.com](https://github.com/new) and ask Claude to push to it, or run:
```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

---

## 10. Add tests and guardrails (optional but recommended)

Ask Claude to add basic tests as the app grows:

> Can you add a few tests to check that adding, completing, and deleting a
> task works correctly?

This helps catch regressions automatically as you keep adding features,
instead of manually re-testing everything by hand each time.

---

## 11. Give Claude persistent project context (optional)

For longer-running projects, create a `CLAUDE.md` file in the project root
describing conventions you want followed (coding style, folder structure,
how to run tests, etc.). Claude Code automatically reads this file at the
start of each session, so you don't have to repeat yourself.

You can ask Claude to generate a starting one for you:

> Please create a CLAUDE.md summarizing this project's structure and how to
> run/test it.

---

## 12. Deploy your app (when you're ready)

Once the app works the way you want, ask Claude for deployment help suited
to what you built, for example:

> How would I deploy this app somewhere so others can use it? Walk me
> through the steps.

Common beginner-friendly options Claude may suggest:
- **Vercel** or **Netlify** for web frontends.
- **Railway** or **Render** for apps needing a backend/database.
- **GitHub Pages** for simple static sites.

Claude Code can generate the necessary config files and walk you through
connecting your GitHub repository to the hosting service.

---

## Quick reference: the full loop

```
1. mkdir my-app && cd my-app
2. claude                        # start a session
3. Describe the app you want
4. Review the plan / approve actions
5. Run the app and try it
6. Describe bugs/changes in plain English
7. Repeat steps 5-6 until happy
8. Commit progress with git regularly
9. Deploy when ready
```

---

## Tips for beginners

- **Be specific, not clever.** "Add a delete button next to each task that
  removes it from the list" beats "make it better."
- **One change at a time** when things are complex — it's easier to verify
  and undo if needed.
- **It's fine to not understand the code.** You can always ask Claude to
  explain any file or function in plain language.
- **Undo is your friend.** If a change breaks something, tell Claude and it
  can revert or fix it — especially easy if you've been committing with git.
- **Ask "why," not just "what."** Understanding *why* Claude made a choice
  helps you make better decisions as the app grows.
