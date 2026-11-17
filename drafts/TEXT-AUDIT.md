# Where the portfolio repeats itself, and where it is all words

Written by `tools/text-audit.py`, which reads the nine pages a visitor
actually walks through. It reports and changes nothing; tick what you
want cut and I will cut it.

Three things are counted: a sentence that appears in more than one
place, a section that asks to be read without showing anything, and a
paragraph past 55 words, which is roughly where a reader starts
skimming.


## 1. The same sentence, twice

Nothing. No sentence of six words or more appears in two places.


## 1b. Two sentences that say the same thing

Ranked by how alike they are. The page and section are given so
you can see which of the two is carrying its weight.

**63% alike**

- *Paira / Role* — I own the surfaces where people arrive and where they help.
- *Paira / Core Experience* — I own the surfaces where people enter Paira, find something to help with, and decide to give more.


## 2. Sections with nothing to look at

Word count is the whole section, headings included.

| Page | Section | Words | First line |
|---|---|---|---|
| About | What I do | 68 | Skills I bring… |
| Paira | Overview | 255 | I joined before there was a product, and helped decide what Paira shou… |
| Paira | Reflection | 282 | A year at Paira taught me two things at once: how to grow inside a tea… |
| Merlin Bird ID | Project Overview | 258 | I first reframed “beginner birder” as a research problem, not a fixed … |
| Merlin Bird ID | Reflection | 132 | A metric can create clarity, but it should stay open to being revised.… |
| EcoScan | Outcome & Reflection | 106 | The final prototype communicates a direction for food transparency, no… |
| Common Ground | Visual System | 126 | A visual grammar players could read at table speed.… |
| Focus House | ? | 185 | What I took from it… |
| Mooncake | ? | 193 | What I took from it… |


## 3. Paragraphs past 55 words

| Page | Section | Words | Paragraph |
|---|---|---|---|
| Paira | The Pivot | 97 | The early Paira borrowed its shape from dating apps: a People tab you swiped through, a Request tab with small bounty po… |
| Paira | Market Research | 76 | The big professional and campus networks are broad but transactional: you browse a marketplace of people and send reques… |
| Paira | Growth & Next | 69 | A launch is a moment; a product is a habit, and habits are built one cohort at a time. This fall's back-to-school push i… |
| Paira | Market Research | 68 | Before the product had a shape, we had to make the case for it. The early research I contributed to named three problems… |
| Mooncake | air | 64 | Enlarging the holes to Ø1 made them print open, and six on a bolt circle covered most of the recessed field. Before comm… |
| Paira | Overview | 62 | In a startup this small, one of two designers does many jobs. Mine were to make the idea concrete, to own the surfaces w… |
| Paira | Brand in the World | 61 | From the waitlist in late 2025 to the App Store launch in June 2026, the summer speaker series, and this fall's back-to-… |
| Mooncake | air | 61 | I printed three bucks at once: blank, raised orchid, engraved orchid. The outline and the scallops came through on all t… |
| Paira | Core Experience | 56 | Paira's premium layer runs on points: earned by inviting friends who complete a profile, spent on boosting a request for… |


## 4. Where the words are

| Page | Words | Sections | Of those, no picture |
|---|---|---|---|
| Home | 243 | 4 | 0 |
| About | 534 | 5 | 1 |
| Paira | 3885 | 11 | 2 |
| Merlin Bird ID | 1201 | 7 | 2 |
| EcoScan | 760 | 6 | 1 |
| Common Ground | 1384 | 7 | 1 |
| Explorations | 533 | 2 | 0 |
| Focus House | 1744 | 8 | 1 |
| Mooncake | 1821 | 9 | 1 |


## Totals

- 0 sentences appear word for word in more than one place
- 1 pairs say much the same thing
- 9 sections carry 60 words or more and show nothing
- 9 paragraphs run past 55 words

<!-- written by hand below this line; the script keeps it -->
---

# What I would cut, in order

Written by hand from the tables above. Tick a line and I will do it; the
numbers beside each are what it buys.

## A. Paira is carrying the weight of the whole site — DONE, 17 Nov

Paira was **3,729 words**; it is **3,290** now. Of the 23 over-long
paragraphs on the site, 17 were on Paira and 11 of those in Core Experience;
the site is down to **13** and Core Experience to **2**, both of which sit
right on the 55-word line.

- [x] **A1 — Core Experience, 11 long paragraphs.** Done. Every one of them
  sat beside a screen that already showed what it described, so each was cut
  to the part a screen cannot say: why the decision was made, and what the
  testing found. 1,481 words to 1,135. Nothing was removed that the pictures
  were not already saying, and the two facts that are not visible anywhere —
  the six mentors tested one-on-one, and the three iterations — are still
  there.
- [x] **A2 — Overview, 174 words in one paragraph.** Done. It is three
  paragraphs of 51, 43 and 62 words: the premise, the path, the role. Every
  fact kept, including the App Store, the 100+ waitlist and the 50+ beta.
- [ ] **A3 — The Pivot.** **Withdrawn: this was wrong.** The audit counted
  literal `<img>` tags, and The Pivot's eleven visuals are mounted by script,
  so it read as a 661-word section with nothing to look at. It has a
  before-and-after component, and one over-long paragraph. The script now
  counts script-mounted components too, which is why the unpaired count went
  from 10 to 9. Nothing was cut here.
- [x] **A4 — Reflection, 359 words.** Done, 282 now. The 99-word item about
  the path from design to code was the worst of it; the diagram under it was
  already saying the rest, so the sentence stops where the diagram starts.

### What the old A-section said

- [ ] ~~**A1 — Core Experience, 11 long paragraphs.**~~ Every one of them sits
  beside a screen that already shows what it describes. Cut each to the one
  sentence the screen cannot say. Estimated −400 words. *Actual: −346.*

## B. Five places where the same thought is written twice — DONE, 17 Nov

- [x] **B1 — Merlin, Key Findings vs Concept Testing (82% alike).** "The
  findings showed that novice birders need different kinds of support" and
  "User testing showed that different novice birders wanted different kinds
  of support." The second is the same claim with a different verb. Cut it and
  let that section say what the testing changed instead.
- [x] **B2 — Paira, Role vs Core Experience (79% alike).** The five surfaces
  are listed in the same order in both. Keep the list where the reader can
  act on it, in Core Experience, and let Role say what owning them meant.
- [x] **B3 — Mooncake, making vs What I took from it (74% alike).** The fill
  line is proposed in the build notes and proposed again in the takeaway.
  Keep the takeaway.
- [x] **B4 — Merlin, Research Approach vs Reflection (65% alike).** Both open
  with "interviews and shadowing showed". Give the Reflection its own opening.
- [x] **B5 — Common Ground, Designing the System vs How the Game Works
  (62% alike).** Resources combining into a team behaviour is explained
  twice. Keep it where the diagram is.

## B and D, what was actually done

B1 Merlin act 05 restated act 03's finding as its own heading; it now says
what the testing settled, which is what the line under it was already
claiming. B2 the five Paira surfaces were listed twice in the same order;
the list stays in Core Experience, where a reader can act on it. B3 the
Mooncake fill line was proposed in the build notes and again in the
takeaway; the takeaway keeps it. B4 two Merlin sections opened with the same
five words. B5 Common Ground explained the same mechanic twice; the diagram
keeps it.

D1 five process paragraphs on Focus House and Mooncake, all beside
photographs of the process. Cut to what a photograph cannot carry: the
reasoning and the measurements. Every number stays — Ø0.4, Ø1, 66.5 mm²,
900.3 mm², 2 mm, 2°, 4°, 20 mm.

Site totals since the audit was written: over-long paragraphs 23 → 9,
near-duplicate pairs 5 → 1. Paira reads 3,885 words rather than 3,290
because act 06 was merged into it in the same sitting; without it the page
is 2,900.

## C. Nine sections that ask to be read and show nothing

Two of them are on Paira, Overview and Reflection, and both are now much
shorter but still show nothing. The rest:

- [ ] **C1 — Merlin, Project Overview (261 words).** The page's opening act.
- [ ] **C2 — Merlin, Reflection (137 words).**
- [ ] **C3 — EcoScan, Outcome & Reflection (110 words).**
- [ ] **C4 — Common Ground, Visual System (129 words).** A section about a
  visual system, with no visual in it.
- [ ] **C5 — Focus House, What I took from it (185 words).**
- [ ] **C6 — Mooncake, What I took from it (193 words).**
- [ ] **C7 — About, What I do (68 words).** The smallest of them; probably
  fine as it is.

C4 is the one I would do first: a section named Visual System with nothing
to look at is the clearest version of the problem on the whole site.

## D. Not a cut, but the same instinct — DONE, 17 Nov

- [x] **D1 — Focus House, `tests`, and Mooncake, `air`.** Five long
  paragraphs between them, all of them process notes beside photographs that
  already show the process. Same treatment as A1.

---

*Regenerate the tables above with `python3 tools/text-audit.py`. It reads the
nine pages a visitor walks through and changes nothing.*
