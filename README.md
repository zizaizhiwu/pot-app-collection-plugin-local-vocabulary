# Pot 收集插件：本地生词本

把 Pot 的翻译结果保存到本地部署的生词本服务（`pot-vocabulary-server`）。

## 配置项

在 Pot 的「插件设置 - 本地生词本」中只需填写一项：

| 配置 | 说明 | 示例 |
| --- | --- | --- |
| 服务地址 | 生词本服务的地址，不填默认 `http://127.0.0.1:8050` | `http://127.0.0.1:8050` |

无需填写「来源名称」：Pot 调用收集插件时只传原文、译文字符串和该插件自己的配置（见 `TargetArea` 中的 `func(sourceText.trim(), result.toString(), { config, utils })`），插件无法得知结果是哪个翻译服务产生的，因此不记录来源。同一个词（原文 + 语言对）只会有一条主题，重复收藏会覆盖旧结果。

## 数据结构

插件向服务提交：

```json
{
  "sourceText": "hello",
  "sourceLang": "",
  "targetLang": "",
  "contentText": "你好；喂；哈喽",
  "contentJson": ""
}
```

- 当前 Pot 传进来的 `target` 是译文字符串（`result.toString()`），`contentText` 即该字符串，`contentJson` 为空。
- 旧版本或特殊翻译插件传 `{ explanations, pronunciations }` 结构时，`contentText` 转成可读纯文本，`contentJson` 保留原始结构。

## 打包

把 `info.json`、`main.js`、`vocabulary.svg` 压缩为 zip 并重命名为 `plugin.com.zizaizhiwu.local-vocabulary.potext`，即可在 Pot 中安装。推送到 GitHub 后 Actions 会自动打包。

## 接口约定

- `POST /api/topics` 保存结果
- `POST /api/topics/list` 列表，请求体 `{ "page": 1, "size": 20, "keyword": "" }`
- `GET /api/topics/{id}` 详情
- `GET /api/topics/{id}/next`、`/prev` 相邻主题

详见 `../pot-app-collection-plugin-local-vocabulary-java/README.md`。
