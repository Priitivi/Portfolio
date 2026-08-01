/**
 * Sim's Cosy Corner content source of truth.
 *
 * Replace the example copy and records in this file as Sim supplies her own
 * favourites, photographs, notes, marker details and Pokopia discoveries.
 * Presentation components deliberately do not contain personal content.
 *
 * @typedef {{ id:string, label:string, shortLabel:string, icon:string }} NavigationItem
 * @typedef {{ id:string, name:string, icon:string, description:string, status:string, accent:string, notes:string, tools:string[], dateAdded:string }} Hobby
 * @typedef {{ id:string, name:string, difficulty:'Starter'|'Growing'|'Confident', tools:string[], steps:string[], tips:string[], mistakes:string[], palette:string[], notes:string, favourite:boolean, dateTried:string|null, confidence:number, related:string[] }} Technique
 * @typedef {{ id:string, title:string, book:string, markerSet:string, techniques:string[], palette:string[], completed:string|null, notes:string, favourite:boolean, art:string }} GalleryItem
 * @typedef {{ id:string, name:string, mood:string, colours:string[] }} PalettePreset
 * @typedef {{ id:string, name:string, theme:string, difficulty:string, location:string, footprint:string, time:string, status:'Concept'|'Verified', description:string, palette:string[], materials:Array<{id:string,name:string,category:string,required:number}>, decorations:string[], stages:Array<{title:string,copy:string,materials:string[],diagram:string}>, notes:string }} ConceptBuild
 */

export const cosyTheme = {
  id: "lavender-daydream",
  name: "Lavender Daydream",
  description: "Cream paper, dusty lavender, soft lilac and quiet supporting pastels.",
  tokens: {
    cream: "#fff8e9",
    paper: "#fffdf7",
    lavender: "#c9b6e4",
    lilac: "#aa8fc8",
    violet: "#745b91",
    periwinkle: "#aebbe2",
    blush: "#edc5d0",
    peach: "#efc3a8",
    butter: "#f2d98c",
    blue: "#b8d5e6",
    sage: "#b8c9aa",
    plum: "#3f304b",
  },
  futureMoods: ["Peach Sunrise", "Sage Cottage", "Powder Blue Evening", "Buttercup Picnic"],
};

export const simCosyContent = {
  lab: {
    number: "007",
    title: "Sim’s Cosy Corner",
    eyebrow: "A little scrapbook in progress",
    intro: "A soft place for colourful pages, tiny game plans and whatever hobby feels lovely this week.",
    previewLabel: "Experimental Lab preview",
    editableNote: "Starter copy — ready to make properly Sim’s.",
  },
  navigation: /** @type {NavigationItem[]} */ ([
    { id: "home", label: "Cosy corner", shortLabel: "Home", icon: "⌂" },
    { id: "hobbies", label: "Hobby shelf", shortLabel: "Shelf", icon: "♡" },
    { id: "colouring", label: "Colouring studio", shortLabel: "Colour", icon: "✎" },
    { id: "pokopia", label: "Build book", shortLabel: "Builds", icon: "◇" },
  ]),
  currentInterests: [
    { label: "On the desk", value: "Lavender marker combinations", accent: "lilac" },
    { label: "Playing", value: "Planning a tiny garden build", accent: "sage" },
    { label: "Next cosy idea", value: "Add Sim’s real favourites", accent: "butter" },
  ],
  stickers: ["made with care", "cosy find", "try this next", "Sim’s favourite", "little joy"],
};

export const hobbies = /** @type {Hobby[]} */ ([
  { id:"colouring", name:"Cosy colouring", icon:"✿", description:"Slow pages, gentle palettes and the satisfying last little detail.", status:"Current obsession", accent:"blush", notes:"Add favourite books and finished-page memories here.", tools:["Colouring books", "Palette notes"], dateAdded:"2026-08-01" },
  { id:"markers", name:"Alcohol markers", icon:"▰", description:"Learning blends, shadows and textures one swatch at a time.", status:"Trying", accent:"lilac", notes:"Brand and real marker codes intentionally left open.", tools:["Marker paper", "White gel pen", "Colourless blender"], dateAdded:"2026-08-01" },
  { id:"pokopia", name:"Pokémon Pokopia", icon:"⌂", description:"Cosy town ideas, garden sketches and build-day checklists.", status:"Current obsession", accent:"sage", notes:"Concept plans live in the Build Book.", tools:["Build notebook", "Material checklist"], dateAdded:"2026-08-01" },
  { id:"gaming", name:"Cosy gaming", icon:"✦", description:"Places to potter, decorate, collect and unwind.", status:"Favourite", accent:"blue", notes:"Replace with Sim’s favourite games and moments.", tools:["Wish list", "Cosy evening"], dateAdded:"2026-08-01" },
  { id:"projects", name:"Creative projects", icon:"✂", description:"Small things worth making just because they feel fun.", status:"On my list", accent:"peach", notes:"A flexible home for future crafts.", tools:["Idea scraps", "Weekend time"], dateAdded:"2026-08-01" },
  { id:"shows", name:"Favourite shows", icon:"☾", description:"Comfort watches and stories worth returning to.", status:"Add Sim’s picks", accent:"periwinkle", notes:"Placeholder category — no favourites assumed.", tools:["Watch list"], dateAdded:"2026-08-01" },
  { id:"cafes", name:"Café corners", icon:"♨", description:"Good cake, warm cups and lovely little corners to remember.", status:"On my list", accent:"peach", notes:"Add photos and favourite orders later.", tools:["Saved places", "Favourite order"], dateAdded:"2026-08-01" },
  { id:"music", name:"Music for making", icon:"♪", description:"The soft soundtrack behind colouring and building.", status:"Add a playlist", accent:"butter", notes:"Placeholder ready for Sim’s real listening.", tools:["Cosy playlist"], dateAdded:"2026-08-01" },
]);

export const colouringTechniques = /** @type {Technique[]} */ ([
  { id:"flat", name:"Smooth flat colour", difficulty:"Starter", tools:["Alcohol marker", "Marker-friendly paper"], steps:["Choose one light-to-mid tone.", "Work in small overlapping strokes.", "Keep a wet edge until the shape is filled."], tips:["Move steadily and revisit only while the ink is damp."], mistakes:["Letting one area dry before joining the next can leave hard seams."], palette:["#cbb8e8","#f0cad5","#f7dda0"], notes:"Editable example — record the paper and nib that feel best.", favourite:true, dateTried:null, confidence:2, related:["blend","streaks"] },
  { id:"blend", name:"Two-colour blend", difficulty:"Growing", tools:["Two nearby hues", "Scrap paper"], steps:["Lay down the lighter colour.", "Add the darker tone where shadow belongs.", "Return with the lighter marker to soften the join."], tips:["Test how the two inks react before colouring the page."], mistakes:["Using very distant hues without a bridge colour can create a harsh band."], palette:["#b6a0db","#d6b9e6","#f3d4da"], notes:"Editable example — add Sim’s favourite pairing.", favourite:true, dateTried:null, confidence:2, related:["flat","shadow"] },
  { id:"shadow", name:"Gentle shadow placement", difficulty:"Growing", tools:["Base colour", "Slightly deeper companion tone"], steps:["Pick one imaginary light direction.", "Place shadow opposite the light.", "Add small contact shadows where objects meet."], tips:["Keep the first pass simple: one light direction is enough."], mistakes:["Scattering shadows on every edge makes the form harder to read."], palette:["#d9caed","#9c82be","#665079"], notes:"Editable example — note which lighting direction feels intuitive.", favourite:false, dateTried:null, confidence:1, related:["blend","highlight"] },
  { id:"highlight", name:"White-pen highlights", difficulty:"Starter", tools:["Fully dry marker layer", "Opaque white pen"], steps:["Wait for the alcohol ink to dry.", "Choose a few brightest edges.", "Add tiny lines or dots, then stop."], tips:["A handful of marks often looks shinier than covering every edge."], mistakes:["Applying while the base is wet can muddy the white pen."], palette:["#afc6e4","#d9e6f1","#fffdf7"], notes:"Editable example — add the pen that works reliably.", favourite:true, dateTried:null, confidence:3, related:["shadow","glass"] },
  { id:"texture", name:"Soft fabric texture", difficulty:"Confident", tools:["Base marker", "Fine nib", "White pen (optional)"], steps:["Fill a smooth base.", "Add short strokes that follow the fabric form.", "Vary spacing instead of adding more colours."], tips:["Keep texture quieter in shadow and brighter near highlights."], mistakes:["Identical marks can make soft fabric look rigid."], palette:["#e8c9d2","#caa9bd","#8d718d"], notes:"Editable example content.", favourite:false, dateTried:null, confidence:1, related:["shadow","highlight"] },
  { id:"foliage", name:"Layered foliage", difficulty:"Growing", tools:["Two or three greens", "Fine or brush nib"], steps:["Block in the lightest green.", "Cluster mid-tone leaf marks.", "Tuck the deepest green beneath overlaps."], tips:["Leave small gaps of the light base to keep the plant airy."], mistakes:["Evenly distributing every tone can flatten the foliage."], palette:["#cedbbd","#9fb58e","#60765b"], notes:"Useful for original garden studies and build sketches.", favourite:false, dateTried:null, confidence:2, related:["shadow","texture"] },
  { id:"glass", name:"Simple glass effects", difficulty:"Confident", tools:["Pale blue-grey", "Background colour", "White pen"], steps:["Let some background colour show through.", "Add a narrow cool shadow.", "Finish with one crisp white reflection."], tips:["Glass is often defined by its edges and reflections, not a heavy fill."], mistakes:["Colouring the whole object evenly can make it look opaque."], palette:["#d8e7ed","#adcada","#ffffff"], notes:"Editable example content.", favourite:false, dateTried:null, confidence:1, related:["highlight","shadow"] },
  { id:"streaks", name:"Avoiding streaks", difficulty:"Starter", tools:["Broad nib", "Marker-friendly paper", "Scrap sheet"], steps:["Use the broad face of the nib.", "Overlap each pass slightly.", "Finish a small region before moving on."], tips:["Rotate the page so the stroke stays comfortable."], mistakes:["Scrubbing dry areas with repeated strokes may roughen the paper."], palette:["#e7d8f1","#cbb8e8","#aa8fc8"], notes:"Editable example — paper choice changes the result.", favourite:true, dateTried:null, confidence:3, related:["flat","blend"] },
]);

export const palettePresets = /** @type {PalettePreset[]} */ ([
  { id:"daydream", name:"Lavender Daydream", mood:"gentle & airy", colours:["#8f75ad","#baa6d4","#ddcfee","#f3d5dc","#f5e4ae"] },
  { id:"lilac-evening", name:"Cosy Lilac Evening", mood:"soft & dusky", colours:["#6f5a86","#9d86b4","#c8b6d9","#dfcad8","#f6e8d5"] },
  { id:"bakery", name:"Pastel Bakery", mood:"warm & sweet", colours:["#9475a7","#d8afd0","#efc3a8","#f1d796","#fff0d8"] },
  { id:"spring", name:"Soft Spring Garden", mood:"fresh & floral", colours:["#80659c","#b6a3d1","#b8c9aa","#d7deb7","#efc8d2"] },
  { id:"sunset", name:"Peach & Lavender Sunset", mood:"glowy & calm", colours:["#765b90","#b49acb","#e8b9bd","#f1c3a5","#f5d89e"] },
  { id:"morning", name:"Powder Blue Morning", mood:"cool & quiet", colours:["#796497","#aeb9df","#bed7e4","#dce8e9","#f7e8c7"] },
  { id:"cottage", name:"Sage Cottage", mood:"earthy & soft", colours:["#76608e","#b6a6cb","#9fb596","#cbd5b3","#efe0bd"] },
  { id:"berry", name:"Berry Milkshake", mood:"creamy & rich", colours:["#76516f","#a9789b","#d4a5bd","#efcad6","#f7e7db"] },
  { id:"winter", name:"Winter Pastels", mood:"frosted & light", colours:["#776690","#aeb7d8","#c7dbe4","#e5dfec","#f9f1e5"] },
  { id:"picnic", name:"Storybook Picnic", mood:"cheerful & mellow", colours:["#816598","#c0a9d6","#b7caa6","#eed794","#ecc2b2"] },
]);

export const colouringGallery = /** @type {GalleryItem[]} */ ([
  { id:"lavender-window", title:"Lavender window", book:"Original sample placeholder", markerSet:"Add Sim’s marker set", techniques:["Smooth flat colour","White-pen highlights"], palette:["#8f75ad","#cbb8e8","#b8c9aa"], completed:null, notes:"Replace this abstract sample with Sim’s own photo and details.", favourite:true, art:"window" },
  { id:"tea-shelf", title:"Tea shelf", book:"Original sample placeholder", markerSet:"Add Sim’s marker set", techniques:["Shadow placement","Wood texture"], palette:["#745b91","#efc3a8","#f2d98c"], completed:null, notes:"Original CSS composition — no colouring-book artwork is embedded.", favourite:false, art:"shelf" },
  { id:"garden-post", title:"Garden post", book:"Original sample placeholder", markerSet:"Add Sim’s marker set", techniques:["Layered foliage","Two-colour blend"], palette:["#aa8fc8","#b8c9aa","#edc5d0"], completed:null, notes:"A neutral frame until a real finished page is supplied.", favourite:false, art:"garden" },
]);

export const pokopiaBuilds = /** @type {ConceptBuild[]} */ ([
  {
    id:"lavender-garden", name:"Lavender picnic meadow", theme:"Floral retreat", difficulty:"Gentle", location:"An open, grassy area", footprint:"Small · roughly 8 × 10 spaces", time:"One relaxed play session", status:"Concept",
    description:"A quiet oval picnic spot ringed by purple flowers, soft paths and two little resting corners.", palette:["#8f75ad","#c9b6e4","#b8c9aa","#f2d98c"],
    materials:[{id:"path",name:"Path pieces",category:"Structure",required:18},{id:"seating",name:"Seats or cushions",category:"Furniture",required:4},{id:"table",name:"Low table",category:"Furniture",required:1},{id:"purple-flowers",name:"Purple flowers",category:"Plants",required:12},{id:"greenery",name:"Soft greenery",category:"Plants",required:8},{id:"lamps",name:"Warm lights",category:"Details",required:4}],
    decorations:["Picnic food arrangement","A small sign","One playful focal object"],
    stages:[
      {title:"Choose & clear",copy:"Find a calm open patch and keep one natural feature worth framing.",materials:[],diagram:"clear"},
      {title:"Mark the footprint",copy:"Trace an 8 × 10 oval with temporary path pieces.",materials:["6 path pieces"],diagram:"footprint"},
      {title:"Shape the centre",copy:"Fill a loose inner path and leave a cream-sized clearing for the picnic.",materials:["12 path pieces"],diagram:"structure"},
      {title:"Plant the edges",copy:"Cluster flowers unevenly and soften three corners with greenery.",materials:["12 purple flowers","8 soft greenery"],diagram:"landscape"},
      {title:"Place the useful pieces",copy:"Set the table first, then keep a comfortable route to every seat.",materials:["1 low table","4 seats or cushions"],diagram:"function"},
      {title:"Add tiny stories",copy:"Place lights, a sign and a single playful focal object.",materials:["4 warm lights"],diagram:"details"},
      {title:"Take a slow lap",copy:"Walk the whole edge, remove anything crowded and save a photo angle.",materials:[],diagram:"finish"},
    ], notes:"Original inspiration plan. Exact objects, recipes, grid scale and quantities must be confirmed in-game.",
  },
  {
    id:"forest-tea", name:"Forest tea garden", theme:"Woodland café", difficulty:"Patient", location:"Woodland edge or shady clearing", footprint:"Medium · roughly 12 × 12 spaces", time:"Two play sessions", status:"Concept",
    description:"A mossy tea terrace with curved seating pockets and a tiny service nook.", palette:["#6f5a86","#9fb596","#cbd5b3","#efc3a8"],
    materials:[{id:"wood-path",name:"Wood or earthy path pieces",category:"Structure",required:24},{id:"tea-tables",name:"Small tables",category:"Furniture",required:3},{id:"chairs",name:"Chairs",category:"Furniture",required:6},{id:"shrubs",name:"Shrubs or ferns",category:"Plants",required:14},{id:"lights",name:"Warm lights",category:"Details",required:6}],
    decorations:["Tea-service objects","Woodland sign","Small water detail"], stages:[], notes:"Original concept; all materials and quantities are estimates to confirm in-game.",
  },
  {
    id:"berry-bakery", name:"Cosy berry bakery", theme:"Village shop", difficulty:"Patient", location:"Near a village path", footprint:"Medium · roughly 10 × 14 spaces", time:"Two to three sessions", status:"Concept",
    description:"A blush-and-cream bakery frontage with berry planters and a sunny tasting table.", palette:["#765b90","#d4a5bd","#efc3a8","#f2d98c"],
    materials:[{id:"walls",name:"Wall or divider pieces",category:"Structure",required:18},{id:"counters",name:"Counters",category:"Furniture",required:3},{id:"display",name:"Display objects",category:"Furniture",required:6},{id:"berry-plants",name:"Berry-like plants",category:"Plants",required:10},{id:"signage",name:"Signs and lights",category:"Details",required:5}],
    decorations:["Outdoor tasting table","Menu board","Crate arrangement"], stages:[], notes:"Original concept; object availability, recipes and quantities are not verified.",
  },
  {
    id:"reading-nook", name:"Riverside reading nook", theme:"Quiet waterside", difficulty:"Gentle", location:"A safe stretch beside water", footprint:"Small · roughly 7 × 9 spaces", time:"One session", status:"Concept",
    description:"One reading chair, one tiny library shelf and a view that stays mostly untouched.", palette:["#80659c","#b8d5e6","#b8c9aa","#fff8e9"],
    materials:[{id:"deck",name:"Deck or path pieces",category:"Structure",required:14},{id:"chair",name:"Comfortable seat",category:"Furniture",required:1},{id:"books",name:"Book-like decorations",category:"Details",required:4},{id:"plants",name:"Waterside plants",category:"Plants",required:7},{id:"lamp",name:"Reading light",category:"Details",required:1}],
    decorations:["Small table","Warm drink prop","Simple sign"], stages:[], notes:"Original inspiration only. Confirm safe placement and available objects in-game.",
  },
  {
    id:"greenhouse", name:"Pastel greenhouse", theme:"Growing room", difficulty:"Ambitious", location:"Bright garden plot", footprint:"Large · roughly 14 × 16 spaces", time:"Several sessions", status:"Concept",
    description:"A powder-blue and sage growing space organised around a generous central potting table.", palette:["#745b91","#b8d5e6","#b8c9aa","#f2d98c"],
    materials:[{id:"frame",name:"Frame or wall pieces",category:"Structure",required:36},{id:"planters",name:"Planters",category:"Furniture",required:12},{id:"worktable",name:"Work table",category:"Furniture",required:2},{id:"plants-mix",name:"Mixed plants",category:"Plants",required:24},{id:"greenhouse-lights",name:"Lights",category:"Details",required:8}],
    decorations:["Watering area","Seed shelf","Resting stool"], stages:[], notes:"Original concept build; exact structures, recipes and quantities require in-game confirmation.",
  },
]);

export const pokopiaFacts = [
  "Pokémon Pokopia is a life-simulation game for Nintendo Switch 2 focused on crafting, creating, building and gardening.",
  "The player takes the role of a Ditto restoring a withered world alongside Pokémon friends.",
  "Official examples show learned moves changing the environment, including Leafage for plants, Rock Smash for walls, Surf for water and Glide for mountains.",
  "Official material confirms furniture crafting, home building, visits and photo-taking; this prototype does not claim specific recipes.",
];

export const externalSources = [
  { label:"Nintendo UK — Pokémon Pokopia game page", url:"https://www.nintendo.com/en-gb/Games/Nintendo-Switch-2-games/Pokemon-Pokopia-2915161.html", verified:"Platform, release date, building/crafting/gardening overview and named move examples." },
  { label:"Official Pokémon Pokopia site", url:"https://pokopia.pokemon.com/en-us", verified:"Ditto premise, building a paradise, Leafage and Water Gun examples." },
];

export const emptyJournalEntry = {
  name:"", status:"idea", notes:"", materialsProgress:0, inspiration:"", completionDate:"", palette:"Lavender Daydream", nextAction:"",
};
