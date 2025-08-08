// ==UserScript==
// @name         SEO 分析工具
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically analyze the SEO elements of the page and display them in the floating box
// @author       Hsiao Feng
// @match        http://192.168.0.1:90/*
// @match        https://192.168.0.1:90/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';
  
    // 自定义样式
    GM_addStyle(`
        #seo-analysis-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            padding: 15px;
            font-family: Arial, sans-serif;
        }
        .seo-section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .seo-section:last-child {
            border-bottom: none;
        }
        .seo-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #0d6efd;
        }
        .seo-item {
            margin-bottom: 5px;
            word-break: break-word;
        }
        .seo-item-label {
            font-weight: bold;
            color: #6c757d;
        }
        .seo-missing {
            color: #dc3545;
            font-style: italic;
        }
        .seo-present {
            color: #198754;
        }
        .seo-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .seo-panel-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #0d6efd;
        }
        .seo-close-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #6c757d;
        }
    `);

    // 创建SEO分析面板
    function createSeoPanel() {
        const panel = document.createElement('div');
        panel.id = 'seo-analysis-panel';

        // 面板头部
        const panelHeader = document.createElement('div');
        panelHeader.className = 'seo-panel-header';

        const panelTitle = document.createElement('div');
        panelTitle.className = 'seo-panel-title';
        panelTitle.textContent = 'SEO Analysis';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'seo-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        panelHeader.appendChild(panelTitle);
        panelHeader.appendChild(closeBtn);
        panel.appendChild(panelHeader);

        // 分析页面SEO
        analyzeSeo(panel);

        document.body.appendChild(panel);
    }

    // 分析SEO元素
    function analyzeSeo(panel) {
        // 获取页面标题
        const pageTitle = document.title;
        addSeoSection(panel, 'Title', pageTitle);

        // 获取meta description
        const description = document.querySelector('meta[name="description"]')?.content;
        addSeoItem(panel, 'Meta Description', description);

        // 获取meta keywords
        const keywords = document.querySelector('meta[name="keywords"]')?.content;
        addSeoItem(panel, 'Meta Keywords', keywords);

        // 获取viewport设置
        const viewport = document.querySelector('meta[name="viewport"]')?.content;
        addSeoItem(panel, 'Viewport', viewport);

        // 获取charset
        const charset = document.querySelector('meta[charset]')?.getAttribute('charset') ||
                       document.querySelector('meta[http-equiv="Content-Type"]')?.content;
        addSeoItem(panel, 'Charset', charset);

        // 获取canonical链接
        const canonical = document.querySelector('link[rel="canonical"]')?.href;
        addSeoItem(panel, 'Canonical URL', canonical);

        // 分析Open Graph协议
        analyzeOpenGraph(panel);

        // 分析Twitter Cards
        analyzeTwitterCards(panel);

        // 分析h1-h6标题
        analyzeHeadings(panel);

        // 分析图片alt属性
        analyzeImageAlts(panel);
    }

    // 分析Open Graph协议
    function analyzeOpenGraph(panel) {
        const ogTags = document.querySelectorAll('meta[property^="og:"]');

        if (ogTags.length > 0) {
            const section = addSeoSection(panel, 'Open Graph');

            const ogTypes = {};
            ogTags.forEach(tag => {
                const property = tag.getAttribute('property').replace('og:', '');
                const content = tag.getAttribute('content');
                ogTypes[property] = content;
            });

            for (const [property, content] of Object.entries(ogTypes)) {
                addSeoItem(section, `og:${property}`, content);
            }
        } else {
            addSeoItem(panel, 'Open Graph', 'Not Found', true);
        }
    }

    // 分析Twitter Cards
    function analyzeTwitterCards(panel) {
        const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');

        if (twitterTags.length > 0) {
            const section = addSeoSection(panel, 'Twitter Cards');

            const twitterTypes = {};
            twitterTags.forEach(tag => {
                const name = tag.getAttribute('name').replace('twitter:', '');
                const content = tag.getAttribute('content');
                twitterTypes[name] = content;
            });

            for (const [name, content] of Object.entries(twitterTypes)) {
                addSeoItem(section, `twitter:${name}`, content);
            }
        } else {
            addSeoItem(panel, 'Twitter Cards', 'Not Found', true);
        }
    }

    // 分析标题标签
    function analyzeHeadings(panel) {
        const headings = {
            h1: document.querySelectorAll('h1'),
            h2: document.querySelectorAll('h2'),
            h3: document.querySelectorAll('h3'),
            h4: document.querySelectorAll('h4'),
            h5: document.querySelectorAll('h5'),
            h6: document.querySelectorAll('h6')
        };

        const section = addSeoSection(panel, '标题标签');

        for (const [tag, elements] of Object.entries(headings)) {
            const count = elements.length;
            let content = `${count}`;

            if (count > 0) {
                content += ` (示例: "${elements[0].textContent.trim()}")`;
            }

            addSeoItem(section, tag.toUpperCase(), content, count === 0);
        }
    }

    // 分析图片alt属性
    function analyzeImageAlts(panel) {
        const images = document.querySelectorAll('img');
        let imagesWithAlt = 0;
        let imagesWithoutAlt = 0;

        images.forEach(img => {
            if (img.alt && img.alt.trim() !== '') {
                imagesWithAlt++;
            } else {
                imagesWithoutAlt++;
            }
        });

        const section = addSeoSection(panel, 'Image ALT');
        addSeoItem(section, 'Total Images', images.length);
        addSeoItem(section, 'Images with ALT', imagesWithAlt);
        addSeoItem(section, 'Images without ALT', imagesWithoutAlt, imagesWithoutAlt > 0);
    }

    // 添加SEO部分
    function addSeoSection(panel, title, content) {
        const section = document.createElement('div');
        section.className = 'seo-section';

        const titleEl = document.createElement('div');
        titleEl.className = 'seo-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);

        if (content) {
            const contentEl = document.createElement('div');
            contentEl.className = 'seo-item';
            contentEl.textContent = content;
            section.appendChild(contentEl);
        }

        panel.appendChild(section);
        return section;
    }

    // 添加SEO项目
    function addSeoItem(section, label, content, isMissing) {
        const item = document.createElement('div');
        item.className = 'seo-item';

        const labelEl = document.createElement('span');
        labelEl.className = 'seo-item-label';
        labelEl.textContent = `${label}: `;
        item.appendChild(labelEl);

        const contentEl = document.createElement('span');
        if (content) {
            contentEl.textContent = content;
            contentEl.className = 'seo-present';
        } else {
            contentEl.textContent = isMissing ? 'Not Found' : 'Null';
            contentEl.className = 'seo-missing';
        }
        item.appendChild(contentEl);

        section.appendChild(item);
    }

    // 页面加载完成后创建面板
    window.addEventListener('load', function() {
        setTimeout(createSeoPanel, 1000); // 延迟1秒确保所有元素加载完成
    });
})();
