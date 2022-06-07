const Eventhandler = require('../lib/EventHandler/dist/Eventhandler');
const InfiniteLoop = require('infinite-loop');
const fs = require('fs');

eh = new Eventhandler(8000, "dashboard");
eh.init();

const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

var loop = new InfiniteLoop;

eh.subscribe("set_energy_schedule", (req) => {
    let data = {};
    if (req['device_id'] == 0) {
        data['1'] = req['1'];
        data['2'] = req['2'];
        data['3'] = req['3'];
        data['4'] = req['4'];
        if (writeDeviceFile("0", data)) {
            return true;
        } else {
            return false;
        }
    } else if (req['device_id'] == 1) {
        let current_data = readDeviceFile("1");
        data['1'] = req['1'];
        data['usage'] = current_data['usage'];
        if (writeDeviceFile("1", data)) {
            return true;
        } else {
            return false;
        }
    }
});

eh.subscribe("set_energy_usage", (req) => {
    let data = {};
    if (req['device_id'] == 1) {
        let current_data = readDeviceFile("1");
        data['1'] = current_data['1'];
        data['usage'] = req['usage'];
        if (writeDeviceFile("1", data)) {
            return true;
        } else {
            return false;
        }
    }
});

eh.subscribe("get_energy_usage", (req) => {
    let data = {};
    if (req['device_id'] == 0) {
        let current_data = readDeviceFile("0");
        data['1'] = current_data['1'];
        data['2'] = current_data['2'];
        data['3'] = current_data['3'];
        data['4'] = current_data['4'];
    } else if (req['device_id'] == 1) {
        let current_data = readDeviceFile("1");
        data['1'] = current_data['1'];
    }
    return data;
});

eh.subscribe("get_energy_schedule", (req) => {
    let data = {};
    if (req['device_id'] == 1) {
        let current_data = readDeviceFile("1");
        data['usage'] = current_data['usage'];
    }
    return data;
});

function readDeviceFile(device_id) {
    try {
        let data = fs.readFileSync('./config/device_'+device_id+'.json', 'utf8');
        let parsed_data = JSON.parse(data);
        return parsed_data;
    } catch (err) {
        console.log(`Error reading file from disk: ${err}`);
        return false;
    }
}

function writeDeviceFile(device_id, data) {
    try {
        let json = JSON.stringify(data, null, 4);
        fs.writeFileSync('./config/device_'+device_id+'.json', json, 'utf8');
        return true;
    } catch (err) {
        console.log(`Error writing file: ${err}`);
        return false;
    }
}

async function checkTime(device_id) {
    let date_time = new Date();
    let hours = date_time.getHours();
    let minutes = date_time.getMinutes();
    let count = 0;
    let time_string = "";

    if (hours < 10) {
        time_string = "0"+hours+":"+minutes;
    } else {
        time_string = hours+":"+minutes;
    }

    if (minutes == 0 || minutes == 15 || minutes == 30 || minutes == 45) {
        let day = weekday[date_time.getDay()];
        let current_data = readDeviceFile(device_id);

        if (device_id == "0") {
            count = 4;
        } else {
            count = 1;
        }

        for (let i = 1; i <= count; i++) {
            let saved_from = current_data[i][day]['from'];
            let saved_to = current_data[i][day]['to'];
            let arr_from = saved_from.split(":");
            let arr_to = saved_to.split(":");

            if (parseInt(arr_from[0]) ==  hours) {
                if (parseInt(arr_from[1]) ==  minutes) {
                    let res = await sendOutletChange(device_id, i, "on");
                }
            } else if (parseInt(arr_to[0]) ==  hours) {
                if (parseInt(arr_from[1]) ==  minutes) {
                    let res = await sendOutletChange(device_id, i, "off");
                }
            }
        }
    }
}

async function sendOutletChange(device_id, outlet_id, change) {
    let response = await eh.request("set_outlet_status", {device: device_id, outlet: outlet_id, status_change: change});
    if (response) {
        return response;
    } else {
        return false;
    }
}

async function checkUsage(device_id) {
    let response = await eh.request("get_outlet_usage", {device: device_id, outlet: "1"});
    let tmp = parseInt(response['usage']);
    let current_settings = readDeviceFile(device_id);
    if (tmp < parseInt(current_settings['usage'])) {
        let res = await sendOutletChange(device_id, "1", "off");
    }
}

loop.add(checkTime, ["0"]);
loop.add(checkTime, ["1"]);
loop.add(checkUsage, ["1"]);

loop.setInterval(1000);

loop.run();

setTimeout( function(){
    loop.stop();
} , 10 * 1000);