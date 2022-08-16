'use strict';

import socket from "./client.js"

const pc = parseInt(document.querySelector("input[name='pc']").value);

if (document.forms["bid"]) {
    document.forms["bid"].querySelector("input[value='立候補']").onclick = function (e) {
        if (this.closest("form").reportValidity()) {
            socket.emit("input", pc, { declaration: parseInt(this.closest("form").elements["declaration"].value) });
        }
    };

    document.forms["bid"].querySelector("input[value='降りる']").onclick = function (e) {
        socket.emit("input", pc, { declaration: 0 });
    };
}

if (document.forms["designation"]) {
    document.forms["designation"].elements["medal"].onchange = function (e) {
        this.closest("form").elements["medal_suit"].disabled = this.value !== "その他";
        this.closest("form").elements["medal_rank"].disabled = this.value !== "その他";
    };

    document.forms["designation"].querySelector("input[value='決定']").onclick = function (e) {
        if (this.closest("form").reportValidity()) {
            const trump = this.closest("form").elements["trump"].value;
            let medal = this.closest("form").elements["medal"].value;
            if (medal === "その他")
                medal = this.closest("form").elements["medal_suit"].value
                    + "の" + this.closest("form").elements["medal_rank"].value;
            if (!document.querySelector(`svg g.player_area:first-of-type g.hand image[href='${filepathFromNickname(trump, medal)}']`)
                || window.confirm("自分で所持しているカードですが、よろしいですか？"))
                socket.emit("input", pc, { trump, medal });
        }
    };
}

if (document.getElementById("discard_button")) {
    document.getElementById("discard_button").onclick = function (e) {
        const hand_list = document.querySelector("svg g.player_area:first-of-type g.hand").children;
        const trash = Array.from(hand_list, (x, i) => x.classList.contains("lifted") ? i : -1).filter(x => x >= 0);
        socket.emit("input", pc, { trash });
    };
}

if (document.forms["joker_suit"]) {
    document.forms["joker_suit"].onchange = function (e) {
        if (this.closest("form").checkValidity()) {
            socket.emit("input", pc, {
                index: this.closest("form").elements["index"].value,
                request: this.closest("form").elements["request"].value
            });
        }
    };

    document.forms["joker_suit"].onreset = function (e) {
        document.getElementById("request_dialog").style.display = "none";
    };
}

if (document.forms["finish"]) {
    document.forms["finish"].querySelector("input[value='OK']").onclick = function (e) {
        socket.emit("input", pc, { action: "finish" });
        location.reload();
    };
}

for (const card of document.getElementsByClassName("disposable")) card.onclick = toggleCardSelection;
for (const card of document.getElementsByClassName("available")) card.onclick = playCard;

function toggleCardSelection(e) {
    this.classList.toggle("lifted");
    this.setAttribute("y", this.classList.contains("lifted") ? -30 : 0);
    document.getElementById("discard_button").disabled = 
        this.parentNode.childElementCount - this.parentNode.getElementsByClassName("lifted").length
            !== Math.floor(50 / document.getElementsByClassName("player_area").length);
}

function playCard(e) {
    const j = Array.from(this.parentNode.children).indexOf(this);
    if (this.getAttribute("href").endsWith("joker.svg") && document.querySelector("svg g.layout image") == null) {
        document.getElementById("request_dialog").style.display = "initial";
        document.forms["joker_suit"].elements["index"].value = j;
    }
    else {
        socket.emit("input", pc, { index: j });
    }
}

function filepathFromNickname(trump, medal) {
    const inverse_of = { "スペード": "クラブ", "ハート": "ダイヤ", "ダイヤ": "ハート", "クラブ": "スペード" };
    const translator = { "スペード": "spade", "ハート": "heart", "ダイヤ": "diamond", "クラブ": "club" };
    if (medal === "マイティ") {
        if (trump === "スペード") return `/img/playing-cards/1_club.svg`;
        return `/img/playing-cards/1_spade.svg`;
    }
    if (medal === "エクストラジョーカー") return `/img/playing-cards/extra_joker.svg`;
    if (medal === "赤ジョーカー") return `/img/playing-cards/red_joker.svg`;
    if (medal === "黒ジョーカー") return `/img/playing-cards/black_joker.svg`;
    if (medal === "正ジャック") return `/img/playing-cards/jack_${translator[trump]}.svg`;
    if (medal === "裏ジャック") return `/img/playing-cards/jack_${translator[inverse_of[trump]]}.svg`;
    let [suit, rank] = medal.split("の");
    if (rank === "A") rank = "1";
    if (rank === "J") rank = "jack";
    if (rank === "Q") rank = "queen";
    if (rank === "K") rank = "king";
    suit = translator[suit];
    return `/img/playing-cards/${rank}_${suit}.svg`;
}
