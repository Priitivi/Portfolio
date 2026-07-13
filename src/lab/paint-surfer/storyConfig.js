export const paintStoryChapters = [
  {
    id: "horizon",
    number: "01",
    title: "Wake the horizon",
    prompt: "Surf colour around the unfinished billboard until its sleeping landscape remembers the sunrise.",
    hint: "Follow the pink beacon beyond the starting canvas.",
    position: { x: 0, z: -18 },
    radius: 7.2,
    goal: 14,
    accent: "#ff5f9f",
  },
  {
    id: "maker",
    number: "02",
    title: "Return the maker's spark",
    prompt: "Circle the blank artist statue and paint enough momentum to relight the heart in its chest.",
    hint: "The cyan beacon waits to the right of the mural.",
    position: { x: 15, z: 2 },
    radius: 7.4,
    goal: 16,
    accent: "#4de8ff",
  },
  {
    id: "doorway",
    number: "03",
    title: "Draw the way home",
    prompt: "Complete the last loop around the colourless doorway and surf your new world through it.",
    hint: "The ultraviolet beacon burns across the canvas.",
    position: { x: -13, z: 14 },
    radius: 7.8,
    goal: 18,
    accent: "#a779ff",
  },
];

export const PAINT_STORY_GOAL = paintStoryChapters.reduce((total, chapter) => total + chapter.goal, 0);

export function isInsideStoryChapter(position, chapter) {
  if (!position || !chapter) return false;
  return Math.hypot(position.x - chapter.position.x, position.z - chapter.position.z) <= chapter.radius;
}

export function createStoryStatus(paintedCounts = []) {
  const chapters = paintStoryChapters.map((chapter, index) => {
    const painted = Math.max(0, Math.min(chapter.goal, Number(paintedCounts[index]) || 0));
    return {
      ...chapter,
      painted,
      progress: Math.round((painted / chapter.goal) * 100),
      complete: painted >= chapter.goal,
    };
  });
  const firstIncomplete = chapters.findIndex((chapter) => !chapter.complete);
  const activeIndex = firstIncomplete === -1 ? chapters.length : firstIncomplete;
  const painted = chapters.reduce((total, chapter) => total + chapter.painted, 0);

  return {
    activeIndex,
    chapters,
    complete: activeIndex === chapters.length,
    progress: Math.round((painted / PAINT_STORY_GOAL) * 100),
    current: chapters[Math.min(activeIndex, chapters.length - 1)],
  };
}
