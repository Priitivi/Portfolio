export const appMeta = {
  browser:{ title:"Orbit Browser", color:"#8ee6c5" },
  editor:{ title:"Vector Editor", color:"#82aaff" },
  terminal:{ title:"Flux Terminal", color:"#d6b3ff" },
  files:{ title:"Index Files", color:"#ffd35a" },
  mail:{ title:"Relay Mail", color:"#ff927d" },
  notes:{ title:"Field Notes", color:"#b5e66d" },
  sheet:{ title:"Grid Sheet", color:"#6ee7ae" },
};

export function createInitialWindows() {
  return Object.entries(appMeta).map(([app, meta], index) => ({
    id:app,
    app,
    title:meta.title,
    open:index < 3,
    minimized:false,
    x:170 + index * 28,
    y:88 + index * 24,
    width:app === "terminal" ? 700 : 820,
    height:app === "terminal" ? 470 : 540,
    z:index + 1,
  }));
}
