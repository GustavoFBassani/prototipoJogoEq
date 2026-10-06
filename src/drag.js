import { getTokenColors, resolveDrop } from './algebra.js';

let activeDrag = null;

function itemsOnSide(game, side) {
  return side === 'lhs' ? game.lhsItems : game.rhsItems;
}

function setItemsOnSide(game, side, items) {
  if (side === 'lhs') game.lhsItems = items;
  else game.rhsItems = items;
}

export function setupDrag(element, item, sideName, game) {
  element.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const container = element.closest('.equation-container');
    if (container) {
      container.style.zIndex = '50';
    }

    try {
      element.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture is optional */
    }

    activeDrag = {
      element,
      item,
      side: sideName,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      container,
      targetToken: null,
    };

    element.classList.add('dragging');
    element.style.transform = 'translate3d(0px, 0px, 0) scale(1.15)';

    const sideDropzone =
      activeDrag.side === 'lhs' ? game.els.dropzoneLhs : game.els.dropzoneRhs;
    if (sideDropzone) {
      sideDropzone.classList.add('drag-active');
    }

    const onPointerMove = (moveEvent) => {
      if (!activeDrag || activeDrag.element !== element) return;

      const dx = moveEvent.clientX - activeDrag.startX;
      const dy = moveEvent.clientY - activeDrag.startY;

      element.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.15)`;

      const currentDropzone =
        activeDrag.side === 'lhs' ? game.els.dropzoneLhs : game.els.dropzoneRhs;
      const tokens = currentDropzone.querySelectorAll('.game-token:not(.dragging)');
      const sideItems = itemsOnSide(game, activeDrag.side);

      let foundTarget = null;
      let foundAction = null;

      tokens.forEach((otherEl) => {
        const oRect = otherEl.getBoundingClientRect();
        const isOver =
          moveEvent.clientX >= oRect.left &&
          moveEvent.clientX <= oRect.right &&
          moveEvent.clientY >= oRect.top &&
          moveEvent.clientY <= oRect.bottom;

        if (!isOver) return;
        const targetItem = sideItems.find((i) => i.id === parseInt(otherEl.dataset.id, 10));
        const drop = resolveDrop(activeDrag.item, targetItem);
        if (drop) {
          foundTarget = otherEl;
          foundAction = drop.action;
        }
      });

      tokens.forEach((otherEl) => {
        otherEl.classList.toggle('hover-target', otherEl === foundTarget && foundAction !== 'fuse');
        otherEl.classList.toggle('hover-fuse', otherEl === foundTarget && foundAction === 'fuse');
      });

      activeDrag.targetToken = foundTarget;
    };

    const handleDragEnd = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);

      if (!activeDrag || activeDrag.element !== element) return;

      try {
        element.releasePointerCapture(activeDrag.pointerId);
      } catch (err) {
        /* capture is optional */
      }

      if (container) {
        container.style.zIndex = '';
      }

      element.classList.remove('dragging');
      element.style.transform = '';

      const currentDropzone =
        activeDrag.side === 'lhs' ? game.els.dropzoneLhs : game.els.dropzoneRhs;
      if (currentDropzone) {
        currentDropzone.classList.remove('drag-active');
      }

      if (activeDrag.targetToken) {
        const targetId = parseInt(activeDrag.targetToken.dataset.id, 10);
        const sourceId = activeDrag.item.id;
        const sideItems = itemsOnSide(game, activeDrag.side);
        const targetItem = sideItems.find((i) => i.id === targetId);
        const drop = resolveDrop(activeDrag.item, targetItem);

        if (drop && targetItem) {
          const rect = activeDrag.targetToken.getBoundingClientRect();
          const burstX = rect.left + rect.width / 2;
          const burstY = rect.top + rect.height / 2;
          const colorA = getTokenColors(activeDrag.item).glow;
          const colorB = getTokenColors(targetItem).glow;

          if (drop.action === 'annihilate') {
            game.particles.createDustExplosion(burstX, burstY, colorA, colorB);
            game.sound.playDustAnnihilation();
            setItemsOnSide(
              game,
              activeDrag.side,
              sideItems.filter((i) => i.id !== sourceId && i.id !== targetId)
            );
          } else {
            if (drop.action === 'fuse') {
              game.particles.createDustExplosion(burstX, burstY, colorA, '#ffffff');
              game.sound.playAddOperation();
            } else {
              game.particles.createDustExplosion(burstX, burstY, colorA, colorB);
              game.sound.playDustAnnihilation();
            }
            targetItem.num = drop.num;
            targetItem.den = drop.den;
            setItemsOnSide(
              game,
              activeDrag.side,
              sideItems.filter((i) => i.id !== sourceId)
            );
          }

          game.recordStep?.();
          game.renderAll();
        }
      } else {
        currentDropzone?.querySelectorAll('.game-token').forEach((t) => {
          t.classList.remove('hover-target', 'hover-fuse');
        });
      }

      activeDrag = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointercancel', handleDragEnd);
  });
}
