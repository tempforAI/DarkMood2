/* 启动与主循环 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State;

  function boot() {
    // 先按画风加载美术模块（高清 / 经典像素），再初始化
    Core.loadArt(St.settings.style).then(start);
  }

  function start() {
    if (St.settings.style !== 'pixel' && !DM.HDArt) { St.settings.style = 'pixel'; }
    Core.fit();
    window.addEventListener('resize', Core.fit);
    window.addEventListener('orientationchange', function () { setTimeout(Core.fit, 250); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', Core.fit);
    DM.Render.init(document.getElementById('screen'));
    DM.UI.init();
    Core.fit();
    DM.Audio.setVolume('bgm', St.settings.bgm);
    DM.Audio.setVolume('se', St.settings.se);

    // 主循环：渲染 + 打字机；标签页隐藏时暂停
    var last = 0, running = true;
    function loop(now) {
      if (!running) return;
      DM.UI.tick(now);
      DM.Render.tick(now, DM.UI.idle ? DM.UI.idle() : false);
      if (St.s && last) St.s.playMs += Math.min(250, now - last);
      last = now;
      requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; DM.Audio.pause(); }
      else { running = true; last = 0; DM.Render.markDirty(); DM.Audio.resume(); requestAnimationFrame(loop); }
    });
    requestAnimationFrame(loop);

    window.addEventListener('pagehide', function () { if (St.s && DM.Interp.resume) DM.Interp.autosave(); });

    // 调试入口：?ch=ch2 直接从某章开始；?label=xxx 跳到标签
    var q = new URLSearchParams(location.search);
    if (q.get('ch')) {
      DM.Interp.startChapter(q.get('ch')).then(function () {
        if (q.get('label')) { DM.Interp.stop(); if (DM.Interp.jump(q.get('label'))) DM.Interp.run(); }
      });
      return;
    }
    DM.Menus.toTitle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
