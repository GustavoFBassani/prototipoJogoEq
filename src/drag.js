import { areOpposites, getTokenColors } from './algebra.js';

let activeDrag = null;

export function setupDrag(element, group, sideName, game) {
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      element.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture is optional */
    }

    activeDrag = {
      element,
      group,
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

      if (isOver && areOpposites(activeDrag.group.type, otherEl.dataset.type)) {
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
      const targetType = activeDrag.targetToken.dataset.type;
      const sourceType = activeDrag.group.type;

      const rect = activeDrag.targetToken.getBoundingClientRect();
      const burstX = rect.left + rect.width / 2;
      const burstY = rect.top + rect.height / 2;

      const colorA = getTokenColors(sourceType).glow;
      const colorB = getTokenColors(targetType).glow;
      game.particles.createDustExplosion(burstX, burstY, colorA, colorB);
      game.sound.playDustAnnihilation();

      // Pega a referência correta do array do lado (lhs ou rhs)
      const itemsArray = activeDrag.side === 'lhs' ? game.lhsItems : game.rhsItems;

      // Conta quantos itens de cada tipo existem neste lado
      const sourceItems = itemsArray.filter((i) => i.type === sourceType);
      const targetItems = itemsArray.filter((i) => i.type === targetType);

      const sourceCount = sourceItems.length;
      const targetCount = targetItems.length;

      // Calcula o saldo final (aniquilação total ou parcial em uma única jogada)
      if (sourceCount === targetCount) {
        // Remove todos de ambos os tipos
        const filtered = itemsArray.filter((i) => i.type !== sourceType && i.type !== targetType);
        if (activeDrag.side === 'lhs') game.lhsItems = filtered;
        else game.rhsItems = filtered;
      } else if (sourceCount > targetCount) {
        // Sobram itens da origem; remove todos do alvo e reduz a quantidade da origem
        const toRemoveCount = targetCount;
        let removed = 0;
        const filtered = itemsArray.filter((i) => {
          if (i.type === targetType) return false;
          if (i.type === sourceType && removed < toRemoveCount) {
            removed++;
            return false;
          }
          return true;
        });
        if (activeDrag.side === 'lhs') game.lhsItems = filtered;
        else game.rhsItems = filtered;
      } else {
        // Sobram itens do alvo; remove todos da origem e reduz a quantidade do alvo
        const toRemoveCount = sourceCount;
        let removed = 0;
        const filtered = itemsArray.filter((i) => {
          if (i.type === sourceType) return false;
          if (i.type === targetType && removed < toRemoveCount) {
            removed++;
            return false;
          }
          return true;
        });
        if (activeDrag.side === 'lhs') game.lhsItems = filtered;
        else game.rhsItems = filtered;
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