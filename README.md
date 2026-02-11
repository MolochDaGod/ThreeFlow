### 项目名称：ThreeFlow

### 项目描述

ThreeFlow:一个基于Three.js+Vue3+Vite+Typescript实现的3D场景编辑器。

项目采用企业级项目标准的开发规范：Eslint+Stylelint+Prettier+Husky+JSDoc实现项目代码工程规范。

对Three.js核心操作模块的功能进行单独模块化抽离封装，减少Three.j在现代框架中使用的成本

### 🌐 安装/启动/打包(详见 package.json)

```
 pnpm install

 pnpm serve 
 
 pnpm build/pnpm build:pro

```

### 💚  支持项目 ⭐

如果你觉得该项目对你有帮助那就留个star吧，这是对作者每次熬夜牺牲休息时间去更新开源项目最大的动力支持

### 🎵 主要技术栈

| 名称                     | 版本    | 名称         | 版本  |
| ------------------------ | ------- | ------------ | ----- |
| Vue                      | 3.5.13  | Typescript   | 5.7.x |
| Vite                     | 6.1.x   | Element-plus | 2.9.4 |
| Three                    | 182     | Pinia        | 2.3.x |
| 详见 `package.json`      | 😁      | 🥰           | 🤗    |

### 🌺 开发环境

| 名称 | 版本    | 名称    | 版本   |
| ---- | ------- | ------- | ------ |
| node | 21.3.0  | npm     | 10.2.4 |
| yarn | 1.22.21 | windows | 10     |
| pnpm | 9.15.1  | mac     | M1-M4  |

### ⚖️ 许可协议

本项目采用 AGPL-3.0 开源协议，使用时请遵守协议条款:
✅ 允许 个人学习、研究、修改使用

✅ 允许 商业使用

✅ 允许收费、SaaS、企业内部使用

❗ 但要求：
修改过的代码必须开源

通过网络向用户提供服务时，也必须提供源码

### 📚 商用版（ThreeFlowX）

如果你有商用目的需求，那么非常推荐👇🏻

**ThreeFlowX(商用版)：** 在保留了 *ThreeFlow* 所有功能的基础上，提供更加丰富多态的3D场景元素内容和更加强大的低代码自定义能力。同时提供了多模型、大场景资源的加载/渲染/存储的解决方案。

<!-- Start of Selection -->
**[在线文档](http://threeflowx.cn/docs/)**:<http://threeflowx.cn/docs/>

**[在线地址](http://threeflowx.cn/edit/)**:<http://threeflowx.cn/edit/>
<!-- End of Selection -->

### 👷 项目目录结构介绍

### 1. 入口文件

- App.vue : 应用程序的根组件，包含路由视图
- main.js : 应用程序入口文件，负责初始化 Vue 应用、注册全局组件、全局状态、指令和插件

### 2. /assets 目录

存放静态资源文件：

- iconFont/ : 阿里巴巴矢量图标库（地址: <https://www.iconfont.cn/）>
- image/ : 图片资源
- previewIcon/ : 模型预览图片
- textures/ : 资源贴图文件

### 3. /components 目录

全局组件文件：

- Loading/ : 自定义封装的页面加载loading
- index.ts : 组件导出文件

### 4. /config 目录

常量配置和静态数据配置文件：

- constant.ts :  常量定义
- defaultDragList.ts : 左侧模型拖拽资源内容数据
- propertyConfig.ts : 3D资源属性项目静态配置
