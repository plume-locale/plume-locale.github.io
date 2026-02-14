/**
 * DIFF MODULE - HANDLERS
 * Attaches event listeners for UI interactions.
 */

const DiffHandlers = {
    init() {
        const selectOld = document.getElementById('diffVersionOld');
        const selectNew = document.getElementById('diffVersionNew');
        const btnUnified = document.getElementById('btnDiffUnified');
        const btnSide = document.getElementById('btnDiffSide');
        const btnClose = document.getElementById('btnCloseDiffModal');

        if (selectOld) {
            selectOld.addEventListener('change', () => {
                DiffViewModel.setVersions(Number(selectOld.value), Number(selectNew.value));
            });
        }

        if (selectNew) {
            selectNew.addEventListener('change', () => {
                DiffViewModel.setVersions(Number(selectOld.value), Number(selectNew.value));
            });
        }

        if (btnUnified) {
            btnUnified.addEventListener('click', () => {
                DiffViewModel.setViewMode('unified');
                DiffView.updateViewModeButtons('unified');
            });
        }

        if (btnSide) {
            btnSide.addEventListener('click', () => {
                DiffViewModel.setViewMode('side');
                DiffView.updateViewModeButtons('side');
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                DiffView.closeModal();
            });
        }
    }
};
