'use strict';
/**
 * 冒烟自检：DSH_PET_SMOKE=1 时延时检查窗口、渲染、动画与交互链路，截图后退出。
 *
 * 只在开发与排查时进入；检查项要读主进程侧的窗口表与穿透镜像，所以由调用方传入，不自己持状态。
 * @module dsh-pet/runtime/electron-helper/main-smoke
 */

const path = require('node:path');
const { writeFileSync } = require('node:fs');

/**
 * 跑一次冒烟检查。
 * @param deps.app - Electron app（退出与临时目录）。
 * @param deps.windows - 宠物窗口表。
 * @param deps.windowIgnore - 每个窗口当前是否穿透（主进程镜像）。
 * @param deps.setPointerFallbackPaused - 检查穿透往返期间暂停兜底轮询。
 */
function runSmokeCheck({ app, windows, windowIgnore, setPointerFallbackPaused }) {
  const smokeOut = process.env.DSH_PET_SMOKE_OUT || path.join(app.getPath('temp'), 'dsh-pet-smoke.png');
  const afterMs = Number(process.env.DSH_PET_SMOKE_AFTER_MS || 9000);
  const target = windows.values().next().value;
  if (target) {
    // 转发渲染端 console（定位动画/余额/错误问题）
    target.webContents.on('console-message', (event) => {
      console.log(`[renderer:${event.level}] ${event.message}`);
    });
  }
  setTimeout(async () => {
    try {
      const first = windows.values().next().value;
      if (first && !first.isDestroyed()) {
        const dump = await first.webContents.executeJavaScript(`(async () => ({
          hasBridge: typeof window.petBridge !== 'undefined',
          hasSetInteractive: typeof window.petBridge?.setInteractive === 'function',
          viewport: window.innerWidth + 'x' + window.innerHeight,
          dpr: window.devicePixelRatio,
          debug: window.__dshPetDebug || null,
          sprites: document.querySelectorAll('.pet-sprite').length,
          errorVisible: document.getElementById('pet-error').classList.contains('visible'),
          errorText: document.getElementById('pet-error').textContent,
          firstBubble: (document.querySelector('.pet-bubble.is-on') || { textContent: '' }).textContent.slice(0, 120),
          hitCursor: (function () {
            var hit = document.querySelector('.pet-hit');
            return hit ? getComputedStyle(hit).cursor : '';
          })(),
          dragTransform: (function () {
            var hit = document.querySelector('.pet-hit');
            var stage = document.querySelector('.pet-stage');
            if (!hit || !stage) return 'no-sprite';
            var out = { idle: stage.style.transform };
            hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 120, clientY: 120, screenX: 120, screenY: 120, pointerId: 91 }));
            out.duringClick = stage.style.transform;
            hit.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 120, clientY: 120, screenX: 120, screenY: 120, pointerId: 91 }));
            out.afterClick = stage.style.transform;
            hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200, screenX: 200, screenY: 200, pointerId: 92 }));
            hit.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 280, clientY: 240, screenX: 280, screenY: 240, pointerId: 92 }));
            out.duringDrag = stage.style.transform;
            window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 280, clientY: 240, screenX: 280, screenY: 240, pointerId: 92 }));
            out.afterDrag = stage.style.transform;
            return out;
          })(),
          releaseKeptPosition: await (async function () {
            // Independent invariant: drag the pet to a fixed safe point (600,300) inside the work area; after release the window position must not move.
            // With drag/throw physics (spring follow + fling), the spring needs ~0.3s to settle after a long pointer jump,
            // so holding still for more than RELEASE_STALE_MS(150ms) before release counts as a gentle drop (estimated velocity null, no throw) —
            // therefore wait for the spring to settle, then hold still before releasing; this checks only whether the position moves at the moment of release.
            var d = window.__dshPetDebug;
            var hit = document.querySelector('.pet-hit');
            if (!d || !d.dragPos || !hit) return null;
            var P = { x: d.dragPos.x, y: d.dragPos.y };
            var T = { x: 600, y: 300 }; // target window top-left (inside the 1708×1020 work area, far from all edges)
            var upX = 1000 + (T.x - P.x);
            var upY = 600 + (T.y - P.y);
            var sleep = function (ms) {
              return new Promise(function (r) {
                setTimeout(r, ms);
              });
            };
            hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 1000, clientY: 600, screenX: 1000, screenY: 600, pointerId: 93 }));
            hit.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: upX, clientY: upY, screenX: upX, screenY: upY, pointerId: 93 }));
            await sleep(400); // spring follow settles
            var during = { x: d.dragPos.x, y: d.dragPos.y };
            await sleep(200); // trail expires -> estimated velocity null -> gentle drop (no throw)
            window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: upX, clientY: upY, screenX: upX, screenY: upY, pointerId: 93 }));
            await sleep(80); // release handling done
            var released = d.lastDragRelease ? { x: d.lastDragRelease.x, y: d.lastDragRelease.y } : null;
            return {
              during: during,
              released: released,
              kept: !!(released && Math.abs(released.x - during.x) <= 1 && Math.abs(released.y - during.y) <= 1),
            };
          })(),
          interactiveFlip: (function () {
            // Click-through hit test: cursor inside the hit area -> interactive; moved out -> transparent; dragging (pointer captured) -> force interactive.
            // hitRect uses sprite coordinates while mousemove uses window coordinates — test events must add the body offset inside the window (winOffset).
            var d = window.__dshPetDebug;
            var hit = document.querySelector('.pet-hit');
            if (!d || !d.hitRect || !d.winOffset || !hit) return null;
            var r = d.hitRect;
            var m = d.winOffset;
            var xIn = m.x + r.x + r.w / 2;
            var yIn = m.y + r.y + r.h / 2;
            var xOut = Math.max(0, m.x + r.x - 20);
            var yOut = Math.max(0, m.y + r.y - 20);
            var out = {};
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: xIn, clientY: yIn, screenX: xIn, screenY: yIn }));
            out.inside = d.interactive === true;
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: xOut, clientY: yOut, screenX: xOut, screenY: yOut }));
            out.outside = d.interactive === false;
            hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: xIn, clientY: yIn, screenX: xIn, screenY: yIn, pointerId: 94 }));
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: xOut, clientY: yOut, screenX: xOut, screenY: yOut }));
            out.duringDragForced = d.interactive === true;
            window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: xOut, clientY: yOut, screenX: xOut, screenY: yOut, pointerId: 94 }));
            return out;
          })(),
          videoSrcA: (document.querySelectorAll('.pet-sprite video')[0] || { src: '' }).src,
          videoSrcB: (document.querySelectorAll('.pet-sprite video')[1] || { src: '' }).src,
          // Context menu self-check: dispatch contextmenu on the hit area -> verify menu mount / root text / subpanels / runtime errors
          menuSmoke: await (async function () {
            // The drag/release/interactive tests above just dragged the pet: right click is blocked for 100ms by justDragged,
            // a real user does not right click right after dragging — wait 250ms to remove that timing effect
            await new Promise(function (resolve) {
              setTimeout(resolve, 250);
            });
            var hit = document.querySelector('.pet-hit');
            var d = window.__dshPetDebug;
            if (!hit || !d) return null;
            var errsBefore = (d.errors || []).length;
            try {
              hit.dispatchEvent(
                new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 400, clientY: 260, screenX: 400, screenY: 260 }),
              );
            } catch (err) {
              return { threw: String(err), menuMounted: false };
            }
            var menu = document.querySelector('.dsh-pet-menu');
            var out = {
              threw: null,
              menuMounted: !!menu,
              menuOpen: d.menuOpen === true,
              rootText: menu ? menu.textContent.slice(0, 60) : '',
              errsNew: (d.errors || []).length - errsBefore,
            };
            if (menu) {
              var branch = menu.querySelector('.dsh-pet-menu-branch');
              if (branch) {
                branch.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, relatedTarget: menu }));
                var panels = Array.prototype.slice.call(
                  menu.querySelectorAll('.dsh-pet-menu-column'),
                );
                var visible = function () {
                  return panels.filter(function (p) {
                    return p.style.display !== 'none';
                  });
                };
                out.panelCount = panels.length;
                out.lvl2AfterHoverRoot = visible().length;
                // Level 2: hover the first category under "Actions" -> open the level 3 panel (concrete animations)
                var panel1 = visible().filter(function (p) {
                  return p !== panels[0];
                })[0];
                if (panel1) {
                  var cat = panel1.querySelector('.dsh-pet-menu-branch');
                  if (cat) {
                    cat.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, relatedTarget: panel1 }));
                    await new Promise(function (resolve) {
                      setTimeout(resolve, 50);
                    });
                    out.lvl3AfterHoverCat = visible().length;
                    // Replay the user path: move the mouse from the category item toward the level 3 panel (first leave the category item into the 4px gap,
                    // then enter the level 3 panel) — the mouseleave in the gap schedules a 160ms close timer
                    cat.dispatchEvent(
                      new MouseEvent('mouseleave', { bubbles: false, relatedTarget: document.body }),
                    );
                    await new Promise(function (resolve) {
                      setTimeout(resolve, 60);
                    });
                    var panel2 = visible()[visible().length - 1];
                    if (panel2) {
                      panel2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
                    }
                    await new Promise(function (resolve) {
                      setTimeout(resolve, 220);
                    });
                    out.lvl3SurvivedAfterReenter = visible().length;
                    // Extreme case: lingering in the gap longer than the close delay (hesitating mouse)
                    cat.dispatchEvent(
                      new MouseEvent('mouseleave', { bubbles: false, relatedTarget: document.body }),
                    );
                    await new Promise(function (resolve) {
                      setTimeout(resolve, 260);
                    });
                    out.lvl3AfterGapHover = visible().length;
                  }
                }
              }
            }
            return out;
          })(),
        }))()`);
        console.log(
          '[dsh-pet-desktop-helper] smoke dump: windows=' +
            windows.size +
            ' ids=' +
            JSON.stringify([...windows.keys()]) +
            ' => ' +
            JSON.stringify(dump),
        );
        console.log('[dsh-pet-desktop-helper] smoke bounds:', JSON.stringify(first.getContentBounds()));
        // 点击穿透 round-trip：true → 窗口捕获输入，false → 恢复整窗穿透；状态取自主进程镜像。
        // 期间暂停兜底轮询：它按真实光标翻转，冒烟时鼠标不在宠物身上会覆盖本断言的状态。
        setPointerFallbackPaused(true);
        await first.webContents.executeJavaScript('window.petBridge.setInteractive(true); true;');
        await new Promise((r) => setTimeout(r, 80));
        const interactiveIgnoring = windowIgnore.get(first.id);
        await first.webContents.executeJavaScript('window.petBridge.setInteractive(false); true;');
        await new Promise((r) => setTimeout(r, 80));
        const passthroughIgnoring = windowIgnore.get(first.id);
        setPointerFallbackPaused(false);
        console.log(
          '[dsh-pet-desktop-helper] smoke interactive round-trip:',
          JSON.stringify({ interactiveIgnoring, passthroughIgnoring }),
        );
        const image = await first.webContents.capturePage();
        writeFileSync(smokeOut, image.toPNG());
        console.log('[dsh-pet-desktop-helper] smoke capture:', smokeOut);
      }
    } catch (error) {
      console.error('[dsh-pet-desktop-helper] smoke capture failed:', error);
    }
    setTimeout(() => app.quit(), 500);
  }, afterMs);
}

module.exports = { runSmokeCheck };
