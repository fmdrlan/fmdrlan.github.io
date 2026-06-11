/* ============================================================
 * DR. YANG's Toolbox — SVG Icons (Lucide-inspired stroke icons)
 * 跨頁面共用，避免 emoji 跨平台渲染不一致的問題
 * 使用方式：document.getElementById('foo').innerHTML = ICON.search;
 * ============================================================ */
(function (global) {
  'use strict';

  function svg(path, viewBox) {
    viewBox = viewBox || '0 0 24 24';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox +
           '" fill="none" stroke="currentColor" stroke-width="1.8"' +
           ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           path + '</svg>';
  }

  var ICON = {
    // 工具類 icon（landing page + tabs）
    search:    svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    chart:     svg('<path d="M3 3v18h18"/><path d="M7 16l4-6 4 3 5-8"/>'),
    syringe:   svg('<path d="M18 2l4 4"/><path d="M16 4l4 4"/>' +
                   '<path d="M11.5 8.5L20 17l-3 3-8.5-8.5"/>' +
                   '<path d="M8.5 11.5L4 16l4 4 4.5-4.5"/>'),

    // landing page header
    stethoscope: svg('<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3"/>' +
                     '<path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/>' +
                     '<circle cx="20" cy="10" r="2"/>'),

    // landing page warning
    alert:     svg('<path d="M12 9v4"/><path d="M12 17h.01"/>' +
                   '<path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'),

    // changelog
    changelog: svg('<circle cx="12" cy="12" r="10"/>' +
                   '<polyline points="12 6 12 12 16 14"/>'),
    plus:      svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    edit:      svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
                   '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    minus:     svg('<path d="M5 12h14"/>'),

    // related drugs
    link:      svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
                   '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),

    // copy
    copy:      svg('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
                   '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    check:     svg('<polyline points="20 6 9 17 4 12"/>'),

    // arrow
    chevronRight: svg('<polyline points="9 18 15 12 9 6"/>'),
    close:        svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),

    // 工具卡片右側箭頭
    arrowRight:   svg('<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>'),

    // 比較工具：天平
    scale:     svg('<path d="M16 16.01V16"/><path d="M8 16.01V16"/>' +
                   '<path d="m2 16 3-9 3 9"/><path d="m14 16 3-9 3 9"/>' +
                   '<path d="M5 16h6"/><path d="M17 16h6"/>' +
                   '<path d="M12 3v18"/><path d="M5 21h14"/>'),

    // 首頁
    home:      svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
                   '<polyline points="9 22 9 12 15 12 15 22"/>'),

    // BMI 對照工具：尺
    ruler:     svg('<path d="M21.3 8.7L8.7 21.3a2.4 2.4 0 0 1-3.4 0L2.7 18.7a2.4 2.4 0 0 1 0-3.4L15.3 2.7a2.4 2.4 0 0 1 3.4 0l2.6 2.6a2.4 2.4 0 0 1 0 3.4z"/>' +
                   '<path d="M14.5 12.5L12 15"/><path d="M11.5 9.5L9 12"/>' +
                   '<path d="M8.5 6.5L6 9"/><path d="M17.5 15.5L15 18"/>'),

    // 意見回饋：對話框
    message:   svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),

    // ── 肥胖門診問診工具用到的 icons ──
    // 工具入口：磅秤刻度
    weight:    svg('<circle cx="12" cy="15" r="6"/>' +
                   '<path d="M12 11v0M12 11l1.5-3.5h-3L12 11z"/>' +
                   '<path d="M9 6h6"/>'),

    // 檢驗報告解讀工具：燒瓶
    flask:     svg('<path d="M9 3h6"/>' +
                   '<path d="M10 3v6.5L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/>' +
                   '<path d="M8 14h8"/>'),
    // 初診評估：寫字板
    clipboard: svg('<rect x="8" y="2" width="8" height="4" rx="1"/>' +
                   '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'),
    // 回診追蹤：日曆
    calendar:  svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
                   '<line x1="16" y1="2" x2="16" y2="6"/>' +
                   '<line x1="8" y1="2" x2="8" y2="6"/>' +
                   '<line x1="3" y1="10" x2="21" y2="10"/>'),
    // 性別/個人
    user:      svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
                   '<circle cx="12" cy="7" r="4"/>'),
    // 目標
    target:    svg('<circle cx="12" cy="12" r="10"/>' +
                   '<circle cx="12" cy="12" r="6"/>' +
                   '<circle cx="12" cy="12" r="2"/>'),
    // 時間/體重變化史
    clock:     svg('<circle cx="12" cy="12" r="10"/>' +
                   '<polyline points="12 6 12 12 16 14"/>'),
    // 生活事件：火焰（戒菸常見圖示）
    flame:     svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    // 藥物
    pill:      svg('<path d="M10.5 20.5L20.5 10.5a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/>' +
                   '<line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>'),
    // 共病：心
    heart:     svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    // 症狀：活動/波動線
    activity:  svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
    // 家族史
    users:     svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
                   '<circle cx="9" cy="7" r="4"/>' +
                   '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' +
                   '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    // 飲食內容：碗
    bowl:      svg('<path d="M3 11h18a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z"/>' +
                   '<path d="M7 7c0-1 1-2 2-2"/>' +
                   '<path d="M12 5c0-1 1-2 2-2"/>'),
    // 飲食行為（心理面）：大腦
    brain:     svg('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/>' +
                   '<path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>'),
    // 身體活動：跑步
    run:       svg('<circle cx="13" cy="4" r="2"/>' +
                   '<path d="M4 22l3-8 3 2 1-5 3 3h4"/>' +
                   '<path d="M14 10l-2 3 3 4-2 5"/>'),
    // 睡眠：月亮
    moon:      svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
    // 心理社會：笑臉
    smile:     svg('<circle cx="12" cy="12" r="10"/>' +
                   '<path d="M8 14s1.5 2 4 2 4-2 4-2"/>' +
                   '<line x1="9" y1="9" x2="9.01" y2="9"/>' +
                   '<line x1="15" y1="9" x2="15.01" y2="9"/>'),
    // 肌少肥胖：啞鈴
    dumbbell:  svg('<path d="M6 5v14"/><path d="M18 5v14"/>' +
                   '<path d="M3 9v6"/><path d="M21 9v6"/>' +
                   '<line x1="6" y1="12" x2="18" y2="12"/>'),
    // 病歷文字：文件
    fileText:  svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                   '<polyline points="14 2 14 8 20 8"/>' +
                   '<line x1="16" y1="13" x2="8" y2="13"/>' +
                   '<line x1="16" y1="17" x2="8" y2="17"/>'),
    // 檢驗：燒瓶
    flask:     svg('<path d="M9 2v6L4 19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1L15 8V2"/>' +
                   '<line x1="9" y1="2" x2="15" y2="2"/>'),
    // 清空：重整
    refresh:   svg('<polyline points="23 4 23 10 17 10"/>' +
                   '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>')
  };

  global.ICON = ICON;
})(window);
