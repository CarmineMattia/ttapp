markdown
# 🎉 TimeYeet: Your Time-Tracking Buddy! 🎉

Yo coder! 😎 **TimeYeet** is a slick app for peeps (25-50) to track work hours, tie ‘em to projects or tasks, and export a fancy "Ferrarini-style" CSV. It’s all about keeping things simple and fun! ⏰

- **Goal**: Make hour tracking a breeze with a cool vibe.  
- **Who’s It For?**: Folks juggling multiple projects or teams.  
- **Progress**: Login and UI are solid, but timer and CSV need some TLC. Peek at **TODO.md** for what’s up! 📋  

## 🛠️ The Tech Crew

Here’s the squad making TimeYeet tick! 🦸‍♂️

| What’s This?         | Tool               | Why It’s Awesome                           |
|----------------------|--------------------|--------------------------------------------|
| Framework            | Next.js (App Router) | Zippy pages and APIs—pure magic! 🌐       |
| Language             | TypeScript         | Keeps bugs at bay! 🐞                     |
| UI Magic             | React              | Clicky, smooth interfaces. 💖             |
| Components           | Shadcn/ui          | Pre-styled bits in `src/components/ui`. 🎨 |
| Styling              | Tailwind CSS       | Fast, consistent looks. ✂️               |
| Code Cleanup         | ESLint             | Code stays clean and shiny. 🧼            |
| Extras               | Helpers            | CSV magic in `src/utils/exportHelpers.ts`. 🪄 |

**Hot Tips**:  
- 🎨 Grab components from `src/components/ui` first.  
- 💅 Use Tailwind for all styling—keep it tight!  

## ✨ TimeYeet’s Tricks

Features with emoji vibes: ✅ = Done, 🚧 = In Progress, ⏳ = To Do.

| Feature                   | Status     | What’s It About?                           |
|---------------------------|------------|--------------------------------------------|
| 🔐 User Login             | ✅ Done     | Sign up, sign in, sign out—easy!           |
| ⏱️ Start/Stop Timer       | ⏳ To Do    | Track hours with a quick click.            |
| 📝 Shift Details          | ⏳ To Do    | Add `department`, `project`, `notes`.      |
| 📅 View Shifts            | 🚧 Started | List or calendar of your shifts.           |
| ✏️ Edit Shifts            | ⏳ To Do    | Tweak times or details.                    |
| 🗑️ Delete Shifts          | ⏳ To Do    | Ditch wrong shifts safely.                 |
| 📊 "Ferrarini" CSV Export | 🚧 Started | Special CSV style (check `prd.md`).        |
| 👤 Profile Page           | ✅ Done     | Update your name, email, and more.         |

**Heads Up**:  
- ⏲️ Timer needs to be bulletproof—no slip-ups!  
- 📑 CSV *has* to match "Ferrarini-style" (see `prd.md`).  
- 📱💻 Gotta look sweet on phones and desktops.  

## 🧑‍💻 Code Like a Pro

Stay sharp with these guidelines:  

### 📂 Where Stuff Lives  
- **Routes**: `src/app/` for pages and layouts.  
- **Components**:  
  - `src/components/ui/` for Shadcn/ui stuff.  
  - `src/components/` for app bits (like `Timer`).  
- **Helpers**: `src/utils/` (e.g., `exportHelpers.ts` for CSV).  

### 💻 Coding Rules  
- **TypeScript**: Types everywhere—`any` is banned! 🚫  
- **Components**: Keep ‘em small, use Shadcn/ui flavor.  
- **Styling**: Tailwind only, responsive with `sm:`, `md:`.  
- **Errors**: Friendly user messages, logs for debugging.  

### 📊 CSV Vibes  
- Make `src/utils/exportHelpers.ts` follow `prd.md` exactly.  
- Test weird stuff (empty shifts, odd characters).  

### 📝 Docs  
- Comment tricky bits (like timer logic).  
- Update **TODO.md** as you go.  
- Keep **README.md** fresh.  

### 🧪 Testing  
- Check UI on all screen sizes.  
- Test CSV exports by hand.  

## 🚀 Get It Running!

Spin up TimeYeet like this:  

1. **Grab It**:  
   git clone <repo-url>
   cd timeyeet

2. **Install**:  
   npm install

3. **Secrets**:  
- Make `.env.local`:  
  ```
  NEXT_PUBLIC_DATABASE_URL=your-url
  ```

4. **Run**:  
   npm run dev
- Open `http://localhost:3000`—you’re in! 🌐  

5. **Polish**:  
   npm run lint
   npm run format

6. **Key Files**:  
- **prd.md**: The master plan.  
- **TODO.md**: Your to-dos.  
- **README.md**: Setup basics.  

## 📚 Help Links

Lost? These are gold:  
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs) 📘  
- **Shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com) 🎨  
- **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs) ✂️  

## 💡 Be a TimeYeet Star

- 🎯 Hit **TODO.md** tasks first (timer, CSV).  
- 🤔 Unclear on `prd.md`? Ask up!  
- 📝 Commit often with clear notes (e.g., “Added timer button”).  
- 🧪 Test everything before sharing.  

## 🔮 Future Ideas

Down the road, maybe:  
- 📦 Bulk shift edits.  
- 📊 Time stats per project.  
- 🤝 Payroll connections.  

---