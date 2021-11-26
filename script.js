function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var suggestions = ["flowers", "Vincent van Gogh", "a chair", "North African culture", "Picasso", "a vase", "The Scream", "postmodern art", "Indigenous pottery"];

async function typeWrite(txt, speed = 100) {
    searchBarLength = $("#search-bar").attr("placeholder").length - 11 // remove the "search for " part
    for (let i=0; i < searchBarLength; i++) {
        $("#search-bar").attr("placeholder", (index, value) => value.slice(0, -1));
        await sleep(getRandomInt(0, speed))
    }

    txt += "...";
    for (let i=0; i < txt.length; i++) {
        $("#search-bar").attr("placeholder", (index, value) => (value || "") + txt.charAt(i));
        await sleep(speed)
    }
}

async function showSuggestions() {
    while (true) {
        suggestions.sort(() => .5 - Math.random()); // shuffle the suggestions
        for (let i=0; i < suggestions.length; i++) {
            await typeWrite(suggestions[i]);
            await sleep(2000)
        }
    }
}

showSuggestions();

let search_base_url = "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=";
let object_base_url = "https://collectionapi.metmuseum.org/public/collection/v1/objects/"


var typingTimer;
var doneTypingInterval = 2000;

$("#search-bar").on('keypress', function (e) {
    if (e.keyCode == 13) {
        // If the ENTER key is pressed, prevent the form from being submitted
        e.preventDefault();
        // showResult($("#search-bar").val());
    } else {
        $("#search-btn > i").removeClass("fa-search")
        $("#search-btn > i").addClass("fa-circle-notch fa-spin")
        $("#no-results").css("visibility", "hidden");
        $("#results").html("");
        clearTimeout(typingTimer);
        typingTimer = setTimeout(updateResults, doneTypingInterval);
    }
});

function updateResults() {
    $("#results").html("").show();
    query = $("#search-bar").val();

    if (!query) return false;
    $.get(search_base_url + query, data => {
        if (data.objectIDs) {
            data.objectIDs.slice(0, 20).forEach(id => {
                $.get(object_base_url + id, data => {
                    let result = document.createElement("div");
                    result.classList.add("result");
                    result.setAttribute("id", id)
                    result.setAttribute("onclick", "showResult(this.id);")
                    result.innerText = (data.artistDisplayName ? data.artistDisplayName + "'s " : "") + data.title + (data.objectDate ? ", " + data.objectDate : "");
                    $("#results").append(result);
                }, "json");
            });
        } else {
            $("#no-results").css("visibility", "visible");
        }
    }, "json")

    $("#search-btn > i").removeClass("fa-circle-notch fa-spin")
    $("#search-btn > i").addClass("fa-search")
}

function showResult(objectID) {
    $("#loading").css("display", "flex").hide().fadeIn("slow");
    $("#no-results").css("visibility", "hidden");
    $("#results").html("").hide();
    $("#page-title").animate({height: "0px", opacity: "0"}, 500).css("visibility", "hidden");
    // $("#search-bar-container").css("height", "auto")
    $("#search-bar-container").css("top", "15px")
    $("#result").css("display", "flex").css("height", "auto").css("min-height", "100%");
    $.get(object_base_url + objectID, data => {
        $("#search-bar").val((data.artistDisplayName ? data.artistDisplayName + "'s " : "") + data.title + (data.objectDate ? ", " + data.objectDate : ""))

        $("#title").text(data.title);
        $("#title").attr("href", data.objectURL);
        
        $("#artist").text(data.artistDisplayName || "unknown artist");
        if (data.artistULAN_URL) {
            $("#artist").addClass("link")
            $("#artist").attr("href", data.artistULAN_URL);
        } else {
            $("#artist").removeClass("link");
            $("#artist").removeAttr("href");
        }

        $("#date").text(data.objectDate || "Unknown creation date");
        
        $("#artist-bio").text(data.artistDisplayBio || "N/A");

        $("#department").text(data.department || "N/A");

        $("#culture").text(data.culture || "N/A");

        $("#classification").text(data.classification || "N/A");

        $("#medium").text(data.medium || "N/A");

        $("#dimensions").text(data.dimensions || "N/A");

        $("#credit").text(data.credit || "N/A");

        tags = []
        if (data.tags)
            data.tags.forEach(tag => {
                tags.push(`<a class="link" target='_blank' href=${tag.AAT_URL}>${tag.term}</a>`)
            })
        
        $("#tags").html(tags.join(', ') || "N/A")

        var url = data.primaryImage;

        var img = new Image();
        img.onload = function() {
            $("#bg-image").css("background-image", `url(${url})`)
            $("#result-image").css("background-image", `url(${url})`);
            $("#loading").fadeOut("slow", function() {
                $("#loading").hide()
            });
        }
        img.src = url;
        if (img.complete) img.onload();
    }, "json")
}