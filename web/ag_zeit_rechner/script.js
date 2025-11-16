document.addEventListener('DOMContentLoaded', async () => {
    const storageKey = 'twNoblingProfiles';
    let profiles = JSON.parse(localStorage.getItem(storageKey)) || [];
    const profileTabs = document.getElementById('profileTabs');
    const profileTabContent = document.getElementById('profileTabContent');
    const addProfileBtn = document.getElementById('addProfileBtn');
    const mapStatus = document.getElementById('mapStatus');
    const reloadMapBtn = document.getElementById('reloadMapBtn');

    // Map data
    let playerMap = new Map();
    let villageMap = new Map();
    let villagesByName = new Map();
    let mapLoaded = false;

    // Cache Keys (wie in deinem Scanner)
    const CACHE_VILLAGE = 'nobling_village_dep20';
    const CACHE_PLAYER = 'nobling_player_dep20';
    const CACHE_TIME = 'nobling_cache_time_dep20';
    const VILLAGE_ORIG = 'https://dep20.die-staemme.de/map/village.txt';
    const PLAYER_ORIG = 'https://dep20.die-staemme.de/map/player.txt';

    function setMapStatus(msg, type = 'loading') {
        mapStatus.innerHTML = `<div class="alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}">${msg}</div>`;
    }

    function updateCacheInfo() {
        const time = localStorage.getItem(CACHE_TIME);
        if (time) {
            const date = new Date(parseInt(time));
            mapStatus.innerHTML += `<small class="cache-info">Cache: ${date.toLocaleString()} | <button class="btn btn-sm btn-outline-warning" onclick="forceReloadMap()">Neu laden</button></small>`;
        }
    }

    function saveCache(key, data) {
        try {
            localStorage.setItem(key, data);
            localStorage.setItem(CACHE_TIME, Date.now().toString());
        } catch (e) {
            console.warn("Cache voll:", e);
            setMapStatus('Cache voll – lösche LocalStorage manuell!', 'error');
        }
    }

    function getCache(key) {
        return localStorage.getItem(key);
    }

    async function fetchWithCache(origUrl, cacheKey) {
        const cached = getCache(cacheKey);
        if (cached) {
            setMapStatus('Karte aus Cache...');
            return cached;
        }
        const timedUrl = origUrl + '?t=' + Date.now();
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(timedUrl);
        setMapStatus('Lade Karte via Proxy...');
        try {
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            saveCache(cacheKey, text);
            setMapStatus('Karte geladen & gecacht!');
            return text;
        } catch (err) {
            throw new Error(`Proxy-Fehler: ${err.message}`);
        }
    }

    window.forceReloadMap = async function() {
        localStorage.removeItem(CACHE_VILLAGE);
        localStorage.removeItem(CACHE_PLAYER);
        localStorage.removeItem(CACHE_TIME);
        setMapStatus('Cache gelöscht – lade neu...');
        await loadMapData();
    };

    async function loadMapData() {
        try {
            const [villageText, playerText] = await Promise.all([
                fetchWithCache(VILLAGE_ORIG, CACHE_VILLAGE),
                fetchWithCache(PLAYER_ORIG, CACHE_PLAYER)
            ]);

            // Parse players (auch wenn nicht verwendet – für Erweiterung)
            playerText.split('\n').forEach(line => {
                if (line.trim()) {
                    const [id, name, ...rest] = line.split(',');
                    const decodedName = decodeURIComponent(name.replace(/\+/g, '%20'));
                    playerMap.set(id, decodedName);
                }
            });

            // Parse villages
            villageText.split('\n').forEach(line => {
                if (line.trim()) {
                    const parts = line.split(',');
                    const id = parts[0];
                    let encodedName = parts[1];
                    const x = parseInt(parts[2]);
                    const y = parseInt(parts[3]);
                    const playerId = parts[4];
                    encodedName = encodedName.replace(/\+/g, '%20');
                    const name = decodeURIComponent(encodedName);
                    const village = {id, name, x, y, playerId};
                    villageMap.set(id, village);
                    const lcName = name.toLowerCase();
                    if (!villagesByName.has(lcName)) {
                        villagesByName.set(lcName, []);
                    }
                    villagesByName.get(lcName).push(village);
                }
            });

            mapLoaded = true;
            setMapStatus(`Karte geladen: ${villageMap.size} Dörfer.`);
            updateCacheInfo();
        } catch(e) {
            mapLoaded = false;
            setMapStatus(`Fehler beim Laden: ${e.message}`, 'error');
            reloadMapBtn.style.display = 'inline-block';
        }
    }

    await loadMapData();
    reloadMapBtn.addEventListener('click', forceReloadMap);

    function saveProfiles() {
        localStorage.setItem(storageKey, JSON.stringify(profiles));
    }

    function parseTime(timeStr) {
        const [h, m, s] = timeStr.split(':').map(Number);
        return (h * 3600 + m * 60 + s) * 1000;
    }

    function msToHHMMSS(ms) {
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    function formatDateTime(date) {
        return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }

    function calculateStartTime(arrivalDate, runtimeMs) {
        const startDate = new Date(arrivalDate.getTime() - runtimeMs);
        return startDate;
    }

    async function loadVillage(profileIndex, isTarget, vIndex = null) {
        if (!mapLoaded) {
            alert('Karte wird geladen... Warte oder klicke "Karte neu laden".');
            return;
        }
        const inputId = isTarget ? `targetId-${profileIndex}` : `villageInput-${profileIndex}-${vIndex}`;
        const input = document.getElementById(inputId);
        const query = input.value.trim();
        if (!query) return;
        let village;
        if (/^\d+$/.test(query)) {
            village = villageMap.get(query);
        } else if (/^(\d+)\|(\d+)$/.test(query)) {
            const [, xStr, yStr] = query.match(/^(\d+)\|(\d+)$/);
            const x = parseInt(xStr), y = parseInt(yStr);
            village = { name: `${x}|${y}`, x, y, id: null };
        } else {
            const lcQuery = query.toLowerCase();
            const matches = villagesByName.get(lcQuery) || [];
            if (matches.length === 0) {
                alert('Kein Dorf gefunden.');
                return;
            } else if (matches.length > 1) {
                const names = matches.slice(0,3).map(v => v.name).join(', ');
                alert(`Mehrere Dörfer gefunden: ${names}. Verwende ID für Genauigkeit.`);
                return;
            } else {
                village = matches[0];
            }
        }
        if (!village) {
            alert('Dorf nicht gefunden.');
            return;
        }
        const profile = profiles[profileIndex];
        if (isTarget) {
            profile.target = village;
            profile.targetId = query;
            document.getElementById(`targetDisplay-${profileIndex}`).innerHTML = `<strong>${village.name} @ ${village.x}|${village.y}</strong>`;
        } else {
            profile.villages[vIndex].name = village.name;
            profile.villages[vIndex].x = village.x;
            profile.villages[vIndex].y = village.y;
            profile.villages[vIndex].id = village.id;
            profile.villages[vIndex].identifier = query;
            const display = document.querySelector(`#villageDisplay-${profileIndex}-${vIndex}`);
            display.innerHTML = `<strong>${village.name} @ ${village.x}|${village.y}</strong>`;
        }
        saveProfiles();
    }

    function renderProfileTab(profileIndex) {
        const profile = profiles[profileIndex];
        const tabId = `profile-${profileIndex}`;
        const tabPane = document.createElement('div');
        tabPane.className = 'tab-pane fade card p-3';
        tabPane.id = tabId;
        tabPane.role = 'tabpanel';

        const form = document.createElement('div');
        form.innerHTML = `
            <div class="mb-3">
                <label for="profileName-${profileIndex}" class="form-label">Profil-Name</label>
                <input type="text" class="form-control" id="profileName-${profileIndex}" value="${profile.name || 'Profil ' + (profileIndex + 1)}">
            </div>
            <div class="mb-3">
                <label for="arrivalTime-${profileIndex}" class="form-label">Gewünschte Ankunftszeit (YYYY-MM-DD HH:MM:SS)</label>
                <input type="text" class="form-control" id="arrivalTime-${profileIndex}" value="${profile.arrivalTime || ''}" placeholder="z.B. 2025-11-17 12:24:04">
            </div>
            <div class="mb-3">
                <label for="targetId-${profileIndex}" class="form-label">Ziel-Dorf (ID, Name oder x|y)</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="targetId-${profileIndex}" value="${profile.targetId || ''}" placeholder="z.B. 12345 oder Dorf Name oder 500|600">
                    <button class="btn btn-info" id="loadTarget-${profileIndex}"><i class="bi bi-download"></i> Laden</button>
                </div>
                <small id="targetDisplay-${profileIndex}" class="form-text">${profile.target ? `${profile.target.name} @ ${profile.target.x}|${profile.target.y}` : 'Nicht geladen'}</small>
            </div>
            <div class="mb-3">
                <label for="speed-${profileIndex}" class="form-label">Nobler-Geschwindigkeit (Minuten pro Feld)</label>
                <input type="number" class="form-control" id="speed-${profileIndex}" value="${profile.speed || 35}" min="1" step="0.1">
            </div>
            <h5>Angriffs-Dörfer</h5>
            <div id="villages-${profileIndex}"></div>
            <button class="btn btn-secondary mb-3" id="addVillage-${profileIndex}"><i class="bi bi-plus"></i> Dorf hinzufügen</button>
            <button class="btn btn-success mb-3" id="calculate-${profileIndex}"><i class="bi bi-calculator"></i> Berechnen</button>
            <button class="btn btn-danger mb-3" id="deleteProfile-${profileIndex}"><i class="bi bi-trash"></i> Profil löschen</button>
            <div id="results-${profileIndex}" class="mt-3"></div>
        `;
        tabPane.appendChild(form);

        const villagesContainer = form.querySelector(`#villages-${profileIndex}`);
        if (profile.villages) {
            profile.villages.forEach((village, vIndex) => renderVillageInput(profileIndex, vIndex, villagesContainer));
        }

        form.querySelector(`#addVillage-${profileIndex}`).addEventListener('click', () => {
            profile.villages = profile.villages || [];
            profile.villages.push({identifier: '', name: '', x: null, y: null, id: null});
            renderVillageInput(profileIndex, profile.villages.length - 1, villagesContainer);
            saveProfiles();
        });

        form.querySelector(`#calculate-${profileIndex}`).addEventListener('click', () => calculateProfile(profileIndex));
        form.querySelector(`#deleteProfile-${profileIndex}`).addEventListener('click', () => deleteProfile(profileIndex));

        form.querySelector(`#profileName-${profileIndex}`).addEventListener('input', (e) => {
            profile.name = e.target.value;
            updateTabNames();
            saveProfiles();
        });

        form.querySelector(`#arrivalTime-${profileIndex}`).addEventListener('input', (e) => {
            profile.arrivalTime = e.target.value;
            saveProfiles();
        });

        const targetInput = form.querySelector(`#targetId-${profileIndex}`);
        targetInput.addEventListener('input', (e) => {
            profile.targetId = e.target.value;
            saveProfiles();
        });
        form.querySelector(`#loadTarget-${profileIndex}`).addEventListener('click', () => loadVillage(profileIndex, true));

        const speedInput = form.querySelector(`#speed-${profileIndex}`);
        speedInput.addEventListener('input', (e) => {
            profile.speed = parseFloat(e.target.value) || 35;
            saveProfiles();
        });

        return tabPane;
    }

    function renderVillageInput(profileIndex, vIndex, container) {
        const village = profiles[profileIndex].villages[vIndex];
        const div = document.createElement('div');
        div.className = 'row mb-2 border bg-secondary bg-opacity-10 p-2';
        div.innerHTML = `
            <div class="col-4">
                <input type="text" class="form-control" id="villageInput-${profileIndex}-${vIndex}" placeholder="ID, Name oder x|y" value="${village.identifier || ''}">
            </div>
            <div class="col-2">
                <button class="btn btn-info btn-sm w-100" onclick="loadVillage(${profileIndex}, false, ${vIndex})"><i class="bi bi-download"></i> Laden</button>
            </div>
            <div class="col-4">
                <small id="villageDisplay-${profileIndex}-${vIndex}" class="form-text">${village.name ? `<strong>${village.name} @ ${village.x}|${village.y}</strong>` : 'Nicht geladen'}</small>
            </div>
            <div class="col-2">
                <button class="btn btn-outline-danger btn-sm w-100" onclick="deleteVillage(${profileIndex}, ${vIndex})"><i class="bi bi-trash"></i></button>
            </div>
        `;
        container.appendChild(div);

        const input = div.querySelector('input');
        input.addEventListener('input', (e) => {
            village.identifier = e.target.value;
            saveProfiles();
        });
    }

    function deleteVillage(profileIndex, vIndex) {
        profiles[profileIndex].villages.splice(vIndex, 1);
        renderProfileVillages(profileIndex);
        saveProfiles();
    }

    function renderProfileVillages(profileIndex) {
        const container = document.querySelector(`#villages-${profileIndex}`);
        container.innerHTML = '';
        const profile = profiles[profileIndex];
        if (profile.villages) {
            profile.villages.forEach((village, vIndex) => renderVillageInput(profileIndex, vIndex, container));
        }
    }

    function calculateProfile(profileIndex) {
        const profile = profiles[profileIndex];
        const resultsDiv = document.querySelector(`#results-${profileIndex}`);
        resultsDiv.innerHTML = '';

        if (!mapLoaded) {
            resultsDiv.innerHTML = '<div class="alert alert-warning">Karte nicht geladen! Klicke "Karte neu laden".</div>';
            return;
        }

        if (!profile.target || !profile.target.x || !profile.target.y) {
            resultsDiv.innerHTML = '<div class="alert alert-warning">Ziel-Dorf nicht geladen! Lade es zuerst.</div>';
            return;
        }

        const speed = profile.speed || 35;
        const arrivalStr = profile.arrivalTime;
        if (!arrivalStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            resultsDiv.innerHTML = '<div class="alert alert-danger">Ungültiges Ankunftszeit-Format! Verwende YYYY-MM-DD HH:MM:SS.</div>';
            return;
        }

        const arrivalDate = new Date(arrivalStr.replace(' ', 'T') + ':00'); // Assume local time
        if (isNaN(arrivalDate)) {
            resultsDiv.innerHTML = '<div class="alert alert-danger">Ungültige Ankunftszeit!</div>';
            return;
        }

        let table = '<table class="table table-dark"><thead><tr><th>Dorf</th><th>Koordinaten</th><th>Entfernung</th><th>Laufzeit</th><th>Startzeit</th></tr></thead><tbody>';
        profile.villages.forEach(village => {
            if (!village.x || !village.y) {
                table += `<tr class="table-warning"><td>${village.name || 'Unbenannt'}</td><td>-</td><td>-</td><td>Dorf nicht geladen!</td><td>-</td></tr>`;
                return;
            }
            const dx = village.x - profile.target.x;
            const dy = village.y - profile.target.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const runtimeMs = dist * speed * 60 * 1000;
            const runtimeStr = msToHHMMSS(runtimeMs);
            const startDate = calculateStartTime(arrivalDate, runtimeMs);
            const startStr = formatDateTime(startDate);
            table += `<tr><td>${village.name || 'Unbenannt'}</td><td>${village.x}|${village.y}</td><td>${dist.toFixed(1)}</td><td>${runtimeStr}</td><td>${startStr}</td></tr>`;
        });
        table += '</tbody></table>';
        resultsDiv.innerHTML = table;
    }

    function renderOverviewTab() {
        const tabId = 'overview';
        const tabPane = document.createElement('div');
        tabPane.className = 'tab-pane fade card p-3';
        tabPane.id = tabId;
        tabPane.role = 'tabpanel';

        const content = document.createElement('div');
        content.innerHTML = '<h5>Übersicht aller Angriffe</h5><div id="overviewResults"></div>';
        tabPane.appendChild(content);

        return tabPane;
    }

    function updateOverview() {
        const overviewResults = document.querySelector('#overviewResults');
        if (!overviewResults) return;

        if (!mapLoaded) {
            overviewResults.innerHTML = '<p>Karte nicht geladen – Übersicht unvollständig.</p>';
            return;
        }

        let allAttacks = [];
        profiles.forEach((profile, pIndex) => {
            if (!profile.target || !profile.target.x || !profile.target.y) return;
            const arrivalDate = new Date(profile.arrivalTime.replace(' ', 'T') + ':00');
            if (isNaN(arrivalDate)) return;
            const speed = profile.speed || 35;
            profile.villages.forEach(village => {
                if (!village.x || !village.y) return;
                const dx = village.x - profile.target.x;
                const dy = village.y - profile.target.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const runtimeMs = dist * speed * 60 * 1000;
                const startDate = calculateStartTime(arrivalDate, runtimeMs);
                const runtimeStr = msToHHMMSS(runtimeMs);
                allAttacks.push({
                    profile: profile.name || `Profil ${pIndex + 1}`,
                    village: village.name || 'Unbenannt',
                    coords: `${village.x}|${village.y}`,
                    runtimeStr,
                    startTime: startDate,
                    startTimeStr: formatDateTime(startDate),
                    arrival: formatDateTime(arrivalDate)
                });
            });
        });

        allAttacks.sort((a, b) => a.startTime - b.startTime);

        let table = '<table class="table table-dark"><thead><tr><th>Profil</th><th>Dorf</th><th>Koords</th><th>Laufzeit</th><th>Startzeit</th><th>Ankunft</th></tr></thead><tbody>';
        allAttacks.forEach(attack => {
            table += `<tr><td>${attack.profile}</td><td>${attack.village}</td><td>${attack.coords}</td><td>${attack.runtimeStr}</td><td>${attack.startTimeStr}</td><td>${attack.arrival}</td></tr>`;
        });
        table += '</tbody></table>';
        overviewResults.innerHTML = allAttacks.length ? table : '<p>Keine gültigen Angriffe vorhanden.</p>';
    }

    function updateTabNames() {
        Array.from(profileTabs.querySelectorAll('.nav-item')).forEach((tab, index) => {
            if (tab.id !== 'overviewTab') {
                const btn = tab.querySelector('button');
                btn.textContent = profiles[index].name || `Profil ${index + 1}`;
            }
        });
    }

    function deleteProfile(profileIndex) {
        profiles.splice(profileIndex, 1);
        saveProfiles();
        renderTabs();
    }

    function renderTabs() {
        profileTabs.innerHTML = '';
        profileTabContent.innerHTML = '';

        profiles.forEach((profile, index) => {
            profile.villages = profile.villages || [];
            const tab = document.createElement('li');
            tab.className = 'nav-item';
            tab.innerHTML = `<button class="nav-link ${index === 0 ? 'active' : ''}" id="tab-${index}" data-bs-toggle="tab" data-bs-target="#profile-${index}" type="button" role="tab">${profile.name || 'Profil ' + (index + 1)}</button>`;
            profileTabs.appendChild(tab);

            const tabPane = renderProfileTab(index);
            if (index === 0) tabPane.classList.add('show', 'active');
            profileTabContent.appendChild(tabPane);
        });

        // Übersicht-Tab
        const overviewTab = document.createElement('li');
        overviewTab.className = 'nav-item';
        overviewTab.id = 'overviewTab';
        overviewTab.innerHTML = `<button class="nav-link" id="tab-overview" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">Übersicht</button>`;
        profileTabs.appendChild(overviewTab);

        const overviewPane = renderOverviewTab();
        profileTabContent.appendChild(overviewPane);

        const tabLinks = document.querySelectorAll('.nav-link');
        tabLinks.forEach(link => {
            link.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'tab-overview') updateOverview();
            });
        });

        updateTabNames();
        updateOverview();
    }

    addProfileBtn.addEventListener('click', () => {
        profiles.push({ name: '', arrivalTime: '', targetId: '', target: null, speed: 35, villages: [] });
        saveProfiles();
        renderTabs();
        const newIndex = profiles.length - 1;
        const newTab = document.querySelector(`#tab-${newIndex}`);
        new bootstrap.Tab(newTab).show();
    });

    if (profiles.length === 0) {
        profiles.push({ name: '', arrivalTime: '', targetId: '', target: null, speed: 35, villages: [] });
        saveProfiles();
    }

    renderTabs();
    window.loadVillage = loadVillage; // Global for onclick
    window.deleteVillage = deleteVillage;
});
