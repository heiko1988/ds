javascript:
var warehouseCapacity = [];
var allWoodTotals = [];
var allClayTotals = [];
var allIronTotals = [];
var availableMerchants = [];
var totalMerchants = [];
var farmSpaceUsed = [];
var farmSpaceTotal = [];
var villagesData = [];
var allWoodObjects, allClayObjects, allIronObjects, allVillages;
var totalsAndAverages = "";
var data, totalWood = 0, totalStone = 0, totalIron = 0, resLimit = 0;
var sendBack;
var totalWoodSent = 0; totalStoneSent = 0; totalIronSent = 0;

// Standardwerte für Münzen
var defaultWood = 28000;
var defaultStone = 30000;
var defaultIron = 25000;

// Benutzerwerte laden
var targetWood = parseInt(sessionStorage.getItem("targetWood")) || defaultWood;
var targetStone = parseInt(sessionStorage.getItem("targetStone")) || defaultStone;
var targetIron = parseInt(sessionStorage.getItem("targetIron")) || defaultIron;
var totalTarget = targetWood + targetStone + targetIron;
var woodPercentage = targetWood / totalTarget;
var stonePercentage = targetStone / totalTarget;
var ironPercentage = targetIron / totalTarget;

if (typeof woodPercentage == 'undefined') {
    woodPercentage = 28000 / 83000;
    stonePercentage = 30000 / 83000;
    ironPercentage = 25000 / 83000;
}

var backgroundColor = "#36393f";
var borderColor = "#3e4147";
var headerColor = "#202225";
var titleColor = "#ffffdf";
var langShinko = [
    "Resource sender for flag boost minting",
    "Enter coordinate to send to",
    "Save",
    "Creator",
    "Player",
    "Village",
    "Points",
    "Coordinate to send to",
    "Keep WH% behind",
    "Recalculate res/change",
    "Res sender",
    "Source village",
    "Target village",
    "Distance",
    "Wood",
    "Clay",
    "Iron",
    "Send resources",
    "Created by Sophie 'Shinko to Kuma'"
];

if (game_data.locale == "de_DE") {
    langShinko = [
        "Rohstoff-Versender für Flaggen-Boost-Münzen",
        "Koordinaten eingeben (Ziel)",
        "Speichern",
        "Ersteller",
        "Spieler",
        "Dorf",
        "Punkte",
        "Ziel-Koordinaten",
        "Lager % behalten",
        "Rohstoffe neu berechnen/ändern",
        "Rohstoffe versenden",
        "Quell-Dorf",
        "Ziel-Dorf",
        "Distanz",
        "Holz",
        "Lehm",
        "Eisen",
        "Rohstoffe versenden",
        "Erstellt von Sophie 'Shinko to Kuma' (überarbeitet)"
    ];
}

if (game_data.locale == "en_DK") {
    langShinko = [
        "Resource sender for flag boost minting",
        "Enter coordinate to send to",
        "Save",
        "Creator",
        "Player",
        "Village",
        "Points",
        "Coordinate to send to",
        "Keep WH% behind",
        "Recalculate res/change",
        "Res sender",
        "Source village",
        "Target village",
        "Distance",
        "Wood",
        "Clay",
        "Iron",
        "Send resources",
        "Created by Sophie 'Shinko to Kuma'"
    ]
}
if (game_data.locale == "el_GR") {
    langShinko = [
        "Αποστολή πόρων",
        "Εισάγετε τις συντεταγμένες - στόχο",
        "Αποθήκευση",
        "Δημιουργός",
        "Παίκτης",
        "Χωριό",
        "Πόντοι",
        "Στόχος",
        "Διατήρησε το % Αποθήκης κάτω από",
        "Υπολογισμός πόρων/αλλαγή στόχου",
        "Αποστολή πόρων",
        "Προέλευση",
        "Χωριό στόχος",
        "Απόσταση",
        "Ξύλο",
        "Πηλός",
        "Σίδερο",
        "Αποστολή πόρων",
        "Δημιουργήθηκε από την Sophie 'Shinko to Kuma'"
    ]
}
if (game_data.locale == "nl_NL") {
    langShinko = [
        "Grondstoffen versturen voor vlagfarmen",
        "Geef coordinaat in om naar te sturen",
        "Opslaan",
        "Scripter",
        "Speler",
        "Dorp",
        "Punten",
        "Coordinaat om naar te sturen",
        "Hou WH% achter",
        "Herbereken gs/doelwit",
        "Gs versturen",
        "Oorsprong",
        "Doelwit",
        "Afstand",
        "Hout",
        "Leem",
        "Ijzer",
        "Verstuur grondstoffen",
        "Gemaakt door Sophie 'Shinko to Kuma'"
    ]
}
if (game_data.locale == "it_IT") {
    langShinko = [
        "Script pushing per coniare",
        "Inserire le coordinate a cui mandare resources",
        "Salva",
        "Creatrice",
        "Giocatore",
        "Villaggio",
        "Punti",
        "Coordinate a cui mandare",
        "Conserva % magazzino",
        "Ricalcola trasporti",
        "Invia resources",
        "Villaggio di origine",
        "Villaggio di destinazione",
        "Distanza",
        "Legno",
        "Argilla",
        "Ferro",
        "Manda resources",
        "Creato da Sophie 'Shinko to Kuma'"
    ]
}
if (game_data.locale == "pt_BR") {
    langShinko = [
        "Enviar resources para cunhagem de moedas",
        "Insira coordenada para enviar resources",
        "Salvar",
        "Criador",
        "Jogador",
        "Aldeia",
        "Pontos",
        "Enviar para",
        "Manter % no armazém",
        "Recalcular transporte",
        "Enviar resources",
        "Origem",
        "Destino",
        "Distância",
        "Madeira",
        "Argila",
        "Ferro",
        "Enviar resources",
        "Criado por Sophie 'Shinko to Kuma'"
    ]
}

cssClassesSophie = `
<style>
.sophRowA { background-color: #2c2f33; color: #dcddde; border: 1px solid #3e4147; padding: 5px; }
.sophRowB { background-color: #23272a; color: #dcddde; border: 1px solid #3e4147; padding: 5px; }
.sophHeader { background-color: #202225; font-weight: bold; color: #ffffff; border: 1px solid #3e4147; padding: 5px; text-align: center; }
input { background-color: #40444b; color: #dcddde; border: 1px solid #72767d; padding: 3px; border-radius: 3px; }
button { background-color: #7289da; color: #ffffff; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }
button:hover { background-color: #5b6eae; }
table { border-collapse: collapse; width: 100%; }
</style>`

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

// resLimit speichern/laden
if ("resLimit" in sessionStorage) {
    resLimit = parseInt(sessionStorage.getItem("resLimit"));
} else {
    sessionStorage.setItem("resLimit", resLimit);
}

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&page=-1&`;
} else {
    URLReq = "game.php?&screen=overview_villages&mode=prod&page=-1&";
}
$.get(URLReq, function () {
    console.log("Managed to grab the page");
}).done(function (page) {
    if ($("#mobileHeader")[0]) {
        console.log("mobile");
        allWoodObjects = $(page).find(".res.mwood,.warn_90.mwood,.warn.mwood");
        allClayObjects = $(page).find(".res.mstone,.warn_90.mstone,.warn.mstone");
        allIronObjects = $(page).find(".res.miron,.warn_90.miron,.warn.miron");
        allWarehouses = $(page).find(".mheader.ressources");
        allVillages = $(page).find(".quickedit-vn");
        allFarms = $(page).find(".header.population");
        allMerchants = $(page).find('a[href*="market"]');
        for (var i = 0; i < allWoodObjects.length; i++) {
            n = allWoodObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allWoodTotals.push(n);
        };
        for (var i = 0; i < allClayObjects.length; i++) {
            n = allClayObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allClayTotals.push(n);
        };
        for (var i = 0; i < allIronObjects.length; i++) {
            n = allIronObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allIronTotals.push(n);
        };
        for (var i = 0; i < allVillages.length; i++) {
            warehouseCapacity.push(allWarehouses[i].parentElement.innerText);
        };
        for (var i = 0; i < allVillages.length; i++) {
            availableMerchants.push(allMerchants[i].innerText);
            totalMerchants.push("999");
        };
        for (var i = 0; i < allVillages.length; i++) {
            farmSpaceUsed.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[1]);
            farmSpaceTotal.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[2]);
        };
    } else {
        console.log("desktop");
        allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
        allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
        allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron")
        allVillages = $(page).find(".quickedit-vn");
        for (var i = 0; i < allWoodObjects.length; i++) {
            n = allWoodObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allWoodTotals.push(n);
        };
        for (var i = 0; i < allClayObjects.length; i++) {
            n = allClayObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allClayTotals.push(n);
        };
        for (var i = 0; i < allIronObjects.length; i++) {
            n = allIronObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allIronTotals.push(n);
        };
        for (var i = 0; i < allVillages.length; i++) {
            warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
        };
        for (var i = 0; i < allVillages.length; i++) {
            availableMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
            totalMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
        };
        for (var i = 0; i < allVillages.length; i++) {
            farmSpaceUsed.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
            farmSpaceTotal.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
        };
    }

    for (var i = 0; i < allVillages.length; i++) {
        villagesData.push({
            "id": allVillages[i].dataset.id,
            "url": allVillages[i].children[0].children[0].href,
            "coord": allVillages[i].innerText.trim().match(/\d+\|\d+/)[0],
            "name": allVillages[i].innerText.trim(),
            "wood": allWoodTotals[i],
            "stone": allClayTotals[i],
            "iron": allIronTotals[i],
            "availableMerchants": availableMerchants[i],
            "totalMerchants": totalMerchants[i],
            "warehouseCapacity": warehouseCapacity[i],
            "farmSpaceUsed": farmSpaceUsed[i],
            "farmSpaceTotal": farmSpaceTotal[i]
        });
    };

    askCoordinate();
});

function askCoordinate() {
    var savedCoord = sessionStorage.getItem("coordinate") || "";
    var ownVillagesHtml = '<table style="width:100%; margin-top:10px;"><thead><tr><td class="sophHeader">Dorfname</td><td class="sophHeader">Koordinaten</td></tr></thead><tbody>';
    for (var i = 0; i < villagesData.length; i++) {
        var rowClass = (i % 2 == 0) ? 'sophRowA' : 'sophRowB';
        ownVillagesHtml += `<tr class="${rowClass}"><td><a href="#" onclick="selectOwnVillage(${i}); return false;" style="color:#40D0E0;">${villagesData[i].name}</a></td><td style="text-align:center;">${villagesData[i].coord}</td></tr>`;
    }
    ownVillagesHtml += '</tbody></table>';

    var content = `<div style="max-width:1000px;">
    <h2 class="popup_box_header">
       <center><u>
          <font color="darkgreen">${langShinko[0]}</font>
          </u>
       </center>
    </h2>
    <hr>
    <p>
    <center>
       <font color=maroon><b>${langShinko[1]}</b>
       </font>
    </center>
    </p>
    <center>
       <table>
          <tr><td><input type="text" id="coordinateTargetFirstTime" size="20" value="${savedCoord}" placeholder="z.B. 500|500"></td></tr>
          <tr><td>
             <button type="button" id="showOwnVillages" class="btn">Eigene Dörfer</button>
             <button type="button" id="showFriends" class="btn">Freunde</button>
             <button type="button" id="showTribe" class="btn">Stamm</button>
          </td></tr>
          <tr><td id="ownVillagesList" style="display:none;">${ownVillagesHtml}</td></tr>
          <tr><td id="friendsList" style="display:none;"><div>Lade Freunde...</div></td></tr>
          <tr><td id="tribeList" style="display:none;"><div>Lade Stamm...</div></td></tr>
          <tr><td><button type="button" class="btn evt-cancel-btn btn-confirm-yes" id="saveCoord">${langShinko[2]}</button></td></tr>
       </table>
    </center>
    <br>
    <hr>
    <center><img id="sophieImg" class="tooltip-delayed" title="<font color=darkgreen>Sophie -Shinko to Kuma-</font>" src="https://dl.dropboxusercontent.com/s/bxoyga8wa6yuuz4/sophie2.gif" style="cursor:help; position: relative"></center>
    <br>
    <center>
       <p>${langShinko[18]}: <a href="https://shinko-to-kuma.my-free.website/" title="Sophie profile" target="_blank">Sophie "Shinko to Kuma"</a></p>
    </center>
 </div>`;
    Dialog.show('Supportfilter', content);

    $('#showOwnVillages').click(function() {
        $('#ownVillagesList').toggle();
    });
    $('#showFriends').click(loadFriendsList);
    $('#showTribe').click(loadTribeList);

    $('#saveCoord').click(function () {
        var inputCoord = $("#coordinateTargetFirstTime")[0].value.match(/\d+\|\d+/);
        if (inputCoord) {
            coordinate = inputCoord[0];
            sessionStorage.setItem("coordinate", coordinate);
            var close_this = document.getElementsByClassName('popup_box_close');
            close_this[0].click();
            coordToId(coordinate);
        } else {
            alert("Ungültige Koordinaten!");
        }
    });
}

// Freunde laden
function loadFriendsList() {
    var friendsDiv = $('#friendsList');
    friendsDiv.show().html('<div>Lade Freunde...</div>');
    var url = game_data.player.sitter > 0 ? `game.php?t=${game_data.player.id}&screen=buddies` : 'game.php?screen=buddies';
    $.get(url).done(function(page) {
        var rows = $(page).find('tbody tr');
        var html = '<table style="width:100%;"><thead><tr><td class="sophHeader">Freund</td></tr></thead><tbody>';
        rows.each(function(i) {
            if (i > 0) {
                var nameTd = $(this).find('td').eq(1);
                var nameLink = nameTd.find('a');
                if (nameLink.length) {
                    var name = nameLink.text().trim();
                    var playerId = nameLink.attr('href').match(/id=(\d+)/)[1];
                    html += `<tr class="${i % 2 == 0 ? 'sophRowA' : 'sophRowB'}"><td><a href="#" onclick="loadPlayerVillages(${playerId}, '${name}'); return false;" style="color:#40D0E0;">${name}</a></td></tr>`;
                }
            }
        });
        html += '</tbody></table>';
        friendsDiv.html(html);
    }).fail(function() { friendsDiv.html('<div>Fehler beim Laden der Freunde.</div>'); });
}

// Stamm laden
function loadTribeList() {
    var tribeDiv = $('#tribeList');
    tribeDiv.show().html('<div>Lade Stamm...</div>');
    var url = game_data.player.sitter > 0 ? `game.php?t=${game_data.player.id}&screen=ally&mode=members` : 'game.php?screen=ally&mode=members';
    $.get(url).done(function(page) {
        var rows = $(page).find('table.vis tbody tr');
        var html = '<table style="width:100%;"><thead><tr><td class="sophHeader">Stammmitglied</td></tr></thead><tbody>';
        rows.each(function(i) {
            if (i > 0) {
                var nameTd = $(this).find('td.lit-item').eq(0);
                var nameLink = nameTd.find('a');
                if (nameLink.length) {
                    var name = nameLink.text().trim();
                    var playerId = nameLink.attr('href').match(/id=(\d+)/)[1];
                    html += `<tr class="${i % 2 == 0 ? 'sophRowA' : 'sophRowB'}"><td><a href="#" onclick="loadPlayerVillages(${playerId}, '${name}'); return false;" style="color:#40D0E0;">${name}</a></td></tr>`;
                }
            }
        });
        html += '</tbody></table>';
        tribeDiv.html(html);
    }).fail(function() { tribeDiv.html('<div>Fehler beim Laden des Stamms.</div>'); });
}

// Dörfer eines Players laden
function loadPlayerVillages(playerId, playerName) {
    var villagesDiv = $('#ownVillagesList');
    villagesDiv.html('<div>Lade Dörfer von ' + playerName + '...</div>').show();
    $('#friendsList, #tribeList').hide();
    var url = game_data.player.sitter > 0 ? `game.php?t=${game_data.player.id}&screen=info_player&id=${playerId}` : `game.php?screen=info_player&id=${playerId}`;
    $.get(url).done(function(page) {
        var rows = $(page).find('#villages_list tbody tr');
        var html = '<table style="width:100%; margin-top:10px;"><thead><tr><td class="sophHeader">Dorf von ' + playerName + '</td><td class="sophHeader">Koordinaten</td></tr></thead><tbody>';
        rows.each(function(i) {
            var nameTd = $(this).find('td').eq(0);
            var coordTd = $(this).find('td').eq(1);
            var nameLink = nameTd.find('a');
            var coord = coordTd.text().trim();
            if (coord.match(/\d+\|\d+/)) {
                var name = nameLink.length ? nameLink.text().trim() : 'Dorf';
                var rowClass = (i % 2 == 0) ? 'sophRowA' : 'sophRowB';
                html += `<tr class="${rowClass}"><td>${name}</td><td style="text-align:center;"><a href="#" onclick="selectExternalVillage('${coord}'); return false;" style="color:#40D0E0;">${coord}</a></td></tr>`;
            }
        });
        html += '</tbody></table>';
        villagesDiv.html(html);
    }).fail(function() { villagesDiv.html('<div>Fehler beim Laden der Dörfer.</div>'); });
}

function selectExternalVillage(coord) {
    $("#coordinateTargetFirstTime")[0].value = coord;
    $('#saveCoord').click();
}

function selectOwnVillage(index) {
    coordinate = villagesData[index].coord;
    $("#coordinateTargetFirstTime")[0].value = coordinate;
    $('#saveCoord').click();
}

function createList() {
    if ($("#sendResources")[0]) {
        $("#sendResources")[0].remove();
        $("#resourceSender")[0].remove();
    }
    var htmlString = `
                <div id="resourceSender">
                    <table id="Settings" width="100%">
                        <thead>
                            <tr>
                                <td class="sophHeader" colspan="2">Einstellungen</td>
                                <td class="sophHeader" colspan="3">Zielmengen (pro Sendung)</td>
                                <td class="sophHeader" colspan="3">Aktionen</td>
                            </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td class="sophHeader" style="width:20%;">Ziel-Koordinaten</td>
                            <td class="sophHeader" style="width:10%;">Lager % behalten</td>
                            <td class="sophHeader" style="width:15%;">Holz</td>
                            <td class="sophHeader" style="width:15%;">Lehm</td>
                            <td class="sophHeader" style="width:15%;">Eisen</td>
                            <td class="sophHeader" style="width:10%;"></td>
                            <td class="sophHeader" style="width:10%;"></td>
                            <td class="sophHeader" style="width:10%;"></td>
                        </tr>
                        <tr>
                            <td class="sophRowA"><input type="text" id="coordinateTarget" name="coordinateTarget" size="10" value="${coordinate || ''}" placeholder="500|500"></td>
                            <td class="sophRowA" align="right"><input type="number" id="resPercent" name="resPercent" size="3" value="${resLimit || ''}" min="0" max="100">%</td>
                            <td class="sophRowA"><span class="icon header wood"></span> <input type="number" id="targetWood" size="8" value="${targetWood}" min="0"></td>
                            <td class="sophRowA"><span class="icon header stone"></span> <input type="number" id="targetStone" size="8" value="${targetStone}" min="0"></td>
                            <td class="sophRowA"><span class="icon header iron"></span> <input type="number" id="targetIron" size="8" value="${targetIron}" min="0"></td>
                            <td class="sophRowA"></td>
                            <td class="sophRowA"><button type="button" id="resetDefaults" class="btn">Standard</button></td>
                            <td class="sophRowA"><button type="button" id="sendRes" class="btn" onclick="reDo()">${langShinko[9]}</button></td>
                        </tr>
                        </tbody>
                    </table>
                    <br>
                </div>`.trim();
    var uiDiv = document.createElement('div');
    uiDiv.innerHTML = htmlString;

    var htmlCode = `
            <div id="sendResources" border=0>
                <table id="tableSend" width="100%">
                    <tbody id="appendHere">
                        <tr>
                            <td class="sophHeader" colspan=7 width="550" style="text-align:center">${langShinko[10]}</td>
                        </tr>
                        <tr>
                            <td class="sophHeader" width="25%" style="text-align:center">${langShinko[11]}</td>
                            <td class="sophHeader" width="25%" style="text-align:center">${langShinko[12]}</td>
                            <td class="sophHeader" width="5%" style="text-align:center">${langShinko[13]}</td>
                            <td class="sophHeader" width="10%" style="text-align:center">${langShinko[14]}</td>
                            <td class="sophHeader" width="10%" style="text-align:center">${langShinko[15]}</td>
                            <td class="sophHeader" width="10%" style="text-align:center">${langShinko[16]}</td>
                            <td class="sophHeader" width="15%">
                                <font size="1">${langShinko[17]}</font>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            `;

    $("#mobileHeader").eq(0).append(htmlCode);
    $("#contentContainer").eq(0).prepend(htmlCode);
    $("#mobileHeader").prepend(uiDiv.firstChild);
    $("#contentContainer").prepend(uiDiv.firstChild);

    $('#resetDefaults').click(function () {
        $("#targetWood")[0].value = defaultWood;
        $("#targetStone")[0].value = defaultStone;
        $("#targetIron")[0].value = defaultIron;
        $('#button').click();
    });
    $('#button').click(function () {
        coordinate = $("#coordinateTarget")[0].value.match(/\d+\|\d+/)[0] || coordinate;
        resLimit = parseInt($("#resPercent")[0].value) || 0;
        targetWood = parseInt($("#targetWood")[0].value) || defaultWood;
        targetStone = parseInt($("#targetStone")[0].value) || defaultStone;
        targetIron = parseInt($("#targetIron")[0].value) || defaultIron;
        totalTarget = targetWood + targetStone + targetIron;
        woodPercentage = targetWood / totalTarget;
        stonePercentage = targetStone / totalTarget;
        ironPercentage = targetIron / totalTarget;
        sessionStorage.setItem("coordinate", coordinate);
        sessionStorage.setItem("resLimit", resLimit);
        sessionStorage.setItem("targetWood", targetWood);
        sessionStorage.setItem("targetStone", targetStone);
        sessionStorage.setItem("targetIron", targetIron);
        reDo();
    });

    var listHTML = ``;

    $("#resourceSender").eq(0).prepend(`<table id="playerTarget" width="600">
    <tbody>
        <tr>
            <td class="sophHeader" rowspan="3"><img src="${sendBack[2]}"></td>
            <td class="sophHeader">${langShinko[4]}:</td>
            <td class="sophRowA">${sendBack[3]}</td>
            <td class="sophHeader"><span class="icon header wood"> </span></td>
            <td class="sophRowB" id="woodSent"></td>
        </tr>
        <tr>
            <td class="sophHeader">${langShinko[5]}:</td>
            <td class="sophRowB">${sendBack[1]}</td>
            <td class="sophHeader"><span class="icon header stone"> </span></td>
            <td class="sophRowA" id="stoneSent"></td>
        </tr>
        <tr>
            <td class="sophHeader">${langShinko[6]}: </td>
            <td class="sophRowA">${sendBack[4]}</td>
            <td class="sophHeader"><span class="icon header iron"> </span></td>
            <td class="sophRowB" id="ironSent"></td>
        </tr>
    </tbody>
</table>`);

    for (var i = 0; i < villagesData.length; i++) {
        if (i % 2 == 0) {
            tempRow = " id='" + i + "' class='sophRowB'";
        } else {
            tempRow = " id='" + i + "' class='sophRowA'";
        }
        res = calculateResAmounts(villagesData[i].wood, villagesData[i].stone, villagesData[i].iron, villagesData[i].warehouseCapacity, villagesData[i].availableMerchants);
        if (res.wood + res.stone + res.iron != 0 && villagesData[i].id != sendBack[0]) {
            listHTML += `
        <tr ${tempRow} height="40">
            <td><a href="${villagesData[i].url}" style="color:#40D0E0;">${villagesData[i].name} </a></td>
            <td> <a href="" style="color:#40D0E0;">${sendBack[1]}</a> </td>
            <td>${checkDistance(sendBack[5], sendBack[6], villagesData[i].coord.substring(0, 3), villagesData[i].coord.substring(4, 7))}</td>
            <td width="50" style="text-align:center">${res.wood}<span class="icon header wood"> </span></td>
            <td width="50" style="text-align:center">${res.stone}<span class="icon header stone"> </span></td>
            <td width="50" style="text-align:center">${res.iron}<span class="icon header iron"> </span></td>
            <td style="text-align:center"><input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="sendResources" value="${langShinko[17]}" onclick=sendResource(${villagesData[i].id},${sendBack[0]},${res.wood},${res.stone},${res.iron},${i})></td>
        </tr>`
        }
    }
    $("#appendHere").eq(0).append(listHTML);
    sortTableTest(2);
    formatTable();
    $(":button,#sendResources")[3].focus();
}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount, rowNr) {
    $(':button[id^="sendResources"]').prop('disabled', true);
    setTimeout(function () { $("#" + rowNr)[0].remove(); $(':button[id^="sendResources"]').prop('disabled', false); $(":button,#sendResources")[3].focus(); if($("#tableSend tr").length<=2) {
        alert("Finished sending!");
        if($(".btn-pp").length>0) $(".btn-pp").remove();
        throw Error("Done.");
    } }, 200);
    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", { ajaxaction: "map_send", village: sourceID }, e, function (e) {
        Dialog.close(),
            UI.SuccessMessage(e.message)
        console.log(e.message)
        totalWoodSent += woodAmount;
        totalStoneSent += stoneAmount;
        totalIronSent += ironAmount;
        $("#woodSent").eq(0).text(`${numberWithCommas(totalWoodSent)}`);
        $("#stoneSent").eq(0).text(`${numberWithCommas(totalStoneSent)}`);
        $("#ironSent").eq(0).text(`${numberWithCommas(totalIronSent)}`);
       }, !1);
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1.$2");
    return x;
}

function checkDistance(x1, y1, x2, y2) {
    var a = x1 - x2;
    var b = y1 - y2;
    return Math.round(Math.hypot(a, b));
}

function calculateResAmounts(wood, stone, iron, warehouse, merchants) {
    var merchantCarry = merchants * 1000;
    leaveBehindRes = Math.floor(warehouse / 100 * resLimit);
    var localWood = Math.max(0, wood - leaveBehindRes);
    var localStone = Math.max(0, stone - leaveBehindRes);
    var localIron = Math.max(0, iron - leaveBehindRes);
    merchantWood = (merchantCarry * woodPercentage);
    merchantStone = (merchantCarry * stonePercentage);
    merchantIron = (merchantCarry * ironPercentage);
    var perc = 1;
    if (merchantWood > localWood) { perc = localWood / merchantWood; merchantWood *= perc; merchantStone *= perc; merchantIron *= perc; }
    if (merchantStone > localStone) { perc = localStone / merchantStone; merchantWood *= perc; merchantStone *= perc; merchantIron *= perc; }
    if (merchantIron > localIron) { perc = localIron / merchantIron; merchantWood *= perc; merchantStone *= perc; merchantIron *= perc; }
    return { "wood": Math.floor(merchantWood), "stone": Math.floor(merchantStone), "iron": Math.floor(merchantIron) }
}

function coordToId(coordinate) {
    if (game_data.player.sitter > 0) {
        sitterID = `game.php?t=${game_data.player.id}&screen=api&ajax=target_selection&input=${coordinate}&type=coord`;
    } else {
        sitterID = '/game.php?&screen=api&ajax=target_selection&input=' + coordinate + '&type=coord';
    }
    $.get(sitterID, function (json) {
        if(parseFloat(game_data.majorVersion)>8.217) data = json;
        else data=JSON.parse(json);
    }).done(function(){
        sendBack = [data.villages[0].id, data.villages[0].name, data.villages[0].image, data.villages[0].player_name, data.villages[0].points, data.villages[0].x, data.villages[0].y]
        createList();
    })
}

function reDo() { coordToId(coordinate); }

function formatTable() {
    var tableRows = $("#tableSend tr");
    for (var i = 1; i < tableRows.length; i++) {
        tableRows[i].className = (i % 2 == 0) ? "sophRowB" : "sophRowA";
    }
}

function sortTableTest(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("tableSend");
    switching = true; dir = "asc";
    while (switching) {
        switching = false; rows = table.rows;
        for (i = 2; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[n];
            y = rows[i + 1].getElementsByTagName("td")[n];
            if (dir == "asc") {
                if (Number(x.innerHTML) > Number(y.innerHTML)) { shouldSwitch = true; break; }
            } else if (dir == "desc") {
                if (Number(x.innerHTML) < Number(y.innerHTML)) { shouldSwitch = true; break; }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true; switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") { dir = "desc"; switching = true; }
        }
    }
}
