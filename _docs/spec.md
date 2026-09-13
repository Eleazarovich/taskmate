# Chess Kanban --- MVP Specification

## 1. Product Summary

**Chess Kanban** is a personal productivity web application that
combines a practical Kanban board with the progression and feedback of a
chess game.

The application is designed primarily for one person managing their own
work. It is not a team collaboration tool in the MVP.

Users create separate boards for different areas of work or life. Every
board uses the same fixed six-stage workflow based on all six chess
pieces:

**Pawn → Knight → Bishop → Rook → Queen → King**

Every task starts as a Pawn and must progress one stage at a time until
it becomes a King. The application reinforces progression with
drag-and-drop interactions, chess-inspired sounds, animations, rating
points, and a victory experience when a task reaches King.

The core principle is:

> **The workflow is Kanban. The experience is chess.**

Chess terminology should enhance the experience without making ordinary
task management confusing.

------------------------------------------------------------------------

## 2. Product Goals

The MVP should:

-   Make personal task management fun and motivating.
-   Remain immediately recognizable and usable as a Kanban board.
-   Give every task a visible journey from backlog to completion.
-   Reward progress through a simple global rating system.
-   Make task movement feel physical and game-like.
-   Use sound and animation as meaningful feedback.
-   Support multiple independent boards for different areas of the
    user's life.
-   Remain intentionally simple rather than becoming a full
    project-management platform.

------------------------------------------------------------------------

## 3. Target User

The MVP is designed for a **single personal user**.

Example boards could include:

-   Chess Work
-   Personal
-   Coding Projects
-   Job Search
-   Administration
-   Any other user-defined area

The product should not be designed around teams, companies,
collaboration, or public boards.

------------------------------------------------------------------------

## 4. Core Workflow

Every board contains exactly six fixed columns.

  -----------------------------------------------------------------------
  Chess Piece             Kanban Stage            Meaning
  ----------------------- ----------------------- -----------------------
  ♟ Pawn                  Backlog                 Task exists but has not
                                                  yet been committed to
                                                  active work

  ♞ Knight                To Do                   Task has been selected
                                                  to work on

  ♝ Bishop                In Progress             Work is actively being
                                                  done

  ♜ Rook                  Testing / Checking      Work is being verified
                                                  or checked

  ♛ Queen                 Review                  Final review, polish,
                                                  or approval stage

  ♚ King                  Completed               Task is finished
  -----------------------------------------------------------------------

These stages are fixed in the MVP.

Users cannot add, remove, rename, or reorder columns.

Every newly created task starts in **Pawn / Backlog**.

------------------------------------------------------------------------

## 5. Movement Rules

Task movement is governed by strict game rules.

### 5.1 Drag and Drop

Tasks are moved primarily through drag and drop.

A task may move only to an **adjacent stage**.

Legal forward progression:

`Pawn → Knight → Bishop → Rook → Queen → King`

Legal backward progression:

`King → Queen → Rook → Bishop → Knight → Pawn`

### 5.2 No Skipping

Tasks cannot skip stages.

Examples:

-   Pawn → Knight: valid
-   Bishop → Rook: valid
-   Queen → King: valid
-   Pawn → Bishop: invalid
-   Knight → Queen: invalid
-   King → Rook: invalid

When an invalid move is attempted:

1.  The task must not change stage.
2.  The card should smoothly snap back to its original position.
3.  An invalid-move sound should play.
4.  Rating must not change.

This restriction is an intentional game rule, not an implementation
limitation.

------------------------------------------------------------------------

## 6. Rating System

The application has one **global player rating** shared across all
boards.

Initial rating:

`0`

Minimum possible rating:

`0`

The rating can never become negative.

### Rating Rules

Every legal forward stage movement:

`+1 Rating`

Every legal backward stage movement:

`-1 Rating`

An invalid/skipped movement:

`0 Rating change`

Example:

A task travelling completely from Pawn to King contributes five forward
moves:

`Pawn → Knight (+1)` `Knight → Bishop (+1)` `Bishop → Rook (+1)`
`Rook → Queen (+1)` `Queen → King (+1)`

If the user later moves King → Queen, one point is removed.

If the current global rating is zero, a backward movement leaves the
rating at zero.

### Rating Visibility

The user's current rating should always be visible in the main Kanban
interface/header.

Example:

`♚ Rating 247`

Selecting the rating/profile area should open a compact player
statistics panel containing at minimum:

-   User name
-   Current global rating
-   Total completed tasks
-   Total boards

The MVP should not become a complex analytics product.

------------------------------------------------------------------------

## 7. Task Model

A task contains:

-   **Title** --- required
-   **Description** --- optional
-   **Priority** --- optional
-   **Created date** --- automatically generated and read-only
-   **Due date** --- optional
-   **Tags** --- optional, free-form
-   **Current stage** --- system controlled through board movement

Example tags:

`MVP`, `Testing`, `Bug`, `Personal`, `Urgent`

### Quick Creation

Creating a task should be fast.

The user should be able to create a task with only a title. Other
details can be added later.

Every new task automatically appears in the **Pawn / Backlog** column.

------------------------------------------------------------------------

## 8. Task Operations

The MVP supports exactly the essential task-management operations:

### Create

Create a new task.

### Edit

Open a task and edit its:

-   Title
-   Description
-   Priority
-   Due date
-   Tags

The created date cannot be manually changed.

### Delete

Delete a task.

Deletion should require confirmation to reduce accidental data loss.

Suggested confirmation:

> Remove this task from the board?

Deleting a task should not be treated as a workflow movement and should
not award rating points.

------------------------------------------------------------------------

## 9. Boards

The user can create multiple independent boards.

Each board represents a project, responsibility, or area of life.

### Board Creation

Board creation should be extremely quick.

Minimum required field:

-   Board name

After creating a board:

1.  A short welcoming/game-start sound plays.
2.  The board opens.
3.  All six fixed columns are automatically created.
4.  The board is immediately ready for new Pawn tasks.

The user should not have to configure workflow stages, themes,
permissions, or templates.

### Board Navigation

The current board is the main application experience.

Other boards should be accessible through a simple sidebar, board
switcher, or similar compact navigation.

There should not be a mandatory analytics dashboard between login and
the user's work.

When possible, opening the application should take the user directly
into their working Kanban experience.

------------------------------------------------------------------------

## 10. Sound Design

Sound is a core part of the product experience, not decorative polish.

The MVP requires distinct sound categories.

### Legal Forward Move

Play a short, satisfying chess-piece movement sound inspired by the
physical feedback of online chess interfaces.

Do not directly copy proprietary audio assets.

### Legal Backward Move

Play a short playful negative-feedback sound --- similar in feeling to a
gentle "oh no" or incorrect-answer cue.

It should communicate regression without being harsh or irritating.

### Invalid / Skipped Move

Play a distinct short error sound communicating:

> That move is not allowed.

### Board Creation

Play a brief welcoming/game-start cue when a new board is successfully
created.

### King / Completion

Moving Queen → King should trigger a distinctive victory sound.

Sounds must remain short so frequent task management does not become
annoying.

A future version may include volume or sound preferences, but complex
sound settings are not required for the MVP.

------------------------------------------------------------------------

## 11. King Victory Experience

Moving a task from **Queen → King** is the largest reward moment in the
application.

After the legal move:

1.  Play the normal progression/completion feedback.
2.  Increase global rating by one.
3.  Play the special victory sound.
4.  Briefly animate the completed task/King state.
5.  Slightly dim the board.
6.  Display a game-style victory overlay.

Example content:

**♚ TASK COMPLETED**

`Build portfolio authentication`

**+1 Rating**

**Rating: 247**

*Another victory.*

The exact copy may be refined during implementation.

### Important Behavior

The completion overlay **must not automatically disappear**.

The user dismisses it manually using:

-   An `X` close button, and/or
-   A `Back to Board` action

Once dismissed, the user returns to the Kanban board.

The completed task remains in the King column.

The celebration should feel rewarding but should not become a long or
disruptive animation.

------------------------------------------------------------------------

## 12. Authentication

The MVP uses basic account authentication.

### Sign Up

Required information:

-   Name
-   Email
-   Password

### Login

Credentials:

-   Email
-   Password

The user's **name is profile information**.

Email and password are authentication credentials.

Passwords must never be stored as plaintext. Authentication should be
implemented using a secure authentication provider or properly hashed
password system.

### Future Authentication

Google OAuth / "Continue with Google" is explicitly deferred to a future
version.

------------------------------------------------------------------------

## 13. Primary Screens

The MVP should require very few screens.

### Authentication

Sign up and login.

### Main Kanban Board

The primary application screen.

Contains:

-   Current board name
-   Board switcher/navigation
-   Global rating
-   Six Kanban columns
-   Task cards
-   Add-task interaction
-   Profile access

### Task Detail / Edit

Modal, drawer, or focused panel for viewing and editing task
information.

### Player Profile / Stats

Compact panel containing basic player information and global progress.

### King Victory Overlay

Completion celebration displayed over the board.

Avoid unnecessary pages.

------------------------------------------------------------------------

## 14. Visual Direction

The visual style is **Modern Game UI**.

The application should feel like a premium modern chess/game interface
rather than ordinary enterprise project-management software.

Desired characteristics:

-   Dark premium interface
-   High contrast and excellent readability
-   Large, beautiful chess-piece symbols
-   Strong visual identity for each workflow stage
-   Subtle chessboard/grid references
-   Smooth card movement
-   Glow states during interaction
-   Responsive hover feedback
-   Short polished animations
-   Layered depth where useful
-   Game-like status and rating presentation
-   Strong but tasteful gamification

The interface should not become childish or overly arcade-like.

Animations should generally be quick. Visual effects must never make
normal task management feel slow.

------------------------------------------------------------------------

## 15. Kanban Column Design

Each column should make both the chess identity and ordinary workflow
meaning immediately clear.

Example header:

`♝ BISHOP` `In Progress`

The chess piece should be visually prominent, while the conventional
Kanban stage label prevents ambiguity.

Suggested column order must always remain:

`♟ PAWN | ♞ KNIGHT | ♝ BISHOP | ♜ ROOK | ♛ QUEEN | ♚ KING`

Desktop is the primary MVP experience.

Horizontal scrolling is acceptable on smaller screens rather than
compressing six columns until they become unusable.

------------------------------------------------------------------------

## 16. Task Card Design

Cards should remain practical despite the game theme.

At minimum, the collapsed card should prioritize:

-   Title
-   Priority indicator when set
-   Due date when set
-   Tags when set

The current chess piece/stage can be represented visually but does not
need to repeat excessive information already communicated by the column.

Dragging a card should provide strong visual feedback:

-   Lift/elevation
-   Slight glow
-   Valid adjacent destination indication
-   Invalid destinations visually unavailable or rejected
-   Smooth drop/snap animation

------------------------------------------------------------------------

## 17. Data Model

A simple implementation may use the following logical entities.

### User

-   id
-   name
-   email
-   password/auth provider data
-   rating
-   created_at
-   updated_at

### Board

-   id
-   user_id
-   name
-   created_at
-   updated_at

### Task

-   id
-   board_id
-   title
-   description
-   priority
-   due_date
-   created_at
-   updated_at
-   stage
-   position
-   tags

`stage` should use a fixed enum or equivalent:

-   `pawn`
-   `knight`
-   `bishop`
-   `rook`
-   `queen`
-   `king`

`position` preserves ordering of cards within a column.

Tags may be stored through a separate normalized model or a simpler
structure appropriate to the chosen database.

------------------------------------------------------------------------

## 18. Core Business Rules

The implementation must enforce these rules in application logic, not
only visually:

1.  Every new task starts as Pawn.
2.  There are exactly six stages.
3.  Stages cannot be customized in the MVP.
4.  Tasks can move only one adjacent stage at a time.
5.  A legal forward move adds one global rating point.
6.  A legal backward move subtracts one global rating point.
7.  Rating can never be below zero.
8.  Invalid moves do not alter task state or rating.
9.  Queen → King triggers the victory experience.
10. King tasks may move backward to Queen.
11. Board switching does not change/reset rating.
12. Rating belongs to the user, not an individual board.
13. Reordering tasks within the same column does not affect rating.
14. Creating, editing, or deleting a task does not award progression
    points.
15. Refreshing the page must not repeat a previously awarded rating
    change.

Rating and stage updates should be persisted atomically where practical
to avoid inconsistencies.

------------------------------------------------------------------------

## 19. Persistence

Boards, tasks, account information, stage positions, and rating must
persist in a database.

The user should be able to:

1.  Log in.
2.  Create boards and tasks.
3.  Close the application.
4.  Return later or use another supported device/browser.
5.  Log in and find their saved state.

Browser-only local storage is not sufficient as the primary persistence
mechanism for the MVP.

------------------------------------------------------------------------

## 20. MVP User Flow

### First Use

1.  User opens application.
2.  User selects Sign Up.
3.  User enters name, email, and password.
4.  Account is created.
5.  User enters the application.
6.  User creates their first board.
7.  Welcome/game-start feedback plays.
8.  Six-stage Kanban appears.
9.  User creates a task.
10. Task appears as a Pawn.

### Normal Progression

1.  User sees task in Pawn.
2.  User drags Pawn → Knight.
3.  Move sound plays.
4.  Rating increases by one.
5.  User later moves Knight → Bishop.
6.  Rating increases again.
7.  Task eventually progresses through Rook and Queen.
8.  User moves Queen → King.
9.  Rating increases.
10. Victory sound and celebration appear.
11. User views their new rating.
12. User dismisses the overlay.
13. User returns to the board.

### Regression

1.  User realizes a Queen task needs more work.
2.  User drags Queen → Rook.
3.  Negative/regression sound plays.
4.  Rating decreases by one, never below zero.
5.  Task remains in Rook.

### Illegal Move

1.  User attempts Pawn → Bishop.
2.  Drop is rejected.
3.  Invalid-move sound plays.
4.  Card snaps back to Pawn.
5.  Rating remains unchanged.

------------------------------------------------------------------------

## 21. MVP Acceptance Criteria

The MVP is successful when:

-   A user can sign up with name, email, and password.
-   A user can log in with email and password.
-   A user can create multiple boards.
-   Every board automatically contains the six fixed chess/Kanban
    stages.
-   A user can create, edit, and delete tasks.
-   Every new task starts in Pawn.
-   Tasks can be reordered inside a stage.
-   Tasks can be dragged only between adjacent stages.
-   Invalid skipped-stage drops are rejected.
-   Legal forward movement adds exactly one rating point.
-   Legal backward movement removes exactly one rating point without
    going below zero.
-   Rating persists correctly across sessions and boards.
-   Relevant movement sounds play.
-   Queen → King triggers a victory experience.
-   The victory overlay stays visible until manually dismissed.
-   Completed tasks remain in King.
-   The interface visibly communicates both Kanban workflow and chess
    progression.
-   Boards and tasks remain available after logout/login.
-   The main work experience feels fast despite animations and sound.

------------------------------------------------------------------------

## 22. Explicitly Out of Scope for MVP

Do **not** add these unless requirements are changed:

-   Team collaboration
-   Organizations/workspaces
-   Invitations
-   Comments
-   Attachments
-   Subtasks
-   Checklists
-   Recurring tasks
-   Time tracking
-   Custom workflow stages
-   Adding/removing Kanban columns
-   Chess openings as board/project names or workflow concepts
-   Task difficulty-based rating
-   AI features
-   Complex analytics dashboards
-   Google OAuth
-   Social profiles
-   Public boards
-   Leaderboards
-   Multiplayer functionality
-   Mobile-native applications
-   Integrations with third-party task systems

Avoid adding features merely because typical Kanban products have them.

------------------------------------------------------------------------

## 23. Future Ideas

Potential later additions, only after the core product proves useful:

-   Google authentication
-   Sound controls and selectable sound packs
-   Rating milestones
-   Player ranks/titles
-   Achievement badges
-   Streaks
-   Historical rating graph
-   Board-specific statistics
-   Archived King tasks
-   Search and filtering
-   Notifications
-   Keyboard shortcuts
-   Additional profile customization
-   PWA/offline support
-   Optional board visual themes

These should not delay the MVP.

------------------------------------------------------------------------

## 24. Product Principle for Implementation

When making implementation decisions, prioritize in this order:

1.  **Useful personal Kanban**
2.  **Clear Pawn-to-King progression**
3.  **Fast drag-and-drop interaction**
4.  **Reliable task/rating state**
5.  **Satisfying game feedback**
6.  **Visual polish**
7.  Additional features

If a chess-themed idea makes the application harder to understand or
slower to use, prefer normal productivity terminology and keep chess as
the interaction and progression layer.

The final experience should make completing ordinary work feel like
advancing through a chess game.
