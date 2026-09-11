# API-Route favicon 安装说明

## 建议部署到网站根目录的文件

- `favicon.ico`：兼容传统浏览器，内含 16、32、48 像素三种尺寸。
- `favicon-48x48.png`：Google 搜索结果优先使用的方形图标。
- `apple-touch-icon.png`：iPhone/iPad 主屏图标，180×180。
- `android-chrome-192x192.png`：PWA/Android 图标。
- `android-chrome-512x512.png`：PWA/Android 大图标。
- `site.webmanifest`：图标清单。

## 页面 `<head>` 中加入

```html
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

## 你的项目需要额外检查

当前代码如果仍由 `SiteContext.jsx` 动态把 favicon 改回 `/images/logo.png`，请移除这段覆盖逻辑，或者把它改为 `/favicon-48x48.png`。否则静态 `<head>` 配置会在页面运行后再次被覆盖。

部署后确认下列 URL 都能直接返回 HTTP 200，且不是重定向到 HTML 页面：

- `https://www.api-route.com/favicon-48x48.png`
- `https://www.api-route.com/favicon.ico`
- `https://www.api-route.com/apple-touch-icon.png`
- `https://www.api-route.com/site.webmanifest`

最后在 Google Search Console 对首页执行“网址检查 → 请求编入索引”。Google 更新搜索结果 favicon 通常不会立即发生，可能需要数天到数周。
