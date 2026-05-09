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
                   '<path d="M12 3v18"/><path d="M5 21h14"/>')
  };

  global.ICON = ICON;
})(window);
