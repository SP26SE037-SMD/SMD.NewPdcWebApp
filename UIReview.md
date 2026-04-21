## Giao diện của curriculum info

<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Major Proposal Review - Curriculum Info</title>
<!-- Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<!-- Icons -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Scripts -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-fixed-dim": "#edefac",
                    "surface-container-lowest": "#ffffff",
                    "outline": "#767c7e",
                    "tertiary-container": "#fcfeb9",
                    "primary-fixed": "#b1f0ce",
                    "on-tertiary-fixed": "#4d501d",
                    "inverse-primary": "#beffdc",
                    "primary-container": "#b1f0ce",
                    "tertiary-dim": "#545622",
                    "primary-fixed-dim": "#a3e2c0",
                    "surface-bright": "#f8f9fa",
                    "tertiary": "#60622d",
                    "primary-dim": "#1f5e44",
                    "on-primary-container": "#1d5c42",
                    "tertiary-fixed": "#fcfeb9",
                    "on-tertiary-fixed-variant": "#6a6d37",
                    "on-background": "#2d3335",
                    "on-secondary-fixed": "#344331",
                    "on-secondary-container": "#465643",
                    "error-container": "#fd795a",
                    "surface": "#f8f9fa",
                    "secondary-fixed": "#d5e8ce",
                    "inverse-on-surface": "#9b9d9e",
                    "inverse-surface": "#0c0f10",
                    "error": "#a73b21",
                    "surface-container-highest": "#dee3e6",
                    "on-secondary": "#ecfee4",
                    "surface-container-low": "#f1f4f5",
                    "secondary": "#53634f",
                    "on-tertiary-container": "#60622d",
                    "surface-tint": "#2d6a4f",
                    "surface-dim": "#d5dbdd",
                    "on-primary-fixed-variant": "#29664c",
                    "surface-variant": "#dee3e6",
                    "on-primary": "#e6ffee",
                    "background": "#f8f9fa",
                    "primary": "#2d6a4f",
                    "surface-container": "#ebeef0",
                    "outline-variant": "#adb3b5",
                    "on-error-container": "#6e1400",
                    "on-secondary-fixed-variant": "#50604c",
                    "secondary-dim": "#475744",
                    "on-surface": "#2d3335",
                    "on-tertiary": "#fbfdb9",
                    "error-dim": "#791903",
                    "on-error": "#fff7f6",
                    "on-surface-variant": "#5a6062",
                    "surface-container-high": "#e5e9eb",
                    "secondary-fixed-dim": "#c7dac1",
                    "secondary-container": "#d5e8ce",
                    "on-primary-fixed": "#014931"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans"],
                    "body": ["Inter"],
                    "label": ["Inter"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            box-shadow: 0px 4px 20px rgba(45, 51, 53, 0.04), 0px 2px 8px rgba(45, 51, 53, 0.08);
        }
        body {
            font-family: 'Inter', sans-serif;
        }
        h1, h2, h3, .brand-font {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
    </style>
</head>
<body class="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none flex items-center justify-between px-8 py-3 w-full font-plus-jakarta-sans tracking-tight">
<div class="flex items-center gap-8">
<span class="text-xl font-bold tracking-tighter text-emerald-800 dark:text-emerald-200">Veridian Review</span>
<div class="hidden md:flex gap-6">
<a class="text-emerald-700 dark:text-emerald-400 font-semibold transition-colors" href="#">Dashboard</a>
<a class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-2 py-1 rounded" href="#">Archive</a>
</div>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center bg-surface-container-low px-4 py-1.5 rounded-full">
<span class="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
<input class="bg-transparent border-none focus:ring-0 text-sm w-48 p-0" placeholder="Search proposals..." type="text"/>
</div>
<button class="material-symbols-outlined text-on-surface-variant hover:bg-slate-50 p-2 rounded-full transition-colors">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:bg-slate-50 p-2 rounded-full transition-colors">settings</button>
<div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs border border-primary/10">
                AD
            </div>
</div>
</nav>
<!-- SideNavBar -->
<aside class="fixed left-0 h-full w-64 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 gap-4 pt-20 border-r-0 font-plus-jakarta-sans text-sm">
<div class="px-8 mb-6">
<h2 class="text-lg font-black text-emerald-900 dark:text-emerald-100">Veridian Admin</h2>
<p class="text-xs text-on-surface-variant opacity-70">Academic Oversight</p>
</div>
<nav class="flex flex-col gap-1">
<a class="flex items-center gap-3 text-slate-600 dark:text-slate-400 ml-4 pl-4 py-3 hover:text-emerald-600 dark:hover:text-emerald-300 transition-transform translate-x-0 hover:translate-x-1" href="#">
<span class="material-symbols-outlined" data-icon="analytics">analytics</span>
<span>Strategic Management</span>
</a>
<a class="flex items-center gap-3 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold rounded-l-full ml-4 pl-4 py-3 shadow-sm" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span>Curriculum Proposals</span>
</a>
</nav>
<div class="mt-auto px-8">
<button class="w-full bg-primary text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-sm">add</span>
                New Proposal
            </button>
</div>
</aside>
<!-- Main Canvas -->
<main class="ml-64 pt-24 px-12 pb-12 min-h-screen">
<!-- Editorial Header -->
<header class="mb-12 max-w-5xl">
<div class="flex items-center gap-2 text-primary font-semibold mb-2">
<span class="material-symbols-outlined text-lg">school</span>
<span class="text-sm tracking-widest uppercase">Proposal Review</span>
</div>
<h1 class="text-5xl font-extrabold tracking-tighter text-on-surface mb-4">B.Sc. CS - Fall 2024</h1>
<div class="flex items-center gap-6 text-on-surface-variant font-medium">
<span class="flex items-center gap-2">
<span class="material-symbols-outlined text-emerald-600">history</span>
                    Version 2.4.1
                </span>
<span class="flex items-center gap-2">
<span class="material-symbols-outlined text-emerald-600">database</span>
                    120 Credits Total
                </span>
<span class="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold uppercase tracking-wider">Under Review</span>
</div>
</header>
<!-- Sub-navigation Tabs -->
<div class="flex gap-12 mb-8 border-b-0 relative">
<button class="pb-4 text-on-surface-variant font-semibold hover:text-primary transition-colors relative">
                Overview
            </button>
<button class="pb-4 text-primary font-bold transition-colors relative">
                Curriculum Info
                <div class="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>
</button>
<button class="pb-4 text-on-surface-variant font-semibold hover:text-primary transition-colors relative">
                Course Map
            </button>
<button class="pb-4 text-on-surface-variant font-semibold hover:text-primary transition-colors relative">
                Resource Impact
            </button>
</div>
<!-- Bento Grid Content -->
<div class="grid grid-cols-12 gap-8 max-w-6xl">
<!-- Metadata Bento Box -->
<div class="col-span-12 md:col-span-5 flex flex-col gap-8">
<section class="bg-surface-container-lowest p-8 rounded-xl editorial-shadow">
<h3 class="text-xl font-bold mb-6 text-emerald-900 flex items-center gap-2">
<span class="material-symbols-outlined">info</span>
                        Core Specifications
                    </h3>
<div class="space-y-6">
<div class="group">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Academic Department</label>
<p class="text-lg font-medium text-on-surface">School of Computer Science &amp; Engineering</p>
</div>
<div class="group">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Degree Level</label>
<p class="text-lg font-medium text-on-surface">Undergraduate (Baccalaureate)</p>
</div>
<div class="group">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Effective Term</label>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary-dim">calendar_today</span>
<p class="text-lg font-medium text-on-surface">Autumn 2024</p>
</div>
</div>
</div>
</section>
<!-- Status Card -->
<section class="bg-emerald-900 text-white p-8 rounded-xl editorial-shadow overflow-hidden relative">
<div class="relative z-10">
<h3 class="text-lg font-bold mb-2">Review Status</h3>
<p class="text-emerald-100 text-sm mb-6 opacity-80 leading-relaxed">Current phase: Academic Senate Subcommittee for Undergraduate Curriculum.</p>
<div class="flex items-center gap-4">
<div class="flex -space-x-3">
<div class="w-10 h-10 rounded-full border-2 border-emerald-900 bg-slate-300 flex items-center justify-center text-slate-800 text-xs font-bold">JD</div>
<div class="w-10 h-10 rounded-full border-2 border-emerald-900 bg-slate-400 flex items-center justify-center text-slate-800 text-xs font-bold">MR</div>
<div class="w-10 h-10 rounded-full border-2 border-emerald-900 bg-slate-200 flex items-center justify-center text-slate-800 text-xs font-bold">PL</div>
</div>
<span class="text-xs font-medium text-emerald-200">+4 Reviewers</span>
</div>
</div>
<span class="material-symbols-outlined absolute -bottom-6 -right-6 text-emerald-800 text-9xl opacity-20 rotate-12" style="font-variation-settings: 'FILL' 1;">verified</span>
</section>
</div>
<!-- PLO Section (Main Content) -->
<div class="col-span-12 md:col-span-7">
<section class="bg-surface-container-low p-1 rounded-xl">
<div class="bg-surface-container-lowest p-8 rounded-lg editorial-shadow h-full">
<div class="flex justify-between items-center mb-8">
<h3 class="text-2xl font-bold tracking-tight text-emerald-900">Program Learning Outcomes</h3>
<button class="text-primary hover:bg-primary-container px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-sm">edit</span> Edit
                            </button>
</div>
<div class="space-y-8">
<!-- PLO 1 -->
<div class="flex gap-6 group">
<div class="flex-shrink-0 w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-black text-lg">1</div>
<div>
<h4 class="font-bold text-on-surface mb-2 leading-snug">Algorithmic Foundations</h4>
<p class="text-on-surface-variant text-sm leading-relaxed">Students will demonstrate the ability to analyze complex computing problems and apply principles of computing and other relevant disciplines to identify solutions.</p>
</div>
</div>
<!-- PLO 2 -->
<div class="flex gap-6 group">
<div class="flex-shrink-0 w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-black text-lg">2</div>
<div>
<h4 class="font-bold text-on-surface mb-2 leading-snug">Software Engineering Professionalism</h4>
<p class="text-on-surface-variant text-sm leading-relaxed">Design, implement, and evaluate a computing-based solution to meet a given set of computing requirements in the context of the program’s discipline.</p>
</div>
</div>
<!-- PLO 3 -->
<div class="flex gap-6 group">
<div class="flex-shrink-0 w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-black text-lg">3</div>
<div>
<h4 class="font-bold text-on-surface mb-2 leading-snug">Collaborative Systems Design</h4>
<p class="text-on-surface-variant text-sm leading-relaxed">Function effectively as a member or leader of a team engaged in activities appropriate to the program’s discipline with effective communication strategies.</p>
</div>
</div>
<!-- PLO 4 -->
<div class="flex gap-6 group">
<div class="flex-shrink-0 w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-black text-lg">4</div>
<div>
<h4 class="font-bold text-on-surface mb-2 leading-snug">Ethical Responsibility</h4>
<p class="text-on-surface-variant text-sm leading-relaxed">Recognize professional responsibilities and make informed judgments in computing practice based on legal and ethical principles.</p>
</div>
</div>
</div>
<div class="mt-12 pt-8 border-t-0 bg-surface-container-low/30 -mx-8 -mb-8 p-8 flex justify-center">
<button class="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold text-sm transition-colors">
<span class="material-symbols-outlined">expand_more</span>
                                View All 8 Learning Outcomes
                            </button>
</div>
</div>
</section>
</div>
</div>
</main>
<!-- FAB Suppression: This is a details/review screen, so FAB is suppressed per rules. -->
</body></html>



## Giao diện matrix mapping 
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Mapping Matrix - Academic Review Portal</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8f9fa;
        }
        .font-headline {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-bright": "#f8f9fa",
                      "on-primary-fixed-variant": "#29664c",
                      "surface-container-high": "#e5e9eb",
                      "surface-container-lowest": "#ffffff",
                      "error-dim": "#791903",
                      "inverse-surface": "#0c0f10",
                      "secondary-fixed-dim": "#c7dac1",
                      "surface-container-low": "#f1f4f5",
                      "on-surface-variant": "#5a6062",
                      "inverse-primary": "#beffdc",
                      "on-tertiary-fixed": "#4d501d",
                      "on-tertiary-fixed-variant": "#6a6d37",
                      "secondary-fixed": "#d5e8ce",
                      "on-primary-fixed": "#014931",
                      "on-background": "#2d3335",
                      "on-surface": "#2d3335",
                      "error-container": "#fd795a",
                      "secondary-dim": "#475744",
                      "on-error-container": "#6e1400",
                      "on-tertiary": "#fbfdb9",
                      "secondary": "#53634f",
                      "tertiary-fixed-dim": "#edefac",
                      "primary-container": "#b1f0ce",
                      "on-secondary-fixed": "#344331",
                      "on-secondary-container": "#465643",
                      "tertiary-dim": "#545622",
                      "outline": "#767c7e",
                      "on-tertiary-container": "#60622d",
                      "background": "#f8f9fa",
                      "error": "#a73b21",
                      "surface-dim": "#d5dbdd",
                      "tertiary": "#60622d",
                      "on-primary-container": "#1d5c42",
                      "on-primary": "#e6ffee",
                      "surface": "#f8f9fa",
                      "tertiary-fixed": "#fcfeb9",
                      "tertiary-container": "#fcfeb9",
                      "surface-tint": "#2d6a4f",
                      "primary-dim": "#1f5e44",
                      "surface-variant": "#dee3e6",
                      "surface-container-highest": "#dee3e6",
                      "on-error": "#fff7f6",
                      "outline-variant": "#adb3b5",
                      "on-secondary": "#ecfee4",
                      "primary-fixed": "#b1f0ce",
                      "primary-fixed-dim": "#a3e2c0",
                      "inverse-on-surface": "#9b9d9e",
                      "primary": "#2d6a4f",
                      "surface-container": "#ebeef0",
                      "secondary-container": "#d5e8ce",
                      "on-secondary-fixed-variant": "#50604c"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "fontFamily": {
                      "headline": ["Plus Jakarta Sans"],
                      "body": ["Inter"],
                      "label": ["Inter"]
              }
            }
          }
        }
    </script>
</head>
<body class="bg-surface text-on-surface">
<div class="flex h-screen overflow-hidden">
<!-- Sidebar Navigation (Shared Logic) -->
<aside class="w-72 flex-shrink-0 bg-surface-container-low border-r border-outline-variant/20 flex flex-col">
<div class="p-6 flex items-center gap-3">
<div class="size-8 bg-primary text-on-primary flex items-center justify-center rounded-lg">
<svg class="size-6" fill="none" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
</svg>
</div>
<h2 class="font-headline text-lg font-bold leading-tight tracking-tight text-on-surface">Review Portal</h2>
</div>
<nav class="flex-1 px-4 py-2 space-y-1">
<div class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
<span class="material-symbols-outlined">gas_meter</span>
<p class="text-sm font-medium">Dashboard</p>
</div>
<div class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
<span class="material-symbols-outlined">school</span>
<p class="text-sm font-medium">Program Management</p>
</div>
<div class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
<span class="material-symbols-outlined">verified</span>
<p class="text-sm font-medium">Accreditation</p>
</div>
<div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-container text-on-primary-container">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">grid_view</span>
<p class="text-sm font-medium">Course Mapping</p>
</div>
<div class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
<span class="material-symbols-outlined">settings</span>
<p class="text-sm font-medium">Settings</p>
</div>
</nav>
<div class="p-4 mt-auto">
<div class="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">System Status</p>
<div class="flex items-center gap-2">
<div class="size-2 rounded-full bg-primary"></div>
<span class="text-xs text-on-surface">All Nodes Active</span>
</div>
</div>
</div>
</aside>
<!-- Main Content -->
<main class="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
<!-- Top Navigation Bar (Shared Style) -->
<header class="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
<div class="flex items-center gap-4">
<div>
<h1 class="font-headline text-xl font-bold text-on-surface">Computer Science</h1>
<p class="text-sm text-on-surface-variant">Faculty of Science • Mapping Matrix</p>
</div>
</div>
<div class="flex items-center gap-6">
<div class="relative group">
<span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
<input class="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all" placeholder="Search matrix..." type="text"/>
</div>
<div class="flex items-center gap-2">
<button class="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant">
<span class="material-symbols-outlined">account_circle</span>
</button>
</div>
</div>
</header>
<!-- Editorial Breadcrumb/Tab Navigation -->
<div class="px-8 mt-8">
<div class="flex gap-8 border-b border-outline-variant/20">
<button class="pb-4 text-sm font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all">Major Overview</button>
<button class="pb-4 text-sm font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all">Curriculum Info</button>
<button class="pb-4 text-sm font-bold text-primary border-b-2 border-primary transition-all">Mapping Matrix</button>
<button class="pb-4 text-sm font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all">Semester Structure</button>
</div>
</div>
<!-- Content Body -->
<div class="p-8 space-y-8">
<!-- Header Section with Stats -->
<section class="flex flex-col lg:flex-row gap-8">
<div class="flex-1">
<h2 class="font-headline text-4xl font-black text-on-surface tracking-tight mb-3">CLO to PLO Mapping</h2>
<p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
                        Assess the alignment integrity between Course Learning Outcomes and Program Goals. This matrix validates that the curriculum effectively supports professional competency requirements.
                    </p>
</div>
<!-- Circular Progress Widget -->
<div class="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-6 min-w-[320px]">
<div class="relative size-24">
<svg class="size-full -rotate-90" viewbox="0 0 36 36">
<circle class="stroke-surface-container-high" cx="18" cy="18" fill="none" r="16" stroke-width="3"></circle>
<circle class="stroke-primary" cx="18" cy="18" fill="none" r="16" stroke-dasharray="100" stroke-dashoffset="15" stroke-linecap="round" stroke-width="3"></circle>
</svg>
<div class="absolute inset-0 flex items-center justify-center">
<span class="font-headline text-2xl font-bold text-primary">85%</span>
</div>
</div>
<div>
<h4 class="font-headline font-bold text-on-surface">Alignment Score</h4>
<p class="text-xs text-on-surface-variant mb-2">Current matrix health</p>
<span class="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase rounded-md tracking-wider">High Alignment</span>
</div>
</div>
</section>
<!-- Table Controls & Legend -->
<div class="flex flex-wrap items-center justify-between gap-4">
<div class="flex items-center gap-6">
<div class="flex items-center gap-2">
<div class="size-3 rounded-sm bg-primary"></div>
<span class="text-xs font-semibold text-on-surface-variant">High Correlation</span>
</div>
<div class="flex items-center gap-2">
<div class="size-3 rounded-sm bg-primary-container border border-primary/20"></div>
<span class="text-xs font-semibold text-on-surface-variant">Medium Correlation</span>
</div>
<div class="flex items-center gap-2">
<div class="size-3 rounded-sm bg-surface-container-high"></div>
<span class="text-xs font-semibold text-on-surface-variant">Low/None</span>
</div>
</div>
<div class="flex gap-2">
<button class="px-4 py-2 bg-surface-container-highest text-on-surface text-sm font-bold rounded-lg hover:bg-outline-variant/20 transition-all">Export PDF</button>
<button class="px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-lg hover:bg-primary-dim transition-all flex items-center gap-2">
<span class="material-symbols-outlined text-sm">edit</span> Edit Matrix
                    </button>
</div>
</div>
<!-- The Mapping Matrix Table -->
<div class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low/50">
<th class="p-6 border-b border-outline-variant/20 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider w-1/3">Course Learning Outcomes (CLO)</th>
<th class="p-6 border-b border-outline-variant/20 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">PLO-1<br/><span class="normal-case font-normal block mt-1 text-[10px]">Fundamental Knowledge</span></th>
<th class="p-6 border-b border-outline-variant/20 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">PLO-2<br/><span class="normal-case font-normal block mt-1 text-[10px]">Problem Analysis</span></th>
<th class="p-6 border-b border-outline-variant/20 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">PLO-3<br/><span class="normal-case font-normal block mt-1 text-[10px]">Design Solutions</span></th>
<th class="p-6 border-b border-outline-variant/20 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">PLO-4<br/><span class="normal-case font-normal block mt-1 text-[10px]">Investigation</span></th>
<th class="p-6 border-b border-outline-variant/20 font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">PLO-5<br/><span class="normal-case font-normal block mt-1 text-[10px]">Modern Tools</span></th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<!-- Row 1 -->
<tr class="group hover:bg-surface-container-low/30 transition-colors">
<td class="p-6">
<div class="flex flex-col">
<span class="text-xs font-bold text-primary mb-1">CLO-101</span>
<span class="text-sm font-semibold text-on-surface leading-tight">Data Structures Foundations</span>
<span class="text-xs text-on-surface-variant mt-1 italic">Principles of abstract data types and complexity.</span>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 700;">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-lg">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">—</td>
<td class="p-6 text-center">—</td>
<td class="p-6 text-center">—</td>
</tr>
<!-- Row 2 -->
<tr class="group hover:bg-surface-container-low/30 transition-colors">
<td class="p-6">
<div class="flex flex-col">
<span class="text-xs font-bold text-primary mb-1">CLO-102</span>
<span class="text-sm font-semibold text-on-surface leading-tight">Algorithmic Efficiency</span>
<span class="text-xs text-on-surface-variant mt-1 italic">Big O notation and performance tuning.</span>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 700;">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 700;">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-lg">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">—</td>
<td class="p-6 text-center">—</td>
</tr>
<!-- Row 3 -->
<tr class="group hover:bg-surface-container-low/30 transition-colors">
<td class="p-6">
<div class="flex flex-col">
<span class="text-xs font-bold text-primary mb-1">CLO-103</span>
<span class="text-sm font-semibold text-on-surface leading-tight">Database Systems Architecture</span>
<span class="text-xs text-on-surface-variant mt-1 italic">Relational models and SQL query optimization.</span>
</div>
</td>
<td class="p-6 text-center">—</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-lg">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 700;">check</span>
</div>
</div>
</td>
<td class="p-6 text-center">—</td>
<td class="p-6 text-center">
<div class="flex justify-center">
<div class="size-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-lg">check</span>
</div>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<!-- Reviewer Notes Section (Bottom Panel) -->
<section class="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20">
<div class="flex items-center gap-4 mb-6">
<span class="material-symbols-outlined text-primary">rate_review</span>
<h3 class="font-headline text-xl font-bold text-on-surface">Reviewer Insights &amp; Feedback</h3>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
<div class="lg:col-span-2 space-y-4">
<div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
<div class="flex justify-between items-start mb-4">
<div class="flex items-center gap-3">
<div class="size-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">DR</div>
<div>
<p class="text-sm font-bold text-on-surface">Dr. Elena Rodriguez</p>
<p class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Internal Reviewer • Oct 24, 2023</p>
</div>
</div>
<span class="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded">DRAFT</span>
</div>
<p class="text-sm text-on-surface leading-relaxed italic">
                                "The mapping between CLO-102 and PLO-2 is exceptionally strong. However, we should consider if CLO-103 needs a stronger link to PLO-4 (Investigation) given the project-based nature of the database module this semester."
                            </p>
</div>
<div class="relative">
<textarea class="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px]" placeholder="Add a new reviewer note..."></textarea>
<div class="absolute bottom-4 right-4">
<button class="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-dim transition-all">Post Note</button>
</div>
</div>
</div>
<div class="space-y-6">
<div class="p-4 bg-tertiary-container rounded-xl border border-tertiary/10">
<p class="text-xs font-bold text-on-tertiary-container uppercase tracking-widest mb-3 flex items-center gap-2">
<span class="material-symbols-outlined text-sm">lightbulb</span> Strategic Tip
                            </p>
<p class="text-sm text-on-tertiary-container leading-relaxed">
                                Ensure every PLO is addressed by at least two CLOs to guarantee curriculum redundancy and student success stability.
                            </p>
</div>
<div class="p-4 bg-surface-container-highest rounded-xl">
<h4 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Recent Actions</h4>
<ul class="space-y-3">
<li class="flex gap-3 text-xs">
<span class="material-symbols-outlined text-primary text-sm">check_circle</span>
<span class="text-on-surface-variant">PLO-1 coverage verified by <b>Admin</b></span>
</li>
<li class="flex gap-3 text-xs">
<span class="material-symbols-outlined text-primary text-sm">sync</span>
<span class="text-on-surface-variant">Matrix synced with Curriculum 2024</span>
</li>
</ul>
</div>
</div>
</div>
</section>
</div>
<!-- Footer Spacer -->
<footer class="p-8 text-center border-t border-outline-variant/10">
<p class="text-xs text-on-surface-variant">© 2023 Academic Excellence Systems • Version 4.2.0-Editorial</p>
</footer>
</main>
</div>
</body></html>



## Giao diện sesmester structure
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Academic Atelier - Semester Structure Review</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container": "#ebeef0",
                        "on-primary-fixed-variant": "#29664c",
                        "on-primary-fixed": "#014931",
                        "on-background": "#2d3335",
                        "surface": "#f8f9fa",
                        "on-tertiary-container": "#60622d",
                        "primary-fixed-dim": "#a3e2c0",
                        "on-secondary-container": "#465643",
                        "on-surface": "#2d3335",
                        "error": "#a73b21",
                        "tertiary": "#60622d",
                        "surface-container-highest": "#dee3e6",
                        "secondary-fixed": "#d5e8ce",
                        "background": "#f8f9fa",
                        "primary": "#2d6a4f",
                        "surface-variant": "#dee3e6",
                        "inverse-primary": "#beffdc",
                        "secondary-fixed-dim": "#c7dac1",
                        "surface-bright": "#f8f9fa",
                        "on-secondary": "#ecfee4",
                        "on-primary": "#e6ffee",
                        "inverse-on-surface": "#9b9d9e",
                        "surface-dim": "#d5dbdd",
                        "tertiary-fixed-dim": "#edefac",
                        "secondary-dim": "#475744",
                        "on-error": "#fff7f6",
                        "primary-dim": "#1f5e44",
                        "on-tertiary-fixed-variant": "#6a6d37",
                        "tertiary-container": "#fcfeb9",
                        "outline": "#767c7e",
                        "error-container": "#fd795a",
                        "surface-tint": "#2d6a4f",
                        "error-dim": "#791903",
                        "on-error-container": "#6e1400",
                        "tertiary-dim": "#545622",
                        "tertiary-fixed": "#fcfeb9",
                        "secondary-container": "#d5e8ce",
                        "primary-fixed": "#b1f0ce",
                        "on-secondary-fixed": "#344331",
                        "surface-container-lowest": "#ffffff",
                        "on-surface-variant": "#5a6062",
                        "on-primary-container": "#1d5c42",
                        "secondary": "#53634f",
                        "on-secondary-fixed-variant": "#50604c",
                        "inverse-surface": "#0c0f10",
                        "surface-container-high": "#e5e9eb",
                        "surface-container-low": "#f1f4f5",
                        "on-tertiary": "#fbfdb9",
                        "primary-container": "#b1f0ce",
                        "outline-variant": "#adb3b5",
                        "on-tertiary-fixed": "#4d501d"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "fontFamily": {
                        "headline": ["Plus Jakarta Sans"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    }
                },
            },
        }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .active-tab-indicator {
            position: relative;
        }
        .active-tab-indicator::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: currentColor;
        }
    </style>
</head>
<body class="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
<div class="flex items-center justify-between px-8 h-16 w-full max-w-screen-2xl mx-auto">
<div class="flex items-center gap-8">
<span class="text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">Academic Atelier</span>
<div class="hidden md:flex gap-6 items-center">
<a class="text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700 pb-1 font-medium transition-colors" href="#">Curriculum</a>
<a class="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors" href="#">Advising</a>
<a class="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors" href="#">Resources</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 text-zinc-500 hover:text-emerald-600 transition-colors">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 text-zinc-500 hover:text-emerald-600 transition-colors">
<span class="material-symbols-outlined">settings</span>
</button>
<div class="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden">
<img alt="User profile avatar" class="w-full h-full object-cover" data-alt="portrait of a professional academic advisor with a friendly expression in a brightly lit modern office" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq1QZAZwNUzm46r-jjjT-y6g3XRDJidJJpNJt6Oo0874Yyq0uMas20LAosmyZdZg3aTo0oJ_fjIAKWuBu-Gej6cZrWOP88hRSg4qWtCx8QoKAPunmIKUkI5V7XQIwJeX46vN1iOxPQIMXr9i4IQpD_RVRBhLy_L8nMXSue6aec_1c-6wIdhh2izJROXQeou4cDezCb22wNVUt7Dye4ckP8bJDIlsoeL2xHPvP6m-5lVs_mse0CWAsDDlXh9vpoU_Y0y1dUjpeY3vyd"/>
</div>
</div>
</div>
</nav>
<!-- SideNavBar (Hidden on small screens) -->
<aside class="h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-zinc-50 dark:bg-zinc-950 py-8 gap-4 pt-20 border-r border-surface-container">
<div class="px-6 mb-4">
<div class="flex items-center gap-3 mb-2">
<div class="h-10 w-10 rounded-xl bg-primary-container flex items-center justify-center text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<p class="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Degree Navigator</p>
<p class="text-xs text-on-surface-variant italic">B.S. Computer Science</p>
</div>
</div>
</div>
<nav class="flex flex-col gap-1 pr-4">
<a class="flex items-center gap-3 py-3 px-6 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="text-sm font-medium">Dashboard</span>
</a>
<a class="flex items-center gap-3 py-3 px-6 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 rounded-r-full" href="#">
<span class="material-symbols-outlined">account_tree</span>
<span class="text-sm">Program Map</span>
</a>
<a class="flex items-center gap-3 py-3 px-6 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" href="#">
<span class="material-symbols-outlined">analytics</span>
<span class="text-sm font-medium">Credit Tracker</span>
</a>
<a class="flex items-center gap-3 py-3 px-6 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" href="#">
<span class="material-symbols-outlined">school</span>
<span class="text-sm font-medium">Faculty</span>
</a>
<a class="flex items-center gap-3 py-3 px-6 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="text-sm font-medium">Settings</span>
</a>
</nav>
<div class="mt-auto px-6">
<button class="w-full py-3 bg-white border border-outline-variant text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container-low transition-all active:scale-95 shadow-sm">
                Download Audit
            </button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="lg:ml-64 pt-16 min-h-screen bg-surface">
<div class="max-w-7xl mx-auto px-8 py-10">
<!-- Breadcrumb & Header -->
<div class="mb-8">
<nav class="flex items-center gap-2 text-xs font-semibold tracking-wider text-on-surface-variant uppercase mb-4">
<span>CURRICULUM PROPOSALS</span>
<span class="material-symbols-outlined text-[10px]">chevron_right</span>
<span class="text-primary">CS-2024</span>
</nav>
<div class="flex items-end justify-between">
<div>
<div class="flex items-center gap-4">
<h1 class="text-4xl font-extrabold tracking-tight text-on-surface">Computer Science</h1>
<span class="px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-widest rounded-full">Active Proposal</span>
</div>
<p class="mt-2 text-on-surface-variant font-medium">Reviewing the 2024-2028 academic structure and progression paths.</p>
</div>
</div>
</div>
<!-- Tab Navigation -->
<div class="flex gap-8 mb-10 border-b border-surface-container">
<a class="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors" href="#">Major Overview</a>
<a class="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors" href="#">Curriculum Info</a>
<a class="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors" href="#">Mapping Matrix</a>
<a class="pb-4 text-sm font-bold text-primary active-tab-indicator" href="#">Semester Structure</a>
</div>
<div class="grid grid-cols-12 gap-10">
<!-- Content Area: Academic Structure -->
<div class="col-span-12 xl:col-span-8 space-y-12">
<!-- First Academic Year -->
<section>
<div class="flex items-center gap-4 mb-6">
<div class="h-px flex-1 bg-surface-container-highest"></div>
<h2 class="text-lg font-bold text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">calendar_today</span>
                                First Academic Year
                            </h2>
<div class="h-px flex-1 bg-surface-container-highest"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<!-- Semester 01 -->
<div class="space-y-4">
<h3 class="font-bold text-sm text-on-surface tracking-wide px-2 uppercase">Semester 01</h3>
<div class="bg-surface-container-low rounded-2xl p-4 space-y-3">
<!-- Course Card -->
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">CS101</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Intro to Computing</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">MATH150</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Calculus I</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">ENG101</span>
<span class="text-[10px] font-semibold text-on-surface-variant">3 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Academic Writing</h4>
</div>
</div>
</div>
<!-- Semester 02 -->
<div class="space-y-4">
<h3 class="font-bold text-sm text-on-surface tracking-wide px-2 uppercase">Semester 02</h3>
<div class="bg-surface-container-low rounded-2xl p-4 space-y-3">
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">CS102</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Data Structures</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">PHYS201</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">University Physics I</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">GEN110</span>
<span class="text-[10px] font-semibold text-on-surface-variant">3 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Critical Thinking</h4>
</div>
</div>
</div>
</div>
</section>
<!-- Second Academic Year -->
<section>
<div class="flex items-center gap-4 mb-6">
<div class="h-px flex-1 bg-surface-container-highest"></div>
<h2 class="text-lg font-bold text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
                                Second Academic Year
                            </h2>
<div class="h-px flex-1 bg-surface-container-highest"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<!-- Semester 03 -->
<div class="space-y-4">
<h3 class="font-bold text-sm text-on-surface tracking-wide px-2 uppercase">Semester 03</h3>
<div class="bg-surface-container-low rounded-2xl p-4 space-y-3">
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-primary/20">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">CS210</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Computer Systems</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">MATH210</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Discrete Mathematics</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">ELC-I</span>
<span class="text-[10px] font-semibold text-on-surface-variant">3 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Program Elective I</h4>
</div>
</div>
</div>
<!-- Semester 04 -->
<div class="space-y-4">
<h3 class="font-bold text-sm text-on-surface tracking-wide px-2 uppercase">Semester 04</h3>
<div class="bg-surface-container-low rounded-2xl p-4 space-y-3">
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-primary/20">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">CS220</span>
<span class="text-[10px] font-semibold text-on-surface-variant">4 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Algorithm Design</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">CS230</span>
<span class="text-[10px] font-semibold text-on-surface-variant">3 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Database Systems</h4>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
<div class="flex justify-between items-start mb-1">
<span class="text-[10px] font-bold text-primary tracking-widest">MATH301</span>
<span class="text-[10px] font-semibold text-on-surface-variant">3 Credits</span>
</div>
<h4 class="text-sm font-bold text-on-surface">Linear Algebra</h4>
</div>
</div>
</div>
</div>
</section>
</div>
<!-- Sidebar (Right) -->
<aside class="col-span-12 xl:col-span-4 space-y-6">
<!-- Curriculum Summary Card -->
<div class="bg-surface-container-lowest p-8 rounded-2xl shadow-sm ring-1 ring-black/[0.03]">
<h3 class="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">Curriculum Summary</h3>
<div class="mb-8">
<span class="text-5xl font-extrabold text-on-surface tracking-tighter">128</span>
<span class="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">Total Credits</span>
</div>
<div class="space-y-4 pt-6 border-t border-surface-container">
<h4 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Credit Distribution</h4>
<div class="space-y-3">
<div>
<div class="flex justify-between text-xs font-medium mb-1">
<span class="text-on-surface">Core Courses</span>
<span class="text-on-surface-variant">82 Credits</span>
</div>
<div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 64%;"></div>
</div>
</div>
<div>
<div class="flex justify-between text-xs font-medium mb-1">
<span class="text-on-surface">Electives</span>
<span class="text-on-surface-variant">24 Credits</span>
</div>
<div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-secondary rounded-full" style="width: 18%;"></div>
</div>
</div>
<div>
<div class="flex justify-between text-xs font-medium mb-1">
<span class="text-on-surface">Gen Ed</span>
<span class="text-on-surface-variant">22 Credits</span>
</div>
<div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-on-primary-fixed-variant rounded-full" style="width: 18%;"></div>
</div>
</div>
</div>
</div>
</div>
<!-- Auditor Note Section -->
<div class="bg-surface-container-low p-8 rounded-2xl">
<h3 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-sm">history_edu</span>
                            Auditor Note
                        </h3>
<textarea class="w-full h-32 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-container focus:border-primary transition-all resize-none" placeholder="Add feedback or notes for the faculty..."></textarea>
<div class="mt-2 flex items-center gap-2">
<span class="material-symbols-outlined text-on-surface-variant text-sm">info</span>
<p class="text-[10px] text-on-surface-variant">Visibility: Academic Board and Department Leads</p>
</div>
</div>
<!-- Actions -->
<div class="space-y-3 pt-4">
<button class="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95">
<span class="material-symbols-outlined text-base">task_alt</span>
                            Approve Structure
                        </button>
<button class="w-full py-4 bg-white border border-outline-variant/50 text-error font-bold text-sm flex items-center justify-center gap-2 hover:bg-error-container/10 transition-all active:scale-95 rounded-xl">
<span class="material-symbols-outlined text-base">assignment_return</span>
                            Request Revision
                        </button>
</div>
<!-- Visual Accent -->
<div class="relative h-48 w-full rounded-2xl overflow-hidden mt-8">
<img alt="University campus hallway" class="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" data-alt="a blurred artistic shot of a clean modern glass-walled university campus hallway with soft morning sunlight filtering through" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALTQdRqoJcoaILKvdpRh59pBmVDXpO8-dY84teGw9psA9GBSjv3FjaBo0oBjkTdFGm9XKW593LRAVGB5AnRBCIv7OmIZ9tgGzHZWJSJVxJxOlhS_Ve3rVmui_QQQoLfHCK3D4fFbtxMfj3DKqA8wg-9OcytzPpXXbQvbzChjZiniDuGK7ixOMMI86uS_ZQJAMAdz7Lpnf4rXiCcmSi312da7eEst6KJIPtw3I93wZLxMfp9UNjocZBukIGPdF73G1YxESf-PnGwSSq"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
</div>
</aside>
</div>
</div>
</main>
</body></html>


