document.addEventListener('DOMContentLoaded', async () => {
    // DOM references
    const els = {
        rpiId: document.getElementById('rpiId'),
        streamerEnabled: document.getElementById('streamerEnabled'),
        streamerUrl: document.getElementById('streamerUrl'),
        streamerStatus: document.getElementById('streamerStatus'),
        printerEnabled: document.getElementById('printerEnabled'),
        printerName: document.getElementById('printerName'),
        printerStatus: document.getElementById('printerStatus'),
        frameEnabled: document.getElementById('frameEnabled'),
        framePath: document.getElementById('framePath'),
        frameStatus: document.getElementById('frameStatus'),
        reloadFrame: document.getElementById('reloadFrame'),
        framePreview: document.getElementById('framePreview'),
        saveConfig: document.getElementById('saveConfig'),
        saveStatus: document.getElementById('saveStatus'),
        packagePictures: document.getElementById('packagePictures'),
        cleanPictures: document.getElementById('cleanPictures'),
        actionStatus: document.getElementById('actionStatus')
    };

    // ==========================================
    // Load current config from server
    // ==========================================
    async function loadConfig() {
        try {
            const res = await fetch('/api/admin/config');
            const config = await res.json();

            els.rpiId.value = config.rpiId;

            // Streamer
            els.streamerEnabled.checked = config.streamer.enabled;
            els.streamerUrl.value = config.streamer.url || '';
            updateStatusBadge(els.streamerStatus, config.streamer.enabled, config.streamer.connected ? 'Connecté' : null);

            // Printer
            els.printerEnabled.checked = config.printer.enabled;
            els.printerName.value = config.printer.name || '';
            updateStatusBadge(els.printerStatus, config.printer.enabled, config.printer.available ? 'Disponible' : null);

            // Frame
            els.frameEnabled.checked = config.printFrame.enabled;
            els.framePath.value = config.printFrame.framePath || '';
            updateStatusBadge(els.frameStatus, config.printFrame.enabled, config.printFrame.available ? 'Chargé' : null);

            updateFramePreview();
        } catch (err) {
            showStatus(els.saveStatus, '❌ Impossible de charger la config: ' + err.message, 'error');
        }
    }

    // ==========================================
    // Status badge helper
    // ==========================================
    function updateStatusBadge(el, enabled, detail) {
        if (!enabled) {
            el.textContent = '⚫ Désactivé';
            el.className = 'status-badge badge-off';
        } else if (detail) {
            el.textContent = '🟢 ' + detail;
            el.className = 'status-badge badge-on';
        } else {
            el.textContent = '🟡 Activé';
            el.className = 'status-badge badge-warn';
        }
    }

    // ==========================================
    // Frame preview
    // ==========================================
    function updateFramePreview() {
        const container = els.framePreview;
        if (els.framePath.value && els.frameEnabled.checked) {
            container.innerHTML = '<img src="/api/admin/frame-preview?' + Date.now() +
                '" alt="Aperçu du cadre" onerror="this.parentElement.innerHTML=\'<p class=frame-preview-placeholder>Cadre introuvable</p>\'" />';
        } else {
            container.innerHTML = '<p class="frame-preview-placeholder">Aucun cadre configuré</p>';
        }
    }

    // ==========================================
    // Status messages
    // ==========================================
    function showStatus(el, message, type = 'info') {
        el.textContent = message;
        el.className = el.id === 'actionStatus' ? 'action-status status-' + type : 'save-status status-' + type;
        if (type === 'success') {
            setTimeout(() => { el.textContent = ''; }, 4000);
        }
    }

    // ==========================================
    // Save configuration
    // ==========================================
    els.saveConfig.addEventListener('click', async () => {
        els.saveConfig.disabled = true;
        showStatus(els.saveStatus, '⏳ Enregistrement...', 'info');

        try {
            const payload = {
                streamer: {
                    enabled: els.streamerEnabled.checked,
                    url: els.streamerUrl.value
                },
                printer: {
                    enabled: els.printerEnabled.checked,
                    name: els.printerName.value
                },
                printFrame: {
                    enabled: els.frameEnabled.checked,
                    framePath: els.framePath.value || null
                }
            };

            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                showStatus(els.saveStatus, '✅ Configuration enregistrée & propagée aux clients', 'success');

                // Update status badges from returned config
                const cfg = data.config;
                updateStatusBadge(els.streamerStatus, cfg.streamer.enabled, cfg.streamer.connected ? 'Connecté' : null);
                updateStatusBadge(els.printerStatus, cfg.printer.enabled, cfg.printer.available ? 'Disponible' : null);
                updateStatusBadge(els.frameStatus, cfg.printFrame.enabled, cfg.printFrame.available ? 'Chargé' : null);
                updateFramePreview();
            } else {
                showStatus(els.saveStatus, '❌ Erreur: ' + (data.error || 'Inconnue'), 'error');
            }
        } catch (err) {
            showStatus(els.saveStatus, '❌ Erreur réseau: ' + err.message, 'error');
        } finally {
            els.saveConfig.disabled = false;
        }
    });

    // ==========================================
    // Reload frame
    // ==========================================
    els.reloadFrame.addEventListener('click', async () => {
        els.reloadFrame.disabled = true;
        showStatus(els.actionStatus, '⏳ Rechargement du cadre...', 'info');

        try {
            const res = await fetch('/api/admin/reload-frame', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                const msg = data.available
                    ? '✅ Cadre rechargé avec succès'
                    : '⚠️ Cadre rechargé mais non disponible';
                showStatus(els.actionStatus, msg, data.available ? 'success' : 'warning');
                updateStatusBadge(els.frameStatus, true, data.available ? 'Chargé' : null);
                updateFramePreview();
            } else {
                showStatus(els.actionStatus, '❌ ' + (data.error || 'Erreur'), 'error');
            }
        } catch (err) {
            showStatus(els.actionStatus, '❌ Erreur: ' + err.message, 'error');
        } finally {
            els.reloadFrame.disabled = false;
        }
    });

    // ==========================================
    // Package pictures → download .tar.gz
    // ==========================================
    els.packagePictures.addEventListener('click', async () => {
        els.packagePictures.disabled = true;
        showStatus(els.actionStatus, '⏳ Création de l\'archive...', 'info');

        try {
            const res = await fetch('/api/admin/package-pictures', { method: 'POST' });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur serveur');
            }

            // Trigger browser download
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            const disposition = res.headers.get('content-disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/);
            a.download = match ? match[1] : 'pictures.tar.gz';
            a.href = url;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus(els.actionStatus, '✅ Archive téléchargée', 'success');
        } catch (err) {
            showStatus(els.actionStatus, '❌ Erreur: ' + err.message, 'error');
        } finally {
            els.packagePictures.disabled = false;
        }
    });

    // ==========================================
    // Clean pictures (with confirmation)
    // ==========================================
    els.cleanPictures.addEventListener('click', async () => {
        const confirmed = confirm(
            '⚠️ Supprimer TOUTES les photos ?\n\n' +
            'Cela videra les dossiers :\n' +
            '• pictures/\n' +
            '• display/\n' +
            '• thumbnails/\n' +
            '• print/\n' +
            '• print-framed/\n\n' +
            'Cette action est irréversible !'
        );
        if (!confirmed) return;

        els.cleanPictures.disabled = true;
        showStatus(els.actionStatus, '⏳ Suppression en cours...', 'info');

        try {
            const res = await fetch('/api/admin/clean-pictures', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showStatus(els.actionStatus, `✅ ${data.deleted} fichier(s) supprimé(s)`, 'success');
            } else {
                showStatus(els.actionStatus, '❌ ' + (data.error || 'Erreur'), 'error');
            }
        } catch (err) {
            showStatus(els.actionStatus, '❌ Erreur: ' + err.message, 'error');
        } finally {
            els.cleanPictures.disabled = false;
        }
    });

    // ==========================================
    // Live preview updates on toggle/input change
    // ==========================================
    els.framePath.addEventListener('change', updateFramePreview);
    els.frameEnabled.addEventListener('change', updateFramePreview);

    // ==========================================
    // Initial load
    // ==========================================
    await loadConfig();
});
