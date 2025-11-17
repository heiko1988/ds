document.addEventListener('DOMContentLoaded', async () => {
    const storageKey = 'twNoblingProfiles';
    let profiles = JSON.parse(localStorage.getItem(storageKey)) || [];
    const profileTabs = document.getElementById('profileTabs');
    const profileTabContent = document.getElementById('profileTabContent');
    const addProfileBtn = document.getElementById('addProfileBtn');
    const mapStatus = document.getElementById('mapStatus');
    const reloadMapBtn = document.getElementById('reloadMapBtn');

    let playerMap = new Map();
    let villageMap = new Map();
    let villagesByName = new Map();
    let villagesByCoords = new Map();
    let mapLoaded = false;

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

    async function loadMapData() {
        setMapStatus('Lade Karte...');
        try {
            const [villageRes, playerRes] = await Promise.all([
                fetch('https://corsproxy.io/?' + encodeURIComponent(VILLAGE_ORIG + '?t=' + Date.now())),
                fetch('https://corsproxy.io/?' + encodeURIComponent(PLAYER_ORIG + '?t=' + Date.now()))
            ]);
            if (!villageRes.ok || !playerRes.ok) throw new Error('HTTP-Fehler');

            const [villageText, playerText] = await Promise.all([villageRes.text(), playerRes.text()]);

            playerMap.clear();
            playerText.split('\n').forEach(line => {
                if (line.trim()) {
                    const [id, nameEnc] = line.split(',');
                    if (id && nameEnc) {
                        const name = decodeURIComponent(nameEnc.replace(/\+/g, '%20'));
                        playerMap.set(id.trim(), name);
                    }
                }
            });

            villageMap.clear(); villagesByName.clear(); villagesByCoords.clear();
            villageText.split('\n').forEach(line => {
                if (line.trim()) {
                    const [id, nameEnc, x, y, playerId] = line.split(',');
                    if (id && nameEnc && x && y) {
                        const name = decodeURIComponent(nameEnc.replace(/\+/g, '%20'));
                        const village = {id: id.trim(), name, x: parseInt(x), y: parseInt(y), playerId: playerId?.trim() || '0'};
                        villageMap.set(id.trim(), village);
                        villagesByCoords.set(`${x}|${y}`, village);
                        const key = name.toLowerCase();
                        if (!villagesByName.has(key)) villagesByName.set(key, []);
                        villagesByName.get(key).push(village);
                    }
                }
            });

            mapLoaded = true;
            setMapStatus(`Karte geladen – ${villageMap.size} Dörfer, ${playerMap.size} Spieler`, 'success');
        } catch (e) {
            mapLoaded = false;
            setMapStatus('Fehler beim Laden der Karte: ' + e.message, 'error');
        }
    }

    await loadMapData();
    reloadMapBtn.addEventListener('click', loadMapData);

    function saveProfiles() { localStorage.setItem(storageKey, JSON.stringify(profiles)); }

    function msToHHMMSS(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600).toString().padStart(2,'0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
        const sec = (s % 60).toString().padStart(2,'0');
        return `${h}:${m}:${sec}`;
    }

    function formatDateTime(date) {
        return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`;
    }

    function parseArrivalTime(str) {
        const match = str.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2}))?/);
        if (!match) return null;
        const dt = new Date(`${match[1]}T${match[2]}:${match[3]||'00'}`);
        return isNaN(dt.getTime()) || dt <= new Date() ? null : dt;
    }

    async function loadVillage(profileIdx, isTarget, vIdx = null) {
        if (!mapLoaded) return alert('Karte wird noch geladen…');
        const input = document.getElementById(isTarget ? `targetId-${profileIdx}` : `villageInput-${profileIdx}-${vIdx}`);
        const query = input.value.trim();
        if (!query) return;

        let village = null;
        if (/^\d+$/.test(query)) village = villageMap.get(query);
        else if (/^\d+\|\d+$/.test(query)) village = villagesByCoords.get(query);
        else {
            const list = villagesByName.get(query.toLowerCase()) || [];
            if (list.length === 1) village = list[0];
            else if (list.length > 1) return alert('Mehrere Dörfer gefunden – bitte ID oder Koords verwenden');
            else return alert('Dorf nicht gefunden');
        }
        if (!village) return alert('Dorf nicht gefunden');

        const playerName = playerMap.get(village.playerId) || 'Barbarer/Unbekannt';
        village.playerName = playerName;

        if (isTarget) {
            profiles[profileIdx].target = village;
            document.getElementById(`targetDisplay-${profileIdx}`).innerHTML = `<strong>${village.name} von ${playerName} @ ${village.x}|${village.y}</strong>`;
        } else {
            const v = profiles[profileIdx].villages[vIdx];
            Object.assign(v, {name: village.name, playerName, x: village.x, y: village.y, identifier: query});
            document.querySelector(`#villageDisplay-${profileIdx}-${vIdx}`).innerHTML = `<strong>${village.name} von ${playerName} @ ${village.x}|${village.y}</strong>`;
        }
        saveProfiles();
    }

    function renderProfileTab(idx) {
        const p = profiles[idx];
        const pane = document.createElement('div');
        pane.className = 'tab-pane fade card p-4';
        pane.id = `profile-${idx}`;
        pane.role = 'tabpanel';

        pane.innerHTML = `
            <div class="mb-3"><label class="form-label">Profil-Name</label>
                <input type="text" class="form-control" id="profileName-${idx}" value="${p.name || ''}">
            </div>
            <div class="mb-3"><label class="form-label">Ankunftszeit</label>
                <input type="datetime-local" class="form-control" id="arrivalTime-${idx}" value="${(p.arrivalTime||getCurrentDateTime()).replace(/:\d{2}$/,'')}" step="1">
                <small class="form-text bg-light p-1 rounded">Klicke für Kalender/Uhrzeit. Format: YYYY-MM-DDTHH:MM</small>
            </div>
            <div class="mb-3"><label class="form-label">Ziel-Dorf (ID, Name oder Koords)</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="targetId-${idx}" value="${p.targetId||''}" placeholder="z.B. 12345 oder 500|500">
                    <button class="btn btn-info" id="loadTarget-${idx}">Laden</button>
                </div>
                <small id="targetDisplay-${idx}" class="form-text bg-light p-1 rounded">${p.target ? `<strong>${p.target.name} von ${p.target.playerName} @ ${p.target.x}|${p.target.y}</strong>` : 'Noch nicht geladen'}</small>
            </div>
            <h5>Angriffs-Dörfer</h5>
            <div id="villages-${idx}"></div>
            <button class="btn btn-secondary mt-2" id="addVillage-${idx}">Dorf hinzufügen</button>
            <button class="btn btn-success ms-2 mt-2" id="calculate-${idx}">Berechnen</button>
            <button class="btn btn-danger ms-2 mt-2" id="deleteProfile-${idx}">Profil löschen</button>
            <div id="results-${idx}" class="mt-4"></div>
        `;

        // Dörfer rendern
        (p.villages || []).forEach((v, i) => renderVillageRow(idx, i, pane.querySelector(`#villages-${idx}`)));

        pane.querySelector(`#addVillage-${idx}`).onclick = () => {
            p.villages = p.villages || [];
            p.villages.push({speed: 35});
            renderVillageRow(idx, p.villages.length-1, pane.querySelector(`#villages-${idx}`));
            saveProfiles();
        };

        pane.querySelector(`#calculate-${idx}`).onclick = () => calculateProfile(idx);
        pane.querySelector(`#deleteProfile-${idx}`).onclick = () => { profiles.splice(idx,1); saveProfiles(); renderTabs(); };
        pane.querySelector(`#profileName-${idx}`).oninput = e => { p.name = e.target.value; saveProfiles(); updateTabNames(); };
        pane.querySelector(`#arrivalTime-${idx}`).onchange = e => { p.arrivalTime = e.target.value.replace('T',' ')+':00'; saveProfiles(); };
        pane.querySelector(`#targetId-${idx}`).oninput = e => { p.targetId = e.target.value; saveProfiles(); };
        pane.querySelector(`#loadTarget-${idx}`).onclick = () => loadVillage(idx, true);

        return pane;
    }

    function renderVillageRow(pIdx, vIdx, container) {
        const v = profiles[pIdx].villages[vIdx];
        const row = document.createElement('div');
        row.className = 'row g-2 mb-2 align-items-center border rounded p-2 bg-secondary bg-opacity-10';
        row.innerHTML = `
            <div class="col-4">
                <input type="text" class="form-control form-control-sm" id="villageInput-${pIdx}-${vIdx}" placeholder="ID, Name oder 500|500" value="${v.identifier||''}">
            </div>
            <div class="col-2">
                <button class="btn btn-info btn-sm w-100" onclick="loadVillage(${pIdx},false,${vIdx})">Laden</button>
            </div>
            <div class="col-4">
                <small id="villageDisplay-${pIdx}-${vIdx}" class="form-text bg-light p-1 rounded">${v.name ? `<strong>${v.name} von ${v.playerName} @ ${v.x}|${v.y}</strong>` : 'Noch nicht geladen'}</small>
            </div>
            <div class="col-1">
                <input type="number" step="0.1" class="form-control form-control-sm" id="villageSpeed-${pIdx}-${vIdx}" value="${v.speed||35}">
            </div>
            <div class="col-1">
                <button class="btn btn-outline-danger btn-sm w-100" onclick="deleteVillage(${pIdx},${vIdx})">X</button>
            </div>
        `;
        container.appendChild(row);
        row.querySelector(`#villageInput-${pIdx}-${vIdx}`).oninput = e => { v.identifier = e.target.value; saveProfiles(); };
        row.querySelector(`#villageSpeed-${pIdx}-${vIdx}`).oninput = e => { v.speed = parseFloat(e.target.value) || 35; saveProfiles(); };
    }

    window.deleteVillage = (pIdx, vIdx) => {
        profiles[pIdx].villages.splice(vIdx,1);
        saveProfiles();
        document.querySelector(`#villages-${pIdx}`).innerHTML = '';
        profiles[pIdx].villages.forEach((v,i) => renderVillageRow(pIdx,i,document.querySelector(`#villages-${pIdx}`)));
    };

    function calculateProfile(idx) {
        const p = profiles[idx];
        const div = document.getElementById(`results-${idx}`);
        if (!p.target) return div.innerHTML = '<div class="alert alert-warning">Ziel-Dorf fehlt!</div>';
        const arrival = parseArrivalTime(p.arrivalTime);
        if (!arrival) return div.innerHTML = '<div class="alert alert-danger">Ungültige Ankunftszeit!</div>';

        let html = `<table class="table table-dark table-striped"><thead><tr>
            <th class="attack-col">Spieler</th>
            <th class="attack-col">Dorf</th>
            <th class="attack-col">Koordinaten</th>
            <th class="target-col">Ziel-Dorfname</th>
            <th class="target-col">Ziel-Koordinate</th>
            <th>AG-Speed</th>
            <th>Entfernung</th>
            <th>Laufzeit</th>
            <th>Startzeit</th>
        </tr></thead><tbody>`;

        (p.villages || []).forEach(v => {
            if (!v.x) return;
            const dx = v.x - p.target.x;
            const dy = v.y - p.target.y;
            const dist = Math.hypot(dx, dy);
            const seconds = Math.round(dist * v.speed * 60);
            const runtime = msToHHMMSS(seconds * 1000);
            const start = new Date(arrival.getTime() - seconds * 1000);
            html += `<tr>
                <td>${v.playerName || '?'}</td>
                <td>${v.name || '?'}</td>
                <td>${v.x}|${v.y}</td>
                <td>${p.target.name}</td>
                <td>${p.target.x}|${p.target.y}</td>
                <td>${v.speed}</td>
                <td>${dist.toFixed(2)}</td>
                <td>${runtime}</td>
                <td>${formatDateTime(start)}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        div.innerHTML = html;
    }

    function updateOverview() {
        const container = document.getElementById('overviewResults');
        if (!container) return;
        let html = '';
        profiles.forEach((p, i) => {
            if (!p.target || !(p.villages||[]).some(v=>v.x)) return;
            const arrival = parseArrivalTime(p.arrivalTime);
            if (!arrival) return;

            html += `<h5 class="mt-4">${p.name || 'Profil '+(i+1)} – Ziel: ${p.target.name} (${p.target.x}|${p.target.y})</h5>`;
            html += `<table class="table table-dark table-striped"><thead><tr>
                <th class="attack-col">Spieler</th>
                <th class="attack-col">Dorf</th>
                <th class="attack-col">Koordinaten</th>
                <th class="target-col">Ziel-Spieler</th>
                <th class="target-col">Ziel-Dorfname</th>
                <th class="target-col">Ziel-Koordinate</th>
                <th>AG-Speed</th>
                <th>Entfernung</th>
                <th>Laufzeit</th>
                <th>Startzeit</th>
                <th>Ankunft</th>
            </tr></thead><tbody>`;

            (p.villages || []).forEach(v => {
                if (!v.x) return;
                const dx = v.x - p.target.x;
                const dy = v.y - p.target.y;
                const dist = Math.hypot(dx, dy);
                const seconds = Math.round(dist * v.speed * 60);
                const runtime = msToHHMMSS(seconds * 1000);
                const start = new Date(arrival.getTime() - seconds * 1000);
                html += `<tr>
                    <td>${v.playerName || '?'}</td>
                    <td>${v.name || '?'}</td>
                    <td>${v.x}|${v.y}</td>
                    <td>${p.target.playerName || '?'}</td>
                    <td>${p.target.name}</td>
                    <td>${p.target.x}|${p.target.y}</td>
                    <td>${v.speed}</td>
                    <td>${dist.toFixed(2)}</td>
                    <td>${runtime}</td>
                    <td>${formatDateTime(start)}</td>
                    <td>${formatDateTime(arrival)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        });
        container.innerHTML = html || '<p class="text-center">Noch keine berechneten Angriffe</p>';
    }

    function renderTabs() {
        profileTabs.innerHTML = '';
        profileTabContent.innerHTML = '';

        profiles.forEach((p, i) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `<button class="nav-link ${i===0?'active':''}" data-bs-toggle="tab" data-bs-target="#profile-${i}">${p.name || 'Profil '+(i+1)}</button>`;
            profileTabs.appendChild(li);

            const pane = renderProfileTab(i);
            if (i===0) pane.classList.add('show','active');
            profileTabContent.appendChild(pane);
        });

        // Übersicht-Tab
        const ovLi = document.createElement('li');
        ovLi.className = 'nav-item';
        ovLi.innerHTML = `<button class="nav-link" data-bs-toggle="tab" data-bs-target="#overview">Übersicht</button>`;
        profileTabs.appendChild(ovLi);

        const ovPane = document.createElement('div');
        ovPane.className = 'tab-pane fade card p-4';
        ovPane.id = 'overview';
        ovPane.innerHTML = '<h5>Übersicht aller Angriffe</h5><div id="overviewResults"></div>';
        profileTabContent.appendChild(ovPane);

        new bootstrap.Tab(document.querySelector('[data-bs-target="#overview"]'))._element.addEventListener('shown.bs.tab', updateOverview);
    }

    function updateTabNames() {
        document.querySelectorAll('#profileTabs .nav-link').forEach((btn,i) => {
            if (btn.getAttribute('data-bs-target') !== '#overview')
                btn.textContent = profiles[i].name || `Profil ${i+1}`;
        });
    }

    addProfileBtn.onclick = () => {
        profiles.push({name:'', arrivalTime: getCurrentDateTime(), villages:[]});
        saveProfiles();
        renderTabs();
        new bootstrap.Tab(document.querySelector(`[data-bs-target="#profile-${profiles.length-1}"]`)).show();
    };

    if (profiles.length === 0) {
        profiles.push({name:'', arrivalTime: getCurrentDateTime(), villages:[]});
        saveProfiles();
    }

    renderTabs();
    window.loadVillage = loadVillage;
});
