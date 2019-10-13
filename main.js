var GRID_WIDTH = 3;
var GRID_HEIGHT = 3;
var PREV_WIDTH = GRID_WIDTH;
var PREV_HEIGHT = GRID_HEIGHT;
var canvas_obj = null;
var data = [];
var g = null;
var speed = 1000;
var stepcounter = 0;

var playing = false;

var timerId = null;

$(document).ready(function () {

    document.getElementById("grid_width").value = GRID_WIDTH;
    document.getElementById("grid_height").value = GRID_HEIGHT;
    document.getElementById("speed").value = speed;
    canvas_obj = d3.select("#game_cnv")
        .append("svg")
        .attr("width", "450px")
        .attr("height", "450px");

    canvas_obj.append("g");


    $("#grid_size").on("change", {
            x: PREV_WIDTH,
            y: PREV_HEIGHT,
        },
        resize_grid);

    $("#speed").on("change", function()
    {
        var new_speed = document.getElementById("speed").value;
        if(new_speed >= 200 || new_speed <= 10000)
            speed = new_speed
        else
            document.getElementById("speed").value = speed;
    });

    $("#step_btn").on("click", {}, step);

    $("#auto-play").on("click", {}, autoplay);
    $("#stop").on("click",{},stop);

    draw_grid();
});

function stop()
{
    if(!playing)
        return;

    clearInterval(timerId);
    playing = false;
    
    $("#auto-play").css("border-style","outset")
    $("#step_btn").prop("disabled",false);
}

function autoplay()
{
    if(playing)
        return;
    playing = true;
    $("#auto-play").css("border-style","inset")
    $("#step_btn").prop("disabled",true);

    timerId = setInterval(step,speed);
}

function resize_grid(event) {
    
    nw = document.getElementById("grid_width").value;
    nh = document.getElementById("grid_height").value;

    if (nw >= 3 && nw <= 255 && nh >= 3 && nh <= 255) {
        PREV_WIDTH = GRID_WIDTH;
        PREV_HEIGHT = GRID_HEIGHT;
        GRID_WIDTH = nw;
        GRID_HEIGHT = nh;
        if (PREV_WIDTH != GRID_WIDTH || PREV_HEIGHT != GRID_HEIGHT)
            draw_grid();
        $("#counter").text(0);
    } else {
        if (nw < 3 || nw > 255)
            document.getElementById("grid_width").value = PREV_WIDTH;
        else
            document.getElementById("grid_height").value = PREV_HEIGHT;
    }
}

function step() {
    $("#counter").text(stepcounter++);
    var new_data = Array(GRID_HEIGHT * GRID_WIDTH).fill(false);
    var observed = Array(GRID_HEIGHT * GRID_WIDTH).fill(false);
    g.selectAll(".game_tile").each(
        function (d, i) {
            if (d)
                new_data[i] = inspect_tile({
                    index: i,
                    obs: observed,
                    nd: new_data
                })

            if (!new_data[i]) {
                d3.select(this).classed("gt_alive", false);
                d3.select(this).classed("gt_dead", true);
            }
        });

    data = JSON.parse(JSON.stringify(new_data));

    g.selectAll(".game_tile").data(data);
}

function inspect_tile(obj) {
    index = obj.index;

    var min_x = (index < GRID_HEIGHT) ? 0 : -1;
    var max_x = (index >= GRID_HEIGHT * GRID_WIDTH - 1) ? 0 : 1;

    var min_y = (index % GRID_HEIGHT == 0) ? 0 : -1;
    var max_y = ((index + 1) % GRID_HEIGHT == 0) ? 0 : 1;


    var live_count = 0;
    for (var y = min_y; y < max_y + 1; y++) {
        for (var x = min_x; x < max_x + 1; x++) {
            if (x == 0 && y == 0) {
                continue;
            }

            if (data[index + x * GRID_HEIGHT + y]) {
                live_count += 1
            } else {
                if (!obj.obs[index + x * GRID_HEIGHT + y]) {
                    obj.nd[index + x * GRID_HEIGHT + y] = inspect_tile_nr(index + x * GRID_HEIGHT + y);
                    if (obj.nd[index + x * GRID_HEIGHT + y]) {
                        d3.selectAll(".game_tile").filter(function (d, i) {
                            return index + x * GRID_HEIGHT + y == i
                        }).classed("gt_alive", true);
                        d3.selectAll(".game_tile").filter(function (d, i) {
                            return index + x * GRID_HEIGHT + y == i
                        }).classed("gt_dead", false);
                    }
                    obj.obs[index + x * GRID_HEIGHT + y] = true;
                }
            }
        }
    }
    return live_count == 2 || live_count == 3
}

function inspect_tile_nr(index) {
    var min_x = (index < GRID_HEIGHT) ? 0 : -1;
    var max_x = (index >= GRID_HEIGHT * GRID_WIDTH - 1) ? 0 : 1;

    var min_y = (index % GRID_HEIGHT == 0) ? 0 : -1;
    var max_y = ((index + 1) % GRID_HEIGHT == 0) ? 0 : 1;



    var live_count = 0;
    for (var y = min_y; y < max_y + 1; y++)
        for (var x = min_x; x < max_x + 1; x++) {
            if (x == 0 && y == 0)
                continue;
            if (data[index + x * GRID_HEIGHT + y])
                live_count += 1
        }
    return live_count == 3
}

function draw_grid() {

    var off = Math.min(1000 / GRID_WIDTH, 1000 / GRID_HEIGHT);
    d3.selectAll(".game_tile").remove();
    data = [];
    canvas_obj.attr("width", GRID_WIDTH * off)
        .attr("height", GRID_HEIGHT * off);
    g = canvas_obj.select("g");

    g.attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%");

    var gr = g.append("rect")
    gr.attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "whitesmoke");


    for (var x = 0; x < GRID_WIDTH; x++) {
        for (var y = 0; y < GRID_HEIGHT; y++) {
            g.append("rect")
                .attr("x", x * off)
                .attr("y", y * off)
                .attr("width", off)
                .attr("height", off)
                .classed("game_tile", true)
                .classed("gt_dead", true);
            data.push(false);
        }
    }

    g.selectAll(".game_tile")
        .data(data);

    g.selectAll(".game_tile")
        .on("click", function (d, i) {
            if (d)
                data[i] = false;
            else
                data[i] = true;

            if (data[i]) {
                d3.select(this).classed("gt_alive", true);
                d3.select(this).classed("gt_dead", false);
            } else {
                d3.select(this).classed("gt_alive", false);
                d3.select(this).classed("gt_dead", true);
            }
            g.selectAll(".game_tile").data(data);
        });
}