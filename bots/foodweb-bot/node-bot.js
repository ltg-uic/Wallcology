
var NUTELLA = require('nutella_lib');

// Get configuration parameters and init nutella
var cliArgs = NUTELLA.parseArgs();
var componentId = NUTELLA.parseComponentId();
var nutella = NUTELLA.init(cliArgs.broker, cliArgs.app_id, cliArgs.run_id, componentId);
// Optionally you can set the resource Id
nutella.setResourceId('my_resource_id');


console.log("Foodweb bot");



var foodwebs = nutella.persist.getMongoObjectStore('foodwebs');

foodwebs.load(function(){

    if (!foodwebs.hasOwnProperty('data')){
        foodwebs.data = [];
        foodwebs.save();
    };

//    nutella.net.subscribe('set_foodweb',{group: this.group, time: t, drawing: drawing})

    nutella.net.subscribe('set_foodweb',function(message,from){
        foodwebs.data.push(message);
        foodwebs.save();
    });


    nutella.net.handle_requests('get_num_of_saved_foodwebs',function(group, from) {
        var index = foodwebs.data.length;
        var count = 0;
        while (--index >= 0){
            if (foodwebs.data[index].group == group) count++;
        }
        return count;
    });



    nutella.net.handle_requests('get_current_foodweb',function(group,from){
        var index = foodwebs.data.length;
        while (--index >= 0){
            if (foodwebs.data[index].group == group) return (foodwebs.data[index]);
        }
        return {};
    });

    nutella.net.handle_requests('get_saved_foodweb',function(message,from){ 
        var countUp = 0;
        for (index=0; index<foodwebs.data.length; index++) {
            if (foodwebs.data[index].group == message.group) 
                { 
                  if (countUp == (message.index)) {return (foodwebs.data[index]);}; 
                    countUp++;
                }

        }
        console.log('none found'); return {};
    });

});


// Some examples to give you ideas...
// You can do things such as:



// // 1. Subscribing to a channel
// nutella.net.subscribe('demo_channel', function(message, from) {
//     // Your code to handle messages received on this channel goes here
// });


// // 2. Publish a message to a channel
// nutella.net.publish('demo_channel', 'demo_message');

	
// // 2a. The cool thing is that the message can be any object
// nutella.net.publish('demo_channel', {a: 'proper', key: 'value'});


// // 3. Make asynchronous requests on a certain channel
// nutella.net.request( 'demo_channel', 'my_request', function(response){
//     // Your code to handle the response to this request goes here
// });


// // 4. Handle requests from other components
// nutella.net.handle_requests( 'demo_channel', function(message, from) {
//     // Your code to handle each request here
//     // Anything this function returns (String, Integer, Object...) is going to be sent as the response
//     var response = 'a simple string'
//     // response = 12345
//     // response = {}
//     // response = {my:'json'}
//     return response;
// });

