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
        "Rohstoff-Versender für Münzen/Flaggen",
        "Ziel-Koordinate eingeben",
        "Speichern",
        "Ersteller",
        "Spieler",
        "Dorf",
        "Punkte",
        "Ziel-Koordinaten",
        "Lager % behalten",
        "Neu berechnen",
        "Rohstoffe versenden",
        "Quell-Dorf",
        "Ziel-Dorf",
        "Distanz",
        "Holz",
        "Lehm",
        "Eisen",
        "Rohstoffe versenden",
        "Erstellt von Sophie 'Shinko to Kuma'"
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
        "Inserire le coordinate a cui mandare risorse",
        "Salva",
        "Creatrice",
        "Giocatore",
        "Villaggio",
        "Punti",
        "Coordinate a cui mandare",
        "Conserva % magazzino",
        "Ricalcola trasporti",
        "Invia risorse",
        "Villaggio di origine",
        "Villaggio di destinazione",
        "Distanz",
        "Legno",
        "Argilla",
        "Ferro",
        "Manda risorse",
        "Creato da Sophie 'Shinko to Kuma'"
    ]
}
if (game_data.locale == "pt_BR") {
    langShinko = [
        "Enviar recursos para cunhagem de moedas",
        "Insira coordenada para enviar recursos",
        "Salvar",
        "Criador",
        "Jogador",
        "Aldeia",
        "Pontos",
        "Enviar para",
        "Manter % no armazém",
        "Recalcular transporte",
        "Enviar recursos",
        "Origem",
        "Destino",
        "Distância",
        "Madeira",
        "Argila",
        "Ferro",
        "Enviar recursos",
        "Criado por Sophie 'Shinko to Kuma'"
    ]
}

cssClassesSophie = `
<style>
.sophRowA { background-color: #32353b; color: white; }
.sophRowB { background-color: #36393f; color: white; }
.sophHeader { background-color: #202225; font-weight: bold; color: white; }
</style>`

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

if ("resLimit" in sessionStorage) {
    resLimit = parseInt(sessionStorage.getItem("resLimit")) || 0;
} else {
    sessionStorage.setItem("resLimit", resLimit);
}

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&page=-1&`;
} else {
    URLReq = "game.php?&screen=overview_villages&mode=prod&page=-1&";
}
$.get(URLReq).done(function (page) {
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
            allWoodTotals.push(allWoodObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allClayObjects.length; i++) {
            allClayTotals.push(allClayObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allIronObjects.length; i++) {
            allIronTotals.push(allIronObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allVillages.length; i++) {
            warehouseCapacity.push(allWarehouses[i].parentElement.innerText);
        }
        for (var i = 0; i < allVillages.length; i++) {
            availableMerchants.push(allMerchants[i+1].innerText);
            totalMerchants.push("999");
        }
        for (var i = 0; i < allVillages.length; i++) {
            var pop = allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/);
            farmSpaceUsed.push(pop[1]); farmSpaceTotal.push(pop[2]);
        }
    } else {
        console.log("desktop");
        allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
        allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
        allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron");
        allVillages = $(page).find(".quickedit-vn");
        for (var i = 0; i < allWoodObjects.length; i++) {
            allWoodTotals.push(allWoodObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allClayObjects.length; i++) {
            allClayTotals.push(allClayObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allIronObjects.length; i++) {
            allIronTotals.push(allIronObjects[i].textContent.replace(/\./g,'').replace(',',''));
        }
        for (var i = 0; i < allVillages.length; i++) {
            warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
        }
        for (var i = 0; i < allVillages.length; i++) {
            var merch = allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/);
            availableMerchants.push(merch[1]); totalMerchants.push(merch[2]);
        }
        for (var i = 0; i < allVillages.length; i++) {
            var pop = allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/);
            farmSpaceUsed.push(pop[1]); farmSpaceTotal.push(pop[2]);
        }
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
    }
    askCoordinate();
});

function askCoordinate() {
    var savedCoord = sessionStorage.getItem("coordinate") || "";
    var ownVillagesHtml = '<table style="width:100%; margin-top:10px;"><thead><tr><td class="sophHeader">Dorf</td><td class="sophHeader">Koord</td></tr></thead><tbody>';
    for (var i = 0; i < villagesData.length; i++) {
        var rowClass = (i % 2 == 0) ? 'sophRowA' : 'sophRowB';
        ownVillagesHtml += `<tr class="${rowClass}"><td><a href="#" onclick="selectOwnVillage(${i});return false;" style="color:#40D0E0;">${villagesData[i].name}</a></td><td style="text-align:center;">${villagesData[i].coord}</td></tr>`;
    }
    ownVillagesHtml += '</tbody></table>';

    var content = `<div style="max-width:1000px;">
    <h2 class="popup_box_header"><center><u><font color="darkgreen">${langShinko[0]}</font></u></center></h2>
    <hr>
    <p><center><font color=maroon><b>${langShinko[1]}</b></font></center></p>
    <center>
       <table>
          <tr><td><input type="text" id="coordinateTargetFirstTime" size="20" value="${savedCoord}"></td></tr>
          <tr><td><button type="button" id="showOwnVillages" class="btn">Eigene Dörfer</button></td></tr>
          <tr><td id="ownVillagesList" style="display:none;">${ownVillagesHtml}</td></tr>
          
          <tr><td><hr></td></tr>
          <tr><td><b>Zielmenge pro Sendung:</b></td></tr>
          <tr>
             <td>
                 <span class="icon header wood"></span> <input type="number" id="inputWood" size="6" value="${targetWood}"> 
                 <span class="icon header stone"></span> <input type="number" id="inputStone" size="6" value="${targetStone}"> 
                 <span class="icon header iron"></span> <input type="number" id="inputIron" size="6" value="${targetIron}">
             </td>
          </tr>
          <tr><td><button type="button" id="resetDefaults" class="btn">Standard (Münzen)</button></td></tr>
          <tr><td>Lager % behalten: <input type="number" id="inputResLimit" size="2" value="${resLimit}">%</td></tr>
          <tr><td><button type="button" class="btn evt-cancel-btn btn-confirm-yes" id="saveCoord">${langShinko[2]}</button></td></tr>
       </table>
    </center>
    <br><hr>
    <center><img id="sophieImg" src="https://dl.dropboxusercontent.com/s/bxoyga8wa6yuuz4/sophie2.gif" style="cursor:help;"></center>
    <br><center><p>${langShinko[18]}: Sophie "Shinko to Kuma"</p></center>
 </div>`;

    Dialog.show('Supportfilter', content);

    $('#showOwnVillages').click(() => $('#ownVillagesList').toggle());
    $('#resetDefaults').click(() => {
        $('#inputWood').val(defaultWood);
        $('#inputStone').val(defaultStone);
        $('#inputIron').val(defaultIron);
    });

    $('#saveCoord').click(() => {
        var coord = $("#coordinateTargetFirstTime")[0].value.match(/\d+\|\d+/);
        if (!coord) { alert("Ungültige Koordinaten!"); return; }
        coordinate = coord[0];
        sessionStorage.setItem("coordinate", coordinate);

        targetWood = parseInt($('#inputWood').val()) || defaultWood;
        targetStone = parseInt($('#inputStone').val()) || defaultStone;
        targetIron = parseInt($('#inputIron').val()) || defaultIron;
        totalTarget = targetWood + targetStone + targetIron;
        woodPercentage = targetWood / totalTarget;
        stonePercentage = targetStone / totalTarget;
        ironPercentage = targetIron / totalTarget;

        sessionStorage.setItem("targetWood", targetWood);
        sessionStorage.setItem("targetStone", targetStone);
        sessionStorage.setItem("targetIron", targetIron);

        resLimit = parseInt($('#inputResLimit').val()) || 0;
        sessionStorage.setItem("resLimit", resLimit);

        $('.popup_box_close')[0].click();
        coordToId(coordinate);
    });
}

function selectOwnVillage(i) {
    coordinate = villagesData[i].coord;
    $("#coordinateTargetFirstTime").val(coordinate);
    $('#saveCoord').click();
}

function createList() {
    if ($("#sendResources")[0]) { $("#sendResources")[0].remove(); $("#resourceSender")[0].remove(); }
    var htmlString = `
        <div id="resourceSender">
            <table id="Settings" width="600">
                <thead><tr>
                    <td class="sophHeader">Ziel: ${coordinate}</td>
                    <td class="sophHeader">Holz: ${targetWood}</td>
                    <td class="sophHeader">Lehm: ${targetStone}</td>
                    <td class="sophHeader">Eisen: ${targetIron}</td>
                    <td class="sophHeader">Lager %: ${resLimit}</td>
                    <td class="sophHeader"><button type="button" id="recalcBtn" class="btn">${langShinko[9]}</button></td>
                </tr></thead>
                <tbody><tr>
                    <td class="sophRowA" colspan="6">
                        <button type="button" id="openSettings" class="btn">Einstellungen ändern</button>
                    </td>
                </tr></tbody>
            </table><br>
        </div>`;
    var uiDiv = document.createElement('div'); uiDiv.innerHTML = htmlString;

    var htmlCode = `<div id="sendResources"><table id="tableSend" width="100%"><tbody id="appendHere">
        <tr><td class="sophHeader" colspan=7 style="text-align:center">${langShinko[10]}</td></tr>
        <tr>
            <td class="sophHeader" width="25%">${langShinko[11]}</td>
            <td class="sophHeader" width="25%">${langShinko[12]}</td>
            <td class="sophHeader" width="5%">${langShinko[13]}</td>
            <td class="sophHeader" width="10%">${langShinko[14]}</td>
            <td class="sophHeader" width="10%">${langShinko[15]}</td>
            <td class="sophHeader" width="10%">${langShinko[16]}</td>
            <td class="sophHeader" width="15%"><font size="1">${langShinko[17]}</font></td>
        </tr>
    </tbody></table></div>`;

    $("#mobileHeader").eq(0).append(htmlCode);
    $("#contentContainer").eq(0).prepend(htmlCode);
    $("#mobileHeader").prepend(uiDiv.firstChild);
    $("#contentContainer").prepend(uiDiv.firstChild);

    $('#recalcBtn').click(() => reDo());
    $('#openSettings').click(() => askCoordinate());

    $("#resourceSender").eq(0).prepend(`<table id="playerTarget" width="600"><tbody>
        <tr><td class="sophHeader" rowspan="3"><img src="${sendBack[2]}"></td>
            <td class="sophHeader">${langShinko[4]}:</td><td class="sophRowA">${sendBack[3]}</td>
            <td class="sophHeader"><span class="icon header wood"></span></td><td class="sophRowB" id="woodSent">0</td></tr>
        <tr><td class="sophHeader">${langShinko[5]}:</td><td class="sophRowB">${sendBack[1]}</td>
            <td class="sophHeader"><span class="icon header stone"></span></td><td class="sophRowA" id="stoneSent">0</td></tr>
        <tr><td class="sophHeader">${langShinko[6]}:</td><td class="sophRowA">${sendBack[4]}</td>
            <td class="sophHeader"><span class="icon header iron"></span></td><td class="sophRowB" id="ironSent">0</td></tr>
    </tbody></table>`);

    var listHTML = "";
    for (var i = 0; i < villagesData.length; i++) {
        var tempRow = (i % 2 == 0) ? `id="${i}" class="sophRowB"` : `id="${i}" class="sophRowA"`;
        var res = calculateResAmounts(villagesData[i].wood, villagesData[i].stone, villagesData[i].iron, villagesData[i].warehouseCapacity, villagesData[i].availableMerchants);
        if (res.wood + res.stone + res.iron > 0 && villagesData[i].id != sendBack[0]) {
            listHTML += `<tr ${tempRow} height="40">
                <td><a href="${villagesData[i].url}" style="color:#40D0E0;">${villagesData[i].name}</a></td>
                <td><a href="" style="color:#40D0E0;">${sendBack[1]}</a></td>
                <td>${checkDistance(sendBack[5], sendBack[6], villagesData[i].coord.substring(0,3), villagesData[i].coord.substring(4,7))}</td>
                <td style="text-align:center">${res.wood}<span class="icon header wood"></span></td>
                <td style="text-align:center">${res.stone}<span class="icon header stone"></span></td>
                <td style="text-align:center">${res.iron}<span class="icon header iron"></span></td>
                <td style="text-align:center"><input type="button" class="btn evt-confirm-btn btn-confirm-yes" value="${langShinko[17]}" onclick="sendResource(${villagesData[i].id},${sendBack[0]},${res.wood},${res.stone},${res.iron},${i})"></td>
            </tr>`;
        }
    }
    $("#appendHere").eq(0).append(listHTML);
    sortTableTest(2);
    formatTable();
    $(":button,#sendResources")[3].focus();
}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount, rowNr) {
    $(':button[id^="sendResources"]').prop('disabled', true);
    setTimeout(() => {
        $("#" + rowNr)[0].remove();
        $(':button[id^="sendResources"]').prop('disabled', false);
        $(":button,#sendResources")[3].focus();
        if($("#tableSend tr").length <= 2) {
            alert("Fertig!");
            if($(".btn-pp").length > 0) $(".btn-pp").remove();
            throw Error("Done.");
        }
    }, 200);
    TribalWars.post("market", { ajaxaction: "map_send", village: sourceID }, { target_id: targetID, wood: woodAmount, stone: stoneAmount, iron: ironAmount }, (e) => {
        Dialog.close();
        UI.SuccessMessage(e.message);
        totalWoodSent += woodAmount;
        totalStoneSent += stoneAmount;
        totalIronSent += ironAmount;
        $("#woodSent").eq(0).text(numberWithCommas(totalWoodSent));
        $("#stoneSent").eq(0).text(numberWithCommas(totalStoneSent));
        $("#ironSent").eq(0).text(numberWithCommas(totalIronSent));
    }, !1);
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1.$2");
    return x;
}

function checkDistance(x1, y1, x2, y2) {
    return Math.round(Math.hypot(x1 - x2, y1 - y2));
}

function calculateResAmounts(wood, stone, iron, warehouse, merchants) {
    var carry = merchants * 1000;
    var leave = Math.floor(warehouse * resLimit / 100);
    var w = Math.max(0, wood - leave);
    var s = Math.max(0, stone - leave);
    var i = Math.max(0, iron - leave);
    var mw = carry * woodPercentage;
    var ms = carry * stonePercentage;
    var mi = carry * ironPercentage;
    var p = 1;
    if (mw > w) p = w / mw;
    if (ms * p > s) p = s / (ms * p);
    if (mi * p > i) p = i / (mi * p);
    return {
        wood: Math.floor(mw * p),
        stone: Math.floor(ms * p),
        iron: Math.floor(mi * p)
    };
}

function coordToId(c) {
    var url = game_data.player.sitter > 0
        ? `game.php?t=${game_data.player.id}&screen=api&ajax=target_selection&input=${c}&type=coord`
        : `/game.php?&screen=api&ajax=target_selection&input=${c}&type=coord`;
    $.get(url).done((json) => {
        var data = parseFloat(game_data.majorVersion) > 8.217 ? json : JSON.parse(json);
        sendBack = [
            data.villages[0].id,
            data.villages[0].name,
            data.villages[0].image,
            data.villages[0].player_name,
            data.villages[0].points,
            data.villages[0].x,
            data.villages[0].y
        ];
        createList();
    });
}

function reDo() { coordToId(coordinate); }

function formatTable() {
    $("#tableSend tr:gt(0)").each((i, e) => {
        e.className = i % 2 == 0 ? "sophRowB" : "sophRowA";
    });
}

function sortTableTest(n) {
    var table = document.getElementById("tableSend");
    var switching = true;
    var dir = "asc";
    while (switching) {
        switching = false;
        var rows = table.rows;
        for (var i = 2; i < rows.length - 1; i++) {
            var shouldSwitch = false;
            var x = rows[i].getElementsByTagName("td")[n];
            var y = rows[i + 1].getElementsByTagName("td")[n];
            if (dir == "asc") {
                if (Number(x.innerHTML) > Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (Number(x.innerHTML) < Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        } else {
            if (dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}
