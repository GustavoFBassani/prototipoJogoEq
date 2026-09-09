export function createDialog(els) {
  function cleanupHandlers(handleConfirm, handleCancel) {
    els.btnInputConfirm.removeEventListener('click', handleConfirm);
    els.btnInputCancel.removeEventListener('click', handleCancel);
  }

  return function showCustomDialog({
    title,
    desc,
    icon,
    isAlert = false,
    defaultValue = '2',
    onConfirm,
  }) {
    els.inputModalTitle.textContent = title;
    els.inputModalDesc.textContent = desc;
    els.inputModalIcon.textContent = icon || '🧪';

    if (isAlert) {
      els.inputModalFieldContainer.style.display = 'none';
      els.btnInputCancel.style.display = 'none';
      els.btnInputConfirm.textContent = 'Entendido';
    } else {
      els.inputModalFieldContainer.style.display = 'block';
      els.btnInputCancel.style.display = 'flex';
      els.btnInputConfirm.textContent = 'Confirmar';
      els.inputModalField.value = defaultValue;
      setTimeout(() => els.inputModalField.focus(), 100);
    }

    els.inputModal.classList.add('active');

    const handleConfirm = () => {
      const val = parseInt(els.inputModalField.value, 10);
      cleanupHandlers(handleConfirm, handleCancel);
      els.inputModal.classList.remove('active');
      if (onConfirm) onConfirm(val);
    };

    const handleCancel = () => {
      cleanupHandlers(handleConfirm, handleCancel);
      els.inputModal.classList.remove('active');
    };

    els.btnInputConfirm.addEventListener('click', handleConfirm);
    els.btnInputCancel.addEventListener('click', handleCancel);
  };
}
