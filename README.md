### 项目名称：ThreeFlow

### 🌐 安装/启动/打包(详见 package.json)

```
pnpm install / pnpm serve / pnpm build(pnpm build:pro)
```

### 🎨 打包部署线上注意事项

打包时需要将 `vite.config.ts` 中的 `base` 设置为 `'/'或者(自身服务器对于域名地址)`
或者修改 `.env.production` 文件中的 `VITE_APP_BASE_URL` 为 `'/'或者(自身服务器对于域名地址)`

### node.js 版本要求

- 项目使用 node.js 版本为 v21.3.0
- 项目使用 pnpm 版本为 9.15.1
