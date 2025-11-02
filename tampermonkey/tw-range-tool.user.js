// ==UserScript==
// @name         TW Range Tool + Debugmode
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Zeigt an, ob du in der Punkterange eines Spielers bist (+/-) und wie viele Punkte Unterschied bestehen. Mit Debug-Modus und Cache. AUTO Range + nächste Änderung! (Map-Hover für Dörfer! FIXED: + in Namen + mehr Infos)
// @author       Heiko & GPT
// @match        https://*/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @downloadURL  https://raw.githubusercontent.com/heiko1988/ds/main/tampermonkey/tw-range-tool.user.js
// @updateURL    https://raw.githubusercontent.com/heiko1988/ds/main/tampermonkey/tw-range-tool.user.js
// ==/UserScript==

(function() {
    'use strict';

    // === SETTINGS ===
    const SETTINGS = {
        cacheDuration: 10 * 60 * 1000, // 10 Minuten Cache
        debugMode: GM_getValue('debugMode', false)
    };

    // === DEBUG HELPER ===
    function debugLog(...args) {
        if (SETTINGS.debugMode) console.log('[Range-Tool DEBUG]', ...args);
    }

    // === NAME CLEANER (FIXED: + → Space, konsistent) ===
    function cleanName(name) {
        return name.replace(/\s+/g, ' ').trim().replace(/[?'"]/g, '').replace(/\+/g, ' '); // + → Space
    }

    // === UI: DEBUG-MODUS TOGGLE ===
    function createSettingsButton() {
        const btn = document.createElement('button');
        btn.textContent = SETTINGS.debugMode ? 'Debug: AN' : 'Debug: AUS';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        btn.style.padding = '5px 8px';
        btn.style.border = '1px solid #444';
        btn.style.borderRadius = '6px';
        btn.style.background = SETTINGS.debugMode ? '#2bff77' : '#ff5454';
        btn.style.color = '#000';
        btn.style.cursor = 'pointer';
        btn.title = 'Debug-Modus umschalten';

        btn.onclick = () => {
            SETTINGS.debugMode = !SETTINGS.debugMode;
            GM_setValue('debugMode', SETTINGS.debugMode);
            btn.textContent = SETTINGS.debugMode ? 'Debug: AN' : 'Debug: AUS';
            btn.style.background = SETTINGS.debugMode ? '#2bff77' : '#ff5454';
            debugLog('Debugmodus umgeschaltet auf', SETTINGS.debugMode);
        };

        document.body.appendChild(btn);
    }

    // === MAP-MOVER INTEGRATION ===
    function integrateMapMover() {
        const waitForMapMover = setInterval(() => {
            const mapMover = document.getElementById('map_mover');
            if (mapMover) {
                clearInterval(waitForMapMover);
                debugLog('Map-Mover gefunden und integriert.');

                mapMover.addEventListener('click', (e) => {
                    e.stopPropagation();
                }, true);

                if (SETTINGS.debugMode) {
                    mapMover.title = 'Range Tool: Map-Mover integriert – Links unten funktionieren!';
                }
            }
        }, 500);

        setTimeout(() => clearInterval(waitForMapMover), 10000);
    }

    // === EIGENE SPIELDATEN HOLEN ===
    function getOwnData() {
        try {
            const gd = unsafeWindow?.game_data || window.game_data;
            if (!gd || !gd.player || !gd.village) return null;

            return {
                playerId: gd.player.id,
                playerName: gd.player.name,
                playerPoints: parseInt(gd.player.points),
                villageId: gd.village.id,
                villageName: gd.village.name,
                world: gd.world
            };
        } catch (e) {
            debugLog('Fehler beim Lesen von game_data:', e);
            return null;
        }
    }

    async function waitForOwnData(maxTries = 10) {
        for (let i = 0; i < maxTries; i++) {
            const data = getOwnData();
            if (data) {
                debugLog('Eigene Daten erfolgreich geladen:', data);
                return data;
            }
            debugLog(`Versuch ${i + 1}/${maxTries}: game_data noch nicht verfügbar`);
            await new Promise(r => setTimeout(r, 500));
        }
        console.error('[Range-Tool DEBUG] Konnte eigene Daten nicht auslesen');
        return null;
    }

    // === AKTUELLE BLOCK HOLEN ===
    async function loadCurrentBlock(world) {
        const cacheKey = `currentBlock_${world}`;
        const cache = GM_getValue(cacheKey, { time: 0, data: null });

        if (Date.now() - cache.time < SETTINGS.cacheDuration && cache.data) {
            debugLog(`Verwende gecachten aktuellen Block für ${world}:`, cache.data);
            return cache.data;
        }

        debugLog(`Lade Settings für aktuellen Block in ${world}`);
        const url = `https://${world}.die-staemme.de/page/settings`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();

            const match = text.match(/Casual-Angriffsblock.*?(\d+)%/i);
            let blockPercent = 20;
            if (match) {
                blockPercent = parseInt(match[1], 10);
                debugLog(`Aktueller Block gefunden: ${blockPercent}%`);
            }

            const data = { blockPercent };
            const newCache = { time: Date.now(), data };
            GM_setValue(cacheKey, newCache);
            debugLog(`Aktueller Block für ${world} gecacht: ${blockPercent}%`);
            return data;
        } catch (e) {
            debugLog(`Fehler beim Laden der Settings für ${world}:`, e);
            return cache.data || { blockPercent: 20 };
        }
    }

    // === NÄCHSTE ÄNDERUNG HOLEN ===
    async function loadNextChange(world, villageId) {
        const cacheKey = `nextChange_${world}`;
        const cache = GM_getValue(cacheKey, { time: 0, data: null });

        if (Date.now() - cache.time < SETTINGS.cacheDuration && cache.data) {
            debugLog(`Verwende gecachte nächste Änderung für ${world}:`, cache.data);
            return cache.data;
        }

        debugLog(`Lade Endgame-Tabelle für nächste Änderung in ${world}`);
        const url = `https://${world}.die-staemme.de/game.php?village=${villageId}&screen=ranking&mode=casual_endgame`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();

            const now = new Date();
            let nextChange = null;
            const dateRegex = /<td[^>]*>(\d{2}\.\d{2}\.\d{4} um \d{2}:\d{2}:\d{2})<\/td>/g;
            let dateMatch;
            while ((dateMatch = dateRegex.exec(text)) !== null) {
                const dateStr = dateMatch[1];
                const startAfterDate = dateMatch.index + dateMatch[0].length;

                const tdStartRegex = /<td[^>]*>/;
                const tdStartMatch = tdStartRegex.exec(text.slice(startAfterDate));
                if (!tdStartMatch) continue;
                const blockStart = startAfterDate + tdStartMatch.index;

                const tdEndRegex = /<\/td>/;
                const tdEndMatch = tdEndRegex.exec(text.slice(blockStart));
                if (!tdEndMatch) continue;
                const blockEnd = blockStart + tdEndMatch.index;

                const blockContent = text.slice(blockStart, blockEnd).trim();

                const percentMatch = /(\d+)%/.exec(blockContent);
                if (!percentMatch) {
                    debugLog(`Kein % im Block für ${dateStr}: "${blockContent.substring(0, 50)}..."`);
                    continue;
                }
                const blockPercent = parseInt(percentMatch[1], 10);

                const dateParts = dateStr.replace(' um ', ' ').split(' ');
                const [day, month, year] = dateParts[0].split('.').map(Number);
                const [h, m, s] = dateParts[1].split(':').map(Number);
                const changeDate = new Date(year, month - 1, day, h, m, s);

                if (changeDate > now && (!nextChange || changeDate < nextChange.date)) {
                    nextChange = {
                        date: changeDate,
                        dateStr: dateStr,
                        blockPercent
                    };
                    debugLog(`Gültige Änderung gefunden: ${dateStr} → ${blockPercent}%`);
                }
            }

            if (!nextChange) {
                debugLog('Keine zukünftige Änderung gefunden.');
            } else {
                debugLog(`Nächste Änderung: ${nextChange.dateStr} → ${nextChange.blockPercent}%`);
            }

            const data = nextChange;
            const newCache = { time: Date.now(), data };
            GM_setValue(cacheKey, newCache);
            return data;
        } catch (e) {
            debugLog(`Fehler beim Laden der Endgame-Seite für ${world}:`, e);
            return cache.data || null;
        }
    }

    // === PLAYER PUNKTE LADEN ===
    async function loadPlayerPoints(world) {
        const cacheKey = `pointsCache_${world}`;
        const cache = GM_getValue(cacheKey, { time: 0, data: {}, nameToData: {} });

        if (Date.now() - cache.time < SETTINGS.cacheDuration) {
            debugLog(`Verwende gecachte Punkte für Welt ${world}`);
            return { idToPoints: cache.data, nameToData: cache.nameToData };
        }

        debugLog(`Lade player.txt für Welt ${world}`);
        const url = `https://${world}.die-staemme.de/map/player.txt`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            const lines = text.trim().split('\n');
            const idToPoints = {};
            const nameToData = {};
            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length < 5) continue;
                const id = parts[0].trim();
                const rawName = parts[1].trim();
                const clean = cleanName(rawName);
                const points = parseInt(parts[4].trim(), 10);
                if (!isNaN(points)) {
                    idToPoints[id] = points;
                    nameToData[rawName] = { id, points }; // Raw + clean
                    if (clean !== rawName) nameToData[clean] = { id, points };
                }
            }
            const newCache = { time: Date.now(), data: idToPoints, nameToData };
            GM_setValue(cacheKey, newCache);
            debugLog(`Punkte für ${world} geladen & gecacht (${Object.keys(idToPoints).length} Spieler)`);
            return { idToPoints, nameToData };
        } catch (e) {
            debugLog(`Fehler bei ${world}/player.txt:`, e);
            return { idToPoints: cache.data, nameToData: cache.nameToData };
        }
    }

    // === PUNKTERANGE PRÜFEN ===
    function checkRange(ownPoints, otherPoints, minRange, maxRange) {
        const min = ownPoints * minRange;
        const max = ownPoints * maxRange;
        if (otherPoints >= min && otherPoints <= max) return 'innerhalb';
        return otherPoints < min ? 'zu niedrig' : 'zu hoch';
    }

    // === MAP-POPUP ENHANCE (ERWEITERT: Mehr Infos + Status/Range) ===
    function enhanceMapPopup(ownData, playerData, minRange, maxRange, nextInfo) {
        if (!window.location.search.includes('screen=map')) return;

        const { nameToData } = playerData;
        const observer = new MutationObserver(() => {
            const popup = document.getElementById('map_popup');
            if (!popup || popup.querySelector('#rangeInfo')) return;

            debugLog('Map-Popup erkannt – parse PlayerName...');

            let playerName = '';
            const playerLink = popup.querySelector('a[href*="info_player&id="]');
            if (playerLink) {
                playerName = cleanName(playerLink.textContent.trim());
                debugLog(`PlayerName aus Link: "${playerName}"`);
            }

            if (!playerName) {
                const thElements = popup.querySelectorAll('th');
                for (const th of thElements) {
                    const text = th.textContent.trim();
                    const nameMatch = text.match(/Besitzer:\s*([^\(]+?)\s*\(/i);
                    if (nameMatch) {
                        playerName = cleanName(nameMatch[1].trim());
                        debugLog(`PlayerName aus th: "${playerName}" (von: "${text.substring(0,50)}...")`);
                        break;
                    }
                }
            }

            if (!playerName) {
                const popupText = popup.textContent.trim();
                const nameMatch = popupText.match(/Besitzer:\s*([^\(]+?)\s*\(/i);
                if (nameMatch) {
                    playerName = cleanName(nameMatch[1].trim());
                    debugLog(`PlayerName aus Text: "${playerName}"`);
                } else {
                    debugLog('Kein PlayerName gefunden – Popup-Text: ' + popupText.substring(0, 200));
                    return;
                }
            }

            if (!playerName || playerName.length < 2) {
                debugLog('PlayerName ungültig (zu kurz/leer) – skip.');
                return;
            }

            let playerInfo = nameToData[playerName];
            if (!playerInfo) {
                const fuzzyName = cleanName(playerName.toLowerCase());
                for (const [cachedName, info] of Object.entries(nameToData)) {
                    const cachedClean = cleanName(cachedName.toLowerCase());
                    if (cachedClean === fuzzyName || cachedClean.includes(fuzzyName) || fuzzyName.includes(cachedClean)) {
                        playerInfo = info;
                        debugLog(`Fuzzy-Match: '${playerName}' → '${cachedName}' gefunden (Similarity: ${cachedClean === fuzzyName ? '100%' : 'partial'})`);
                        break;
                    }
                }
            }

            if (!playerInfo) {
                debugLog(`Spielerdaten für "${playerName}" (fuzzy: '${cleanName(playerName.toLowerCase())}') nicht gefunden (Cache hat ${Object.keys(nameToData).length} Namen). Reload Cache?`);
                if (SETTINGS.debugMode) {
                    loadPlayerPoints(ownData.world).then((newPlayerData) => {
                        enhanceMapPopup(ownData, newPlayerData, minRange, maxRange, nextInfo);
                    });
                }
                return;
            }

            const otherPoints = playerInfo.points;
            const status = checkRange(ownData.playerPoints, otherPoints, minRange, maxRange);
            const diffPercent = Math.round((otherPoints / ownData.playerPoints - 1) * 100);
            const diffPercentText = `(${diffPercent > 0 ? '+' : ''}${diffPercent}%)`;

            const rangeText = `${Math.round(minRange*100)}-${Math.round(maxRange*100)}%`;
            const rangeInfo = `Status: ${status} | Range: ${rangeText} | Next: ${nextInfo}`;

            const tbody = popup.querySelector('#info_content tbody');
            if (!tbody) {
                debugLog('Kein #info_content tbody gefunden.');
                return;
            }

            let bgColor = '#ff6961'; // Rot
            if (status === 'innerhalb') bgColor = '#00ff7f'; // Grün
            else if (status === 'zu niedrig') bgColor = '#4a90e2'; // Blau

            tbody.insertAdjacentHTML('beforeend', `
                <tr id="rangeInfo">
                    <td colspan="2" style="background:${bgColor};color:black;font-weight:bold;padding:4px;text-align:center;">
                        Spieler: ${otherPoints} Punkte ${diffPercentText}
                    </td>
                </tr>
                <tr id="rangeInfoDetail">
                    <td colspan="2" style="background:#333;color:#fff;font-size:11px;padding:2px;text-align:center;">
                        ${rangeInfo}
                    </td>
                </tr>
            `);

            debugLog(`Map-Popup für "${playerName}" erweitert: ${otherPoints} ${diffPercentText} (${status}) | Range: ${rangeText}`);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        debugLog('Map-Popup Observer gestartet.');
    }

    // === HAUPTLOGIK ===
    async function main() {
        const ownData = await waitForOwnData();
        if (!ownData) return;

        const currentBlock = await loadCurrentBlock(ownData.world);
        const minRange = 0.8;
        const maxRange = 1 + (currentBlock.blockPercent / 100);

        const nextChange = await loadNextChange(ownData.world, ownData.villageId);
        const playerData = await loadPlayerPoints(ownData.world);

        const nextInfo = nextChange ? `${nextChange.dateStr} ${nextChange.blockPercent}%` : 'Keine Änderung';
        enhanceMapPopup(ownData, playerData, minRange, maxRange, nextInfo);

        const elements = document.querySelectorAll('a[href*="info_player&id="]');
        if (!elements.length) {
            debugLog('Keine Spielerlinks gefunden.');
            return;
        }

        debugLog(`Gefundene Spielerlinks: ${elements.length}`);
        debugLog(`Aktive Range ${ownData.world}: ${Math.round(minRange*100)}% - ${Math.round(maxRange*100)}% (Block: ${currentBlock.blockPercent}%)`);

        elements.forEach(link => {
            const match = link.href.match(/id=(\d+)/);
            if (!match) return;
            const playerId = match[1];
            const otherPoints = playerData.idToPoints[playerId];
            if (otherPoints === undefined) {
                debugLog(`Punkte für Spieler ${playerId} nicht gefunden.`);
                return;
            }

            const status = checkRange(ownData.playerPoints, otherPoints, minRange, maxRange);
            const diff = otherPoints - ownData.playerPoints;
            const diffPercent = Math.round((otherPoints / ownData.playerPoints - 1) * 100);
            const diffPercentText = diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`;

            const rangeText = `${Math.round(minRange*100)}-${Math.round(maxRange*100)}%`;
            const tooltipText = `Punkte: ${otherPoints} (${diff}) | Range: ${rangeText} | Status: ${status} | Next: ${nextInfo}`;

            link.style.position = 'relative';
            link.title = tooltipText;

            if (SETTINGS.debugMode) {
                const info = document.createElement('span');
                let bgColor = '#ff6961';
                if (status === 'innerhalb') bgColor = '#00ff7f';
                else if (status === 'zu niedrig') bgColor = '#4a90e2';

                info.innerHTML = ` <span style="background: ${bgColor}; color: black; padding: 1px 3px; border-radius: 2px; font-weight: bold; font-size: 10px;">${diffPercentText}</span>`;
                link.appendChild(info);
            }
        });
    }

    // === CACHE LEEREN BUTTON ===
    function createClearCacheButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Cache 🗑️';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.right = '100px';
        btn.style.zIndex = '9999';
        btn.style.padding = '5px 8px';
        btn.style.border = '1px solid #444';
        btn.style.borderRadius = '6px';
        btn.style.background = '#ffaa00';
        btn.style.color = '#000';
        btn.style.cursor = 'pointer';
        btn.title = 'Cache leeren (Punkte + Regeln + Block + Next)';

        btn.onclick = async () => {
            const ownData = getOwnData();
            if (ownData?.world) {
                const keys = [
                    `pointsCache_${ownData.world}`,
                    `currentBlock_${ownData.world}`,
                    `nextChange_${ownData.world}`
                ];
                keys.forEach(key => GM_deleteValue(key));
                alert(`Cache für ${ownData.world} geleert!`);
                main();
            }
        };

        document.body.appendChild(btn);
    }

    // === START ===
    createSettingsButton();
    createClearCacheButton();
    integrateMapMover();
    main();
})();
