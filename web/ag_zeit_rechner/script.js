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
    let villagesByCoords = new Map();
    let mapLoaded = false;

    // URLs
    const VILLAGE_ORIG = 'https://dep20.die-staemme.de/map/village.txt';
    const PLAYER_ORIG = 'https://dep20.die-staemme.de/map/player.txt';

    function setMapStatus(msg, type = 'info') {
        mapStatus.innerHTML = `<div class="alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}">${msg}</div>`;
    }

    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
    }

    async function loadMapData(forceReload = true) {
        setMapStatus('Lade aktuelle Karte via Proxy...');
        try {
            const timedVillage = VILLAGE_ORIG + '?t=' + Date.now();
            const timedPlayer = PLAYER_ORIG + '?t=' + Date.now();
            const [villageRes, playerRes] = await Promise.all([
                fetch('https://corsproxy.io/?' + encodeURIComponent(timedVillage)),
                fetch('https://corsproxy.io/?' + encodeURIComponent(timedPlayer))
            ]);
            if (!villageRes.ok || !playerRes.ok) throw new Error(`HTTP ${villageRes.status || playerRes.status}`);
            const [villageText, playerText] = await Promise.all([villageRes.text(), playerRes.text()]);

            // Parse players – ID als String
            playerMap.clear();
            playerText.split('\n').forEach(line => {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const id = String(parts[0].trim());
                        const encodedName = parts[1].trim();
                        const decodedName = decodeURIComponent(encodedName.replace(/\+/g, '%20').replace(/%27/g, "'"));
                        playerMap.set(id, decodedName);
                    }
                }
            });

            // Parse villages – mit Koords-Map
            villageMap.clear();
            villagesByName.clear();
            villagesByCoords.clear();
            villageText.split('\n').forEach(line => {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length >= 5) {
                        const id = parts[0].trim();
                        let encodedName = parts[1].trim();
                        const x = parseInt(parts[2].trim());
                        const y = parseInt(parts[3].trim());
                        const playerId = String(parts[4].trim());
                        encodedName = encodedName.replace(/\+/g, '%20');
                        const name = decodeURIComponent(encodedName);
                        const village = {id, name, x, y, playerId};
                        villageMap.set(id, village);
                        const coordsKey = `${x}|${y}`;
                        villagesByCoords.set(coordsKey, village);
                        const lcName = name.toLowerCase();
                        if (!villagesByName.has(lcName)) {
                            villagesByName.set(lcName, []);
                        }
                        villagesByName.get(lcName).push(village);
                    }
                }
            });

            mapLoaded = true;
            setMapStatus(`Karte aktualisiert: ${villageMap.size} Dörfer, ${playerMap.size} Spieler (Stand: ${new Date().toLocaleString('de-DE')}).`, 'success');
        } catch(e) {
            mapLoaded = false;
            setMapStatus(`Fehler beim Laden: ${e.message}. Versuche Proxy oder später.`, 'error');
        }
    }

    window.forceReloadMap = async () => await loadMapData(true);

    await loadMapData();

    reloadMapBtn.addEventListener('click', forceReloadMap);

    function saveProfiles() {
        localStorage.setItem(storageKey, JSON.stringify(profiles));
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
        return new Date(arrivalDate.getTime() - runtimeMs);
    }

    function parseArrivalTime(timeStr) {
        const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2}))?/);
        if (!match) return null;
        const [, datePart, timePart, secPart] = match;
        const fullTime = `${datePart}T${timePart}${secPart ? ':' + secPart : ':00'}`;
        const date = new Date(fullTime);
        if (isNaN(date.getTime()) || date < new Date()) {
            return null;
        }
        return date;
    }

    async function loadVillage(profileIndex, isTarget, vIndex = null) {
        if (!mapLoaded) {
            alert('Karte lädt... Warte oder klicke "Karte neu laden".');
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
            const coordsKey = query;
            village = villagesByCoords.get(coordsKey);
            if (!village) {
                alert(`Koordinaten ${query} nicht gefunden.`);
                return;
            }
        } else {
            const lcQuery = query.toLowerCase();
            const matches = villagesByName.get(lcQuery) || [];
            if (matches.length === 0) {
                alert('Kein Dorf gefunden.');
                return;
            } else if (matches.length > 1) {
                const names = matches.slice(0,3).map(v => v.name).join(', ');
                alert(`Mehrere Dörfer: ${names}. Verwende ID.`);
                return;
            } else {
                village = matches[0];
            }
        }
        if (!village) {
            alert('Dorf nicht gefunden.');
            return;
        }
        const playerIdStr = String(village.playerId || '');
        const playerName = playerIdStr && playerMap.has(playerIdStr) ? playerMap.get(playerIdStr) : 'Unbekannt (keine ID)';
        console.log(`Player lookup: ID "${playerIdStr}" -> Name "${playerName}"`);
        village.playerName = playerName;
        const profile = profiles[profileIndex];
        if (isTarget) {
            profile.target = village;
            profile.targetId = query;
            document.getElementById(`targetDisplay-${profileIndex}`).innerHTML = `<strong>${village.name} von ${playerName} @ ${village.x}|${village.y}</strong>`;
        } else {
            profile.villages[vIndex].name = village.name;
            profile.villages[vIndex].playerName = playerName;
            profile.villages[vIndex].x = village.x;
            profile.villages[vIndex].y = village.y;
            profile.villages[vIndex].id = village.id;
            profile.villages[vIndex].identifier = query;
            const display = document.querySelector(`#villageDisplay-${profileIndex}-${vIndex}`);
            display.innerHTML = `<strong>${village.name} von ${playerName} @ ${village.x}|${village.y}</strong>`;
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

        const defaultTime = profile.arrivalTime || getCurrentDateTime();
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="mb-3">
                <label for="profileName-${profileIndex}" class="form-label">Profil-Name</label>
                <input type="text" class="form-control" id="profileName-${profileIndex}" value="${profile.name || 'Profil ' + (profileIndex + 1)}">
            </div>
            <div class="mb-3">
                <label for="arrivalTime-${profileIndex}" class="form-label">Gewünschte Ankunftszeit</label>
                <input type="datetime-local" class="form-control" id="arrivalTime-${profileIndex}" value="${defaultTime.replace(/:\d{2}$/, '')}" step="1">
                <small class="form-text">Klicke für Kalender/Uhrzeit. Format: YYYY-MM-DDTHH:MM (Sekunden auto=00).</small>
            </div>
            <div class="mb-3">
                <label for="targetId-${profileIndex}" class="form-label">Ziel-Dorf (ID, Name oder x|y)</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="targetId-${profileIndex}" value="${profile.targetId || ''}" placeholder="z.B. 12345 oder Dorf Name oder 500|600">
                    <button class="btn btn-info" id="loadTarget-${profileIndex}"><i class="bi bi-download"></i> Laden</button>
                </div>
                <small id="targetDisplay-${profileIndex}" class="form-text">${profile.target ? `<strong>${profile.target.name} von ${profile.target.playerName} @ ${profile.target.x}|${profile.target.y}</strong>` : 'Nicht geladen'}</small>
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
            profile.villages.push({identifier: '', name: '', playerName: '', x: null, y: null, id: null, speed: 35});
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

        const arrivalInput = form.querySelector(`#arrivalTime-${profileIndex}`);
        arrivalInput.addEventListener('change', (e) => {
            let val = e.target.value;
            if (val) {
                val = val.replace('T', ' ') + ':00';
                profile.arrivalTime = val;
            }
            saveProfiles();
        });

        const targetInput = form.querySelector(`#targetId-${profileIndex}`);
        targetInput.addEventListener('input', (e) => {
            profile.targetId = e.target.value;
            saveProfiles();
        });
        form.querySelector(`#loadTarget-${profileIndex}`).addEventListener('click', () => loadVillage(profileIndex, true));

        return tabPane;
    }

    function renderVillageInput(profileIndex, vIndex, container) {
        const village = profiles[profileIndex].villages[vIndex];
        const div = document.createElement('div');
        div.className = 'row mb-2 border bg-secondary bg-opacity-10 p-2';
        div.innerHTML = `
            <div class="col-3">
                <input type="text" class="form-control" id="villageInput-${profileIndex}-${vIndex}" placeholder="ID, Name oder x|y" value="${village.identifier || ''}">
            </div>
            <div class="col-2">
                <button class="btn btn-info btn-sm w-100" onclick="loadVillage(${profileIndex}, false, ${vIndex})"><i class="bi bi-download"></i> Laden</button>
            </div>
            <div class="col-3">
                <small id="villageDisplay-${profileIndex}-${vIndex}" class="form-text">${village.name ? `<strong>${village.name} von ${village.playerName} @ ${village.x}|${village.y}</strong>` : 'Nicht geladen'}</small>
            </div>
            <div class="col-2">
                <input type="number" class="form-control" id="villageSpeed-${profileIndex}-${vIndex}" placeholder="AG-Speed" value="${village.speed || 35}" min="1" step="0.1">
            </div>
            <div class="col-2">
                <button class="btn btn-outline-danger btn-sm w-100" onclick="deleteVillage(${profileIndex}, ${vIndex})"><i class="bi bi-trash"></i></button>
            </div>
        `;
        container.appendChild(div);

        const input = div.querySelector('#villageInput-' + profileIndex + '-' + vIndex);
        input.addEventListener('input', (e) => {
            village.identifier = e.target.value;
            saveProfiles();
        });

        const speedInput = div.querySelector('#villageSpeed-' + profileIndex + '-' + vIndex);
        speedInput.addEventListener('input', (e) => {
            village.speed = parseFloat(e.target.value) || 35;
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
            resultsDiv.innerHTML = '<div class="alert alert-warning">Ziel-Dorf nicht geladen!</div>';
            return;
        }

        const arrivalStr = profile.arrivalTime;
        const arrivalDate = parseArrivalTime(arrivalStr);
        if (!arrivalDate) {
            resultsDiv.innerHTML = `<div class="alert alert-danger">Ungültige Ankunftszeit! Verwende z.B. ${getCurrentDateTime()}. (Muss zukünftig sein)</div>`;
            return;
        }

        let table = '<table class="table table-dark"><thead><tr>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 0)">Ziel-Dorfname</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 1)">Ziel-Koordinaten</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 2)">Ziel-Spieler</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 3)">Dorf</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 4)">Spieler</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 5)">Koordinaten</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 6)">AG-Speed</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 7)">Entfernung</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 8)">Laufzeit</th>' +
            '<th onclick="sortTable(`results-table-${profileIndex}`, 9)">Startzeit</th>' +
            '</tr></thead><tbody id="results-table-body-' + profileIndex + '">';

        let validVillages = 0;
        profile.villages.forEach(village => {
            if (!village.x || !village.y) {
                table += `<tr class="table-warning"><td>${profile.target.name || '-'} </td><td>${profile.target.x}|${profile.target.y}</td><td>${profile.target.playerName || 'Unbekannt'}</td><td>${village.name || 'Unbenannt'}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>Dorf nicht geladen!</td><td>-</td></tr>`;
                return;
            }
            const speed = village.speed || 35;
            const dx = village.x - profile.target.x;
            const dy = village.y - profile.target.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const runtime_sec = Math.round(dist * speed * 60); // Fix: Round to nearest second for accuracy
            const runtimeMs = runtime_sec * 1000;
            const runtimeStr = msToHHMMSS(runtimeMs);
            const startDate = calculateStartTime(arrivalDate, runtimeMs);
            const startStr = formatDateTime(startDate);
            table += `<tr><td>${profile.target.name || '-'} </td><td>${profile.target.x}|${profile.target.y}</td><td>${profile.target.playerName || 'Unbekannt'}</td><td>${village.name || 'Unbenannt'}</td><td>${village.playerName || 'Unbekannt'}</td><td>${village.x}|${village.y}</td><td>${speed}</td><td>${dist.toFixed(2)}</td><td>${runtimeStr}</td><td>${startStr}</td></tr>`; // dist.toFixed(2) for precision
            validVillages++;
        });
        table += '</tbody></table>';
        resultsDiv.innerHTML = validVillages > 0 ? table : '<div class="alert alert-info">Keine gültigen Dörfer zum Berechnen.</div>';
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

    function sortTable(tableId, column, asc = true) {
        const tbody = document.getElementById(tableId + '-body') || document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = document.querySelector(`#${tableId.replace('-body', '')} th:nth-child(${column + 1})`);
        if (!header) return;

        rows.sort((a, b) => {
            const aText = a.cells[column].textContent.trim();
            const bText = b.cells[column].textContent.trim();
            if (column === 5) { // AG-Speed numeric
                return asc ? parseFloat(aText) - parseFloat(bText) : parseFloat(bText) - parseFloat(aText);
            } else if (column === 6) { // Entfernung numeric
                return asc ? parseFloat(aText) - parseFloat(bText) : parseFloat(bText) - parseFloat(aText);
            } else if (column === 7) { // Laufzeit HH:MM:SS -> Sekunden
                const toSec = t => t.split(':').reduce((acc, v, i) => acc + v * Math.pow(60, 2-i), 0);
                return asc ? toSec(aText) - toSec(bText) : toSec(bText) - toSec(aText);
            } else if (column === 8) { // Startzeit Date
                return asc ? new Date(aText) - new Date(bText) : new Date(bText) - new Date(aText);
            } else if (column === 9) { // Ankunft Date
                return asc ? new Date(aText) - new Date(bText) : new Date(bText) - new Date(aText);
            } else {
                return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
            }
        });

        rows.forEach(row => tbody.appendChild(row));
        const icon = asc ? 'up' : 'down';
        header.innerHTML = header.innerHTML.replace(/ [↑↓]$/, '') + (asc ? ' up' : ' down');
    }

    function updateOverview() {
        const overviewResults = document.querySelector('#overviewResults');
        if (!overviewResults) return;

        if (!mapLoaded) {
            overviewResults.innerHTML = '<p>Karte nicht geladen.</p>';
            return;
        }

        let allAttacksByProfile = {};
        profiles.forEach((profile, pIndex) => {
            if (!profile.target || !profile.target.x || !profile.target.y) return;
            const arrivalDate = parseArrivalTime(profile.arrivalTime);
            if (!arrivalDate) return;
            const profileAttacks = [];
            profile.villages.forEach(village => {
                if (!village.x || !village.y) return;
                const speed = village.speed || 35;
                const dx = village.x - profile.target.x;
                const dy = village.y - profile.target.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const runtime_sec = Math.round(dist * speed * 60); // Fix: Round to nearest second for accuracy
                const runtimeMs = runtime_sec * 1000;
                const runtimeStr = msToHHMMSS(runtimeMs);
                const startDate = calculateStartTime(arrivalDate, runtimeMs);
                const runtimeStr = msToHHMMSS(runtimeMs);
                profileAttacks.push({
                    targetName: profile.target.name || 'Unbekannt',
                    targetCoords: `${profile.target.x}|${profile.target.y}`,
                    targetPlayer: profile.target.playerName || 'Unbekannt',
                    village: village.name || 'Unbenannt',
                    playerName: village.playerName || 'Unbekannt',
                    coords: `${village.x}|${village.y}`,
                    speed,
                    dist: dist.toFixed(2), // Mehr Präzision
                    runtimeStr,
                    startTimeStr: formatDateTime(startDate),
                    arrival: formatDateTime(arrivalDate)
                });
            });
            if (profileAttacks.length > 0) {
                allAttacksByProfile[profile.name || `Profil ${pIndex + 1}`] = profileAttacks;
            }
        });

        let html = '';
        Object.entries(allAttacksByProfile).forEach(([profileName, attacks], index) => {
            // Sortiere initial nach Startzeit
            attacks.sort((a, b) => new Date(a.startTimeStr) - new Date(b.startTimeStr));
            const tableId = `overview-table-${index}`;
            html += `<h6 class="mt-4 mb-2">${profileName}</h6>`;
            html += `<table class="table table-dark" id="${tableId}"><thead><tr>` +
                `<th onclick="sortTable('${tableId}', 0)">Ziel-Dorfname</th>` +
                `<th onclick="sortTable('${tableId}', 1)">Ziel-Koordinaten</th>` +
                `<th onclick="sortTable('${tableId}', 2)">Ziel-Spieler</th>` +
                `<th onclick="sortTable('${tableId}', 3)">Dorf</th>` +
                `<th onclick="sortTable('${tableId}', 4)">Spieler</th>` +
                `<th onclick="sortTable('${tableId}', 5)">Koordinaten</th>` +
                `<th onclick="sortTable('${tableId}', 6)">AG-Speed</th>` +
                `<th onclick="sortTable('${tableId}', 7)">Entfernung</th>` +
                `<th onclick="sortTable('${tableId}', 8)">Laufzeit</th>` +
                `<th onclick="sortTable('${tableId}', 9)">Startzeit</th>` +
                `<th onclick="sortTable('${tableId}', 10)">Ankunft</th>` +
                `</tr></thead><tbody>`;
            attacks.forEach(attack => {
                html += `<tr><td>${attack.targetName}</td><td>${attack.targetCoords}</td><td>${attack.targetPlayer}</td><td>${attack.village}</td><td>${attack.playerName}</td><td>${attack.coords}</td><td>${attack.speed}</td><td>${attack.dist}</td><td>${attack.runtimeStr}</td><td>${attack.startTimeStr}</td><td>${attack.arrival}</td></tr>`;
            });
            html += `</tbody></table><hr class="my-3 bg-light opacity-25">`;
        });
        overviewResults.innerHTML = Object.keys(allAttacksByProfile).length > 0 ? html : '<p>Keine gültigen Angriffe.</p>';
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
        profiles.push({ name: '', arrivalTime: getCurrentDateTime(), targetId: '', target: null, villages: [] });
        saveProfiles();
        renderTabs();
        const newIndex = profiles.length - 1;
        const newTab = document.querySelector(`#tab-${newIndex}`);
        new bootstrap.Tab(newTab).show();
    });

    if (profiles.length === 0) {
        profiles.push({ name: '', arrivalTime: getCurrentDateTime(), targetId: '', target: null, villages: [] });
        saveProfiles();
    }

    renderTabs();
    window.loadVillage = loadVillage;
    window.deleteVillage = deleteVillage;
    window.sortTable = sortTable;
});
