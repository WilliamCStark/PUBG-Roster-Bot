/*
    A bot for formatting pubg rosters
*/

console.log('hello');

// Import the aws-sdk
var AWS = require("aws-sdk");
// Import the filesystem module
const fs = require('fs');
// Import assert module
const assert = require('assert');

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();
// Create an instance of an AWS S3 client
var s3 = new AWS.S3();
var bucket = 'pubg-roster-bot';

// Functions, definitions, and objects
// Player Stat object
function Stats(kills, knocks, revives, gamesplayed){
    this.kills = kills;
    this.knocks = knocks;
    this.revives = revives;
    this.gamesplayed = gamesplayed;
}
// Roster Object
function Roster(players, kill_v, knock_v, revive_v, wins_v){
    this.players = players;
    this.kill_value = kill_v;
    this.knock_value = knock_v;
    this.revive_value = revive_v;
    this.wins_value = wins_v;
    this.addPlayer = function(name, stats) {
        this.players[name] = stats;
    };
    this.updatePlayer = function(name, property, newValue) {
        this.players[name][property] = newValue
    }
    this.removePlayer = function(name) {
        delete this.players[name];
    }
    this.updatePointValue = function(property, newValue){
        this[property] = newValue;
    }
    this.reportGameStats = function(name, kills, knocks, revives) {
        this.players[name].kills += kills;
        this.players[name].knocks += knocks;
        this.players[name].revives += revives;
        this.players[name].gamesplayed += 1;
    }
}
var roster_channel = null;
var commmands_list = [
    'AddPlayer',
    'UpdatePlayer',
    'ResetPlayer',
    'RemovePlayer',
    'Help',
    'UpdatePointValue',
    'UpdatePointValues',
    'ReportGameStats',
    'Undo'
];
var roster_inputs = {
    'killsvalue' : 'kill_value',
    'killvalue' : 'kill_value',
    'kills value': 'kill_value',
    'kills_value': 'kill_value',
    'kill value': 'kill_value',
    'kill_value': 'kill_value',
    'kill': 'kill_value',
    'kills': 'kill_value',
    'knocksvalue' : 'knock_value',
    'knockvalue' : 'knock_value',
    'knocks value': 'knock_value',
    'knocks_value': 'knock_value',
    'knock value': 'knock_value',
    'knock_value': 'knock_value',
    'knock': 'knock_value',
    'knocks': 'knock_value',
    'revivesvalue' : 'revive_value',
    'revivevalue' : 'revive_value',
    'revives value': 'revive_value',
    'revives_value': 'revive_value',
    'revive value': 'revive_value',
    'revive_value': 'revive_value',
    'revive': 'revive_value',
    'revives': 'revive_value',
    'winsvalue' : 'wins_value',
    'winvalue' : 'wins_value',
    'wins value': 'wins_value',
    'wins_value': 'wins_value',
    'win value': 'wins_value',
    'win_value': 'wins_value',
    'win': 'wins_value',
    'wins': 'wins_value',

};
// File interaction code:
var roster_channel_id = "";
var roster_channel = null;
var roster = new Roster({},0,0,0,0);
var roster_msg_id = "";

// fs.closeSync(fs.openSync('roster.json', 'a'));
// const read_stream_roster = fs.createReadStream('roster.json');
// read_stream_roster.setEncoding('utf8')
// read_stream_roster.on("data", function (chunk) {
//     assert.equal(typeof chunk, 'string');
//     roster_string += chunk;
// });
// read_stream_roster.on("end", function() {
//     try {
//         var roster_read = JSON.parse(roster_string);
//         for (var property in roster_read) {
//             roster[property] = roster_read[property];
//         }
//     }
//     catch (err) {

//     }
//     finally {
//         // When roster has been read, begin reading the roster_channel
//         fs.closeSync(fs.openSync('roster_channel.txt', 'a'));
//         const read_stream_channel = fs.createReadStream('roster_channel.txt');
//         read_stream_channel.setEncoding('utf8');
//         read_stream_channel.on("data", function (chunk) {
//             assert.equal(typeof chunk, 'string');
//             roster_channel_id += chunk;
//         });
//         read_stream_channel.on("end", function() {
            
//             fs.closeSync(fs.openSync('roster_message.txt', 'a'));
//             const read_stream_message = fs.createReadStream('roster_message.txt');
//             read_stream_message.setEncoding('utf8');
//             read_stream_message.on("data", function(chunk) {
//                 assert.equal(typeof chunk, 'string');
//                 roster_msg_id += chunk;
//             });
            
//             read_stream_message.on("end", function() {
//                 // Don't log the bot in until all files have been read
//                 client.login(process.env.BOT_TOKEN);
//             })
            
//         });
//     }
// });
s3.getObject({
    Bucket: bucket,
    Key: 'roster.json'
}, function(err, roster_string) {
    if (err) {

    }
    else {
        try {
            var roster_read = JSON.parse(roster_string);
            for (var property in roster_read) {
                roster[property] = roster_read[property];
            }
        }
        catch (err) {

        }
        finally {
            s3.getObject({
                Bucket: bucket,
                Key: 'roster_channel.txt'
            }, function(err, rci) {
                if (err) {

                }
                else {
                    roster_channel_id = rci;
                    s3.getObject({
                        Bucket: bucket,
                        Key:'roster_message.txt'
                    }, function(err, rmi) {
                        if (err) {

                        }
                        else {
                            roster_message_id = rmi;

                        }
                    });
                }
            });
        }

    }
    client.login(process.env.BOT_TOKEN);
});

function floatToString(flt, decimal_places) {
    flt = Math.round(flt * Math.pow(10, decimal_places)) / Math.pow(10, decimal_places);
    var float_split = flt.toString().split('.');
    if (float_split.length === 2) {
        var difference = decimal_places - float_split[1].length
        return float_split[0] + '.' + float_split[1].slice(0, decimal_places) + '0'.repeat(difference);
    }
    else {
        return float_split[0] + '.' + '0'.repeat(decimal_places);
    }
}
function capitaliseFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function orderKeysByValue(dict){
    var ret = [];
    for (var key in dict) {
        if (ret.length === 0) {
            ret = [key];
        }
        else {
            count = 0;
            while (dict[key] < dict[ret[count]] && count < Object.keys(dict).length - 1) {
                count++;
            }
            ret.splice(count, 0, key);
        }
    }
    return ret;
}
function generatePlace(place) {
    if ([11,12,13].includes(place % 100)) {
        return place.toString() + 'th';
    }
    else {
        if (place % 10 === 1) {
            return place.toString() + 'st';
        }
        else if (place % 10 === 2){
            return place.toString() + 'nd';
        }
        else if (place % 10 === 3) {
            return place.toString() + 'rd';
        }
        else {
            return place.toString() + 'th';
        }
    }
}
function fillValue(value, col_width) {
    if (typeof value != 'string') {
        value = value.toString();
    }
    var spaces = col_width - value.length;
    return "|" + value + " ".repeat(spaces);

}
function generateRow(player_stats, player_name, col_widths, col_order, player_total, player_kdr, podium) {
    var row = "";
    for (let stat of col_order) {
        if (stat in player_stats) {
            row += fillValue(player_stats[stat], col_widths[stat]);
        }
        else {
            switch (stat) {
                case 'total':
                    row += fillValue(floatToString(player_total, 2), col_widths['total']);
                    break;
                case 'KDR':
                    row += fillValue(floatToString(player_kdr, 2), col_widths['kdr']);
                    break;
                case 'players':
                    row += fillValue(player_name, col_widths['players']);
                    break;
                case 'podium':
                    row += fillValue(generatePlace(podium), col_widths['podium']);
                    break;
            }
        }
    }
    return row + '\n';
}
function generateHeader(col_order, col_widths) {
    header = "";
    for (let val of col_order) {
        if (val === 'gamesplayed') {
            header += fillValue("GamesPlayed", col_widths[val]);
        }
        else {
            header += fillValue(capitaliseFirstLetter(val), col_widths[val.toLowerCase()]);
        }
    }
    return header + '\n';
}
// Roster interpretation function
function generateRosterMessage(roster) {
    var out = "";
    // Find col_widths and generate player_totals and player_kdrs
    var col_widths = {'kills' : 5, 'knocks' : 6, 'revives' : 7, 'gamesplayed' : 11};
    var player_totals = {};
    var player_kdrs = {};
    for (var stat in col_widths) {
        for (var player in roster.players) {
            var width = roster.players[player][stat].toString().length;
            if (width > col_widths[stat]) {
                col_widths[stat] = width;
            }
            if (stat in roster_inputs) {
                if (player in player_totals) {
                    player_totals[player] += roster.players[player][stat]*roster[roster_inputs[stat]];
                }
                else {
                    player_totals[player] = roster.players[player][stat]*roster[roster_inputs[stat]];
                }
            }
            if (stat === 'kills') {
                player_kdrs[player] = roster.players[player]['kills']/roster.players[player]['gamesplayed'];
                if (isNaN(player_kdrs[player]) || !isFinite(player_kdrs[player])){
                    player_kdrs[player] = 0;
                }
            }
        }
    }
    col_widths['total'] = 5;
    for (var player in player_totals) {
        var width = floatToString(player_totals[player], 2).length;
        if (width > col_widths['total']) {
            col_widths['total'] = width;
        }
    }
    col_widths['kdr'] = 3;
    for (var player in player_kdrs) {
        var width = floatToString(player_kdrs[player], 2).length;
        if (width > col_widths['kdr']) {
            col_widths['kdr'] = width;
        }
    }
    col_widths['players'] = 7;
    for (var player in roster.players) {
        var width = player.toString().length;
        if (width > col_widths['players']) {
            col_widths['players'] = width;
        }
    }
    col_widths['podium'] = 6;
    var width = Object.keys(roster.players).length.toString().length + 2;
    if (width > col_widths['podium']) {
        col_widths['podium'] = width;
    }
    // Generate the header and then the rows for each player
    var column_order = ['kills', 'knocks', 'revives', 'total', 'gamesplayed', 'KDR', 'players', 'podium'];
    out += generateHeader(column_order, col_widths);
    var count = 1;
    for (let player_name of orderKeysByValue(player_totals)) {
        out += generateRow(roster.players[player_name], player_name, col_widths, column_order, 
            player_totals[player_name], player_kdrs[player_name], count);
        count++;
    }
    // Generate stats to points conversion info
    out += '1 Kill = ' + floatToString(roster.kill_value, 2) + '\n1 Knock = ' + floatToString(roster.knock_value, 2)
    + '\n1 Revive = ' + floatToString(roster.revive_value, 2) + '\n1 Win = ' + floatToString(roster.wins_value, 2)
    + '\nKDR = Kills Divided by GamesPlayed';
    return "```" + out + "```";
}
////////////////////////
// Client event listers:
////////////////////////
// The ready event is vital, it means that your bot will only start reacting to
// information from Discord _after_ ready is emitted
client.on('ready', () => {
    console.log('Connected');
    console.log('Logged in as:');
    console.log(client.user.username + ' - (' + client.user.id + ')');
    if (client.channels.has(roster_channel_id)) {
        roster_channel = client.channels.get(roster_channel_id);
    }
});

// Create an event listener for messages
client.on('message', message => {
    if (message.author !== client.user){
        if (message.channel === roster_channel){
            // Roster Message Processing code goes here:
            var formatted_msg = message.content.split(',');
            for (var i = 0; i < formatted_msg.length; i++) {
                formatted_msg[i] = formatted_msg[i].trim();
            }
            var roster_updated = false;
            switch(formatted_msg[0].toLowerCase()){
                case 'drawroster':
                    if (formatted_msg.length === 1) {
                        roster_channel.send(generateRosterMessage(roster)).then(function(message) {
                            roster_msg_id = message.id;
                            // const write_stream_message_id = fs.createWriteStream('roster_message.txt');
                            // write_stream_message_id.write(roster_msg_id);
                            // write_stream_message_id.end();
                            s3.putObject({Bucket: bucket, Key: 'roster_message.txt', Body: roster_msg_id }, function(err, data) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }).catch(console.error);
                    }
                    break;
                case 'updateroster':
                    if (formatted_msg.length === 1) {
                        async function edit() {
                            var roster_msg = await roster_channel.fetchMessage(roster_msg_id).then(function(message){
                                message.edit(generateRosterMessage(roster)).catch(console.error);
                            }).catch(function(reason) { 
                                roster_channel.send(generateRosterMessage(roster)).then(function(message) {
                                    roster_msg_id = message.id;
                                    // const write_stream_message_id = fs.createWriteStream('roster_message.txt');
                                    // write_stream_message_id.write(roster_msg_id);
                                    // write_stream_message_id.end();
                                    s3.putObject({Bucket: bucket, Key: 'roster_message.txt', Body: roster_msg_id }, function(err, data) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }).catch(console.error);
                            });
                        }
                        edit();
                    }
                    break;
                case 'addplayer':
                    // Case where just name is submitted
                    if (formatted_msg.length === 2) {
                        roster.addPlayer(formatted_msg[1], new Stats(0,0,0,0));
                        roster_updated = true;
                    }
                    // Case where optional stat values are submitted
                    else if (formatted_msg.length === 6) {
                        // Convert stat values to integers and determine whether they are numbers
                        var all_ints = true;
                        for (var i = 2; i < formatted_msg.length; i++) {
                            formatted_msg[i] = parseInt(formatted_msg[i]);
                            if (isNaN(formatted_msg[i])){
                                all_ints = false;
                            }
                        }
                        // Add a new player to the roster with the submitted stat values
                        if (all_ints) {
                            roster.addPlayer(formatted_msg[1], new Stats(formatted_msg[2],
                                formatted_msg[3],formatted_msg[4],formatted_msg[5]));
                            roster_updated = true;
                        }
                        // Numbers weren't submitted for stat values, alert user.
                        else {
                            roster_channel.send("'AddPlayer' requires numbers for the player stat values (kills, knocks, etc.). Try typing 'Help, AddPlayer' for more information regarding adding players.");
                        }
                    }
                    // Case where user has entered arguments incorrectly
                    else {
                        roster_channel.send("'AddPlayer' requires either 1 parameters or 5 parameters! Try typing 'Help, AddPlayer' for more information regarding adding players.");
                    }
                    break;
                case 'updateplayer':
                    if (formatted_msg.length === 4) {
                        if (formatted_msg[1] in roster.players) {
                            if (formatted_msg[2].toLowerCase() in roster.players[formatted_msg[1]] || formatted_msg[2].toLowerCase() === 'games played') {
                                
                                if (formatted_msg[2].toLowerCase() === 'games played'){
                                    formatted_msg[2] = 'gamesplayed';
                                }
                                formatted_msg[3] = parseInt(formatted_msg[3]);
                                if (!isNaN(formatted_msg[3])) {
                                    roster.updatePlayer(formatted_msg[1], formatted_msg[2].toLowerCase(), formatted_msg[3]);
                                    roster_updated = true;
                                }
                                else {
                                    roster_channel.send("Submitted value must be a number! Try typing 'Help, Update Player' for more information regarding updating players.");
                                }
                            }
                            else {
                                roster_channel.send("'" + formatted_msg[2] + "' is not a valid property to change! Try typing 'Help, UpdatePlayer' for more information regarding updating players.");
                            }
                        }
                        else {
                            roster_channel.send("'" + formatted_msg[1] + "' is not in the roster!");
                        }
                    }
                    else {
                        roster_channel.send("'UpdatePlayer' requires 3 parameters. Try typing 'Help, UpdatePlayer' for more information regarding updating players.");
                    }
                    break;
                case 'resetplayer':
                    if (formatted_msg.length === 2) {
                        if (formatted_msg[1] in roster.players) {
                            for (var property in roster.players[formatted_msg[1]]) {
                                roster.updatePlayer(formatted_msg[1], property, 0);
                            }
                            roster_updated = true;
                        }
                        else {
                            roster_channel.send("'" + formatted_msg[1] + "' is not in the roster!");
                        }
                    }
                    else if (formatted_msg.length === 6) {
                        if (formatted_msg[1] in roster.players) {
                            var all_ints = true;
                            for (var i = 2; i < formatted_msg.length; i++) {
                                formatted_msg[i] = parseInt(formatted_msg[i]);
                                if (formatted_msg[i].isNaN()){
                                    all_ints = false;
                                }
                            }
                            if (all_ints){
                                var count = 2
                                for (var property in roster.players) {
                                    roster.updatePlayer(formatted_msg[1], property, formatted_msg[count])
                                }
                                roster_updated = true;
                            }
                            else {
                                roster_channel.send("Submitted value must be a number! Try typing 'Help, ResetPlayer' for more information regarding resetting players.");
                            }
                        }
                        else {
                            roster_channel.send("'" + formatted_msg[1] + "' is not in the roster!");
                        }
                    }
                    else {
                        roster_channel.send("'ResetPlayer' requires either 1 or 5 parameters! Try typing 'Help, ResetPlayer' for more information regarding resetting players.");
                    }
                    break;
                case 'removeplayer':
                    if (formatted_msg.length === 2) {
                        if (formatted_msg[1] in roster.players) {
                            roster.removePlayer(formatted_msg[1]);
                            roster_updated = true;
                        }
                        else {
                            roster_channel.send("'" + formatted_msg[1] + "' is not in the roster!");
                        }
                    }
                    else {
                        roster_channel.send("'RemovePlayer' requires 1 parameters! Try typing 'Help, RemovePlayer' for more information regarding removing players.");
                    }
                    break;
                case 'removeallplayers':
                    if (formatted_msg.length != 1) {
                        roster_channel.send("For future reference, 'RemoveAllPlayers' doesn't require any parameters!");
                    }
                    for (var player in roster.players) {
                        roster.removePlayer(player);
                    }
                    roster_updated = true;
                    break;
                case 'help':
                    if (formatted_msg.length === 1) {
                        var help_message = "__Help Commands:__\n" +
                        "__**AddPlayer**, *playername*__: Adds a new player to the roster with the name 'playername', setting all of their stats to zero.\n" +
                        "__**AddPlayer**, *playername*, *kills*, *knocks*, *revives*, *gamesplayed*__: Adds a new player to the roster with the name 'playername', and all of the associated stats.\n" +
                        "__**DrawRoster**__: Sends a new message to the channel and designates it as the new roster message. Calling clear in the future will clear all previous roster messages, and changes to the roster will be shown on this new message.\n" +
                        "__**Help**, *optional_command*__: Displays help message in the form of a new message. And optional parameter can be specified to get more information about each command.\n" +
                        "__**Redo**__: Redo the last undone action as a result of the 'undo' command.\n" +
                        "__**RemoveAllPlayers**__: Removes all players in the roster.\n" +
                        "__**RemovePlayer**, *playername*__: Removes the player with the name 'playername' from the roster.\n" +
                        "__**ReportGameStats**, *playername*, *kills*, *knocks*, *revives*__: 'Reports' a recently played game by specifying the player, and the stats for that game. Updates the player by adding those stats to the player, and adding an additional game played.\n" +
                        "__**ResetPlayer**, *playername*__: Resets all of the player's stats to zero.\n" +
                        "__**ResetPlayer**, *playername*, *kills*, *knocks*, *revives*, *gamesplayed*__: Resets all of the player's stats to the stat values provided.\n" +
                        "__**Undo**__: Undoes the last action.\n" +
                        "__**UpdatePlayer**, *playername*, *property*, *new_value*__: Updates the chosen 'property' to the 'new_value' for the player specified by 'playername'.\n" +
                        "__**UpdatePointValue**, *property*, *new_value*__: Update the point value of the specified property as it contributes to the total score for each player in the roster.\n" +
                        "__**UpdateRoster**__: Force the roster message to update to the values of the roster as specified in the bot's memory.";
                        roster_channel.send(help_message);
                    }
                    break;
                case 'updatepointvalue':
                    if (formatted_msg.length === 3) {
                        if (formatted_msg[1].toLowerCase() in roster_inputs) {
                            formatted_msg[2] = parseFloat(formatted_msg[2]);
                            if (!isNaN(formatted_msg[2])){
                                roster.updatePointValue(roster_inputs[formatted_msg[1].toLowerCase()], formatted_msg[2]);
                                roster_updated = true;
                            }
                            else {
                                roster_channel.send("New value must be a number! Try typing 'Help, UpdatePointValue' for more information regarding updating points values.");
                            }
                        }
                        else {
                            roster_channel.send("Submitted property is invalid! Try typing 'Help, UpdatePointValue' for more information regarding updating point values.");
                        }
                    }
                    else {
                        roster_channel.send("'UpdatePointValue' requires 2 parameters! Try typing 'Help, UpdatePointValue' for more information regarding updating point values.");
                    }
                    break;
                case 'reportgamestats':
                    if (formatted_msg.length === 5) {
                        if (formatted_msg[1] in roster.players) {
                            var all_ints = true;
                            for (var i = 2; i < formatted_msg.length; i++) {
                                formatted_msg[i] = parseInt(formatted_msg[i]);
                                if (isNaN(formatted_msg[i])){
                                    all_ints = false;
                                }
                            }
                            if (all_ints) {
                                roster.reportGameStats(formatted_msg[1], formatted_msg[2],
                                    formatted_msg[3], formatted_msg[4]);
                                roster_updated = true;
                            }
                            else {
                                roster_channel.send("Submitted value must be a number! Try typing 'Help, Update Player' for more information regarding reporting game stats.");
                            }
                        }
                        else {
                            roster_channel.send("'" + formatted_msg[1] + "' is not in the roster!");
                        }
                    }
                    break;
                case 'undo':
                    break;
                case 'redo':
                    break;
                case 'clear':
                    async function clear() {
                        var fetched = await roster_channel.fetchMessages({limit: 99});
                        for (let id of fetched.keys()){
                            if (id === roster_msg_id) {
                                fetched.delete(id);
                            }
                        }
                        roster_channel.bulkDelete(fetched);
                    }
                    clear();
                    break;
                default:
                    roster_channel.send("Command not recognised. Did you remember to seperate each segment with a ','. If you need help with which commands to use, you can try typing 'Help' for a list of commands.");
            }
            if (roster_updated) {
                // const write_stream_roster = fs.createWriteStream('roster.json');
                // write_stream_roster.write(JSON.stringify(roster));
                // write_stream_roster.end();
                s3.putObject({Bucket: bucket, Key: 'roster.json', Body: JSON.stringify(roster) }, function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
                async function edit() {
                    var roster_msg = await roster_channel.fetchMessage(roster_msg_id).then(function(message){
                        message.edit(generateRosterMessage(roster)).catch(console.error);
                    }).catch(function(reason) { 
                        roster_channel.send(generateRosterMessage(roster)).then(function(message) {
                            roster_msg_id = message.id;
                            // const write_stream_message_id = fs.createWriteStream('roster_message.txt');
                            // write_stream_message_id.write(roster_msg_id);
                            // write_stream_message_id.end();
                            s3.putObject({Bucket: bucket, Key: 'roster_message.txt', Body: roster_msg_id }, function(err, data) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }).catch(console.error);
                    });
                }
                edit();
            }
        }
        else {
            if (message.content === "!set roster channel"){
                roster_channel = message.channel;
                roster_channel.send("Roster Channel Set");
                // const write_stream_channel = fs.createWriteStream('roster_channel.txt');
                // write_stream_channel.write(roster_channel.id);
                // write_stream_channel.end();
                s3.putObject({Bucket: bucket, Key: 'roster_channel.txt', Body: roster_channel.id}, function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        }
    }
});

// Create an event listener for a forceful close from the cmd prompt
process.on('SIGINT', function(code) {
    console.log("Goodbye!");
    client.destroy();
    // Finally exit the program
    process.exit();
});
