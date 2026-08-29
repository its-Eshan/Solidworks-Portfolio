/* =====================================================================
   PROJECTS DATA
   =====================================================================
   This file lists all your projects on the home page and the details
   shown on each project's detail page.

   Default behavior: the website will AUTO-DISCOVER files in each
   project's folder, so you usually don't need to edit this file.

   You DO need to edit this file if you want to:
     - Change a project's title, summary, or details
     - Add a custom list of components or files (instead of auto-discovery)
   ===================================================================== */

const PROJECTS = [
  {
    /* ---------- 1. V6 ENGINE ---------- */
    id: 'v6-engine',
    title: 'V6 Engine',
    summary: 'A complete V6 engine broken down into 25 individual parts in SolidWorks. Induction, valvetrain, rotating assembly, and structural block, each modelled from scratch and exported as .sldprt and .stl.',

    // Static cover image shown on the home page card instead of the
    // animated overview.gif. Path is relative to the project folder.
    cover: 'components/Engine View.png',

    // Engine-specific: shows the piston working animation + exploded
    // view GIFs above the component blocks.
    showWorkingView: true,

    // Reuse the molding component renderer (per-component image, 3D
    // viewer, and downloads). The piston/exploded block is rendered
    // above the sub-projects when showWorkingView is set.
    isMold: true,

    description:
      'A from-scratch V6 engine broken down part by part in SolidWorks. 25 components ' +
      'cover the full powertrain, including induction, valvetrain, rotating assembly, ' +
      'and structural block. Every part is parameterised, fully constrained, and exported ' +
      'as both a SolidWorks part (.sldprt) and a mesh (.stl).',

    highlights: [
      '25 individually modelled parts covering the full V6 powertrain',
      'Correct V6 geometry (60 degree bank, bore, stroke, clearances)',
      'Full valvetrain with rockers, springs, valves, cam shaft, retainers',
      'Induction and exhaust, turbo, filter, manifolds (intake and L/R exhaust)',
      'Every part exported as .sldprt and .stl, ready for review'
    ],

    // Per-component layout: each entry pairs a component image with its
    // STL and SLDPRT file (paths relative to the project folder). The
    // renderer shows each as PNG left, 3D viewer right, SLDPRT/STL cards below.
    //
    // Filename mismatches between PNG and STL/SLDPRT basenames are noted
    // in comments so future edits stay aware of them.
    subProjects: [
      {
        id: 'v6-components',
        title: 'V6 Engine Components',
        description:
          'Every part of the V6 engine, broken out individually with its image, interactive ' +
          '3D viewer, and downloadable source files.',
        // No overviewVideo for V6 Engine — the engine-specific piston and
        // exploded views are rendered separately above via showWorkingView.
        components: [
          { id: 'air-filter',           title: 'Air Filter',           png: 'components/01-Air Filter.png',            stl: 'files/Air Filter.STL',           sld: 'files/Air Filter.SLDPRT'           },
          { id: 'air-turbo',            title: 'Air Turbo',            png: 'components/02-Air Turbo.png',             stl: 'files/Air Turbo.STL',            sld: 'files/Air Turbo.SLDPRT'            },
          { id: 'belt-wheels',          title: 'Belt Wheels',          png: 'components/03-Belt Wheels.png',           stl: 'files/Belt Wheels.STL',          sld: 'files/Belt Wheels.SLDPRT'          },
          { id: 'belt-wheels-2',        title: 'Belt Wheels 2',        png: 'components/04-Belt Wheels 2.png',         stl: 'files/Belt Wheels 2.STL',        sld: 'files/Belt Wheels 2.SLDPRT'        },
          { id: 'cam-shaft-retainer',   title: 'Cam Shaft Retainer',   png: 'components/05-Cam Shaft Retainer.png',    stl: 'files/Cam Shaft Retainer.STL',   sld: 'files/Cam Shaft Retainer.SLDPRT'   },
          { id: 'cam-shaft',            title: 'Cam Shaft',            png: 'components/06-Cam Shaft.png',             stl: 'files/Cam Shaft.STL',            sld: 'files/Cam Shaft.SLDPRT'            },
          { id: 'camshaft-bolt',        title: 'Camshaft Bolt',        png: 'components/07-Camshaft Bolt.png',         stl: 'files/Camshaft Bolt.STL',        sld: 'files/Camshaft Bolt.SLDPRT'        },
          { id: 'camshaft-bushing',     title: 'Camshaft Bushing',     png: 'components/08-Camshaft Bushing.png',      stl: 'files/CrankShaft Bushing.STL',   sld: 'files/CrankShaft Bushing.SLDPRT'   },
          { id: 'crankshaft',           title: 'Crankshaft',           png: 'components/09-Crack Shaft.png',           stl: 'files/Crankshaft.STL',           sld: 'files/Crankshaft.SLDPRT'           },
          { id: 'cylinder-head',        title: 'Cylinder Head',        png: 'components/10-Cylinder Head.png',         stl: 'files/Cylinder Head.STL',        sld: 'files/Cylinder Head.SLDPRT'        },
          { id: 'engine-block',         title: 'Engine Block',         png: 'components/11-Engine Block.png',          stl: 'files/Engine Block.STL',         sld: 'files/Engine Block.SLDPRT'         },
          { id: 'exhaust-manifold-l',   title: 'Exhaust Manifold Left',  png: 'components/12-Exhaust Mainfold Left.png', stl: 'files/Exhaust Manifold Left.STL',  sld: 'files/Exhaust Manifold Left.SLDPRT' },
          { id: 'exhaust-manifold-r',   title: 'Exhaust Manifold Right', png: 'components/13-Exhaust Manifold Right.png',stl: 'files/Exhaust Manifold Right.STL', sld: 'files/Exhaust Manifold Right.SLDPRT'},
          { id: 'front-cover',          title: 'Front Cover',          png: 'components/14-Front Cover.png',           stl: 'files/Front Cover.STL',          sld: 'files/Front Cover.SLDPRT'          },
          { id: 'intake-manifold',      title: 'Intake Manifold',      png: 'components/15-Intake Manifold.png',       stl: 'files/Intake Manifold.STL',      sld: 'files/Intake Manifold.SLDPRT'      },
          { id: 'piston-head',          title: 'Piston Head',          png: 'components/16-Piston Head.png',           stl: 'files/piston Head.STL',          sld: 'files/piston Head.SLDPRT'          },
          { id: 'piston-pin',           title: 'Piston Pin',           png: 'components/17-Piston Pin.png',            stl: 'files/piston pin.STL',           sld: 'files/piston pin.SLDPRT'           },
          { id: 'piston-rod',           title: 'Piston Rod',           png: 'components/18-Piston Rod.png',            stl: 'files/piston Rod.STL',           sld: 'files/piston Rod.SLDPRT'           },
          { id: 'rocker-arm-body',      title: 'Rocker Arm Body',      png: 'components/19-Rocker Arm Body.png',       stl: 'files/Rocker Arm Body.STL',      sld: 'files/Rocker Arm Body.SLDPRT'      },
          { id: 'rocker-arm-pin-2',     title: 'Rocker Arm Pin 2',     png: 'components/20-Rocker Arm Pin 2.png',      stl: 'files/Rocker Arm pin 2.STL',     sld: 'files/Rocker Arm pin 2.SLDPRT'     },
          { id: 'rocker-arm-pin',       title: 'Rocker Arm Pin',       png: 'components/21-Rocker Arm Pin.png',        stl: 'files/Rocker Arm pin.STL',       sld: 'files/Rocker Arm pin.SLDPRT'       },
          { id: 'rocker-arm-wheel',     title: 'Rocker Arm Wheel',     png: 'components/22-Rocker Arm Wheel.png',      stl: 'files/Rocker Arm Wheel.STL',     sld: 'files/Rocker Arm Wheel.SLDPRT'     },
          { id: 'rocker-spring',        title: 'Rocker Spring',        png: 'components/23-Rocker Spring.png',         stl: 'files/Rocker Spring.STL',        sld: 'files/Rocker Spring.SLDPRT'        },
          { id: 'rocker-valve',         title: 'Rocker Valve',         png: 'components/24-Rocker Valve.png',          stl: 'files/Rocker valve.STL',         sld: 'files/Rocker valve.SLDPRT'         },
          { id: 'valve-cover',          title: 'Valve Cover',          png: 'components/25-Valve Cover.png',           stl: 'files/Valves Cover.STL',         sld: 'files/Valves Cover.SLDPRT'         }
        ]
      }
    ]

  },

  {
    /* ---------- 2. BUGGY ---------- */
    id: 'buggy',
    title: 'Buggy',
    summary: 'A buggy modelled in SolidWorks as five individual components. Chassis, wheel, rim, disc brake, and shock absorber are each modelled from scratch and exported for inspection.',

    description:
      'A buggy broken down into its five main components in SolidWorks. Each part is ' +
      'modelled individually from scratch with proper constraints and clean geometry. ' +
      'Every component is exported as a SolidWorks part (.sldprt) and a mesh (.stl), ' +
      'and is shown here with an overview image, an interactive 3D viewer, and ' +
      'download links.',

    highlights: [
      '5 individually modelled components, chassis, wheel, rim, disc brake, shock absorber',
      'Each component built from scratch with clean, fully constrained geometry',
      'Every component exported as .sldprt and .stl for review',
      'Per component 3D viewer with drag to rotate and scroll to zoom'
    ],

    // Cover image for the home page card.
    cover: 'Buggy_Cover_pic.png',

    // Component-style rendering: each item shows as its own block with
    // a PNG on the left, a 3D viewer on the right, and SLDPRT/STL
    // download cards below. No overview video — Buggy is parts-only.
    // Reuses the mold component renderer (which gracefully skips the
    // video block when overviewVideo is absent).
    isMold: true,

    subProjects: [
      {
        id: 'buggy-components',
        title: 'Buggy Components',
        description:
          'Each component of the buggy, including chassis, wheel, rim, disc brake, and ' +
          'shock absorber, modelled individually in SolidWorks and exported as .sldprt and .stl.',
        // No overviewVideo, Buggy is parts only, so the video block is skipped.
        components: [
          { id: 'body-chassis',   title: 'Body Chassis',    png: '1-Body_Chassis.png',   stl: '1-Body_Chassis.STL',   sld: '1-Body_Chassis.SLDPRT'  },
          { id: 'wheel',          title: 'Wheel',           png: '2-Wheel.png',          stl: '2-Wheel.STL',          sld: '2-Wheel.SLDPRT'         },
          { id: 'rim',            title: 'Rim',             png: '3-Rim.png',            stl: '3-Rim.STL',            sld: '3-Rim.SLDPRT'           },
          { id: 'disc-brake',     title: 'Disc Brake',      png: '4-Disc_Brake.png',     stl: '4-Disc_Brake.STL',     sld: '4-Disc_Brake.SLDPRT'    },
          { id: 'shock-absorber', title: 'Shock Absorber',  png: '5-Shock_Absorber.png', stl: '5-Shock_Absorber.STL', sld: '5-Shock_Absorber.SLDPRT' }
        ]
      }
    ]

  },

  {
    /* ---------- 3. 3D MODELING (mixed gallery) ----------
       Detail page lists each project group (Bobcat, F1 car, Robotic
       Arm, etc.) one by one. Some groups are image/video only, others
       have STL and SLDPRT files and render like weldments (overview,
       3D viewer, downloads). Grouping is done by leading "NN-" prefix
       on the files in projects/3d-modeling/, listed in manifest.json. */
    id: '3d-modeling',
    title: '3D Modeling',
    summary: 'A mix of 3D modelling work, renders, prototypes, and video walkthroughs, featuring robotic arms, moulded covers, and other study pieces.',
    cover: 'overview.png',
    isGallery: true
  },

  {
    /* ---------- 4. SURFACING ---------- */
    id: 'surfacing',
    title: 'Surfacing',
    summary: 'A surfacing study exploring boundary surfaces, lofts, and curvature continuity on consumer-product forms.',

    description:
      'A focused surfacing study using SolidWorks boundary surfaces, lofts, and curvature-controlled fills. ' +
      'Each piece below explores a different facet of production-quality surfacing, from continuous curvature at seams to clean transitions between primary and fill faces.',

    highlights: [
      'Lofted bodies with curvature-controlled fills',
      'Boundary surfaces with G1 and G2 continuity',
      'Clean transitions between primary and fill faces',
      'Each piece exported as .sldprt and .stl'
    ],

    // Cover image for the home page card. A 4-up collage showing the
    // Mouse, Airpod, Plastic Bottle and Fan renders.
    cover: 'Cover_pic.png',

    // Mark this project as a "section" containing multiple sub-projects,
    // each with its own overview / 3D viewer / downloads.
    isMulti: true,

    subProjects: [
      {
        id: 'mouse',
        title: 'Mouse',
        description:
          'A consumer-product mouse form modelled with boundary surfaces and curvature-controlled fills. ' +
          'Explores ergonomic surface flow from the click buttons across the palm rest, with continuous tangency at the parting seams.',
        overview: 'components/01-Mouse.png',
        stl:      'files/01-Mouse.STL',
        sld:      'files/01-Mouse.SLDPRT'
      },
      {
        id: 'bottom-bottle',
        title: 'Bottom Bottle',
        description:
          'A filleted base profile built with boundary surfaces and tangent continuity at the seams. ' +
          'Explores clean curvature transitions between the base fillet and the sidewall, the kind of detail that defines production-quality surfacing.',
        overview: 'components/02-Bottom Bottle.png',
        stl:      'files/02-Bottom Bottle.STL',
        sld:      'files/02-Bottom Bottle.SLDPRT'
      },
      {
        id: 'plastic-bottle',
        title: 'Plastic Bottle',
        description:
          'A lofted body with curvature-controlled fills producing a smooth, continuous sidewall. ' +
          'Demonstrates control over curvature combs, G2 continuity, and uniform transitions, a baseline reference for consumer-product form.',
        overview: 'components/03-Plastic Bottle.png',
        stl:      'files/03-Plastic Bottle.STL',
        sld:      'files/03-Plastic Bottle.SLDPRT'
      },
      {
        id: 'fan',
        title: 'Fan',
        description:
          'A swept-blade fan geometry modelled with curved lofts and curvature-combed transitions. ' +
          'Demonstrates blade-to-hub continuity at G2, with clean fill surfaces that read as a single continuous skin across the blades.',
        overview: 'components/04-Fan.png',
        stl:      'files/04-Fan.STL',
        sld:      'files/04-Fan.SLDPRT'
      },
      {
        id: 'airpod',
        title: 'Airpod',
        description:
          'Compact consumer-electronics enclosure modelled with boundary surfaces and tangent fills. ' +
          'Highlights the curvature flow from the flat parting face through the rounded body, a tight showcase of small-feature surfacing discipline.',
        overview: 'components/05-Airbud.png',
        stl:      'files/05-Airpod.STL',
        sld:      'files/05-Airpod.SLDPRT'
      }
    ],

  },

  {
    /* ---------- 5. WELDMENTS ---------- */
    id: 'weldments',
    title: 'Weldments',
    summary: 'Structural weldment designs using SolidWorks frame tools, with structural members, end caps, gussets, and welded assemblies.',

    description:
      'A collection of structural weldment pieces built with SolidWorks frame tools. ' +
      'Each piece demonstrates structural members, end caps, gussets, and welded assemblies, the kind of detail needed for real fabricated frames.',

    highlights: [
      'Structural members with proper length and miter cuts',
      'End caps and gussets for clean termination',
      'Welded assemblies with proper feature hierarchy',
      'Each piece exported as .sldprt and .stl'
    ],

    cover: 'components/01-Roof_Top.png',
    isMulti: true,

    subProjects: [
      {
        id: 'roof-top',
        title: 'Roof Top',
        description:
          'A structural roof-top frame built from rectangular and round structural members, with end caps and gusset plates at the joints. ' +
          'Demonstrates proper length trimming, miter cuts, and a clean welded assembly suited for roofing applications.',
        overview: 'components/01-Roof_Top.png',
        stl:      'files/01-Roof_Top.STL',
        sld:      'files/01-Roof_Top.SLDPRT'
      },
      {
        id: 'table',
        title: 'Table',
        description:
          'A welded table frame constructed from structural members with proper leg-to-rail joints. ' +
          'Highlights miter cuts, end-cap terminations, and a clean load-bearing welded layout ready for fabrication.',
        overview: 'components/02-Table.png',
        stl:      'files/02-Table.STL',
        sld:      'files/02-Table.SLDPRT'
      },
      {
        id: 'spiral-stairs',
        title: 'Spiral Stairs',
        description:
          'A spiral-stair weldment built with curved and straight structural members wrapped around a central axis. ' +
          'Demonstrates custom-profile members, angle-controlled cuts, and a welded assembly that forms a continuous helical path.',
        overview: 'components/03-Spiral_Stairs.png',
        stl:      'files/03-Spiral_Stairs.STL',
        sld:      'files/03-Spiral_Stairs.SLDPRT'
      },
      {
        id: 'body-design',
        title: 'Body Design',
        description:
          'A vehicle-body-style welded frame using a network of structural members, gussets, and end caps. ' +
          'Shows how multiple profile sizes are combined to create a rigid, lightweight body structure with clean welded joints.',
        overview: 'components/04-Body_Design.png',
        stl:      'files/04-Body_Design.STL',
        sld:      'files/04-Body_Design.SLDPRT'
      },
      {
        id: 'robotic-car-chassis',
        title: 'Robotic Car Chassis',
        description:
          'A robotic-car chassis welded from rectangular and round structural members, with gusset reinforcements at high-stress joints. ' +
          'Demonstrates a fabrication-ready welded frame designed for mounting drivetrain, electronics, and body panels.',
        overview: 'components/05-Robotic_Car_Chassis.png',
        stl:      'files/05-Robotic_Car_Chassis.STL',
        sld:      'files/05-Robotic_Car_Chassis.SLDPRT'
      }
    ],

  },

  {
    /* ---------- 6. MOLDING ---------- */
    id: 'molding',
    title: 'Molding',
    summary: 'Mould design projects with looping assembly videos and per-component 3D viewers, covering Spoon, Button, and Basket mould assemblies.',

    description:
      'A collection of injection-mould design exercises modelled in SolidWorks. ' +
      'Each mould is broken down into its constituent components, including the part, core and cavity, ' +
      'gate, supports, and any sliders, with a looping assembly overview video and ' +
      'a 3D viewer for every component.',

    highlights: [
      'Looping assembly overview video for every mould',
      'Per component 3D viewer for part, core and cavity, gate, and other components',
      'Each component exported as .sldprt and .stl',
      'Clean parting line and draft angle execution'
    ],

    // Cover image (at projects/molding/files/cover_pic.png) — the
    // exploded mould-assembly render used on the home page card.
    cover: 'files/cover_pic.png',

    // The molding section has its own dedicated renderer because the
    // layout differs from the standard multi-project view:
    //   - each sub-project opens with a full-width looping overview video
    //   - then stacks components (PNG left + 3D viewer right) with downloads
    isMold: true,

    subProjects: [
      {
        id: 'spoon-mold',
        title: 'Spoon Mold',
        description:
          'A complete injection-mould assembly for a spoon, broken down into 5 components. ' +
          'The spoon part itself, core and cavity, support plate, gate, and gripper.',
        overviewVideo: 'files/1-Spoon_Mold/Spoon_molding.mp4',
        components: [
          { id: 'spoon',         title: 'Spoon',         png: 'files/1-Spoon_Mold/1-Spoon.png',       stl: 'files/1-Spoon_Mold/1-Spoon.STL',       sld: 'files/1-Spoon_Mold/1-Spoon.SLDPRT' },
          { id: 'core-cavity',   title: 'Core and Cavity', png: 'files/1-Spoon_Mold/2-Core&Cavity.png', stl: 'files/1-Spoon_Mold/2-Core&Cavity.STL', sld: 'files/1-Spoon_Mold/2-Core&Cavity.SLDPRT' },
          { id: 'support',       title: 'Support',       png: 'files/1-Spoon_Mold/3-Support.png',     stl: 'files/1-Spoon_Mold/3-Support.STL',     sld: 'files/1-Spoon_Mold/3-Support.SLDPRT' },
          { id: 'gate',          title: 'Gate',          png: 'files/1-Spoon_Mold/4-Gate.png',        stl: 'files/1-Spoon_Mold/4-Gate.STL',        sld: 'files/1-Spoon_Mold/4-Gate.SLDPRT' },
          { id: 'gripper',       title: 'Gripper',       png: 'files/1-Spoon_Mold/5-Gripper.png',     stl: 'files/1-Spoon_Mold/5-Gripper.STL',     sld: 'files/1-Spoon_Mold/5-Gripper.SLDPRT' }
        ]
      },
      {
        id: 'button-mold',
        title: 'Button Mold',
        description:
          'A compact button mould assembly with 3 components, the button part, ' +
          'core and cavity, and the gate that feeds molten material into the cavity.',
        overviewVideo: 'files/2-Button_mold/Button_molding.mp4',
        components: [
          { id: 'button',        title: 'Button',        png: 'files/2-Button_mold/1-Button.png',       stl: 'files/2-Button_mold/1-Button.STL',       sld: 'files/2-Button_mold/1-Button.SLDPRT' },
          { id: 'core-cavity',   title: 'Core and Cavity', png: 'files/2-Button_mold/2-Core&Cavity.png',  stl: 'files/2-Button_mold/2-Core&Cavity.STL',  sld: 'files/2-Button_mold/2-Core&Cavity.SLDPRT' },
          { id: 'gate',          title: 'Gate',          png: 'files/2-Button_mold/3-Gate.png',         stl: 'files/2-Button_mold/3-Gate.STL',         sld: 'files/2-Button_mold/3-Gate.SLDPRT' }
        ]
      },
      {
        id: 'basket-mold',
        title: 'Basket Mold',
        description:
          'A larger basket mould assembly with 4 components, the basket part, core and cavity, ' +
          'gate, and a slider that forms the undercuts on the basket walls.',
        overviewVideo: 'files/3-Basket_Mold/Basket_molding.mp4',
        components: [
          { id: 'basket',        title: 'Basket',        png: 'files/3-Basket_Mold/1-Basket.png',        stl: 'files/3-Basket_Mold/1-Basket.STL',        sld: 'files/3-Basket_Mold/1-Basket.SLDPRT' },
          { id: 'core-cavity',   title: 'Core and Cavity', png: 'files/3-Basket_Mold/2-Core&Cavity.png',   stl: 'files/3-Basket_Mold/2-Core&Cavity.STL',   sld: 'files/3-Basket_Mold/2-Core&Cavity.SLDPRT' },
          { id: 'gate',          title: 'Gate',          png: 'files/3-Basket_Mold/3-Gate.png',          stl: 'files/3-Basket_Mold/3-Gate.STL',          sld: 'files/3-Basket_Mold/3-Gate.SLDPRT' },
          { id: 'slider',        title: 'Slider',        png: 'files/3-Basket_Mold/4-Slider.png',        stl: 'files/3-Basket_Mold/4-Slider.STL',        sld: 'files/3-Basket_Mold/4-Slider.SLDPRT' }
        ]
      }
    ],

  }
];

/* =====================================================================
   CONTACT INFO
   ===================================================================== */
const CONTACT = {
  email:    'itstawfiq077@gmail.com',
  github:   'https://github.com/its-Tawfiq',
  linkedin: 'https://www.linkedin.com/in/tawfiq-mahmud-khan',
  facebook: 'https://www.facebook.com/Eshan.mech.07',
  whatsapp: 'https://wa.me/1876894750',
  phone:    '+1 876 894 750'
};

/* =====================================================================
   AUTO-DISCOVERY
   =====================================================================
   The list of files at the bottom of each project page is filled in
   automatically by scanning the project's /components and /files folders.
   Nothing to edit here. */
