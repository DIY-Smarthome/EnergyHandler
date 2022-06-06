const eventhandler = require('../lib/EventHandler/dist/Eventhandler');
const InfiniteLoop = require('infinite-loop');

eventhandler = new eventhandler(8000, "dashboard");
eventhandler.init();

var loop = new InfiniteLoop;

eventhandler.subscribe("set_energy_schedule", (req) => {

});

eventhandler.subscribe("set_energy_usage", (req) => {
    
});

eventhandler.subscribe("get_energy_usage", (req) => {
    
});

eventhandler.subscribe("get_energy_schedule", (req) => {
    
});

function checkTime(device_id) {

}

function sendOutletChange(device_id, outlet_id) {
    
}

function checkUsage(device_id) {
    
}

loop.add(checkTime, [1]);
loop.add(checkTime, [2]);
loop.add(checkUsage, [2]);

loop.setInterval(1000);

loop.run();

setTimeout( function(){
    loop.stop();
} , 10 * 1000);