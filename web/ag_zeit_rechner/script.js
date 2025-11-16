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
    let villagesByCoords = new Map(); // Neu: Für Koords-Suche
    let mapLoaded = false;

    // URLs (kein Cache für immer aktuelle Daten – immer neu fetchen bei Load/Reload)
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
        return `${year}-${month}-${day} ${hours}:${minutes}:00`; // Format: YYYY-MM-DD HH:MM:SS
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
                        const id = String(parts[0].trim()); // Explizit String
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
                        const playerId = String(parts[4].trim()); // Explizit String
                        encodedName = encodedName.replace(/\+/g, '%20');
                        const name = decodeURIComponent(encodedName);
                        const village = {id, name, x, y, playerId};
                        villageMap.set(id, village);
                        const coordsKey = `${x}|${y}`;
                        villagesByCoords.set(coordsKey, village); // Neu: Koords-Index
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

    // Auto-Load bei jedem Aufruf/Reload
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
        // Flexibler Parser: YYYY-MM-DD HH:MM(:SS) -> Date
        const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2}))?/);
        if (!match) return null;
        const [, datePart, timePart, secPart] = match;
        const fullTime = `${datePart}T${timePart}${secPart ? ':' + secPart : ':00'}`;
        const date = new Date(fullTime);
        if (isNaN(date.getTime()) || date < new Date()) {
            return null; // Vergangene Zeiten ungültig
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
        } else if (/^(\d+)\|
