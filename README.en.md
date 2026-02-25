### Project Name: ThreeFlow (3D Scene Editor)

### Project Description

ThreeFlow is a 3D scene editor built with **Three.js + Vue 3 + Vite + TypeScript**.

The project follows enterprise-level development standards and integrates **ESLint**, **Stylelint**, **Prettier**, **Husky**, and **CommitLint** to ensure a robust code quality and automation pipeline.

Core Three.js operation modules are abstracted and modularized, which significantly reduces the cost and complexity of using Three.js within a modern frontend framework (Vue 3).

### 🌐 Install / Dev / Build (see `package.json` for details)

```bash
pnpm install

pnpm serve

pnpm build
# or
pnpm build:pro
```

### 💚 Support the Project ⭐

If this project is helpful to you, please consider giving it a **star**.  
Your support is the greatest motivation for the author to keep spending late-night hours improving and maintaining this open-source project.

### 🎵 Tech Stack

| Name         | Version | Name         | Version |
| ------------ | ------- | ------------ | ------- |
| Vue          | 3.5.13  | TypeScript   | 5.7.x   |
| Vite         | 6.1.x   | Element Plus | 2.9.4   |
| Three        | 182     | Pinia        | 2.3.x   |
| TWEEN        | 18.5.0  | More in `package.json` | 🤗 |

### 🌺 Development Environment

| Name  | Version | Name   | Version |
| ----- | ------- | ------ | ------- |
| node  | 21.3.0  | npm    | 10.2.4  |
| yarn  | 1.22.21 | Windows| 10      |
| pnpm  | 9.15.1  | mac    | M1–M4   |

### ⚖️ License

This project is released under the **AGPL-3.0** open-source license.

**You may:**
- ✅ **Use freely**: For personal learning, research, or commercial projects.
- ✅ **Modify and extend**: You can freely modify the source code according to your needs.

**However, you MUST comply with the following obligations:**
- ❗ **Copyleft requirement**: If you modify the code and provide it as a network service (e.g. SaaS, web application), you **must make the complete source code of that service available to all its users**.
- ❗ **Preserve notices**: You must retain the original author's copyright notices (project logo, project name, author name, etc.) and the license statement.

**⚠️ Any losses or legal risks caused by your failure to comply with the license shall be borne by yourself.**

### 📚 Commercial Pro Version (ThreeFlowX)

**ThreeFlowX (3D Low-code Scene Editor)**:  
On top of all the existing features of *ThreeFlow*, the Pro version offers:

- Richer and more diverse 3D scene elements
- More powerful low-code customization capabilities
- Better performance optimizations
- More flexible and convenient interaction and editing experience
- Solutions for loading / rendering / storing multiple models and large-scale scenes

**Online Documentation**:  
`http://threeflowx.cn/docs/`

**Online Editor**:  
`http://threeflowx.cn/edit/`

### Project Screenshots

![Preview 1](public/image/demo-1.png)
![Preview 2](public/image/demo-2.png)

### 👷 Project Directory Structure

Below is a brief overview of the core directories and files.

### 1. Entry Files

- `App.vue`: Root component of the application, containing the router view.
- `main.js`: Application entry, responsible for initializing the Vue app, registering global components, global state, directives, and plugins.

### 2. `/assets` Directory

Static asset files:

- `iconFont/`: Iconfont assets from Alibaba Iconfont (URL: `https://www.iconfont.cn/`)
- `image/`: Image assets
- `previewIcon/`: Model preview images
- `textures/`: Texture assets

### 3. `/components` Directory

Global components:

- `Loading/`: Custom page loading component
- `index.ts`: Component export entry

### 4. `/config` Directory

Constant configuration and static data:

- `constant.ts`: Constant definitions
- `defaultDragList.ts`: Left-side drag resource data for models
- `propertyConfig.ts`: Static property configuration items

### 5. `/enums` Directory

Global enum definitions:

- `enum.ts`: Enums related to scene, transform controls, materials, etc.
- `indexDb.ts`: Enums related to IndexedDB databases

### 6. `/layouts` Directory

Layout components:

- `RenderView.vue`: Main layout component for the rendering view; serves as the primary container of the application.

### 7. `/router` Directory

Routing configuration:

- `index.ts`: Vue Router configuration entry, defining application navigation rules.

### 8. `/store` Directory

Pinia state management:

- `indexDbStore.ts`: State management for IndexedDB operations
- `pinia.ts`: Pinia instance initialization
- `sceneEditStore.ts`: Core state management for the scene editor (scene objects, selected state, etc.)

### 9. `/style` Directory

Global styles:

- `iconFont.scss`: Iconfont styles
- `index.scss`: Global common style entry
- `reset.scss`: Browser default style reset

### 10. `/types` Directory

TypeScript type declarations:

- `global.d.ts`: Global shared type declarations
- `indexDbTypes.ts`: IndexedDB-related data structure types
- `renderModelTypes.ts`: Interfaces related to rendered models
- `rightPanelTypes.ts`: Type definitions for the right-side property panel configuration
- `three-css3d.d.ts`: Type declarations for the CSS3D renderer
- `three-utils.d.ts`: Type declarations for Three.js utility functions

### 11. `/utils` Directory

Core utilities and logic:

- `directive.ts`: Vue custom directive registration
- `globalComponent.ts`: Global component auto-registration
- `globalProperties.ts`: Vue global property registration
- `historyModules/`: History module for undo/redo operations
- `indexedDB.ts`: Encapsulated class for IndexedDB operations
- `renderScene.ts`: **Core file** encapsulating Three.js scene rendering logic (initialization, render loop, event listeners, etc.)
- `sceneModules/`: Scene feature modules (lights, animation, transform controls, etc.)
- `utils.ts`: Common helper functions

### 12. `/views` Directory

Page views:

- `sceneEdit/`: Main view for the 3D scene editor
  - `index.vue`: Entry component of the editor
  - `layouts/`: Internal layout components of the editor (left drag panel, right property panel, top toolbar, etc.)

