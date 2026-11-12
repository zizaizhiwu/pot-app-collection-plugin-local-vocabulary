// Pot 收集插件：把翻译结果保存到本地生词本服务（pot-vocabulary-server）

/**
 * 尝试把字符串解析成对象/数组，失败返回 null。
 */
function tryParseJson(text) {
    const trimmed = text.trim();
    if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
        return null;
    }
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        return null;
    }
}

/**
 * 把 Pot 的 target 转成纯文本。
 * Pot 传进来的通常是译文字符串；多语言模型插件可能传对象或 JSON 字符串，
 * 结构一般为 { explanations: [{ trait, explains }], pronunciations: [], sentence: [] }。
 */
function toPlainText(target) {
    if (target === null || target === undefined) {
        return '';
    }
    if (typeof target === 'string') {
        const parsed = tryParseJson(target);
        return parsed && typeof parsed === 'object' ? toPlainText(parsed) : target;
    }
    if (typeof target !== 'object') {
        return String(target);
    }

    const lines = [];

    if (Array.isArray(target.explanations)) {
        for (const explanation of target.explanations) {
            if (!explanation) continue;
            if (explanation.trait) {
                lines.push(`${explanation.trait}.`);
            }
            const explains = Array.isArray(explanation.explains) ? explanation.explains : [];
            for (const explain of explains) {
                if (explain !== null && explain !== undefined && String(explain).trim() !== '') {
                    lines.push(String(explain));
                }
            }
        }
    }

    if (Array.isArray(target.pronunciations)) {
        for (const pronunciation of target.pronunciations) {
            if (!pronunciation) continue;
            const region = pronunciation.region ? `[${pronunciation.region}]` : '';
            let symbol = pronunciation.symbol ? String(pronunciation.symbol) : '';
            if (symbol && symbol.substring(0, 1) !== '/') {
                symbol = `/${symbol}/`;
            }
            const line = `${region} ${symbol}`.trim();
            if (line) {
                lines.push(line);
            }
        }
    }

    // 未知结构时兜底保留原始 JSON
    if (lines.length === 0) {
        return JSON.stringify(target);
    }
    return lines.join('\n');
}

async function collection(source, target, options = {}) {
    const { config = {}, detect, utils } = options;
    const { http } = utils;
    const { fetch, Body } = http;

    const baseUrl = String(config.url || 'http://127.0.0.1:8050').trim().replace(/\/+$/, '');

    // target 可能是对象，也可能是 JSON 字符串，统一取出结构化数据
    let structured = target;
    if (typeof target === 'string') {
        structured = tryParseJson(target);
    }
    const hasStructure = structured !== null && typeof structured === 'object';

    const payload = {
        sourceText: String(source),
        // 旧版 Pot 才会传 detect，新版没有，拿不到就留空
        sourceLang: typeof detect === 'string' ? detect : '',
        targetLang: '',
        contentText: toPlainText(target),
        contentJson: hasStructure ? JSON.stringify(structured) : '',
    };

    const res = await fetch(`${baseUrl}/api/topics`, {
        method: 'POST',
        body: Body.json(payload),
    });

    if (res && typeof res.status === 'number' && (res.status < 200 || res.status >= 300)) {
        throw new Error(`保存到本地生词本失败：HTTP ${res.status}`);
    }

    return true;
}
