# Mission: CMAS Science — Room D211 (Tointon Academy)

A CMAS Grade 5 Science practice site for Ms. Plett's 5th graders (Blocks 1–4). It's a static site with no ads, trackers, or outside scripts. Student site: `index.html`. Teacher dashboard: `teacher.html`.

## Where the data lives
- **Every action is an event, and events are only ever added.** Nothing is edited or deleted, so a student's **first attempt is permanent**.
- Each Chromebook saves its events to `localStorage` right away, then sends them to the **shared store**: a Google Apps Script web app that writes to a Google Sheet in Ms. Plett's Drive (`Events` and `Roster` tabs).
  - If the internet drops, events wait in a queue and are sent later.
  - If a Chromebook dies mid-test, the student resumes where they stopped.
- Until `SHEET_URL` is set in `config/settings.js`, the site runs in **local-only mode**: data stays on each Chromebook, and the dashboard only sees what's on that one device.
- **Roster:** the dashboard's Roster tab saves the roster to the `Roster` tab of the Sheet. `config/roster.js` is only the starting list; it's copied into the Sheet the first time the dashboard opens with a working `SHEET_URL`.
- **Teacher-only data** (RIT scores, goals, groups marked met, dismissed flags) is stored as events under `sid=TEACHER`. The student endpoint never returns it.

## One-time setup (Ms. Plett, about 10 minutes)
1. In Google Drive, create a new **Google Sheet** (for example "CMAS Mission Data"). **Don't share it.**
2. In the Sheet, go to **Extensions → Apps Script**. Delete the starter code, paste in all of `apps-script/Code.gs`, and save.
3. Go to **Project Settings (gear) → Script Properties → Add property**. Set the name to `TEACHER_PIN` and the value to a PIN you choose. Don't put it in this repo or in chat.
4. Click **Deploy → New deployment → type: Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click Deploy, approve the permissions, and copy the `/exec` URL.
5. In this repo, edit `config/settings.js`: paste that URL into `SHEET_URL: "..."` and commit.
   - Once `SHEET_URL` is set, the dashboard checks the PIN against your Script Property.
   - `TEACHER_PIN: "0000"` in settings.js is only a placeholder for local-only mode. This repo is public, so never put your real PIN there.
6. Open `teacher.html` and enter your PIN. The roster is copied to the Sheet automatically.

To update the script later, use **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

## Things you edit
| File | What |
|---|---|
| `config/settings.js` | `SHEET_URL`, thresholds, checkpoint dates, CMAS estimate bands, daily goal (20 min), whether students see their RIT |
| `config/numbering.js` | Day / question number / workbook page for every item. This is the **one numbering file**; slide number = page number. |
| `config/videos.js` | Your video link for each question (YouTube, Google Drive, or Loom). It shows up in the Review Mission and explanations. |
| Dashboard → Roster | Add (or paste a list), edit, move between blocks, or archive students |
| Dashboard → Settings | Pace and nudge thresholds, idle seconds, whole-group cut-off |
| Dashboard → Checkpoints | Checkpoint names and dates (winter and spring retakes) |

## Item sources
- **Official CMAS (45):** the 2024 CMAS Grade 5 Science paper practice resource, Item Sets 1–3, shown verbatim as page images, with English and Spanish official versions. Answers come from the CDE scoring guide.
- **Official NWEA samples (9):** from NWEA's public "MAP Growth 3–5 Science for use with NGSS — Sample Items" fact sheet.
- **Original MAP-style items (12):** written for this site and aligned to NWEA's instructional areas. These are **not** NWEA items.
- **Strategy Missions (20):** original items that teach CMAS/TestNav test-taking strategies.

Standards tags for every item are listed in `STANDARDS_ALIGNMENT.md`.

## Privacy notes
- Names are first name + last initial, with no passwords. Anyone with the link can see the class name lists on the sign-in page.
- A student's practice events can be fetched by student id without a PIN; this is how kids sign in without passwords. Teacher-only data, all-class data, and Live View require the PIN.
- Activity tracking is limited to this site: counts of mouse moves, clicks, and keys (never which keys), idle time, and tab switches.
- Idle, racing, and off-tab flags are teacher-only. During checkpoints, students see no meters, flags, or nudges.
