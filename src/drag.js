import { areOpposites, getTokenColors } from './algebra.js';

let activeDrag = null;

export function setupDrag(element, item, sideName, game) {
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
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
      targetToken: null,
    };

    element.classList.add('dragging');
  });

  element.addEventListener('pointermove', (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    element.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.18)`;

    const targetSideDropzone =
      activeDrag.side === 'lhs' ? game.els.dropzoneLhs : game.els.dropzoneRhs;
    const tokens = targetSideDropzone.querySelectorAll('.game-token:not(.dragging)');

    let foundTarget = null;
    tokens.forEach((otherEl) => {
      const oRect = otherEl.getBoundingClientRect();
      const isOver =
        e.clientX >= oRect.left &&
        e.clientX <= oRect.right &&
        e.clientY >= oRect.top &&
        e.clientY <= oRect.bottom;

      if (isOver && areOpposites(activeDrag.item.type, otherEl.dataset.type)) {
        foundTarget = otherEl;
      }
    });

    tokens.forEach((otherEl) => {
      if (otherEl === foundTarget) {
        otherEl.classList.add('hover-target');
      } else {
        otherEl.classList.remove('hover-target');
      }
    });

    activeDrag.targetToken = foundTarget;
  });

  const handleDragEnd = (e) => {
    if (!activeDrag || activeDrag.element !== element) return;

    try {
      element.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* capture is optional */
    }

    element.classList.remove('dragging');
    element.style.transform = '';

    if (activeDrag.targetToken) {
      const targetId = parseInt(activeDrag.targetToken.dataset.id, 10);
      const sourceId = activeDrag.item.id;
      const targetType = activeDrag.targetToken.dataset.type;

      const rect = activeDrag.targetToken.getBoundingClientRect();
      const burstX = rect.left + rect.width / 2;
      const burstY = rect.top + rect.height / 2;

      const colorA = getTokenColors(activeDrag.item.type).glow;
      const colorB = getTokenColors(targetType).glow;
      game.particles.createDustExplosion(burstX, burstY, colorA, colorB);
      game.sound.playDustAnnihilation();

      if (activeDrag.side === 'lhs') {
        game.lhsItems = game.lhsItems.filter((i) => i.id !== sourceId && i.id !== targetId);
      } else {
        game.rhsItems = game.rhsItems.filter((i) => i.id !== sourceId && i.id !== targetId);
      }

      game.renderAll();
    } else {
      const targetSideDropzone =
        activeDrag.side === 'lhs' ? game.els.dropzoneLhs : game.els.dropzoneRhs;
      targetSideDropzone.querySelectorAll('.game-token').forEach((t) => {
        t.classList.remove('hover-target');
      });
      element.style.transform = '';
    }

    activeDrag = null;
  };

  element.addEventListener('pointerup', handleDragEnd);
  element.addEventListener('pointercancel', handleDragEnd);
}
