module.exports = function (app) {
    var plugin = {};

    plugin.id = 'accumulated-current-plugin';
    plugin.name = 'Accumulated values';
    plugin.description = 'A plugin to accumulate current consumption on a daily basis';
    
    var unsubscribes = [];
    var consumedToday=0;
    var consumedYesterday=0;
    var solarYieldToday=0;
    var chargerYieldToday=0;
    
    var maxCurrentToday=0;
    var maxCurrent=0;
    var lastTimeHouse=0;
    var lastTimeSolar=0;
    var lastTimeCharger=0;
    var lastTimeAlternator=0;
    var yesterday=0;
    
    
    
    


    plugin.schema = {
        type: 'object',
        required: ['house_current', 'solar_current'],
        properties: {
          house_current: {
            type: 'string',
            title: 'Path to battery current net'
          },
          solar_current: {
            type: 'string',
            title: 'Path to solar charge current',
          },
          charger_current: {
            type: 'string',
            title: 'Path to charger charge current',
          },
          alternator_current: {
            type: 'string',
            title: 'Path to alternator charge current',
          }
          
        }
      };
    
    plugin.start = function (options, restartPlugin) {
      // Here we put our plugin logic
      app.debug('Plugin started');
      let localSubscription = {
        context: '*', // Get data for all contexts
        subscribe: [{
          path: 'electrical.*', // Get all paths
          period: 1000 // Every 5000ms
        }]
      };
    
      app.subscriptionmanager.subscribe(
        localSubscription,
        unsubscribes,
        subscriptionError => {
          app.error('Error:' + subscriptionError);
        },
        delta => {
          //  app.debug("new delta") 
            delta.updates.forEach(u => {
                //app.debug("delta in loop: ",u);
                if (u.values[0].path==options.house_current) {
                    app.debug("found house current path");
                    let ms= Date.parse(u.timestamp)
                    const dt  = new Date(u.timestamp) 
                    let day = dt.getDate()
                    if (yesterday==0)
                        yesterday=day
                    if (day>yesterday) {
                        consumedYesterday=consumedToday
                        consumedToday=0;
                        maxCurrentToday=0;
                        chargerYieldToday=0;
                        solarYieldToday=0;
                        yesterday=day
                    }   
                    if (lastTimeHouse==0) {
                        lastTimeHouse=ms; 
                    }
                    else {
                    
                        let deltaMs=ms-lastTimeHouse
                        lastTimeHouse=ms;
                        consumedToday=consumedToday-(u.values[0].value*deltaMs)/1000/3600
                        if (u.values[0].value<maxCurrentToday) {
                            maxCurrentToday=u.values[0].value
                        }
                        if (u.values[0].value<maxCurrent) {
                            maxCurrent=u.values[0].value
                        }
                        app.debug("current: ",u.values[0].value);
                        app.debug("deltaMs: ",deltaMs);
                        app.debug("date: ",day);
                        
                        
                        app.debug("consumedToday As: ",consumedToday);
                        app.handleMessage('accumulated-current-plugin', {
                         updates :[ 
                            {
                            "meta": [
                                {
                                "path": "electrical.batteries.consumedToday",
                                "value": {
                                    "description": "Net aH form House shunt",
                                    "units": "Ah",
                                    "displayName": "Consumed Ah today",
                                    "timeout": 30
                                    },
                                },
                                {
                                    "path": "electrical.batteries.consumedYesterday",
                                    "value": {
                                        "description": "Net aH form House shunt",
                                        "units": "Ah",
                                        "displayName": "Consumed Ah yesterday",
                                        "timeout": 30
                                    },
                                },
                                {
                                    "path": "electrical.batteries.maxCurrent",
                                    "value": {
                                        "description": "Max current from House shunt",
                                        "units": "A",
                                        "displayName": "Max currrent",
                                        "timeout": 30
                                    },
                                },
                                {
                                    "path": "electrical.batteries.maxCurrentToday",
                                    "value": {
                                        "description": "Max current from House shunt today",
                                        "units": "A",
                                        "displayName": "Max currrent today",
                                        "timeout": 30
                                    },
                                },
                                {
                                    "path": "electrical.batteries.solarYieldToday",
                                    "value": {
                                        "description": "Total energy from charger today",
                                        "units": "Ah",
                                        "displayName": "Energy from charger today",
                                        "timeout": 30
                                    },
                                },
                                {
                                    "path": "electrical.batteries.chargerYieldToday",
                                    "value": {
                                        "description": "Total energy from solar charger today",
                                        "units": "Ah",
                                        "displayName": "Energy from solar charger today",
                                        "timeout": 30
                                    },
                                }
                            ]
                            }
                        ]
                        });


                        app.handleMessage('accumulated-current-plugin', {
                            updates: [
                              {
                                values: [
                                  {
                                    path: 'electrical.batteries.consumedToday',
                                    value: consumedToday,
                                    unit: 'Ah'
                                  },
                                  {
                                    path: 'electrical.batteries.consumedYesterday',
                                    value: consumedYesterday,
                                    unit: 'Ah'
                                  },
                                  {
                                    path: 'electrical.batteries.maxCurrent',
                                    value: maxCurrent,
                                    meta: {
                                       'units' : 'A',
                                       'description': "max current measured since server start" 
                                    }
                                  },
                                  {
                                    path: 'electrical.batteries.maxCurrentToday',
                                    value: maxCurrentToday,
                                    units: 'A'
                                  },
                                  {
                                    path: 'electrical.batteries.solarYieldToday',
                                    value: solarYieldToday,
                                    units: 'Ah'
                                  },
                                  {
                                    path: 'electrical.batteries.chargerYieldToday',
                                    value: chargerYieldToday,
                                    units: 'Ah'
                                  },

                                ]
                              } 
                          ]
                        }) 
                    }
                    // check if timestamp has rolled over from midnight
                    // if rolled over update yesterday value and reset todays value
                    //calculate timestamp differense  
                     //store timestamp as last timestamp /parse first)
                     // add data and delta time to accumulated value
                     // set max current 
                     // publish delta (consumedToday, consumed yesterday)

                }
                if (u.values[0].path==options.solar_current) {
                    app.debug("found solar current path");
                    let mss= Date.parse(u.timestamp)
                    if (lastTimeSolar==0) {
                        lastTimeSolar=mss; 
                    }
                    else {
                    
                        let deltaMss=mss-lastTimeSolar
                        lastTimeSolar=mss;
                        consumedToday=consumedToday+(u.values[0].value*deltaMss)/1000/3600
                        solarYieldToday=solarYieldToday+(u.values[0].value*deltaMss)/1000/3600
                      
                        
                    }
                }
                if (u.values[0].path==options.charger_current) {
                    app.debug("found charger current path");
                    let msss= Date.parse(u.timestamp)
                    if (lastTimeCharger==0) {
                        lastTimeCharger=msss; 
                    }
                    else {
                    
                        let deltaMsss=msss-lastTimeCharger
                        lastTimeCharger=msss;
                        consumedToday=consumedToday+(u.values[0].value*deltaMsss)/1000/3600
                        chargerYieldToday=chargerYieldToday+(u.values[0].value*deltaMsss)/1000/3600
                      
                        
                    }
                }
                
            });
         //   app.debug("end new delta")
        }
      );
    };
  
    plugin.stop = function () {
      // Here we put logic we need when the plugin stops
      unsubscribes.forEach(f => f());
      unsubscribes = [];
      app.debug('Plugin stopped');
    };
  
   
  
    return plugin;
  };