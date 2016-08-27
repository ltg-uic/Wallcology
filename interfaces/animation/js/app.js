
/*==============================================================================
 #    Program Name: App.js
 #          Author: Kyle Reese Almryde
 #            Date: 10/10/2015
 #         Revised: 06/23/2016
 #
 #     Description:
 #        Establishes and communicates between the Unity3D visualization and
 #        Nutella. Handles updates from the simulation and passes them along to
 #        the Unity visualization.
 #
 #    Deficiencies:
 #       None. This program meets specifications
 #
 #==============================================================================
 #                            GLOBAL VAR DECLARATIONS
 #=============================================================================*/

var nutella,
    unity3d,
    WallscopeID;

/*==============================================================================
 #                             START OF MAIN
 #=============================================================================*/

function Start() {

    // instantiate the Nutella components
    initNutellaComponents();

    // initialize the unity WebPlayer
    initWebPlayer();

}

/*==============================================================================
 #                            FUNCTION DEFINITIONS
 #=============================================================================*/

// Instantiate the Nutella components
function initNutellaComponents()
{
    alert("wcV5! Connecting Nutella");
    // Parse the query parameters
    var query_parameters = NUTELLA.parseURLParameters();
    alert(query_parameters);
    WallscopeID = query_parameters.INSTANCE || 0;

    alert('wallscope: ' + WallscopeID)

    // Get an instance of nutella.
    nutella = NUTELLA.init(
        query_parameters.broker,
        query_parameters.app_id,
        query_parameters.run_id,
        NUTELLA.parseComponentId()
    );

    // (Optional) Set the resourceId
    nutella.setResourceId('wallscope_vis');

    // return WallscopeID;
};


function initWebPlayer()
{
    var config =
    {
        width: window.innerWidth, // 960,
        height: window.innerHeight, // 600,
        params: { enableDebugging:"1" }
    };

    unity3d = new UnityObject2(config);

    // var url = "build/wallscope" + WallscopeID.toString() + "/wallscope" + WallscopeID.toString() + ".unity3d";
    var url = "build/demo/demo.unity3d";

    alert("Start WebPlayer");
    jQuery(function() {

        var $missingScreen = jQuery("#unityPlayer").find(".missing");
        var $brokenScreen = jQuery("#unityPlayer").find(".broken");
        $missingScreen.hide();
        $brokenScreen.hide();

        var installPlugin = function (e) {
            e.stopPropagation();
            e.preventDefault();
            unity3d.installPlugin();
            return false;
        };

        unity3d.observeProgress(function (progress) {
            switch(progress.pluginStatus) {
                case "broken":
                    $brokenScreen.find("a").click(installPlugin);
                    $brokenScreen.show();
                break;
                case "missing":
                    $missingScreen.find("a").click(installPlugin);
                    $missingScreen.show();
                break;
                case "installed":
                    $missingScreen.remove();
                break;
                case "first":
                break;
            }
        });
        alert("url is", url);
        // recieve wallscope #, grab appropriate program.
        unity3d.initPlugin(jQuery("#unityPlayer")[0], url);
    });
};



/*==============================================================================
 #                       NUTELLA MESSAGE HANDLERS
 #=============================================================================*/

// Handles most recent state of simulation

function State_Update_Handler( response )
{
    alert("State_Update_Handler called!");

    var updatedState = sanitizeResponse(response);

    alert("\tlast_state!", Date(updatedState["timestamp"]), updatedState);
     // Send messages to Unity

    for (var i = 0; i < updatedState['biotic'][WallscopeID].length; i++) {
        var count = 0,
            rawPopulation = updatedState['biotic'][WallscopeID][i];

        switch(i) {
            case 1:
            case 3:
            case 8:
                count = parseInt( Math.round(rawPopulation * 10) );
                break;
            case 0:
            case 2:
            case 6:
            case 7:
                count = parseInt( Math.round(rawPopulation * 5) );
                break;
            default:
                count = ( rawPopulation / 100.0 );
                break;
        }
        // var count = parseInt(updatedState['biotic'][WallscopeID][i]) * 25;
        var packaged = i.toString() + " " + count.toString();
        alert("state_update", packaged);
        Unity.SetSpeciesRecordCount( packaged );
        // unity3d.getUnity().SendMessage("Habitat", "jsGetPopulationCount", i );
    }

    alert("\tSpecies Record Updated! ");

    var Abiotic = updatedState['abiotic'][WallscopeID];
    Unity.SetThermostatText( Abiotic['thermostat'] );
    Unity.SetTemperatureText( Abiotic['temperature'] );
    // Unity.SetHumidityText( Abiotic['humidity'] );
        // "left": "out",
        // "top": "out",
        // "right": "out",
        // "bottom": "out",
        // "brick": 1,
        // "wood": 1

    // Wait on these for now...
    // updatedState['abiotic'][WallscopeID]['humidistat']
    // updatedState['abiotic'][WallscopeID]['humidity']
    // updatedState['abiotic'][WallscopeID]['left']
    // updatedState['abiotic'][WallscopeID]['top']
    // updatedState['abiotic'][WallscopeID]['right']
    // updatedState['abiotic'][WallscopeID]['bottom']
    // updatedState['abiotic'][WallscopeID]['brick']
    // updatedState['abiotic'][WallscopeID]['wood']
}


function Last_State_Handler( response )
{
    State_Update_Handler( response ); // at least until I can come up with a more thoughtful way of adding critters in place.
}
/*==============================================================================
 #                        MESSAGE HANDLERS
 #                       UNITY->Javascript
 #             These functions are called from WITHIN Unity!
 #=============================================================================*/

var TellJs = {

    ActivateWallScope: function() {  // Allows Unity to tell us its ready
        alert("TellJs.ActivateWallScope:  Unity is READY!! WOOOOOO");

        // Make an Immediate request for the last state. This will let us update
        // the wallscope to its previous state should we suffer a crash.
        nutella.net.request( 'last_state', {}, Last_State_Handler);

        // Subscribe to the channel and wait for updates.
        //                      last_animation_state
        nutella.net.subscribe( 'state_update', State_Update_Handler);
    },

    SubscribeToEventsChannel: function() {
        alert("TellJs.SubscribeToEventsChannel was called from Unity!!");

        // nutella.net.subscribe( 'state-update', function(response) {}
        nutella.net.subscribe( 'thermostat', function(response) {

            var cleaned = sanitizeResponse(response);
            alert( 'channel-thermostat', cleaned);
            Unity.SetThermostatText( cleaned['value'] )

        })


        nutella.net.subscribe( 'humidistat', function(response) {
            var cleaned = sanitizeResponse(response);
            alert( 'channel-humidistat', response);
            Unity.SetHumidityText( cleaned['value'] )

        })

        nutella.net.subscribe( 'wall', function(response) {
            alert( 'channel-wall', response);

            var cleaned = sanitizeResponse(response);
            if ( cleaned['ecosystem'] === WallscopeID )
                Unity.SetDryWall(cleaned['side'], cleaned['direction'])

        })

        nutella.net.subscribe( 'seed', function(response) {
            alert( 'channel-seed', response);
            var cleaned = sanitizeResponse(response);
            if ( cleaned['ecosystem'] === WallscopeID )
                Unity.CallCropSeeder(cleaned['species'])
        })

        nutella.net.subscribe( 'herbicide', function(response) {
            alert( 'channel-herbicide', response);
            var cleaned = sanitizeResponse(response);
            if ( cleaned['ecosystem'] === WallscopeID )
                Unity.CallCropDuster(cleaned['species'])
        })

        nutella.net.subscribe( 'colonize', function(response) {
            alert( 'channel-colonize', response);
            var cleaned = sanitizeResponse(response);
            if ( cleaned['ecosystem'] === WallscopeID )
                Unity.PlaceColony(cleaned['species'])
        })

        nutella.net.subscribe( 'trap', function(response) {
            alert( 'channel-trap', response);
            var cleaned = sanitizeResponse(response);
            if ( cleaned['ecosystem'] === WallscopeID )
                Unity.PlaceTrap(cleaned['species'])
        })
    }
}

/*==============================================================================
 #                         MESSAGE REQUESTS
 #                       Javascript -> UNITY
 #               These functions Send messages TO Unity
 #
 #     unity3d.getUnity().SendMessage("GameObject", "MethodName", param)
 #=============================================================================*/

// Set the Temperature Thermometer
//     expects a float/double
var Unity = {

    // param packaged is a string containing the critter ID and count
    // this function is called multiple times for each entry in the species record
    SetSpeciesRecordCount: function( packaged ) {
        unity3d.getUnity().SendMessage("Habitat", "jsUpdateSpeciesRecord", packaged );
    },

    // Sets the Thermostat GUI Text display
    SetThermostatText : function( thermo ) {
        thermo = thermo.toString();
        alert("Thermostat is", thermo);
        unity3d.getUnity().SendMessage("Thermostat", "SetText", thermo);
    },

    // Sets the Temperature GUI Text display
    SetTemperatureText : function( temp ) {
        // temp = Math.abs(Math.round(temp * 100) / 100);
        temp = temp.toString() + "˚C";
        // temp = "";
        alert("Temperature is", temp);
        unity3d.getUnity().SendMessage("Temperature", "SetText", temp);
    },

    // Sets the Humidistat GUI Text display
    SetHumidityText : function( humid ) {
        // humid = Math.abs(Math.round(humid * 100) / 100);
        humid = humid.toString() + "RH";
        // humid = "";
        alert("Humidity is", humid);
        unity3d.getUnity().SendMessage("Humidity", "SetText", humid);
    },

    // tells Unity to display the side and amount of drywall
    // requires unity to unpack
    SetDryWall: function( side, direction ) {
        var amount = (direction === 'in')? 0.005 : -0.005;

        switch( side ) {
            case 'left':
                unity3d.getUnity().SendMessage("Ground_Resource", "SetTopDrywallLevel", amount);
                break;
            case 'right':
                unity3d.getUnity().SendMessage("Ground_Resource", "SetRightDrywallLevel", amount);
                break;
            case 'top':
                unity3d.getUnity().SendMessage("Ground_Resource", "SetTopDrywallLevel", amount);
                break;
            case 'bottom':
                unity3d.getUnity().SendMessage("Ground_Resource", "SetBottomDrywallLevel", amount);
                break;
        }
    },

    // Accesses the Unity GameObject called 'Habitat_Events' and executes the
    // PositionCritterTrap method, supplying the Trap ID #
    PlaceTrap : function(uID) {
        var id = parseInt(uID)
        unity3d.getUnity().SendMessage("Habitat_Events", "PositionCritterTrap", id);
    },

    // Accesses the Unity GameObject called 'Habitat_Events' and executes the
    // PositionCritterColony method, supplying the Colony ID #
    PlaceColony : function(uID) {
        var id = Number(uID)
        alert("PositionCritterColony", id);
        unity3d.getUnity().SendMessage("Habitat_Events", "PositionCritterColony", id);
    },

    // Accesses the Unity GameObject called 'Habitat_Events' and executes the
    // CallCropDuster method, supplying the CropDuster ID #
    CallCropDuster : function(uID) {
        var id = parseInt(uID)
        unity3d.getUnity().SendMessage("Habitat_Events", "CallCropDuster", id);
    },

    CallCropSeeder : function(uID) {
        var id = parseInt(uID)
        unity3d.getUnity().SendMessage("Habitat_Events", "CallCropSeeder", id);
    },

    /* Decprecated Function */
    StartPopulationTracker : function() {
        var id = parseInt(uID)
        unity3d.getUnity().SendMessage("Habitat", "UpdatePopulationCounts", "" );
    },

    /* Decprecated Function */
    RequestPopulationCount : function ( uID ) {
        // Calls UNITY requesting Population
        var id = parseInt(uID)
        unity3d.getUnity().SendMessage("Habitat", "GetPopulationCount", id);
    },

    /* Decprecated Function */
    SpawnCritter : function( id ) {
        alert("Lets make a "+id.toString() +"! ", typeof id  );
        unity3d.getUnity().SendMessage( "Habitat", "SpawnCritter", id );
    },

    /* Decprecated Function */
    KillCritter : function( id ) {
        alert("Killing " + id.toString() + " softly!");
        unity3d.getUnity().SendMessage("Habitat", "KillCritter", id);
    },

    /* Decprecated Function */
    RequestVegetationPresence: function( uID ) {
        var scaleLevel = Last_State['populations'][0][+uID];
        alert("RequestVegetationPresence!", uID, scaleLevel );
        var scaleString = scaleLevel = scaleLevel.toString();

        if (scaleString.includes('e')) {
            scaleLevel = 0.0001;
            alert("Made an adjustment!", scaleString);
        };
        alert("\tRequestVegetationPresence!", uID, scaleLevel );
        unity3d.getUnity().SendMessage("Habitat", "ScaleVegetation", scaleLevel.toString() + " " + uID.toString());
    }
}



/*==============================================================================
 #                         HELPER FUNCTIONS
 #=============================================================================*/

// Convert the response to an Object in the event that its a string
function sanitizeResponse( response )
{
    if (typeof response === 'string')
        return JSON.parse(response);
    else if (typeof response === 'object')
        return response;

}

